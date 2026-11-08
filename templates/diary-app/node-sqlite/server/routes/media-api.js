import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { Router } from 'express'
import multer from 'multer'
import { config } from '../config.js'
import { db } from '../db.js'
import { storage } from '../storage/index.js'
import { processImage } from '../media/image.js'
import { removeMedia } from '../media/remove.js'
import { uploadLimit } from '../rate.js'
import { wgs84ToGcj02 } from '../geo.js'
import { looksLikeVideo, probe, videoSupported } from '../media/ffmpeg.js'
import { MAX_VIDEO_SECONDS, enqueue, makePoster, origPathOf } from '../media/video.js'
import { newId, ID_RE, ym, ymd, mediaOut } from '../util.js'

const tmpDir = path.join(config.dataDir, 'tmp')
fs.mkdirSync(tmpDir, { recursive: true })
const MB = 1024 * 1024
export const MAX_IMAGE = 50 * MB
export const MAX_VIDEO = 300 * MB
// 先落到磁盘再处理，大文件不会把内存撑爆。上传时还不知道是图片还是视频，先按视频的上限放行，图片再单独检查。
const upload = multer({ dest: tmpDir, limits: { fileSize: MAX_VIDEO, files: 1 } })

export const mediaApi = Router()

// POST /api/media   表单字段名 file，一次一个。上传后还没挂到日记上（entry_id 为空），
// 保存日记时把返回的 id 放进 mediaIds 就挂上了；一直没保存的 24 小时后自动清理。
// 图片：处理完一起返回。视频：存好原文件、做好封面就先返回（status = processing），转码在后台排队做。
mediaApi.post('/', uploadLimit, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no file' })
  const tmp = req.file.path
  let keepTmp = false
  try {
    const fh = await fsp.open(tmp, 'r')
    const head = Buffer.alloc(32)
    try { await fh.read(head, 0, 32, 0) } finally { await fh.close() }

    if (!looksLikeVideo(head)) {
      if (req.file.size > MAX_IMAGE) return res.status(413).json({ error: 'too large', message: '图片太大啦（最大 50MB）' })
      const r = await tryImage(tmp, res)
      if (r !== 'not-image') return r
    }
    // 不是图片：看看是不是视频
    keepTmp = await saveVideo(req, res)
  } finally {
    if (!keepTmp) fsp.rm(tmp, { force: true }).catch(() => {})
  }
})

// 照片 / 视频里的定位是 GPS 原始坐标（WGS-84），转成高德用的 GCJ-02 再给前端；没有定位就是 null。
// 只在上传的这一次返回，用来问「要不要把这个位置标在地图上」，别的接口不返回。
const gpsOut = (lat, lng) => (typeof lat === 'number' && typeof lng === 'number' && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? wgs84ToGcj02(lat, lng) : null)

const unsupported = (res) => res.status(415).json({ error: 'unsupported', message: '这个文件不是能识别的图片或视频' })

async function tryImage(tmp, res) {
  const id = newId()
  const now = Date.now()
  const [y, m] = ym(now)
  const written = []
  try {
    const buf = await fsp.readFile(tmp)
    let r
    try { r = await processImage(buf) } catch { return 'not-image' }
    const key = `${y}/${m}/${id}.webp`
    const thumbKey = `${y}/${m}/${id}-t.webp`
    const origKey = `${y}/${m}/${id}.${r.ext}`

    // 原图留在服务器本地、不公开（里面有位置信息）；公开的只有处理后的两张
    const origPath = path.join(config.dataDir, 'originals', origKey)
    await fsp.mkdir(path.dirname(origPath), { recursive: true })
    await fsp.copyFile(tmp, origPath)
    written.push(() => fsp.rm(origPath, { force: true }))
    await storage.put(key, r.main, { contentType: 'image/webp' })
    written.push(() => storage.remove(key))
    await storage.put(thumbKey, r.thumb, { contentType: 'image/webp' })
    written.push(() => storage.remove(thumbKey))

    db.prepare(`INSERT INTO media (id, entry_id, kind, status, key, thumb_key, orig_key, width, height, size, taken_at, lat, lng, sort, created_at)
                VALUES (?, NULL, 'image', 'ready', ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`)
      .run(id, key, thumbKey, origKey, r.width, r.height, r.main.length, r.takenAt, r.lat, r.lng, now)
    const row = db.prepare('SELECT * FROM media WHERE id = ?').get(id)
    return res.status(201).json({ ...mediaOut(row), date: r.takenAt ? ymd(r.takenAt) : null, gps: gpsOut(r.lat, r.lng) })
  } catch (e) {
    // 中途失败：把已经写出去的清掉，免得留下没人要的文件
    await Promise.allSettled(written.map((f) => f()))
    throw e
  }
}

