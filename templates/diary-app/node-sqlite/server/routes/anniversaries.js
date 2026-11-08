import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { newId, ymd } from '../util.js'
import { autoDays, loveDateOf, present, validLunar } from '../anniversary.js'

const ID_RE = /^[0-9a-f-]{16,36}$/ // 自己新建的是 16 位十六进制，预置的是 UUID
const MAX = 100

const base = {
  title: z.string().trim().min(1, '起个名字吧').max(30),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  calendar: z.enum(['solar', 'lunar']),
  repeat: z.enum(['yearly', 'once']),
  icon: z.string().trim().max(8).nullish(),
}
const Create = z.object({ ...base, calendar: base.calendar.default('solar'), repeat: base.repeat.default('yearly') })
const Patch = z.object(base).partial()

// 日期是不是真的存在（公历看日历，农历看农历）
function dateProblem(date, calendar) {
  const [y, m, d] = date.split('-').map(Number)
  if (y < 1900 || y > 2100) return '年份不对'
  if (calendar === 'lunar') return validLunar(y, m, d) ? null : '农历这一天不存在（比如这个月没有三十）'
  const t = new Date(Date.UTC(y, m - 1, d))
  return t.toISOString().slice(0, 10) === date ? null : '这一天不存在'
}
const bad = (res, issues) => res.status(400).json({ error: 'invalid', message: issues[0], issues })

const all = () => db.prepare('SELECT * FROM anniversaries ORDER BY created_at, id').all()
const get = (id) => ID_RE.test(id) && db.prepare('SELECT * FROM anniversaries WHERE id = ?').get(id)

export const anniversaries = Router()

// GET /api/anniversaries → 自己存的日子（带下一次是哪天、还有几天）+ 接下来几个自动算的整数日子
anniversaries.get('/', (_req, res) => {
  const today = ymd(Date.now())
  const rows = all()
  const items = rows.map((a) => ({ ...present(a, today), rawDate: a.date }))
  // 还没到的在前（按天数），已经过去的「只一次」排最后
  items.sort((x, y) => (x.passed ? 1 : 0) - (y.passed ? 1 : 0) || x.daysLeft - y.daysLeft)
  res.json({ today, items, auto: autoDays(loveDateOf(rows), today, 8) })
})

anniversaries.post('/', (req, res) => {
  const r = Create.safeParse(req.body)
  if (!r.success) return bad(res, r.error.issues.map((i) => i.message))
  const d = r.data
  const problem = dateProblem(d.date, d.calendar)
  if (problem) return bad(res, [problem])
  if (db.prepare('SELECT COUNT(*) n FROM anniversaries').get().n >= MAX) return bad(res, ['纪念日太多啦'])
  const id = newId()
  db.prepare('INSERT INTO anniversaries (id, title, date, calendar, repeat, icon, builtin, created_at) VALUES (?,?,?,?,?,?,0,?)')
    .run(id, d.title, d.date, d.calendar, d.repeat, d.icon || null, Date.now())
  res.status(201).json(present(get(id), ymd(Date.now())))
})

anniversaries.patch('/:id', (req, res) => {
  const a = get(req.params.id)
  if (!a) return res.status(404).json({ error: 'not found' })
  const r = Patch.safeParse(req.body)
  if (!r.success) return bad(res, r.error.issues.map((i) => i.message))
  const d = r.data
  // 「在一起」是整个网站算天数的起点，只能换图标
  if (a.builtin && ['title', 'date', 'calendar', 'repeat'].some((k) => d[k] !== undefined && d[k] !== a[k])) {
    return bad(res, ['「在一起」这一条是算天数的起点，只能改图标'])
  }
  const next = { ...a, ...Object.fromEntries(Object.entries(d).filter(([, v]) => v !== undefined)) }
  const problem = dateProblem(next.date, next.calendar)
  if (problem) return bad(res, [problem])
  db.prepare('UPDATE anniversaries SET title = ?, date = ?, calendar = ?, repeat = ?, icon = ? WHERE id = ?')
    .run(next.title, next.date, next.calendar, next.repeat, next.icon || null, a.id)
  res.json(present(get(a.id), ymd(Date.now())))
})

anniversaries.delete('/:id', (req, res) => {
  const a = get(req.params.id)
  if (!a) return res.status(404).json({ error: 'not found' })
  if (a.builtin) return bad(res, ['「在一起」这一条不能删'])
  db.prepare('DELETE FROM anniversaries WHERE id = ?').run(a.id)
  res.status(204).end()
})
