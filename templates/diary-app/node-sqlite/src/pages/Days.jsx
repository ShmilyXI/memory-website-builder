import { EmojiIcon, Glyph, Arrow, ICON_CHOICES } from '../icons.jsx'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, del, patch, post } from '../api.js'
import DayCard from './DayCard.jsx'
import { Empty, todayStr } from './common.jsx'

const LM = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊']
const dayName = (d) => (d <= 10 ? `初${'一二三四五六七八九十'[d - 1]}` : d < 20 ? `十${'一二三四五六七八九'[d - 11]}` : d === 20 ? '二十' : d < 30 ? `廿${'一二三四五六七八九'[d - 21]}` : '三十')
const pad = (n) => String(n).padStart(2, '0')

export default function Days() {
  const [data, setData] = useState(null) // { today, items, auto }
  const [err, setErr] = useState(false)
  const [form, setForm] = useState(null) // 正在添加 / 修改的那一条
  const [formErr, setFormErr] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => api('/api/anniversaries').then((d) => { setData(d); setErr(false) }).catch(() => setErr(true))
  useEffect(() => { load() }, [])

  const openNew = () => { setFormErr(''); setForm({ title: '', calendar: 'solar', repeat: 'yearly', icon: '', date: todayStr() }) }
  const openEdit = (u) => { setFormErr(''); setForm({ id: u.id, title: u.title, calendar: u.calendar, repeat: u.repeat, icon: u.icon || '', date: u.rawDate, builtin: u.builtin }) }
  const close = () => setForm(null)

  const [fy, fm, fd] = form ? form.date.split('-').map(Number) : []
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const setPart = (part, v) => {
    const p = { y: fy, m: fm, d: fd, [part]: Number(v) }
    set('date', `${String(p.y).padStart(4, '0')}-${pad(p.m)}-${pad(p.d)}`)
  }

  const save = async () => {
    if (!form.title.trim()) return setFormErr('起个名字吧')
    setSaving(true); setFormErr('')
    const body = { title: form.title, calendar: form.calendar, repeat: form.repeat, icon: form.icon || null, date: form.date }
    try {
      if (form.id) await patch(`/api/anniversaries/${form.id}`, form.builtin ? { icon: body.icon } : body)
      else await post('/api/anniversaries', body)
      close(); await load()
    } catch (e) { setFormErr(e.message === 'unauthorized' ? '' : e.message || '没保存成功，再试一次') } finally { setSaving(false) }
  }
  const remove = async () => {
    if (!window.confirm(`确定删掉「${form.title}」吗？`)) return
    try { await del(`/api/anniversaries/${form.id}`); close(); await load() } catch (e) { setFormErr(e.message) }
  }

  if (err) return <div className="d-col"><p className="d-loading">没加载出来，<button className="d-link" onClick={load}>再试一次</button></p></div>
  if (!data) return <div className="d-col"><p className="d-loading">翻页中…</p></div>

  return (
    <div className="d-col">
      <header className="d-head">
        <h1 className="d-title">我们的日子</h1>
        <button className="btn small" onClick={openNew}><Glyph name="plus" size={16} strokeWidth={3} /> 添加</button>
      </header>

      <div className="d-list tight">
        {data.items.map((u) => <DayCard key={u.id} u={u} onClick={() => openEdit(u)} />)}
      </div>
      {data.items.length === 0 && <Empty title="还没有纪念日" hint="生日、第一次去的地方，都可以记下来。" />}

      <h2 className="d-h2">一路上的整数日子</h2>
      <p className="d-sub">满几个月、第几百天，自己算好的，不用记。</p>
      <div className="d-list tight">
        {data.auto.map((u) => <DayCard key={u.date + u.label} u={u} />)}
      </div>
      <Link to="/" className="d-more">回首页 <Arrow /></Link>

      {form && (
        <div className="d-sheet" onClick={close}>
          <div className="d-sheet-in" role="dialog" aria-label="纪念日" onClick={(e) => e.stopPropagation()}>
            <h2>{form.id ? '改一改' : '添加纪念日'}</h2>
            {form.builtin && <p className="d-note">这一条是算「在一起第几天」的起点，只能换图标。</p>}

            <label className="d-field">
              <span className="d-label">叫什么</span>
              <input className="d-input" maxLength={30} placeholder="比如：第一次看海" value={form.title} disabled={form.builtin} onChange={(e) => set('title', e.target.value)} />
            </label>

            <div className="d-field">
              <span className="d-label">用哪种日历</span>
              <div className="d-seg" role="group" aria-label="日历">
                {[['solar', '公历'], ['lunar', '农历']].map(([k, t]) => (
                  <button key={k} type="button" disabled={form.builtin} className={form.calendar === k ? 'on' : ''} aria-pressed={form.calendar === k} onClick={() => set('calendar', k)}>{t}</button>
                ))}
              </div>
            </div>

            <div className="d-field">
              <span className="d-label">{form.calendar === 'lunar' ? '农历日期（生日填出生那年的）' : '哪一天'}</span>
              {form.calendar === 'solar' ? (
                <input className="d-input" type="date" value={form.date} disabled={form.builtin} onChange={(e) => e.target.value && set('date', e.target.value)} />
              ) : (
                <div className="d-lunar">
                  <input className="d-input" type="number" inputMode="numeric" min="1900" max="2100" value={fy} disabled={form.builtin} aria-label="农历年" onChange={(e) => e.target.value && setPart('y', e.target.value)} />
                  <select className="d-input" value={fm} disabled={form.builtin} aria-label="农历月" onChange={(e) => setPart('m', e.target.value)}>
                    {LM.map((n, i) => <option key={n} value={i + 1}>{n}月</option>)}
                  </select>
                  <select className="d-input" value={fd} disabled={form.builtin} aria-label="农历日" onChange={(e) => setPart('d', e.target.value)}>
                    {Array.from({ length: 30 }, (_, i) => <option key={i} value={i + 1}>{dayName(i + 1)}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div className="d-field">
              <span className="d-label">要不要每年都过</span>
              <div className="d-seg" role="group" aria-label="重复">
                {[['yearly', '每年都过'], ['once', '只这一次']].map(([k, t]) => (
                  <button key={k} type="button" disabled={form.builtin} className={form.repeat === k ? 'on' : ''} aria-pressed={form.repeat === k} onClick={() => set('repeat', k)}>{t}</button>
                ))}
              </div>
            </div>

            <div className="d-field">
              <span className="d-label">挑个小图标</span>
              <div className="d-icons" role="group" aria-label="图标">
                {ICON_CHOICES.map((i) => (
                  <button key={i} type="button" className={form.icon === i ? 'on' : ''} aria-pressed={form.icon === i} onClick={() => set('icon', form.icon === i ? '' : i)}><EmojiIcon e={i} size={34} /></button>
                ))}
              </div>
            </div>

            {formErr && <p className="d-error" role="alert">{formErr}</p>}
            <div className="d-sheet-actions">
              {form.id && !form.builtin && <button type="button" className="d-chip" onClick={remove}>删除</button>}
              <button type="button" className="d-chip" onClick={close}>取消</button>
              <button type="button" className="btn small" disabled={saving} onClick={save}>{saving ? '保存中…' : '保存'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
