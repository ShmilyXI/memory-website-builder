import { Glyph } from '../icons.jsx'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, post } from '../api.js'
import { AUTHORS, addDaysStr, fmtDate, todayStr, useMe } from './common.jsx'

// 写一封时间胶囊。封存以后不能改（改了就能反复偷看），只能删。
export default function CapsuleWrite() {
  const nav = useNavigate()
  const [me, setMe] = useMe()
  const [author, setAuthor] = useState(me)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [openDate, setOpenDate] = useState('')
  const [picks, setPicks] = useState([]) // 快捷选择：接下来的纪念日、明年今天
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const area = useRef(null)

  const today = todayStr()
  const min = addDaysStr(today, 1)
  const max = addDaysStr(today, 5 * 365)

  useEffect(() => {
    api('/api/home').then((h) => {
      const list = (h.upcoming || []).filter((u) => u.date >= min).map((u) => ({ label: u.label, date: u.date }))
      const [y, m, d] = today.split('-')
      const nextYear = `${Number(y) + 1}-${m}-${d}`
      setPicks([...list, { label: '明年的今天', date: m === '02' && d === '29' ? `${Number(y) + 1}-02-28` : nextYear }])
    }).catch(() => setPicks([]))
  }, [])

  useEffect(() => {
    const el = area.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [body])

  const ready = Boolean(author && body.trim() && openDate && openDate >= min && openDate <= max) && !saving
  const seal = async () => {
    if (!window.confirm(`封存以后，连你自己也要等到 ${fmtDate(openDate).y}.${fmtDate(openDate).md} 才能看到这封信，而且不能再修改。确定封存吗？`)) return
    setSaving(true); setErr('')
    try {
      await post('/api/capsules', { author, title, body, openDate })
      nav('/capsules', { replace: true })
    } catch (e) {
      if (e.message !== 'unauthorized') setErr(e.message || '没封存成功，再试一次')
      setSaving(false)
    }
  }

  return (
    <div className="d-write">
      <header className="d-wbar">
        <button className="d-back" onClick={() => nav(-1)} aria-label="返回"><Glyph name="back" size={22} strokeWidth={3} /></button>
        <h1>写一封信</h1>
        <button className="btn small" disabled={!ready} onClick={seal}>{saving ? '封存中…' : '封存'}</button>
      </header>

      <div className="d-col">
        <p className="d-note">信会被封起来，到你选的那一天才能打开。到那天之前，里面写了什么谁都看不到。</p>

        <div className="d-field">
          <span className="d-label">谁在写</span>
          <div className="d-pills" role="group" aria-label="谁在写">
            {Object.entries(AUTHORS).map(([k, a]) => (
              <button key={k} type="button" className={`d-pill ${a.cls} ${author === k ? 'on' : ''}`} aria-pressed={author === k} onClick={() => { setAuthor(k); setMe(k) }}>{a.name}</button>
            ))}
          </div>
        </div>

        <label className="d-field">
          <span className="d-label">信的标题（可以不写，封存期间大家能看到标题）</span>
          <input className="d-input" maxLength={40} placeholder="比如：给 28 岁的你" value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>

        <label className="d-field">
          <span className="d-label">想对那时候的 TA 说什么</span>
          <textarea ref={area} className="d-input d-text" placeholder="写给未来的信……" value={body} onChange={(e) => setBody(e.target.value)} />
        </label>

        <div className="d-field">
          <span className="d-label">哪一天可以打开</span>
          <input className="d-input" type="date" min={min} max={max} value={openDate} onChange={(e) => setOpenDate(e.target.value)} />
          {picks.length > 0 && (
            <div className="d-chips" role="group" aria-label="快捷选日子">
              {picks.map((p) => (
                <button key={p.label} type="button" className={`d-chip ${openDate === p.date ? 'on' : ''}`} aria-pressed={openDate === p.date} onClick={() => setOpenDate(p.date)}>{p.label} · {fmtDate(p.date).md}</button>
              ))}
            </div>
          )}
          {openDate && (openDate < min || openDate > max) && <small className="d-hint err">要选明天以后、五年以内的日子</small>}
        </div>

        {err && <p className="d-error" role="alert">{err}</p>}
        <button className="btn wide" disabled={!ready} onClick={seal}>{saving ? '封存中…' : '封存起来'}</button>
        {!author && <p className="d-hint center">先选一下是谁在写哦</p>}
      </div>
    </div>
  )
}
