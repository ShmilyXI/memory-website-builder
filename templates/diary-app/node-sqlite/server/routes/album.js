import { Router } from 'express'
import { db } from '../db.js'
import { mediaOut } from '../util.js'

export const album = Router()

// GET /api/album?month=2026-10 → 所有月份的数量 + 这个月的全部图片（不带 month 就取最近有图的那个月）
album.get('/', (req, res) => {
  const months = db.prepare(`
    SELECT substr(e.date, 1, 7) AS month, COUNT(*) AS count
    FROM media m JOIN entries e ON e.id = m.entry_id
    WHERE e.deleted_at IS NULL AND m.status = 'ready'
    GROUP BY month ORDER BY month DESC`).all()
  const asked = req.query.month
  if (asked !== undefined && !/^\d{4}-\d{2}$/.test(asked)) return res.status(400).json({ error: 'bad month' })
  const month = asked ?? months[0]?.month ?? null
  const items = month
    ? db.prepare(`
        SELECT m.*, e.date FROM media m JOIN entries e ON e.id = m.entry_id
        WHERE e.deleted_at IS NULL AND m.status = 'ready' AND substr(e.date, 1, 7) = ?
        ORDER BY e.date DESC, e.created_at DESC, m.sort`).all(month)
    : []
  res.json({ months, month, items: items.map((r) => ({ ...mediaOut(r), entryId: r.entry_id, date: r.date })) })
})
