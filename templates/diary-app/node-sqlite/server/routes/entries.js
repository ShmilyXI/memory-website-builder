import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { newId, ID_RE, mediaOut } from '../util.js'

class BadRequest extends Error {}

const MOODS = ['happy', 'sweet', 'miss', 'calm', 'tired', 'sad']
const AUTHORS = ['xiao', 'ying'] // 肖肖 / 英英
const realDate = (s) => { const d = new Date(`${s}T00:00:00Z`); return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(d) && d.toISOString().slice(0, 10) === s }

// 日记的地点：坐标是高德用的 GCJ-02；省 / 市 / 区县代码来自高德的搜索或逆地理编码（点亮省市用）
export const LocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  province: z.string().trim().max(30).nullish(),
  city: z.string().trim().max(30).nullish(),
  adcode: z.string().regex(/^\d{6}$/).nullish(),
})

const shape = {
  date: z.string().refine(realDate, '日期不对'), // 事情发生的那天，可以补写以前的日子
  title: z.string().trim().max(60).nullish(),
  body: z.string().max(20000),
  mood: z.enum(MOODS).nullish(),
  place: z.string().trim().max(60).nullish(),
  author: z.enum(AUTHORS),
  featured: z.boolean(), // 收进故事
  mediaIds: z.array(z.string().regex(ID_RE)).max(30),
  location: LocationSchema.nullable(), // 在地图上的位置，不标就是 null
}
const CreateSchema = z.object({ ...shape, body: shape.body.default(''), featured: shape.featured.default(false), mediaIds: shape.mediaIds.default([]), location: shape.location.default(null) })
const PatchSchema = z.object(shape).partial()

const bad = (res, zerr) => res.status(400).json({ error: 'invalid', issues: zerr.issues.map((i) => `${i.path.join('.')}: ${i.message}`) })
const blank = (s) => (s && s.trim() ? s.trim() : null)

// 一批日记 id → 带图片、爱心和留言数的完整数据（保持传入的顺序）
export function load(ids) {
  if (!ids.length) return []
  const ph = ids.map(() => '?').join(',')
  const rows = db.prepare(`SELECT * FROM entries WHERE id IN (${ph}) AND deleted_at IS NULL`).all(...ids)
  const media = db.prepare(`SELECT * FROM media WHERE entry_id IN (${ph}) ORDER BY sort, created_at`).all(...ids)
  const hearts = db.prepare(`SELECT entry_id, author FROM reactions WHERE entry_id IN (${ph}) ORDER BY created_at`).all(...ids)
  const counts = new Map(db.prepare(`SELECT entry_id, COUNT(*) n FROM comments WHERE entry_id IN (${ph}) GROUP BY entry_id`).all(...ids).map((r) => [r.entry_id, r.n]))
  const by = new Map(rows.map((r) => [r.id, {
    id: r.id, date: r.date, title: r.title, body: r.body, mood: r.mood, place: r.place, author: r.author,
    featured: !!r.featured, createdAt: r.created_at, updatedAt: r.updated_at, media: [], hearts: [], commentCount: counts.get(r.id) || 0,
    location: r.lat !== null && r.lng !== null ? { lat: r.lat, lng: r.lng, province: r.province, city: r.city, adcode: r.adcode } : null,
  }]))
  media.forEach((m) => by.get(m.entry_id)?.media.push(mediaOut(m)))
  hearts.forEach((h) => by.get(h.entry_id)?.hearts.push(h.author))
  return ids.map((id) => by.get(id)).filter(Boolean)
}

// 把图片挂到日记上。已经挂在别的日记上的不行；这次没带上的、原来挂着的就松开（等清理任务回收）。
function attach(entryId, ids) {
  const uniq = [...new Set(ids)]
  const ph = uniq.map(() => '?').join(',')
  db.prepare(`UPDATE media SET entry_id = NULL WHERE entry_id = ? ${uniq.length ? `AND id NOT IN (${ph})` : ''}`).run(entryId, ...uniq)
  const upd = db.prepare('UPDATE media SET entry_id = ?, sort = ? WHERE id = ? AND (entry_id IS NULL OR entry_id = ?)')
  uniq.forEach((mid, i) => {
    if (!upd.run(entryId, i, mid, entryId).changes) throw new BadRequest(`图片 ${mid} 不存在，或者已经在别的日记里了`)
  })
}

