import { Doodle, Glyph, Arrow } from '../icons.jsx'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import { AUTHORS, Empty, fmtDate, fmtStamp } from './common.jsx'

// 一封信的卡片：封存中显示还有几天，到日子了显示「可以拆了」
export function CapsuleCard({ c }) {
  const { y, md } = fmtDate(c.openDate)
  const a = AUTHORS[c.author]
  const state = c.locked ? 'sealed' : c.ready ? 'ready' : 'opened'
  return (
    <Link to={`/capsules/${c.id}`} className={`d-cap ${state}`}>
      <span className="d-cap-ico" aria-hidden><Doodle name={c.locked || c.ready ? 'capsule' : 'story'} size={42} />{c.locked && <Glyph name="lock" size={14} className="d-cap-lock" />}</span>
      <span className="d-cap-main">
        <b>{c.title || '（没写标题的信）'}</b>
        <small>{a.name} 写的 · {fmtStamp(c.createdAt).split(' ')[0]} 封存 · {y !== new Date().getFullYear() ? `${y}.` : ''}{md} 开启</small>
      </span>
      <span className="d-cap-left">
        {c.locked ? <><b>{c.daysLeft}</b><small>天后</small></> : c.ready ? <em>可以拆啦</em> : <em>已拆开</em>}
      </span>
    </Link>
  )
}

export default function Capsules() {
  const [data, setData] = useState(null) // { sealed, unlocked }
  const [err, setErr] = useState(false)
  const load = () => api('/api/capsules').then((d) => { setData(d); setErr(false) }).catch(() => setErr(true))
  useEffect(() => { load() }, [])

  if (err) return <div className="d-col"><p className="d-loading">没加载出来，<button className="d-link" onClick={load}>再试一次</button></p></div>
  if (!data) return <div className="d-col"><p className="d-loading">翻页中…</p></div>
  const { sealed, unlocked } = data
  const empty = sealed.length + unlocked.length === 0

  return (
    <div className="d-col">
      <header className="d-head">
        <h1 className="d-title">时间胶囊</h1>
        <Link className="btn small" to="/capsules/new"><Glyph name="plus" size={16} strokeWidth={3} /> 写一封</Link>
      </header>
      <p className="d-sub">写一封信，选一个未来的日子封存起来。到那天之前，谁也看不到里面写了什么，连写信的人自己也不行。</p>

      {empty && <Empty title="还没有封存的信" hint="写给明年的生日、写给一百天、写给以后的某一个普通的日子……" to="/capsules/new" cta="写第一封" />}

      {unlocked.length > 0 && (
        <>
          <h2 className="d-h2">到日子啦</h2>
          <div className="d-list tight">{unlocked.map((c) => <CapsuleCard key={c.id} c={c} />)}</div>
        </>
      )}
      {sealed.length > 0 && (
        <>
          <h2 className="d-h2">封存中</h2>
          <div className="d-list tight">{sealed.map((c) => <CapsuleCard key={c.id} c={c} />)}</div>
        </>
      )}
      <Link to="/" className="d-more">回首页 <Arrow /></Link>
    </div>
  )
}
