import { Doodle, Glyph, Arrow } from '../icons.jsx'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, del, patch, post } from '../api.js'
import { AUTHORS, Empty, fmtDate, todayStr, useMe } from './common.jsx'

// 愿望清单：想一起做的事。做到了打个勾，可以顺手写一篇日记，日记和愿望会互相链接。
export default function Wishes() {
  const nav = useNavigate()
  const [me] = useMe()
  const [data, setData] = useState(null) // { open, done, counts }
  const [err, setErr] = useState(false)
  const [form, setForm] = useState(null) // 添加 / 修改：{ id?, title, note, author, done? , entryId? }
  const [tick, setTick] = useState(null) // 打勾：{ wish, date }
  const [formErr, setFormErr] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => api('/api/wishes').then((d) => { setData(d); setErr(false) }).catch(() => setErr(true))
  useEffect(() => { load() }, [])

  const openNew = () => { setFormErr(''); setForm({ title: '', note: '', author: me || '' }) }
  const openEdit = (w) => { setFormErr(''); setForm({ id: w.id, title: w.title, note: w.note || '', author: w.author, done: w.done, entryId: w.entryId, doneAt: w.doneAt }) }
  const run = async (fn, fail = '没成功，再试一次') => {
    setBusy(true); setFormErr('')
    try { await fn(); await load(); return true } catch (e) { if (e.message !== 'unauthorized') setFormErr(e.message || fail); return false } finally { setBusy(false) }
  }

  const save = async () => {
    if (!form.title.trim()) return setFormErr('写下想做的事吧')
    if (!form.id && !form.author) return setFormErr('先选一下是谁写的哦')
    const ok = await run(() => (form.id
      ? patch(`/api/wishes/${form.id}`, { title: form.title, note: form.note })
      : post('/api/wishes', { title: form.title, note: form.note, author: form.author })))
    if (ok) setForm(null)
  }
  const remove = async () => {
    if (!window.confirm(`确定删掉「${form.title}」吗？`)) return
    if (await run(() => del(`/api/wishes/${form.id}`))) setForm(null)
  }
  const untick = async () => { if (await run(() => patch(`/api/wishes/${form.id}`, { done: false }))) setForm(null) }

  const doTick = async (thenWrite) => {
    const ok = await run(() => patch(`/api/wishes/${tick.wish.id}`, { done: true, doneAt: tick.date }))
    if (!ok) return
    const id = tick.wish.id
    setTick(null)
    if (thenWrite) nav(`/write?wish=${id}`)
  }

  if (err) return <div className="d-col"><p className="d-loading">没加载出来，<button className="d-link" onClick={load}>再试一次</button></p></div>
  if (!data) return <div className="d-col"><p className="d-loading">翻页中…</p></div>
  const { open, done, counts } = data
  const pct = counts.total ? Math.round((counts.done / counts.total) * 100) : 0

  return (
    <div className="d-col">
      <header className="d-head">
        <h1 className="d-title">愿望清单</h1>
        <button className="btn small" onClick={openNew}><Glyph name="plus" size={16} strokeWidth={3} /> 添加</button>
      </header>

      {counts.total > 0 && (
        <div className="d-wish-bar" role="progressbar" aria-valuenow={pct} aria-label={`已做到 ${counts.done} 个，共 ${counts.total} 个`}>
          <i style={{ width: `${pct}%` }} />
          <span>已经做到 {counts.done} / {counts.total}</span>
        </div>
      )}

      {counts.total === 0 && <Empty title="还没有愿望哦" hint="想一起去的地方、想一起做的事，先记下来，做到了再打勾。" />}

      {open.length > 0 && (
        <>
          <h2 className="d-h2">想做的事</h2>
          <ul className="d-wishes">
            {open.map((w) => (
              <li key={w.id} className="d-wish">
                <button className="d-wish-check" aria-label={`「${w.title}」做到啦，打个勾`} onClick={() => setTick({ wish: w, date: todayStr() })} />
                <button className="d-wish-main" onClick={() => openEdit(w)}>
                  <b>{w.title}</b>
                  {w.note && <small>{w.note}</small>}
                </button>
                <span className={`d-who ${AUTHORS[w.author].cls}`}>{AUTHORS[w.author].name}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {done.length > 0 && (
        <>
          <h2 className="d-h2">已经做到 <Doodle name="party" size={26} /></h2>
          <ul className="d-wishes">
            {done.map((w) => (
              <li key={w.id} className="d-wish done">
                <button className="d-wish-check on" aria-label={`「${w.title}」已经做到了，点一下可以改`} onClick={() => openEdit(w)}><Glyph name="check" size={20} strokeWidth={3.4} /></button>
                <button className="d-wish-main" onClick={() => openEdit(w)}>
                  <b>{w.title}</b>
                  <small>{fmtDate(w.doneAt).y !== new Date().getFullYear() ? `${fmtDate(w.doneAt).y}.` : ''}{fmtDate(w.doneAt).md} 做到啦</small>
                </button>
                {w.entryId && <Link className="d-chip" to={`/diary/${w.entryId}`}>日记 <Arrow /></Link>}
              </li>
            ))}
          </ul>
        </>
      )}
      <Link to="/" className="d-more">回首页 <Arrow /></Link>

      {form && (
        <div className="d-sheet" onClick={() => setForm(null)}>
          <div className="d-sheet-in" role="dialog" aria-label="愿望" onClick={(e) => e.stopPropagation()}>
            <h2>{form.id ? '改一改' : '添一个愿望'}</h2>

            {!form.id && (
              <div className="d-field">
                <span className="d-label">谁想的</span>
                <div className="d-pills" role="group" aria-label="谁想的">
                  {Object.entries(AUTHORS).map(([k, a]) => (
                    <button key={k} type="button" className={`d-pill ${a.cls} ${form.author === k ? 'on' : ''}`} aria-pressed={form.author === k} onClick={() => setForm({ ...form, author: k })}>{a.name}</button>
                  ))}
                </div>
              </div>
            )}

            <label className="d-field">
              <span className="d-label">想做什么</span>
              <input className="d-input" maxLength={60} placeholder="比如：一起去看冬天的海" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </label>
            <label className="d-field">
              <span className="d-label">备注（可以不写）</span>
              <textarea className="d-input d-note-in" maxLength={300} rows={3} placeholder="想什么时候、去哪里、需要准备什么……" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </label>

            {form.done && (
              <div className="d-wish-extra">
                <p className="d-note">这个愿望 {fmtDate(form.doneAt).md} 做到啦。</p>
                <div className="d-wish-links">
                  {form.entryId
                    ? <Link className="d-chip" to={`/diary/${form.entryId}`}>去看那篇日记 <Arrow /></Link>
                    : <Link className="d-chip" to={`/write?wish=${form.id}`}>补写一篇日记 <Arrow /></Link>}
                  <button type="button" className="d-chip" onClick={untick} disabled={busy}>还没做完，取消打勾</button>
                </div>
              </div>
            )}

            {formErr && <p className="d-error" role="alert">{formErr}</p>}
            <div className="d-sheet-actions">
              {form.id && <button type="button" className="d-chip" onClick={remove} disabled={busy}>删除</button>}
              <button type="button" className="d-chip" onClick={() => setForm(null)}>取消</button>
              <button type="button" className="btn small" disabled={busy} onClick={save}>{busy ? '保存中…' : '保存'}</button>
            </div>
          </div>
        </div>
      )}

      {tick && (
        <div className="d-sheet" onClick={() => setTick(null)}>
          <div className="d-sheet-in" role="dialog" aria-label="做到啦" onClick={(e) => e.stopPropagation()}>
            <h2>做到啦！<Doodle name="party" size={30} /></h2>
            <p className="d-wish-big">「{tick.wish.title}」</p>
            <label className="d-field">
              <span className="d-label">哪一天做到的</span>
              <input className="d-input" type="date" max={todayStr()} value={tick.date} onChange={(e) => e.target.value && setTick({ ...tick, date: e.target.value })} />
            </label>
            {formErr && <p className="d-error" role="alert">{formErr}</p>}
            <div className="d-sheet-actions wrap">
              <button type="button" className="d-chip" onClick={() => setTick(null)}>取消</button>
              <button type="button" className="d-chip" disabled={busy} onClick={() => doTick(false)}>只打勾</button>
              <button type="button" className="btn small" disabled={busy} onClick={() => doTick(true)}>打勾，并写一篇日记</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