// 返回 true 表示临时文件已经被移走当原文件用了，外面不用再删
async function saveVideo(req, res) {
  const tmp = req.file.path
  if (!(await videoSupported())) {
    res.status(503).json({ error: 'video unsupported', message: '服务器暂时还不能处理视频' })
    return false
  }
  let info
  try { info = await probe(tmp) } catch { unsupported(res); return false }
  if (!(info.duration > 0)) { unsupported(res); return false }
  if (info.duration > MAX_VIDEO_SECONDS) {
    res.status(413).json({ error: 'too long', message: `视频太长啦（最长 ${MAX_VIDEO_SECONDS / 60} 分钟）` })
    return false
  }

  const id = newId()
  const now = Date.now()
  const [y, m] = ym(now)
  const key = `${y}/${m}/${id}.mp4`
  const thumbKey = `${y}/${m}/${id}-t.webp`
  const ext = (path.extname(req.file.originalname || '').slice(1).toLowerCase().replace(/[^a-z0-9]/g, '') || 'mov').slice(0, 5)
  const origKey = `${y}/${m}/${id}.${ext}`
  const origPath = path.join(config.dataDir, 'originals', origKey)
  const written = []
  try {
    const poster = await makePoster(tmp, info.duration)
    await fsp.mkdir(path.dirname(origPath), { recursive: true })
    await fsp.rename(tmp, origPath) // 同一块盘，直接改名，不用再拷一遍
    written.push(() => fsp.rm(origPath, { force: true }))
    await storage.put(thumbKey, poster, { contentType: 'image/webp' })
    written.push(() => storage.remove(thumbKey))
    db.prepare(`INSERT INTO media (id, entry_id, kind, status, key, thumb_key, orig_key, width, height, duration, size, taken_at, lat, lng, sort, created_at)
                VALUES (?, NULL, 'video', 'processing', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`)
      .run(id, key, thumbKey, origKey, info.width, info.height, info.duration, req.file.size, info.takenAt, info.lat, info.lng, now)
  } catch (e) {
    await Promise.allSettled(written.map((f) => f()))
    throw e
  }
  enqueue(id)
  const row = db.prepare('SELECT * FROM media WHERE id = ?').get(id)
  res.status(201).json({ ...mediaOut(row), date: info.takenAt ? ymd(info.takenAt) : null, gps: gpsOut(info.lat, info.lng) })
  return true
}

mediaApi.get('/:id', (req, res) => {
  const row = ID_RE.test(req.params.id) && db.prepare('SELECT * FROM media WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: 'not found' })
  res.json(mediaOut(row))
})

// 视频处理失败了，点「重试」重新排队（原文件还在服务器上）
mediaApi.post('/:id/retry', async (req, res) => {
  const row = ID_RE.test(req.params.id) && db.prepare("SELECT * FROM media WHERE id = ? AND kind = 'video'").get(req.params.id)
  if (!row) return res.status(404).json({ error: 'not found' })
  if (row.status === 'failed') {
    try { await fsp.access(origPathOf(row)) } catch { return res.status(410).json({ error: 'gone', message: '原视频已经不在了，请删掉重新传一次' }) }
    db.prepare("UPDATE media SET status = 'processing' WHERE id = ?").run(row.id)
    enqueue(row.id)
  }
  res.json(mediaOut(db.prepare('SELECT * FROM media WHERE id = ?').get(row.id)))
})

mediaApi.delete('/:id', async (req, res) => {
  const row = ID_RE.test(req.params.id) && db.prepare('SELECT * FROM media WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: 'not found' })
  await removeMedia(row)
  res.status(204).end()
})
