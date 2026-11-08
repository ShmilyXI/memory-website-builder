import { Router } from 'express'
import { db } from '../db.js'
import { ymd } from '../util.js'
import { diffDays, loveDateOf, upcoming } from '../anniversary.js'
import { load } from './entries.js'
import { buildMap } from './map.js'

export const home = Router()

// 那年今天：和今天同一个「日」的往期日记。往前看 5 年（60 个月），整年的叫「N 年前的今天」，
// 其他叫「N 个月前的今天」；没有这一天的月份（比如 31 号遇到 30 天的月）跳过。最多 3 篇，近的在前。
export function onThisDay(today, limit = 3) {
  const [y, m, d] = today.split('-').map(Number)
  const dates = []
  for (let k = 1; k <= 60; k++) {
    const t = new Date(Date.UTC(y, m - 1 - k, 1))
    const last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate()
    if (d > last) continue
    dates.push({ k, date: `${String(t.getUTCFullYear()).padStart(4, '0')}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` })
  }
  const ph = dates.map(() => '?').join(',')
  const rows = db.prepare(`SELECT id, date FROM entries WHERE deleted_at IS NULL AND date IN (${ph}) ORDER BY date DESC, created_at DESC, id DESC`).all(...dates.map((x) => x.date))
  const kOf = new Map(dates.map((x) => [x.date, x.k]))
  const picked = rows.slice(0, limit)
  const full = new Map(load(picked.map((r) => r.id)).map((e) => [e.id, e]))
  const label = (k) => (k % 12 === 0 ? `${k / 12} 年前的今天` : k < 12 ? `${k} 个月前的今天` : `${Math.floor(k / 12)} 年 ${k % 12} 个月前的今天`)
  return picked.map((r) => ({ label: label(kOf.get(r.date)), entry: full.get(r.id) })).filter((x) => x.entry)
}

// GET /api/home → 首页要的：在一起第几天、接下来最近的 3 个日子、日记和照片一共多少、
// 那年今天、愿望清单和时间胶囊的数量
home.get('/', (_req, res) => {
  const today = ymd(Date.now())
  const rows = db.prepare('SELECT * FROM anniversaries').all()
  const entries = db.prepare('SELECT COUNT(*) n FROM entries WHERE deleted_at IS NULL').get().n
  const photos = db.prepare(`SELECT COUNT(*) n FROM media m JOIN entries e ON e.id = m.entry_id
                             WHERE e.deleted_at IS NULL AND m.status = 'ready'`).get().n
  const w = db.prepare('SELECT COUNT(*) total, COUNT(done_at) done FROM wishes').get()
  const c = db.prepare(`SELECT COALESCE(SUM(open_date > ?), 0) sealed, COALESCE(SUM(open_date <= ? AND opened_at IS NULL), 0) ready FROM capsules`).get(today, today)
  res.set('Cache-Control', 'no-store')
  res.json({
    today,
    daysTogether: diffDays(loveDateOf(rows), today),
    upcoming: upcoming(rows, today, 3),
    counts: { entries, photos },
    onThisDay: onThisDay(today),
    wishes: { open: w.total - w.done, done: w.done },
    capsules: { sealed: c.sealed, ready: c.ready },
    map: (({ pins, cities, provinces, km }) => ({ pins, cities, provinces, km }))(buildMap().summary),
  })
})
