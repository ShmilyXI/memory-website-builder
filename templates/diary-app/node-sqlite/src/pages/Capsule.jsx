import { Doodle, Glyph, Arrow } from '../icons.jsx'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, del, post } from '../api.js'
import { CountUp } from '../bits.jsx'
import { Kitty } from '../cute.jsx'
import { AUTHORS, Empty, fmtDate, fmtStamp } from './common.jsx'

// 一封时间胶囊：封存中 → 到日子了（一个等着拆的信封）→ 拆开后的信纸
export default function Capsule() {
  const { id } = useParams()
  const nav = useNavigate()
  const [c, setC] = useState(undefined) // undefined 加载中；null 没找到
  const [letter, setLetter] = useState(null) // 拆开后的正文
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const open = async () => {
    setBusy(true); setErr('')
    try {
      const r = await post(`/api/capsules/${id}/open`)
      setLetter(r); setC(r)
    } catch (e) {
      if (e.status === 403) setC(await api(`/api/capsules/${id}`)) // 还没到日子（刷新一下状态）
      else if (e.message !== 'unauthorized') setErr('没打开成功，再试一次')
    } finally { setBusy(false) }
  }

  useEffect(() => {
    setC(undefined); setLetter(null)
    api(`/api/capsules/${id}`).then((s) => {
      setC(s)
      if (!s.locked && s.opened) post(`/api/capsules/${id}/open`).then((r) => setLetter(r)).catch(() => {}) // 拆过的直接看
    }).catch(() => setC(null))
  }, [id])

  const remove = async () => {
    const msg = c.locked ? '信里的内容封着，删掉以后谁也找不回来了。确定删掉这封信吗？' : '确定删掉这封信吗？'
    if (!window.confirm(msg)) return
    await del(`/api/capsules/${id}`)
    nav('/capsules', { replace: true })
  }

  if (c === undefined) return <div className="d-col"><p className="d-loading">翻页中…</p></div>
  if (c === null) return <div className="d-col"><Empty title="这封信找不到啦" hint="可能已经被删掉了。" to="/capsules" cta="回时间胶囊" /></div>

  const a = AUTHORS[c.author]
  const { y, md, wd } = fmtDate(c.openDate)
  const year = y !== new Date().getFullYear() ? `${y}.` : ''

  return (
    <div className="d-col">
      <header className="d-head">
        <button className="d-back" onClick={() => (window.history.length > 1 ? nav(-1) : nav('/capsules'))} aria-label="返回"><Glyph name="back" size={22} strokeWidth={3} /></button>
        <div className="d-head-r"><button className="d-chip" onClick={remove}>删除</button></div>
      </header>

      {c.locked && (
        <article className={`d-paper d-seal ${a.cls}`}>
          <Kitty size={96} />
          <p className="d-seal-small">这封信封存着</p>
          <div className="d-seal-days"><span>还要等</span><CountUp to={c.daysLeft} className="big" /><span>天</span></div>
          <p className="d-seal-date">{year}{md} {wd} 才能打开</p>
          {c.title && <h1 className="d-paper-title">{c.title}</h1>}
          <p className="d-meta"><span className={`d-who ${a.cls}`}>{a.name}</span><span>{fmtStamp(c.createdAt).split(' ')[0]} 写下并封存</span></p>
          <p className="d-sub plain">到那天之前，谁也看不到里面写了什么。</p>
        </article>
      )}

      {!c.locked && !letter && (
        <article className={`d-paper d-seal ready ${a.cls}`}>
          <div className="d-envelope" aria-hidden><Doodle name="capsule" size={96} /></div>
          <p className="d-seal-small">到日子啦</p>
          {c.title && <h1 className="d-paper-title">{c.title}</h1>}
          <p className="d-meta"><span className={`d-who ${a.cls}`}>{a.name}</span><span>{fmtStamp(c.createdAt).split(' ')[0]} 写下并封存</span></p>
          {c.opened ? <p className="d-loading">翻开中…</p> : <button className="btn" disabled={busy} onClick={open}>{busy ? '拆开中…' : '拆开这封信'}</button>}
          {err && <p className="d-error" role="alert">{err}</p>}
        </article>
      )}

      {letter && (
        <article className={`d-paper d-letter ${a.cls}`}>
          {letter.firstOpen && <p className="d-note"><Doodle name="sparkle" size={20} /> 这封信今天第一次被拆开。</p>}
          {c.title && <h1 className="d-paper-title">{c.title}</h1>}
          <p className="d-meta">
            <span className={`d-who ${a.cls}`}>{a.name}</span>
            <span>{fmtStamp(c.createdAt).split(' ')[0]} 写下</span>
            <span>{year}{md} 开启</span>
          </p>
          <div className="d-body">{letter.body}</div>
        </article>
      )}
      <Link to="/capsules" className="d-more">所有时间胶囊 <Arrow /></Link>
    </div>
  )
}
