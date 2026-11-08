import { Doodle, Glyph, Arrow } from '../icons.jsx'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, del, post } from '../api.js'
import { openViewer } from '../ui.jsx'
import { AUTHORS, Empty, HeartIcon, WhoAmI, fmtDate, fmtDur, fmtStamp, moodOf, thisYear, useMe } from './common.jsx'

export default function Entry() {
  const { id } = useParams()
  const nav = useNavigate()
  const [me] = useMe()
  const [e, setE] = useState(undefined) // undefined：加载中；null：没找到
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setE(undefined)
    api(`/api/entries/${id}`).then(setE).catch(() => setE(null))
  }, [id])

  // ---------- 留言 ----------
  const [cmts, setCmts] = useState(null) // null 加载中
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [cErr, setCErr] = useState('')
  useEffect(() => {
    setCmts(null); setDraft(''); setCErr('')
    api(`/api/entries/${id}/comments`).then((r) => setCmts(r.items)).catch(() => setCmts([]))
  }, [id])
  const send = async () => {
    if (!me || !draft.trim() || sending) return
    setSending(true); setCErr('')
    try {
      const c = await post(`/api/entries/${id}/comments`, { author: me, body: draft })
      setCmts((l) => [...(l || []), c]); setDraft('')
    } catch (er) { if (er.message !== 'unauthorized') setCErr(er.message || '没发出去，再试一次') } finally { setSending(false) }
  }
  const removeCmt = async (c) => {
    if (!window.confirm('确定删掉这条留言吗？')) return
    try { await del(`/api/entries/${id}/comments/${c.id}`); setCmts((l) => l.filter((x) => x.id !== c.id)) } catch { setCErr('没删掉，再试一次') }
  }

  // 有视频还在转码：隔几秒刷新一下，好了就自动能播放
  const waiting = Boolean(e && e.media.some((m) => m.status === 'processing'))
  useEffect(() => {
    if (!waiting) return
    const t = setInterval(() => { api(`/api/entries/${id}`).then(setE).catch(() => {}) }, 4000)
    return () => clearInterval(t)
  }, [waiting, id])

  if (e === undefined) return <div className="d-col"><p className="d-loading">翻页中…</p></div>
  if (e === null) {
    return (
      <div className="d-col">
        <Empty title="这一页找不到啦" hint="可能已经被删掉了。" to="/diary" cta="回日记本" />
      </div>
    )
  }

  const a = AUTHORS[e.author]
  const { y, md, wd } = fmtDate(e.date)
  const mood = moodOf(e.mood)
  const mine = me && e.hearts.includes(me)

  const heart = async () => {
    if (!me || busy) return
    setBusy(true)
    try { const r = await post(`/api/entries/${id}/heart`, { author: me }); setE({ ...e, hearts: r.hearts }) } finally { setBusy(false) }
  }
  const remove = async () => {
    if (!window.confirm('确定删掉这篇日记吗？')) return
    await del(`/api/entries/${id}`)
    nav('/diary', { replace: true })
  }
  // 还没转好的视频没有播放地址，不放进大图列表里
  const playable = e.media.filter((m) => m.url)
  const look = (m) => openViewer({
    list: playable.map((x) => ({ id: x.id, src: x.url, kind: x.kind, poster: x.thumbUrl, hint: `${md}` })),
    index: playable.indexOf(m),
    title: e.title || `${md} 的日记`,
  })
  const retryVideo = async (m) => {
    try { await post(`/api/media/${m.id}/retry`); setE(await api(`/api/entries/${id}`)) } catch (er) { window.alert(er.status === 410 ? er.message : '没能重新处理，等一下再试试。') }
  }

  return (
    <div className="d-col">
      <header className="d-head">
        <button className="d-back" onClick={() => (window.history.length > 1 ? nav(-1) : nav('/diary'))} aria-label="返回"><Glyph name="back" size={22} strokeWidth={3} /></button>
        <div className="d-head-r">
          <Link className="d-chip" to={`/write/${e.id}`}>编辑</Link>
          <button className="d-chip" onClick={remove}>删除</button>
        </div>
      </header>

      <article className={`d-paper ${a.cls}`}>
        <div className="d-card-top">
          <span className="d-date"><b>{md}</b><small>{y !== thisYear() ? `${y} ` : ''}{wd}</small></span>
          <span className={`d-who ${a.cls}`}>{a.name}</span>
        </div>
        {e.title && <h1 className="d-paper-title">{e.title}</h1>}
        {(mood || e.place || e.location) && (
          <p className="d-meta">{mood && <span>{mood.e} {mood.t}</span>}{e.place && <span><Doodle name="pin" size={18} /> {e.place}</span>}{e.location && <Link className="d-link" to={`/map?focus=${e.id}`}>在地图上看 <Arrow /></Link>}</p>
        )}
        {e.body && <div className="d-body">{e.body}</div>}
        {e.media.length > 0 && (
          <div className={`d-media n${Math.min(e.media.length, 2)}`}>
            {e.media.map((m, i) => (m.kind === 'video' ? (
              <button key={m.id} className="d-video" onClick={() => (m.status === 'failed' ? retryVideo(m) : m.url && look(m))}
                aria-label={m.status === 'ready' ? `播放第 ${i + 1} 个视频` : m.status === 'processing' ? '视频还在处理' : '视频处理失败，点一下重试'}>
                {m.thumbUrl && <img src={m.thumbUrl} alt="" loading="lazy" />}
                {m.status === 'ready' && <b className="d-vbadge big" aria-hidden><Glyph name="play" size={14} /> <small>{fmtDur(m.duration)}</small></b>}
                {m.status === 'processing' && <span className="d-proc">处理中…</span>}
                {m.status === 'failed' && <span className="d-retry">处理失败<br />点这里重试</span>}
              </button>
            ) : (
              <button key={m.id} onClick={() => look(m)} aria-label={`放大第 ${i + 1} 张照片`}>
                {(m.thumbUrl || m.url) && <img src={m.url || m.thumbUrl} alt="" loading="lazy" />}
              </button>
            )))}
          </div>
        )}
        {e.featured && <p className="d-feat-note"><Doodle name="star" size={18} /> 这一篇收进了我们的故事</p>}
      </article>

      <section className="d-hearts-box" aria-label="爱心">
        <div className="d-hearts-row">
          {Object.entries(AUTHORS).map(([k, au]) => (
            <span key={k} className={`d-heart-chip ${e.hearts.includes(k) ? 'on' : ''}`}><HeartIcon on={e.hearts.includes(k)} />{au.name}</span>
          ))}
        </div>
        {me
          ? <button className={`btn ${mine ? 'ghost' : ''}`} onClick={heart} disabled={busy}>{mine ? '取消爱心' : '给这一篇点个爱心'}</button>
          : <WhoAmI label="先选一下你是谁，才能点爱心" className="center" />}
      </section>

      <section className="d-cmts" aria-label="留言">
        <h2 className="d-h2">留言{cmts && cmts.length > 0 && <small> · {cmts.length}</small>}</h2>
        {cmts === null ? <p className="d-loading">翻页中…</p> : cmts.length === 0 ? <p className="d-sub plain">还没有留言，说点什么吧。</p> : (
          <ul className="d-cmt-list">
            {cmts.map((c) => (
              <li key={c.id} className={`d-cmt ${AUTHORS[c.author].cls}`}>
                <div className="d-cmt-bub">
                  <span className={`d-who ${AUTHORS[c.author].cls}`}>{AUTHORS[c.author].name}</span>
                  <p>{c.body}</p>
                </div>
                <small>{fmtStamp(c.createdAt)}{c.author === me && <> · <button className="d-link" onClick={() => removeCmt(c)}>删除</button></>}</small>
              </li>
            ))}
          </ul>
        )}
        {me ? (
          <div className="d-cmt-form">
            <textarea className="d-input" rows={2} maxLength={500} placeholder={`${AUTHORS[me].name}：想对 TA 说点什么……`} value={draft} onChange={(ev) => setDraft(ev.target.value)} aria-label="写留言" />
            <button className="btn small" disabled={!draft.trim() || sending} onClick={send}>{sending ? '发送中…' : '发送'}</button>
          </div>
        ) : <WhoAmI label="先选一下你是谁，才能留言" className="center" />}
        {cErr && <p className="d-error" role="alert">{cErr}</p>}
      </section>
    </div>
  )
}
