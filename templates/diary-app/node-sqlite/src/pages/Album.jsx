import { Glyph } from '../icons.jsx'
import { useEffect, useRef, useState } from 'react'
import { api } from '../api.js'
import { openViewer } from '../ui.jsx'
import { Empty, fmtDate, fmtDur } from './common.jsx'

const monthLabel = (m) => { const [y, mm] = m.split('-'); return `${y} 年 ${Number(mm)} 月` }

export default function Album() {
  const [data, setData] = useState(null) // {months, month, items}
  const [err, setErr] = useState(false)
  const ticket = useRef(0)

  const load = (month) => {
    const t = ++ticket.current
    setErr(false)
    api(`/api/album${month ? `?month=${month}` : ''}`).then((d) => t === ticket.current && setData(d)).catch(() => t === ticket.current && setErr(true))
  }
  useEffect(() => { load() }, [])

  const look = (i) => {
    const list = data.items.map((m) => ({ id: m.id, src: m.url, kind: m.kind, poster: m.thumbUrl, hint: fmtDate(m.date).md, entryId: m.entryId }))
    openViewer({ list, index: i, title: monthLabel(data.month) })
  }

  if (err) return <div className="d-col"><p className="d-loading">没加载出来，<button className="d-link" onClick={() => load()}>再试一次</button></p></div>
  if (!data) return <div className="d-col"><p className="d-loading">翻页中…</p></div>
  const total = data.months.reduce((n, m) => n + m.count, 0)

  return (
    <div className="d-col">
      <header className="d-head">
        <h1 className="d-title">相册</h1>
        {total > 0 && <span className="d-count">{total} 项</span>}
      </header>
      {total === 0 ? (
        <Empty title="还没有照片和视频哦" hint="写日记的时候放进去的照片和视频，都会按月份收在这里。" to="/write" cta="去记一笔" />
      ) : (
        <>
          <div className="d-months" role="group" aria-label="选月份">
            {data.months.map((m) => (
              <button key={m.month} className={`d-chip ${m.month === data.month ? 'on' : ''}`} aria-pressed={m.month === data.month} onClick={() => load(m.month)}>
                {monthLabel(m.month)} · {m.count}
              </button>
            ))}
          </div>
          <div className="d-grid">
            {data.items.map((m, i) => (
              <button key={m.id} className="d-cell" onClick={() => look(i)} aria-label={`${fmtDate(m.date).md} 的${m.kind === 'video' ? '视频，点开播放' : '照片，点开看大图'}`}>
                {m.thumbUrl && <img src={m.thumbUrl} alt="" loading="lazy" />}
                {m.kind === 'video' && <b className="d-vbadge" aria-hidden><Glyph name="play" size={11} /> <small>{fmtDur(m.duration)}</small></b>}
              </button>
            ))}
          </div>
          <p className="d-end">点开一张，可以直接跳到那一天的日记</p>
        </>
      )}
    </div>
  )
}
