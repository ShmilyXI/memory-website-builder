import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { newId, ID_RE, ymd } from '../util.js'
import { diffDays } from '../anniversary.js'

const AUTHORS = ['xiao', 'ying']
const MAX = 100
const MAX_YEARS = 5
const realDate = (s) => { const d = new Date(`${s}T00:00:00Z`); return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(d) && d.toISOString().slice(0, 10) === s }

const Create = z.object({
  title: z.string().trim().max(40, '标题 40 个字以内').nullish(),
  body: z.string().trim().min(1, '信还是空的哦').max(20000, '信太长啦，2 万字以内'),
  openDate: z.string().refine(realDate, '日期不对'),
  author: z.enum(AUTHORS),
})

const today = () => ymd(Date.now())
// 北京时间：到了 open_date 这一天就能拆（日期字符串直接比大小）
const locked = (c, t = today()) => t < c.open_date
// 摘要：列表和详情都只返回这个，永远不带正文
const summary = (c, t = today()) => {
  const isLocked = locked(c, t)
  return {
    id: c.id, author: c.author, title: c.title, openDate: c.open_date, createdAt: c.created_at,
    locked: isLocked,
    daysLeft: isLocked ? diffDays(t, c.open_date) : 0,
    opened: c.opened_at !== null,
    openedAt: c.opened_at,
    ready: !isLocked && c.opened_at === null, // 到日子了、还没人拆
  }
}
const get = (id) => ID_RE.test(id) && db.prepare('SELECT * FROM capsules WHERE id = ?').get(id)

export const capsules = Router()

// GET /api/capsules → 封存中的（快到的在前）+ 可以拆的 / 已经拆过的（新的在前）
capsules.get('/', (_req, res) => {
  const t = today()
  const rows = db.prepare('SELECT * FROM capsules').all()
  const items = rows.map((c) => summary(c, t))
  const sealed = items.filter((c) => c.locked).sort((a, b) => a.openDate.localeCompare(b.openDate))
  const unlocked = items.filter((c) => !c.locked).sort((a, b) => (b.ready ? 1 : 0) - (a.ready ? 1 : 0) || b.openDate.localeCompare(a.openDate))
  res.json({ today: t, sealed, unlocked })
})

capsules.post('/', (req, res) => {
  const r = Create.safeParse(req.body)
  if (!r.success) return res.status(400).json({ error: 'invalid', message: r.error.issues[0].message })
  const d = r.data
  const t = today()
  if (d.openDate <= t) return res.status(400).json({ error: 'invalid', message: '要选一个明天以后的日子' })
  if (diffDays(t, d.openDate) > MAX_YEARS * 366) return res.status(400).json({ error: 'invalid', message: `最多封存 ${MAX_YEARS} 年` })
  if (db.prepare('SELECT COUNT(*) n FROM capsules').get().n >= MAX) return res.status(400).json({ error: 'invalid', message: '时间胶囊太多啦' })
  const id = newId()
  db.prepare('INSERT INTO capsules (id, author, title, body, open_date, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, d.author, d.title || null, d.body, d.openDate, Date.now())
  res.status(201).json(summary(get(id)))
})

capsules.get('/:id', (req, res) => {
  const c = get(req.params.id)
  if (!c) return res.status(404).json({ error: 'not found' })
  res.json(summary(c))
})

// POST /api/capsules/:id/open → 到日子才给正文；第一次拆开会记下时间
capsules.post('/:id/open', (req, res) => {
  const c = get(req.params.id)
  if (!c) return res.status(404).json({ error: 'not found' })
  if (locked(c)) {
    return res.status(403).json({ error: 'locked', message: '还没到日子哦', openDate: c.open_date, daysLeft: diffDays(today(), c.open_date) })
  }
  const first = c.opened_at === null
  if (first) db.prepare('UPDATE capsules SET opened_at = ? WHERE id = ? AND opened_at IS NULL').run(Date.now(), c.id)
  res.json({ ...summary(get(c.id)), body: c.body, firstOpen: first })
})

capsules.delete('/:id', (req, res) => {
  if (!get(req.params.id)) return res.status(404).json({ error: 'not found' })
  db.prepare('DELETE FROM capsules WHERE id = ?').run(req.params.id)
  res.status(204).end()
})
