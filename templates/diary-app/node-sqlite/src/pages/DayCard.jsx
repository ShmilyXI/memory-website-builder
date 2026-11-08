import { EmojiIcon } from '../icons.jsx'
import { fmtDate, thisYear } from './common.jsx'

// 一个日子：图标 + 名字 + 哪天 + 还有几天。首页和纪念日页共用。
export default function DayCard({ u, onClick }) {
  const { y, md, wd } = fmtDate(u.date)
  const today = u.daysLeft === 0 && !u.passed
  const word = u.passed ? '已过去' : today ? '就是今天' : u.daysLeft === 1 ? '明天' : null
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag className={`d-day-card ${today ? 'today' : ''} ${u.passed ? 'passed' : ''}`} onClick={onClick} type={onClick ? 'button' : undefined}>
      <span className="d-day-icon" aria-hidden><EmojiIcon e={u.icon || '✨'} size={36} /></span>
      <span className="d-day-main">
        <b>{u.label}</b>
        <small>{y !== thisYear() ? `${y}.` : ''}{md} {wd}{u.sub ? ` · ${u.sub}` : ''}</small>
      </span>
      <span className="d-day-left">{word ? <em>{word}</em> : <><b>{u.daysLeft}</b><small>天</small></>}</span>
    </Tag>
  )
}