const exists = (id) => ID_RE.test(id) && db.prepare('SELECT 1 FROM entries WHERE id = ? AND deleted_at IS NULL').get(id)

export const entries = Router()

// GET /api/entries?cursor=&month=2026-10&author=ying&featured=1&limit=20
entries.get('/', (req, res) => {
  const { month, author, featured, cursor } = req.query
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50)
  const where = ['deleted_at IS NULL']
  const params = []
  if (month !== undefined) { if (!/^\d{4}-\d{2}$/.test(month)) return res.status(400).json({ error: 'bad month' }); where.push('substr(date,1,7) = ?'); params.push(month) }
  if (author !== undefined) { if (!AUTHORS.includes(author)) return res.status(400).json({ error: 'bad author' }); where.push('author = ?'); params.push(author) }
  if (featured === '1') where.push('featured = 1')
  if (cursor !== undefined) {
    let c
    try { c = JSON.parse(Buffer.from(cursor, 'base64url').toString()) } catch { c = null }
    if (!Array.isArray(c) || c.length !== 3) return res.status(400).json({ error: 'bad cursor' })
    where.push('(date, created_at, id) < (?, ?, ?)')
    params.push(...c)
  }
  const rows = db.prepare(`SELECT id, date, created_at FROM entries WHERE ${where.join(' AND ')} ORDER BY date DESC, created_at DESC, id DESC LIMIT ?`).all(...params, limit + 1)
  const page = rows.slice(0, limit)
  const last = page[page.length - 1]
  res.json({
    items: load(page.map((r) => r.id)),
    nextCursor: rows.length > limit ? Buffer.from(JSON.stringify([last.date, last.created_at, last.id])).toString('base64url') : null,
  })
})

entries.get('/:id', (req, res) => {
  const [e] = ID_RE.test(req.params.id) ? load([req.params.id]) : []
  if (!e) return res.status(404).json({ error: 'not found' })
  res.json(e)
})

