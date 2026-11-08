import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { newId, ID_RE, ymd } from '../util.js'

const AUTHORS = ['xiao', 'ying']
const MAX = 200
const realDate = (s) => { const d = new Date(`${s}T00:00:00Z`); return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(d) && d.toISOString().slice(0, 10) === s }

const Create = z.object({
  title: z.string().trim().min(1, '写下想做的事吧').max(60, '太长啦，60 个字以内'),
  note: z.string().trim().max(300, '备注 300 个字以内').nullish(),
  author: z.enum(AUTHORS),
})
const Patch = z.object({
  title: z.string().trim().min(1, '写下想做的事吧').max(60, '太长啦，60 个字以内'),
  note: z.string().trim().max(300, '备注 300 个字以内').nullish(),
  done: z.boolean(),
  doneAt: z.string().refine(realDate, '日期不对'),
  entryId: z.string().regex(ID_RE).nullable(),
}).partial()

const bad = (res, zerr) => res.status(400).json({ error: 'invalid', message: zerr.issues[0].message, issues: zerr.issues.map((i) => i.message) })

// 日记还在（没被删）才算有链接
const SELECT = `SELECT w.*, CASE WHEN e.id IS NOT NULL AND e.deleted_at IS NULL THEN e.id END AS live_entry
                FROM wishes w LEFT JOIN entries e ON e.id = w.entry_id`
const out = (w) => ({
  id: w.id, title: w.title, note: w.note, author: w.author, createdAt: w.created_at,
  done: w.done_at !== null, doneAt: w.done_at, entryId: w.live_entry ?? null,
})
const get = (id) => ID_RE.test(id) && db.prepare(`${SELECT} WHERE w.id = ?`).get(id)

export const wishes = Router()

// GET /api/wishes → 还没做的（新的在前）+ 已经做到的（最近做到的在前）
wishes.get('/', (_req, res) => {
  const rows = db.prepare(`${SELECT} ORDER BY w.created_at DESC, w.id DESC`).all()
  const open = rows.filter((w) => w.done_at === null).map(out)
  const done = rows.filter((w) => w.done_at !== null).sort((a, b) => b.done_at.localeCompare(a.done_at) || b.created_at - a.created_at).map(out)
  res.json({ open, done, counts: { open: open.length, done: done.length, total: rows.length } })
})

wishes.post('/', (req, res) => {
  const r = Create.safeParse(req.body)
  if (!r.success) return bad(res, r.error)
  if (db.prepare('SELECT COUNT(*) n FROM wishes').get().n >= MAX) return res.status(400).json({ error: 'invalid', message: '愿望太多啦，先把做到的删掉一些吧' })
  const id = newId()
  db.prepare('INSERT INTO wishes (id, title, note, author, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(id, r.data.title, r.data.note || null, r.data.author, Date.now())
  res.status(201).json(out(get(id)))
})

wishes.patch('/:id', (req, res) => {
  const w = get(req.params.id)
  if (!w) return res.status(404).json({ error: 'not found' })
  const r = Patch.safeParse(req.body)
  if (!r.success) return bad(res, r.error)
  const d = r.data
  let doneAt = w.done_at
  let entryId = w.entry_id
  if (d.done === false) { doneAt = null; entryId = null }
  if (d.done === true || (d.doneAt !== undefined && w.done_at !== null)) {
    doneAt = d.doneAt ?? w.done_at ?? ymd(Date.now())
  }
  if (d.entryId !== undefined) {
    if (d.entryId !== null && !db.prepare('SELECT 1 FROM entries WHERE id = ? AND deleted_at IS NULL').get(d.entryId)) {
      return res.status(400).json({ error: 'invalid', message: '这篇日记不存在' })
    }
    entryId = d.entryId
    if (entryId && doneAt === null) doneAt = ymd(Date.now()) // 链上日记就是做到了
  }
  db.prepare('UPDATE wishes SET title = ?, note = ?, done_at = ?, entry_id = ? WHERE id = ?')
    .run(d.title ?? w.title, d.note !== undefined ? d.note || null : w.note, doneAt, entryId, w.id)
  res.json(out(get(w.id)))
})

wishes.delete('/:id', (req, res) => {
  if (!get(req.params.id)) return res.status(404).json({ error: 'not found' })
  db.prepare('DELETE FROM wishes WHERE id = ?').run(req.params.id)
  res.status(204).end()
})
