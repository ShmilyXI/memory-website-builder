import { Doodle, Glyph } from '../icons.jsx'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api, del, patch, post, uploadFile } from '../api.js'
import { AUTHORS, Empty, MOODS, fmtDate, todayStr, useMe } from './common.jsx'
import { loadAMap, regeo, useMapConfig } from '../mapUtil.js'
import PlacePicker from './PlacePicker.jsx'

const DRAFT = 'diary-draft-v1' // 没写完的草稿放在这台设备上，误刷新也不会丢
const MAX = 30
let seq = 0
const uid = () => `u${Date.now().toString(36)}${seq++}`
const isVideo = (f) => f.type.startsWith('video/') || /\.(mp4|mov|m4v|3gp|webm|avi|mkv)$/i.test(f.name)
const isMedia = (f) => isVideo(f) || f.type.startsWith('image/') || /\.(heic|heif|jpe?g|png|webp|gif)$/i.test(f.name)
const MB = 1024 * 1024

export default function Write() {
  const { id } = useParams()
  const editing = Boolean(id)
  const nav = useNavigate()
  const [me, setMe] = useMe()
  const [sp] = useSearchParams()
  const wishId = editing ? null : sp.get('wish') // 从愿望清单点「写一篇日记」过来的
  const [wish, setWish] = useState(null)
  const mapCfg = useMapConfig() // 配了高德才有「标记在地图上」
  const [location, setLocation] = useState(null) // { lat, lng, province, city, adcode }
  const [picker, setPicker] = useState(false)
  const [gpsHint, setGpsHint] = useState(null) // 照片里带的定位：{ lat, lng, name }
  const gpsAsked = useRef(false)

  const [author, setAuthor] = useState(me)
  const [date, setDate] = useState(todayStr())
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [mood, setMood] = useState(null)
  const [place, setPlace] = useState('')
  const [featured, setFeatured] = useState(false)
  // 照片和视频：{ key, id?, kind: image|video, vstatus?: processing|ready|failed（视频在服务器上的转码状态）, file?, preview?, thumbUrl?, status: queued|uploading|done|error, progress, error?, fresh }
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(editing)
  const [missing, setMissing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [warn, setWarn] = useState('')
  const [note, setNote] = useState(null) // { text, undo? }

  const dateTouched = useRef(false) // 手动改过日期，或者已经按照片改过，就不再自动改
  const dateRef = useRef(date); dateRef.current = date
  const itemsRef = useRef(items); itemsRef.current = items
  const locationRef = useRef(location); locationRef.current = location
  const dirty = useRef(false)
  const area = useRef(null)

  // ---------- 编辑已有的日记 ----------
  useEffect(() => {
    if (!editing) return
    api(`/api/entries/${id}`).then((e) => {
      dateTouched.current = true
      setAuthor(e.author); setDate(e.date); setTitle(e.title || ''); setBody(e.body); setMood(e.mood); setPlace(e.place || ''); setFeatured(e.featured); setLocation(e.location)
      setItems(e.media.map((m) => ({ key: m.id, id: m.id, kind: m.kind, vstatus: m.status, thumbUrl: m.thumbUrl, status: 'done', progress: 1, fresh: false })))
      setLoading(false)
    }).catch(() => { setMissing(true); setLoading(false) })
  }, [id, editing])

  // ---------- 从愿望来的：带上愿望的名字，发布后把愿望链到这篇日记 ----------
  useEffect(() => {
    if (!wishId) return
    api('/api/wishes').then((d) => {
      const w = [...d.open, ...d.done].find((x) => x.id === wishId)
      if (!w) return
      setWish(w)
      setTitle((t) => t || w.title)
    }).catch(() => {})
  }, [wishId])

  // ---------- 找回草稿 ----------
  useEffect(() => {
    if (editing) return
    try {
      const d = JSON.parse(localStorage.getItem(DRAFT) || 'null')
      if (d && (d.title || d.body || d.media?.length)) {
        dateTouched.current = !!d.dateTouched
        setDate(d.date || todayStr()); setTitle(d.title || ''); setBody(d.body || ''); setMood(d.mood || null); setPlace(d.place || ''); setFeatured(!!d.featured); setLocation(d.location || null)
        if (d.author) setAuthor(d.author)
        setItems((d.media || []).map((m) => ({ key: m.id, id: m.id, kind: m.kind || 'image', vstatus: m.vstatus, thumbUrl: m.thumbUrl, status: 'done', progress: 1, fresh: true })))
        setNote({ text: '找到上次没写完的草稿，已经放回来啦', undo: true })
      }
    } catch { /* 草稿坏了就当没有 */ }
  }, [editing])

  // ---------- 自动存草稿 ----------
  useEffect(() => {
    if (editing || loading) return
    const t = setTimeout(() => {
      const media = items.filter((i) => i.status === 'done').map((i) => ({ id: i.id, thumbUrl: i.thumbUrl, kind: i.kind, vstatus: i.vstatus }))
      try {
        if (!title && !body && !media.length) localStorage.removeItem(DRAFT)
        else localStorage.setItem(DRAFT, JSON.stringify({ author, date, dateTouched: dateTouched.current, title, body, mood, place, featured, media, location }))
      } catch { /* 存不了就算了 */ }
    }, 400)
    return () => clearTimeout(t)
  }, [editing, loading, author, date, title, body, mood, place, featured, items, location])

  // 输入框跟着内容长高
  useEffect(() => {
    const el = area.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [body, loading])

  // ---------- 上传：最多同时传 2 张，各自显示进度 ----------
  const patchItem = (key, p) => setItems((prev) => prev.map((x) => (x.key === key ? { ...x, ...p } : x)))
  const startUpload = (it) => {
    patchItem(it.key, { status: 'uploading', progress: 0, error: null })
    uploadFile(it.file, (pr) => patchItem(it.key, { progress: pr }))
      .then((r) => {
        if (!itemsRef.current.some((x) => x.key === it.key)) { del(`/api/media/${r.id}`).catch(() => {}); return } // 传的时候被删掉了
        patchItem(it.key, { id: r.id, thumbUrl: r.thumbUrl, kind: r.kind, vstatus: r.status, status: 'done', progress: 1, file: null })
        if (it.preview) URL.revokeObjectURL(it.preview)
        // 照片 / 视频里带着定位：问一句要不要标在地图上（只问一次；已经标过就不问）
        if (r.gps && !gpsAsked.current && !locationRef.current) { gpsAsked.current = true; setGpsHint({ lat: r.gps.lat, lng: r.gps.lng, name: '' }) }
        // 第一张带拍摄日期的照片：把日期改成拍照那天（除非你已经自己改过）
        if (r.date && !dateTouched.current) {
          dateTouched.current = true
          if (r.date !== dateRef.current) { setDate(r.date); setNote({ text: `照片是 ${fmtDate(r.date).md} 拍的，日期帮你改好啦` }) }
        }
      })
      .catch((e) => patchItem(it.key, { status: 'error', error: e.message }))
  }
  useEffect(() => {
    const running = items.filter((i) => i.status === 'uploading').length
    items.filter((i) => i.status === 'queued').slice(0, Math.max(0, 2 - running)).forEach(startUpload)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  const addFiles = (list) => {
    const all = [...list]
    const media = all.filter(isMedia)
    const small = media.filter((f) => f.size <= (isVideo(f) ? 300 : 50) * MB)
    const room = Math.max(0, MAX - itemsRef.current.length)
    const picked = small.slice(0, room)
    setWarn(
      media.length < all.length ? '有的文件不是照片或视频，已经跳过了。'
        : small.length < media.length ? '有的文件太大了（照片最大 50MB，视频最大 300MB），已经跳过了。'
        : small.length > picked.length ? `一篇最多放 ${MAX} 张照片或视频。` : '')
    dirty.current = true
    setItems((p) => [...p, ...picked.map((f) => ({ key: uid(), kind: isVideo(f) ? 'video' : 'image', file: f, preview: URL.createObjectURL(f), status: 'queued', progress: 0, fresh: true }))])
  }
  const retry = (it) => patchItem(it.key, { status: 'queued', error: null })
  // 视频上传完以后，服务器还要转码（几十秒到几分钟）：每 3 秒问一下好了没有
  const hasProc = items.some((i) => i.status === 'done' && i.vstatus === 'processing')
  useEffect(() => {
    if (!hasProc) return
    const t = setInterval(() => {
      itemsRef.current.filter((i) => i.status === 'done' && i.vstatus === 'processing').forEach((i) => {
        api(`/api/media/${i.id}`).then((m) => { if (m.status !== 'processing') patchItem(i.key, { vstatus: m.status }) }).catch(() => {})
      })
    }, 3000)
    return () => clearInterval(t)
  }, [hasProc])
  const retryVideo = (it) => {
    patchItem(it.key, { vstatus: 'processing' })
    post(`/api/media/${it.id}/retry`).catch((e) => { patchItem(it.key, { vstatus: 'failed' }); setErr(e.status === 410 ? e.message : '没能重新处理，等一下再试试。') })
  }
  const removeItem = (it) => {
    dirty.current = true
    setItems((p) => p.filter((x) => x.key !== it.key))
    if (it.preview) URL.revokeObjectURL(it.preview)
    if (it.id && it.fresh) del(`/api/media/${it.id}`).catch(() => {}) // 刚传的、还没挂到日记上的，直接删掉
  }

  // ---------- 地点 ----------
  // 照片定位 → 问高德这是哪儿（出名字给你看），你点「标上」才会写进日记
  useEffect(() => {
    if (!gpsHint || gpsHint.name || !mapCfg) return
    let on = true
    loadAMap(mapCfg).then((AMap) => regeo(AMap, gpsHint.lng, gpsHint.lat)).then((g) => { if (on) setGpsHint((h) => h && { ...h, ...g, name: g.address || [g.province, g.city].filter(Boolean).join('') || '一个地方' }) }).catch(() => { if (on) setGpsHint((h) => h && { ...h, name: '一个地方' }) })
    return () => { on = false }
  }, [gpsHint, mapCfg])
  const useGps = () => {
    const h = gpsHint
    setLocation({ lat: h.lat, lng: h.lng, province: h.province ?? null, city: h.city ?? null, adcode: h.adcode ?? null })
    if (!place.trim()) setPlace(h.city || h.province || '')
    dirty.current = true; setGpsHint(null)
  }
  const pickPlace = (pl) => {
    setLocation({ lat: pl.lat, lng: pl.lng, province: pl.province, city: pl.city, adcode: pl.adcode })
    if (!place.trim()) setPlace(pl.name)
    dirty.current = true; setPicker(false); setGpsHint(null)
  }

  // ---------- 发布 ----------
  const doneIds = items.filter((i) => i.status === 'done').map((i) => i.id)
  const uploading = items.some((i) => i.status === 'uploading' || i.status === 'queued')
  const failed = items.filter((i) => i.status === 'error')
  const procFailed = items.filter((i) => i.vstatus === 'failed')
  const processing = items.some((i) => i.status === 'done' && i.vstatus === 'processing')
  const canSave = Boolean(author) && !saving && !loading && !uploading && Boolean(title.trim() || body.trim() || doneIds.length)

  const save = async () => {
    if (failed.length) return setErr(`有 ${failed.length} 个文件没传上去：点「重试」，或者把它删掉再发布。`)
    if (procFailed.length) return setErr('有视频没处理好：点「重试」，或者把它删掉再发布。')
    setSaving(true)
    setErr('')
    const payload = { date, title, body, mood, place, author, featured, mediaIds: doneIds, location }
    try {
      const r = editing ? await patch(`/api/entries/${id}`, payload) : await post('/api/entries', payload)
      if (!editing) { try { localStorage.removeItem(DRAFT) } catch { /* 无所谓 */ } }
      if (wish) await patch(`/api/wishes/${wish.id}`, { done: true, doneAt: wish.doneAt || date, entryId: r.id }).catch(() => {}) // 愿望打勾，并链到这篇日记
      nav(`/diary/${r.id}`, { replace: true })
    } catch (e) {
      setErr(e.status === 400 && /图片/.test(e.message || '')
        ? '有的照片或视频已经失效了（草稿放太久了），把它们删掉重新选一下。'
        : e.message === 'unauthorized' ? '' : '没发布成功，再点一次试试。')
      setSaving(false)
    }
  }

  const leave = () => {
    if (editing && dirty.current && !window.confirm('改动还没保存，确定离开吗？')) return
    if (window.history.length > 1) nav(-1); else nav(editing ? `/diary/${id}` : '/diary')
  }
  const clearDraft = () => {
    items.forEach((i) => { if (i.id && i.fresh) del(`/api/media/${i.id}`).catch(() => {}) })
    try { localStorage.removeItem(DRAFT) } catch { /* 无所谓 */ }
    setTitle(''); setBody(''); setMood(null); setPlace(''); setFeatured(false); setItems([]); setDate(todayStr()); dateTouched.current = false
    setNote(null)
  }
  const mark = (fn) => (v) => { dirty.current = true; fn(v) }

  if (loading) return <div className="d-col"><p className="d-loading">翻页中…</p></div>
  if (missing) return <div className="d-col"><Empty title="这一篇找不到啦" hint="可能已经被删掉了。" to="/diary" cta="回日记本" /></div>

  return (
    <div className="d-write">
      <header className="d-wbar">
        <button className="d-back" onClick={leave} aria-label="返回"><Glyph name="back" size={22} strokeWidth={3} /></button>
        <h1>{editing ? '改一改' : '记一笔'}</h1>
        <button className="btn small" disabled={!canSave} onClick={save}>{saving ? '发布中…' : editing ? '保存' : '发布'}</button>
      </header>

      <div className="d-col">
        {wish && <p className="d-note"><Doodle name="star" size={20} /> 这一篇会记在愿望「{wish.title}」下面，发布后愿望会自动打勾。</p>}
        {note && (
          <p className="d-note">{note.text}{note.undo && <> · <button className="d-link" onClick={clearDraft}>清空重写</button></>}</p>
        )}

        <div className="d-field">
          <span className="d-label">谁在写</span>
          {editing ? (
            <span className={`d-who big ${AUTHORS[author].cls}`}>{AUTHORS[author].name}</span>
          ) : (
            <div className="d-pills" role="group" aria-label="谁在写">
              {Object.entries(AUTHORS).map(([k, a]) => (
                <button key={k} type="button" className={`d-pill ${a.cls} ${author === k ? 'on' : ''}`} aria-pressed={author === k}
                  onClick={() => { setAuthor(k); setMe(k) }}>{a.name}</button>
              ))}
            </div>
          )}
          {!author && <small className="d-hint">先选一下是谁在写哦</small>}
        </div>

        <label className="d-field">
          <span className="d-label">哪一天的事</span>
          <input className="d-input" type="date" value={date} max={todayStr()} onChange={(e) => { dateTouched.current = true; mark(setDate)(e.target.value) }} />
        </label>

        <label className="d-field">
          <span className="d-label">标题（可以不写）</span>
          <input className="d-input" maxLength={60} placeholder="比如：今天去了衡山" value={title} onChange={(e) => mark(setTitle)(e.target.value)} />
        </label>

        <label className="d-field">
          <span className="d-label">想记下什么</span>
          <textarea ref={area} className="d-input d-text" placeholder="今天发生了什么，心里在想什么……" value={body} onChange={(e) => mark(setBody)(e.target.value)} />
        </label>

        <div className="d-field">
          <span className="d-label">心情</span>
          <div className="d-chips" role="group" aria-label="心情">
            {MOODS.map((m) => (
              <button key={m.k} type="button" className={`d-chip ${mood === m.k ? 'on' : ''}`} aria-pressed={mood === m.k}
                onClick={() => { dirty.current = true; setMood(mood === m.k ? null : m.k) }}>{m.e} {m.t}</button>
            ))}
          </div>
        </div>

        <label className="d-field">
          <span className="d-label">在哪里</span>
          <input className="d-input" maxLength={60} placeholder="比如：深圳的家" value={place} onChange={(e) => mark(setPlace)(e.target.value)} />
        </label>
        {mapCfg && (
          <div className="d-field d-loc">
            {location ? (
              <p className="d-loc-chip" role="status"><Doodle name="pin" size={18} /> 已标在地图上{location.city ? `：${location.city}` : ''}
                <button type="button" className="d-link" onClick={() => setPicker(true)}>换</button>
                <button type="button" className="d-link" onClick={() => { setLocation(null); dirty.current = true }} aria-label="取消地图标记">取消</button></p>
            ) : (
              <button type="button" className="d-chip" onClick={() => setPicker(true)}><Doodle name="pin" size={18} /> 标记在地图上</button>
            )}
            {gpsHint && !location && (
              <p className="d-note"><Doodle name="camera" size={20} /> 照片里带着定位{gpsHint.name ? `：${gpsHint.name}` : '…'}　
                <button type="button" className="d-link" disabled={!gpsHint.name} onClick={useGps}>标在地图上</button>　
                <button type="button" className="d-link" onClick={() => setGpsHint(null)}>不用</button></p>
            )}
          </div>
        )}
        {picker && mapCfg && <PlacePicker cfg={mapCfg} onClose={() => setPicker(false)} onPick={pickPlace} />}

        <div className="d-field">
          <span className="d-label">照片和视频{items.length > 0 && ` · ${items.length}`}</span>
          <ul className="d-up">
            {items.map((it) => (
              <li key={it.key} className={`d-tile ${it.status}`}>
                {it.thumbUrl ? <img src={it.thumbUrl} alt="" />
                  : it.preview && (it.kind === 'video' ? <video src={it.preview} muted playsInline preload="metadata" /> : <img src={it.preview} alt="" />)}
                {it.kind === 'video' && <span className="d-vbadge" aria-hidden><Glyph name="play" size={12} /></span>}
                {it.status === 'done' && it.vstatus === 'processing' && <span className="d-proc">处理中…</span>}
                {it.status === 'done' && it.vstatus === 'failed' && <button type="button" className="d-retry" onClick={() => retryVideo(it)}>处理失败<br />点这里重试</button>}
                {(it.status === 'uploading' || it.status === 'queued') && <span className="d-prog" role="progressbar" aria-valuenow={Math.round(it.progress * 100)}><i style={{ width: `${Math.round(it.progress * 100)}%` }} /></span>}
                {it.status === 'error' && <button type="button" className="d-retry" onClick={() => retry(it)}>重试</button>}
                <button type="button" className="d-x" onClick={() => removeItem(it)} aria-label="删掉这一项"><Glyph name="close" size={14} strokeWidth={3.4} /></button>
              </li>
            ))}
            {items.length < MAX && (
              <li>
                <label className="d-tile add">
                  <input type="file" accept="image/*,video/*" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = '' }} />
                  <span><Glyph name="plus" size={30} strokeWidth={3.2} /></span><small>照片 / 视频</small>
                </label>
              </li>
            )}
          </ul>
          {failed.map((it) => <small key={it.key} className="d-hint err">有一个没传上去：{it.error}</small>)}
          {items.some((i) => i.kind === 'video') && !warn && <small className="d-hint">视频最大 300MB、10 分钟以内。传完还要在服务器上处理一会儿，处理的时候也可以先发布。</small>}
          {warn && <small className="d-hint">{warn}</small>}
        </div>

        <label className="d-switch">
          <input type="checkbox" checked={featured} onChange={(e) => { dirty.current = true; setFeatured(e.target.checked) }} />
          <span className="d-box" aria-hidden />
          <span><b>收进我们的故事</b><small>勾上以后，这一篇会出现在「我们的故事」的最后</small></span>
        </label>

        {err && <p className="d-error" role="alert">{err}</p>}
        <button className="btn wide" disabled={!canSave} onClick={save}>{saving ? '发布中…' : editing ? '保存' : '发布'}</button>
        {uploading && <p className="d-hint center">还在上传，传完就能发布啦</p>}
        {!uploading && processing && <p className="d-hint center">视频还在处理，现在发布也可以，处理好了会自动出现</p>}
      </div>
    </div>
  )
}