entries.post('/', (req, res) => {
  const r = CreateSchema.safeParse(req.body)
  if (!r.success) return bad(res, r.error)
  const d = r.data
  if (!blank(d.title) && !blank(d.body) && !d.mediaIds.length) return res.status(400).json({ error: 'empty', message: '写点什么，或者放张照片吧' })
  const id = newId()
  const now = Date.now()
  try {
    db.transaction(() => {
      const loc = d.location
      db.prepare(`INSERT INTO entries (id, date, title, body, mood, place, author, featured, created_at, updated_at, lat, lng, province, city, adcode)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(id, d.date, blank(d.title), d.body, d.mood ?? null, blank(d.place), d.author, d.featured ? 1 : 0, now, now,
          loc?.lat ?? null, loc?.lng ?? null, blank(loc?.province), blank(loc?.city), loc?.adcode ?? null)
      attach(id, d.mediaIds)
    })()
  } catch (e) {
    if (e instanceof BadRequest) return res.status(400).json({ error: 'invalid', message: e.message })
    throw e
  }
  res.status(201).json(load([id])[0])
})

entries.patch('/:id', (req, res) => {
  if (!exists(req.params.id)) return res.status(404).json({ error: 'not found' })
  const r = PatchSchema.safeParse(req.body)
  if (!r.success) return bad(res, r.error)
  const d = r.data
  const sets = []
  const params = []
  const set = (col, v) => { sets.push(`${col} = ?`); params.push(v) }
  if (d.date !== undefined) set('date', d.date)
  if (d.title !== undefined) set('title', blank(d.title))
  if (d.body !== undefined) set('body', d.body)
  if (d.mood !== undefined) set('mood', d.mood ?? null)
  if (d.place !== undefined) set('place', blank(d.place))
  if (d.author !== undefined) set('author', d.author)
  if (d.featured !== undefined) set('featured', d.featured ? 1 : 0)
  if (d.location !== undefined) {
    const loc = d.location
    set('lat', loc?.lat ?? null); set('lng', loc?.lng ?? null)
    set('province', blank(loc?.province)); set('city', blank(loc?.city)); set('adcode', loc?.adcode ?? null)
  }
  try {
    db.transaction(() => {
      set('updated_at', Date.now())
      db.prepare(`UPDATE entries SET ${sets.join(', ')} WHERE id = ?`).run(...params, req.params.id)
      if (d.mediaIds !== undefined) attach(req.params.id, d.mediaIds)
    })()
  } catch (e) {
    if (e instanceof BadRequest) return res.status(400).json({ error: 'invalid', message: e.message })
    throw e
  }
  res.json(load([req.params.id])[0])
})

// 软删除：先留 30 天，手滑了还能找回来（清理任务到期才真正删）
entries.delete('/:id', (req, res) => {
  if (!exists(req.params.id)) return res.status(404).json({ error: 'not found' })
  db.prepare('UPDATE entries SET deleted_at = ? WHERE id = ?').run(Date.now(), req.params.id)
  res.status(204).end()
})

// 点一下加爱心，再点一下取消。每人每篇最多一个。
entries.post('/:id/heart', (req, res) => {
  if (!exists(req.params.id)) return res.status(404).json({ error: 'not found' })
  const r = z.object({ author: z.enum(AUTHORS) }).safeParse(req.body)
  if (!r.success) return bad(res, r.error)
  const had = db.prepare('SELECT 1 FROM reactions WHERE entry_id = ? AND author = ?').get(req.params.id, r.data.author)
  if (had) db.prepare('DELETE FROM reactions WHERE entry_id = ? AND author = ?').run(req.params.id, r.data.author)
  else db.prepare('INSERT INTO reactions (entry_id, author, created_at) VALUES (?, ?, ?)').run(req.params.id, r.data.author, Date.now())
  res.json({ hearts: db.prepare('SELECT author FROM reactions WHERE entry_id = ? ORDER BY created_at').all(req.params.id).map((h) => h.author) })
})

// ---------- 留言：平铺，按时间排，两个人像聊天一样一来一回 ----------
const MAX_COMMENTS = 300
const CommentSchema = z.object({
  author: z.enum(AUTHORS),
  body: z.string().trim().min(1, '写点什么再发吧').max(500, '留言 500 个字以内'),
})
const commentOut = (c) => ({ id: c.id, author: c.author, body: c.body, createdAt: c.created_at })

entries.get('/:id/comments', (req, res) => {
  if (!exists(req.params.id)) return res.status(404).json({ error: 'not found' })
  const rows = db.prepare('SELECT * FROM comments WHERE entry_id = ? ORDER BY created_at, id').all(req.params.id)
  res.json({ items: rows.map(commentOut) })
})

entries.post('/:id/comments', (req, res) => {
  if (!exists(req.params.id)) return res.status(404).json({ error: 'not found' })
  const r = CommentSchema.safeParse(req.body)
  if (!r.success) return res.status(400).json({ error: 'invalid', message: r.error.issues[0].message })
  if (db.prepare('SELECT COUNT(*) n FROM comments WHERE entry_id = ?').get(req.params.id).n >= MAX_COMMENTS) {
    return res.status(400).json({ error: 'invalid', message: '这一篇下面的留言太多啦' })
  }
  const id = newId()
  db.prepare('INSERT INTO comments (id, entry_id, author, body, created_at) VALUES (?, ?, ?, ?, ?)').run(id, req.params.id, r.data.author, r.data.body, Date.now())
  res.status(201).json(commentOut(db.prepare('SELECT * FROM comments WHERE id = ?').get(id)))
})

entries.delete('/:id/comments/:cid', (req, res) => {
  if (!exists(req.params.id) || !ID_RE.test(req.params.cid)) return res.status(404).json({ error: 'not found' })
  const info = db.prepare('DELETE FROM comments WHERE id = ? AND entry_id = ?').run(req.params.cid, req.params.id)
  if (!info.changes) return res.status(404).json({ error: 'not found' })
  res.status(204).end()
})
