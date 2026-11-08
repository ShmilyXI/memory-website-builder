import fs from 'node:fs'
import path from 'node:path'
import { Router } from 'express'
import { config } from '../config.js'
import { verify } from '../sign.js'

// 文件只放在固定的两个根目录里：story（故事页素材）和 media（日记上传，M2 起用）
const ROOTS = { story: config.storyDir, upload: path.join(config.dataDir, 'media') }
const EXT_OK = /\.(webp|jpe?g|png|gif|mp3|m4a|mp4|webm|json)$/i

export const media = Router()

// GET /media/<key>?e=&s=
media.get(/^\/(.+)$/, (req, res) => {
  let key
  try { key = decodeURIComponent(req.params[0]) } catch { return res.status(400).end() }
  if (!verify(key, req.query.e, req.query.s)) return res.status(403).end()

  // 带上哪个根目录：upload/ 开头的走上传目录，其余都是故事素材
  const [first, ...rest] = key.split('/')
  const [rootDir, rel] = first === 'upload' ? [ROOTS.upload, rest.join('/')] : [ROOTS.story, key]
  const file = path.resolve(rootDir, rel)
  if (!file.startsWith(rootDir + path.sep) || !EXT_OK.test(file)) return res.status(404).end()
  if (path.basename(file).startsWith('_') || key.endsWith('photos.json') || key.endsWith('voices.json') || key.startsWith('data/')) return res.status(404).end()
  if (!fs.existsSync(file)) return res.status(404).end()

  // 签名地址每小时才变一次，浏览器可以放心缓存；sendFile 自带 Range，视频能拖进度
  res.set('Cache-Control', 'private, max-age=3600')
  res.sendFile(file, { dotfiles: 'deny' })
})
