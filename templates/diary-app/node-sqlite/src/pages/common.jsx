import { Doodle } from '../icons.jsx'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Kitty } from '../cute.jsx'

export const AUTHORS = {
  xiao: { name: '肖肖', cls: 'xiao' },
  ying: { name: '英英', cls: 'ying' },
}

export const MOODS = [
  { k: 'happy', e: <Doodle name="happy" size={24} className="mood" />, t: '开心' },
  { k: 'sweet', e: <Doodle name="sweet" size={24} className="mood" />, t: '甜甜的' },
  { k: 'miss', e: <Doodle name="miss" size={24} className="mood" />, t: '想你' },
  { k: 'calm', e: <Doodle name="calm" size={24} className="mood" />, t: '平静' },
  { k: 'tired', e: <Doodle name="tired" size={24} className="mood" />, t: '累累' },
  { k: 'sad', e: <Doodle name="sad" size={24} className="mood" />, t: '难过' },
]
export const moodOf = (k) => MOODS.find((m) => m.k === k)

// ---------- 我是谁 ----------
// 只用来给日记署名和点爱心，记在这台手机 / 电脑上，和口令无关（口令每次打开都要输）。
const ME_KEY = 'diary-me'
let me = null
try { const v = localStorage.getItem(ME_KEY); if (v === 'xiao' || v === 'ying') me = v } catch { /* 隐私模式读不了就算了 */ }
const subs = new Set()
export function setMe(v) {
  me = v
  try { localStorage.setItem(ME_KEY, v) } catch { /* 同上 */ }
  subs.forEach((f) => f(v))
}
export function useMe() {
  const [v, setV] = useState(me)
  useEffect(() => { subs.add(setV); return () => subs.delete(setV) }, [])
  return [v, setMe]
}

// ---------- 日期（都按北京时间） ----------
const WD = ['日', '一', '二', '三', '四', '五', '六']
export const todayStr = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' }) // 2026-10-06
export function fmtDate(s) {
  const [y, m, d] = s.split('-').map(Number)
  return { y, md: `${m}.${d}`, wd: `周${WD[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]}` }
}
// 视频时长：75 秒 → 1:15
export function fmtDur(sec) {
  const s = Math.max(0, Math.round(sec || 0))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
// 一个时间戳 → 「10.6 18:30」（北京时间）
export function fmtStamp(ts) {
  const s = new Date(ts + 8 * 3600_000).toISOString()
  return `${Number(s.slice(5, 7))}.${Number(s.slice(8, 10))} ${s.slice(11, 16)}`
}
// 'yyyy-mm-dd' 加减几天
export function addDaysStr(s, n) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10)
}
export const thisYear = () => Number(todayStr().slice(0, 4))

// ---------- 小组件 ----------
export function WhoAmI({ label = '现在是谁在用', className = '' }) {
  const [v, set] = useMe()
  return (
    <div className={`d-who-pick ${className}`} role="group" aria-label={label}>
      <span>{label}</span>
      {Object.entries(AUTHORS).map(([k, a]) => (
        <button key={k} type="button" className={`d-pill ${a.cls} ${v === k ? 'on' : ''}`} aria-pressed={v === k} onClick={() => set(k)}>{a.name}</button>
      ))}
    </div>
  )
}

export function Empty({ title, hint, to, cta }) {
  return (
    <div className="d-empty">
      <Kitty size={84} />
      <b>{title}</b>
      {hint && <p>{hint}</p>}
      {to && <Link className="btn" to={to}>{cta}</Link>}
    </div>
  )
}

export const HeartIcon = ({ on }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
    <path d="M12 20.5s-7.5-4.6-7.5-10.4A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.5c0 5.8-7.5 10.4-7.5 10.4z" fill={on ? '#ff5c8a' : '#fff'} stroke="#5a2b3c" strokeWidth="2.2" strokeLinejoin="round" />
  </svg>
)
