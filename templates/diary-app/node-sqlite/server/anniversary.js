import { Lunar } from 'lunar-javascript'

// 纪念日的计算。全部是纯函数：给定「今天」（北京时间 YYYY-MM-DD），算出下一次是哪天、还有几天。
const DAY = 86400000
const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return { y, m, d } }
const utc = (y, m, d) => Date.UTC(y, m - 1, d)
const toStr = (ms) => new Date(ms).toISOString().slice(0, 10)
const dim = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate() // y 年 m 月有几天（m 从 1 开始）
export const diffDays = (a, b) => Math.round((utc(...Object.values(parse(b))) - utc(...Object.values(parse(a)))) / DAY) // b - a

// ---------- 农历 ----------
export function validLunar(y, m, d) {
  try { return Lunar.fromYmd(y, m, d).getDay() === d && Lunar.fromYmd(y, m, d).getMonth() === m } catch { return false }
}
// 农历 → 公历。这个月没有三十，就按二十九算；闰月不算（都按正常月份）。
export function lunarToSolar(ly, m, d) {
  for (const day of [d, d - 1]) {
    try { return Lunar.fromYmd(ly, m, day).getSolar().toYmd() } catch { /* 没有这一天 */ }
  }
  return null
}
const lunarYearOf = (dateStr) => { const { y, m, d } = parse(dateStr); return Lunar.fromDate(new Date(Date.UTC(y, m - 1, d, 12))).getYear() }
export function lunarText(a) {
  const f = parse(a.date)
  try { const l = Lunar.fromYmd(f.y, f.m, f.d); return `农历${l.getMonthInChinese()}月${l.getDayInChinese()}` } catch { return `农历${f.m}月${f.d}日` }
}

/**
 * 一条纪念日，从 today（含）起的下一次：{ date, n }。
 * n：第几年（生日就是几岁、周年就是几周年；第一次就是 0）。
 * 公历 2 月 29 日遇到平年按 2 月 28 日；农历生日的岁数按农历年算。
 */
export function nextOccurrence(a, today) {
  const f = parse(a.date)
  const lunar = a.calendar === 'lunar'
  if (a.repeat === 'once') {
    const date = lunar ? lunarToSolar(f.y, f.m, f.d) : a.date
    return date ? { date, n: 0 } : null
  }
  let best = null
  if (lunar) {
    const ly0 = lunarYearOf(today)
    for (let ly = Math.max(ly0 - 1, f.y); ly <= ly0 + 1; ly++) {
      const date = lunarToSolar(ly, f.m, f.d)
      if (date && date >= today && (!best || date < best.date)) best = { date, n: ly - f.y }
    }
    return best
  }
  const ty = parse(today).y
  for (let y = Math.max(f.y, ty); y <= ty + 1; y++) {
    const d = f.m === 2 && f.d === 29 && dim(y, 2) < 29 ? 28 : f.d
    const date = toStr(utc(y, f.m, d))
    if (date >= today) return { date, n: y - f.y }
  }
  return null
}

const labelFor = (a, n) => {
  if (a.repeat === 'once' || n === 0) return a.title
  return a.title.endsWith('生日') ? `${a.title} · ${n} 岁` : `${a.title} ${n} 周年`
}

export function describe(a, occ, today) {
  return {
    id: a.id, kind: 'custom', title: a.title, icon: a.icon, label: labelFor(a, occ.n),
    date: occ.date, daysLeft: diffDays(today, occ.date),
    calendar: a.calendar, repeat: a.repeat, sub: a.calendar === 'lunar' ? lunarText(a) : null, builtin: !!a.builtin,
  }
}

/**
 * 自动算出来的日子（不存数据库）：
 *  - 在一起满 N 个月：每月 30 号，2 月没有 30 号就是月底；满整年的由「在一起」每年重复那条负责，这里不重复
 *  - 在一起第 N 百天：和故事页一样，在一起那天算第 0 天，所以第 100 天是 10.8
 */
export function autoDays(loveDate, today, count = 8) {
  const L = parse(loveDate)
  const out = []
  for (let k = 1; k <= 120; k++) {
    if (k % 12 === 0) continue
    const total = L.m - 1 + k
    const y = L.y + Math.floor(total / 12)
    const m = (total % 12) + 1
    const date = toStr(utc(y, m, Math.min(L.d, dim(y, m))))
    if (date >= today) out.push({ kind: 'auto', icon: '🌙', label: `在一起满 ${k} 个月`, date })
  }
  for (let n = 100; n <= 3600; n += 100) {
    const date = toStr(utc(L.y, L.m, L.d) + n * DAY)
    if (date >= today) out.push({ kind: 'auto', icon: '💯', label: `在一起第 ${n} 天`, date })
  }
  return out.sort((a, b) => (a.date < b.date ? -1 : 1)).slice(0, count).map((x) => ({ ...x, daysLeft: diffDays(today, x.date) }))
}

// 给前端看的一条：已经过去的「只一次」带上 passed
export function present(a, today) {
  const occ = nextOccurrence(a, today)
  if (!occ) return { ...describe(a, { date: a.date, n: 0 }, today), passed: true }
  const d = describe(a, occ, today)
  return occ.date < today ? { ...d, passed: true } : d
}

export const loveDateOf = (rows) => rows.find((r) => r.builtin)?.date ?? '2026-06-30'

// 接下来最近的几个日子：自己存的 + 自动算的，按还有几天排，同一天自己存的排前面
export function upcoming(rows, today, limit = 3) {
  const items = []
  for (const a of rows) {
    const occ = nextOccurrence(a, today)
    if (occ && occ.date >= today) items.push(describe(a, occ, today)) // 已经过去的「只一次」不再出现
  }
  items.push(...autoDays(loveDateOf(rows), today, 12))
  return items.sort((x, y) => x.daysLeft - y.daysLeft || (x.kind === 'auto') - (y.kind === 'auto')).slice(0, limit)
}
