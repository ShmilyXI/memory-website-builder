import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { storage } from '../storage/index.js'
import { newId, ID_RE } from '../util.js'
import { haversineKm } from '../geo.js'
import { LocationSchema } from './entries.js'

const MAX = 500
const realDate = (s) => { const d = new Date(`${s}T00:00:00Z`); return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(d) && d.toISOString().slice(0, 10) === s }
const blank = (s) => (s && String(s).trim() ? String(s).trim() : null)

// ---------- 恋爱地图：日记上标了位置的 + 单独放的「去过的地方」，合在一起按日期排 ----------
export const map = Router()

// pins：按日期从早到晚，kind = 'entry'（来自日记）或 'footprint'（单独放的）
// summary：几个地方、几座城市、几个省、一路走了多少公里（按日期顺序把相邻的点连起来算）
export function buildMap() {
  const entries = db.prepare(`SELECT id, date, title, place, author, lat, lng, province, city, adcode, created_at
                              FROM entries WHERE deleted_at IS NULL AND lat IS NOT NULL AND lng IS NOT NULL`).all()
  const thumbs = new Map()
  if (entries.length) {
    const ph = entries.map(() => '?').join(',')
    for (const t of db.prepare(`SELECT entry_id, thumb_key FROM media WHERE entry_id IN (${ph}) AND status = 'ready' AND thumb_key IS NOT NULL ORDER BY sort, created_at`).all(...entries.map((e) => e.id))) {
      if (!thumbs.has(t.entry_id)) thumbs.set(t.entry_id, storage.url(t.thumb_key))
    }
  }
  const pins = [
    ...entries.map((e) => ({
      id: e.id, kind: 'entry', entryId: e.id, date: e.date, title: e.title || e.place || '日记', place: e.place, author: e.author,
      lat: e.lat, lng: e.lng, province: e.province, city: e.city, adcode: e.adcode, thumbUrl: thumbs.get(e.id) ?? null, note: null, icon: null, _t: e.created_at,
    })),
    ...db.prepare('SELECT * FROM footprints').all().map((f) => ({
      id: f.id, kind: 'footprint', entryId: null, date: f.date, title: f.title, place: null, author: null,
      lat: f.lat, lng: f.lng, province: f.province, city: f.city, adcode: f.adcode, thumbUrl: null, note: f.note, icon: f.icon, _t: f.created_at,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date) || a._t - b._t)
  pins.forEach((p) => delete p._t)

  let km = 0
  for (let i = 1; i < pins.length; i++) km += haversineKm(pins[i - 1], pins[i])
  const code = (p, n) => (p.adcode ? p.adcode.slice(0, n) + '0'.repeat(6 - n) : null)
  const provinceCodes = [...new Set(pins.map((p) => code(p, 2)).filter(Boolean))]
  const cityCodes = [...new Set(pins.map((p) => code(p, 4)).filter(Boolean))]
  return {
    pins,
    summary: { pins: pins.length, provinces: provinceCodes.length, cities: cityCodes.length, provinceCodes, cityCodes, km: Math.round(km) },
  }
}

// GET /api/map → { pins, summary }
map.get('/', (_req, res) => {
  res.set('Cache-Control', 'no-store')
  res.json(buildMap())
})

// ---------- 单独放的「去过的地方」 ----------
const FootBase = {
  title: z.string().trim().min(1, '起个名字吧').max(40, '名字 40 个字以内'),
  date: z.string().refine(realDate, '日期不对'),
  note: z.string().trim().max(300, '备注 300 个字以内').nullish(),
  icon: z.string().trim().max(8).nullish(),
}
const FootCreate = z.object({ ...FootBase, location: LocationSchema })
const FootPatch = z.object({ ...FootBase, location: LocationSchema }).partial()

const out = (f) => ({
  id: f.id, kind: 'footprint', title: f.title, date: f.date, note: f.note, icon: f.icon,
  lat: f.lat, lng: f.lng, province: f.province, city: f.city, adcode: f.adcode,
})
const get = (id) => ID_RE.test(id) && db.prepare('SELECT * FROM footprints WHERE id = ?').get(id)
const bad = (res, zerr) => res.status(400).json({ error: 'invalid', message: zerr.issues[0].message })

export const footprints = Router()

footprints.post('/', (req, res) => {
  const r = FootCreate.safeParse(req.body)
  if (!r.success) return bad(res, r.error)
  if (db.prepare('SELECT COUNT(*) n FROM footprints').get().n >= MAX) return res.status(400).json({ error: 'invalid', message: '去过的地方太多啦' })
  const d = r.data
  const id = newId()
  db.prepare('INSERT INTO footprints (id, title, date, lat, lng, province, city, adcode, note, icon, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, d.title, d.date, d.location.lat, d.location.lng, blank(d.location.province), blank(d.location.city), d.location.adcode ?? null, blank(d.note), blank(d.icon), Date.now())
  res.status(201).json(out(get(id)))
})

footprints.patch('/:id', (req, res) => {
  const f = get(req.params.id)
  if (!f) return res.status(404).json({ error: 'not found' })
  const r = FootPatch.safeParse(req.body)
  if (!r.success) return bad(res, r.error)
  const d = r.data
  const loc = d.location
  db.prepare('UPDATE footprints SET title = ?, date = ?, note = ?, icon = ?, lat = ?, lng = ?, province = ?, city = ?, adcode = ? WHERE id = ?').run(
    d.title ?? f.title, d.date ?? f.date,
    d.note !== undefined ? blank(d.note) : f.note, d.icon !== undefined ? blank(d.icon) : f.icon,
    loc ? loc.lat : f.lat, loc ? loc.lng : f.lng,
    loc ? blank(loc.province) : f.province, loc ? blank(loc.city) : f.city, loc ? loc.adcode ?? null : f.adcode,
    f.id)
  res.json(out(get(f.id)))
})

footprints.delete('/:id', (req, res) => {
  if (!get(req.params.id)) return res.status(404).json({ error: 'not found' })
  db.prepare('DELETE FROM footprints WHERE id = ?').run(req.params.id)
  res.status(204).end()
})
