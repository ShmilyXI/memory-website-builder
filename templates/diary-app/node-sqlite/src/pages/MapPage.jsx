import { Doodle, EmojiIcon, Glyph, Arrow, ICON_CHOICES, emojiUrl } from '../icons.jsx'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api, del, patch, post } from '../api.js'
import { Kitty } from '../cute.jsx'
import { esc, groupPins, loadAMap, regeo, shortDate, useMapConfig } from '../mapUtil.js'
import { AUTHORS, Empty, fmtDate, todayStr } from './common.jsx'
import PlacePicker from './PlacePicker.jsx'

const PINK = '#ff5c8a'
const INK = '#5A2B3C'

// 一个图钉的贴纸：圆形的照片（或小图标）+ 日期小标签，像贴在地图上的贴纸
const pinHtml = (p, on) => `<div class="mp ${p.kind} ${on ? 'on' : ''}">
  <span class="mp-face">${p.thumbUrl ? `<img src="${esc(p.thumbUrl)}" alt="" draggable="false">` : `<img class="mp-ico" src="${esc(emojiUrl(p.icon || '💗'))}" alt="" draggable="false">`}</span>
  <span class="mp-tag">${esc(shortDate(p.date))}</span></div>`
const bubbleHtml = (n) => `<div class="mp-group"><b>${n}</b><small>处</small></div>`

export default function MapPage() {
  const cfg = useMapConfig()
  if (cfg === undefined) return <div className="d-col"><p className="d-loading">翻页中…</p></div>
  if (cfg === null) {
    return (
      <div className="d-col">
        <header className="d-head"><h1 className="d-title">恋爱地图</h1></header>
        <Empty title="地图还没有接上" hint="需要先在服务器上配置高德地图的 Key（步骤在部署说明里），配好以后这里就会出现你们去过的地方。" to="/" cta="回首页" />
      </div>
    )
  }
  return <LoveMap cfg={cfg} />
}

function LoveMap({ cfg }) {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const box = useRef(null)
  const R = useRef({}) // 地图对象和图层：{ AMap, map, markers, route, layer, play }
  const [data, setData] = useState(null) // { pins, summary }
  const [loadErr, setLoadErr] = useState('')
  const [mapErr, setMapErr] = useState('')
  const [ready, setReady] = useState(false)
  const [zoom, setZoom] = useState(5)
  const [sel, setSel] = useState(null) // 点开的图钉
  const [adding, setAdding] = useState(false) // 正在放图钉：点地图或搜地点
  const [searching, setSearching] = useState(false)
  const [form, setForm] = useState(null) // 放 / 改「去过的地方」
  const [formErr, setFormErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [play, setPlay] = useState(null) // 回放：{ i }
  const stateRef = useRef({}); stateRef.current = { adding, form }

  const load = useCallback(() => api('/api/map').then((d) => { setData(d); setLoadErr('') }).catch(() => setLoadErr('没加载出来')), [])
  useEffect(() => { load() }, [load])

  // ---------- 创建地图（只一次）----------
  useEffect(() => {
    let dead = false
    loadAMap(cfg).then((AMap) => {
      if (dead || !box.current) return
      const map = new AMap.Map(box.current, {
        zoom: 5, center: [108, 31], zooms: [3, 18], mapStyle: cfg.style,
        features: ['bg', 'road'], // 不要满地图的商家小图标和楼块，画面干净一点
        viewMode: '2D', resizeEnable: true, showIndoorMap: false,
      })
      R.current = { AMap, map, markers: [], play: null }
      map.on('zoomend', () => setZoom(Math.round(map.getZoom())))
      map.on('click', (e) => { if (stateRef.current.adding) dropPin(e.lnglat.getLng(), e.lnglat.getLat()) })
      setZoom(Math.round(map.getZoom()))
      setReady(true)
    }).catch((e) => { if (!dead) setMapErr(e.message || '地图没加载出来') })
    return () => { dead = true; try { R.current.map?.destroy() } catch { /* 页面离开了 */ } R.current = {} }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg])

  // ---------- 点亮去过的省 + 画路线（数据变了才重画）----------
  useEffect(() => {
    const { AMap, map } = R.current
    if (!ready || !data) return
    const old = R.current
    old.layer && map.remove(old.layer)
    old.route && map.remove(old.route)
    old.halo && map.remove(old.halo)
    const codes = data.summary.provinceCodes
    old.layer = null
    // 点亮省份是锦上添花：这个图层出任何问题，都不能影响地图本身
    try {
      if (codes.length && AMap.DistrictLayer?.Province) {
        const lit = new Set(codes)
        old.layer = new AMap.DistrictLayer.Province({
          zIndex: 8, adcode: codes, depth: 1,
          styles: {
            // 省级的面 adcode_pro 可能是 0 或不存在，所以用 || 往后找，而不是 ??
            fill: (p) => (lit.has(String(p.adcode_pro || p.adcode || '')) || lit.has(String(p.adcode || '')) ? 'rgba(255,120,165,0.45)' : 'rgba(0,0,0,0)'),
            'province-stroke': INK, 'city-stroke': 'rgba(0,0,0,0)', 'county-stroke': 'rgba(0,0,0,0)', 'coastline-stroke': INK, 'nation-stroke': INK,
          },
        })
        map.add(old.layer)
      }
    } catch { old.layer = null }
    const path = data.pins.map((p) => [p.lng, p.lat])
    if (path.length > 1) {
      // 先铺一条白色的粗线当描边，再叠一条粉色虚线，像贴纸胶带
      old.halo = new AMap.Polyline({ path, strokeColor: '#ffffff', strokeWeight: 9, strokeOpacity: 0.9, lineJoin: 'round', lineCap: 'round', zIndex: 49 })
      old.route = new AMap.Polyline({ path, strokeColor: PINK, strokeWeight: 4, strokeStyle: 'dashed', strokeDasharray: [10, 10], lineJoin: 'round', lineCap: 'round', zIndex: 50 })
      map.add([old.halo, old.route])
    } else { old.route = null; old.halo = null }
  }, [ready, data])

  // ---------- 图钉（缩放、选中、回放时重画）----------
  const activeId = play ? data?.pins[play.i]?.id : sel?.id
  useEffect(() => {
    const { AMap, map } = R.current
    if (!ready || !data) return
    R.current.markers.forEach((m) => map.remove(m))
    const groups = groupPins(data.pins, zoom)
    R.current.markers = groups.map((g) => {
      const single = g.pins.length === 1
      const on = g.pins.some((p) => p.id === activeId)
      const m = new AMap.Marker({
        position: [g.lng, g.lat], anchor: 'bottom-center', zIndex: on ? 200 : 100,
        content: single ? pinHtml(g.pins[0], on) : bubbleHtml(g.pins.length),
      })
      m.on('click', () => {
        if (stateRef.current.adding) return
        if (single) setSel(g.pins[0])
        else map.setZoomAndCenter(Math.min(zoom + 2, 17), [g.lng, g.lat])
      })
      return m
    })
    map.add(R.current.markers)
  }, [ready, data, zoom, activeId])

  // ---------- 第一次进来：整条路线放进视野；?focus= 直接飞到那一篇 ----------
  const fitted = useRef(false)
  useEffect(() => {
    const { map } = R.current
    if (!ready || !data || fitted.current) return
    fitted.current = true
    const focus = params.get('focus') && data.pins.find((p) => p.id === params.get('focus'))
    if (focus) { map.setZoomAndCenter(12, [focus.lng, focus.lat]); setSel(focus) }
    else if (data.pins.length === 1) map.setZoomAndCenter(11, [data.pins[0].lng, data.pins[0].lat])
    else if (data.pins.length > 1) {
      const lngs = data.pins.map((p) => p.lng), lats = data.pins.map((p) => p.lat)
      map.setBounds(new R.current.AMap.Bounds([Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]), false, [70, 50, 70, 50])
    }
  }, [ready, data, params])

  // ---------- 放图钉 ----------
  async function dropPin(lng, lat, name) {
    const g = await regeo(R.current.AMap, lng, lat)
    setAdding(false); setSearching(false)
    setFormErr('')
    setForm((f) => ({ ...(f || { title: name || '', date: todayStr(), icon: '', note: '' }), lng, lat, province: g.province, city: g.city, adcode: g.adcode, address: g.address || name || '' }))
  }
  const startAdd = () => { setSel(null); setAdding(true); setSearching(false) }
  const saveForm = async () => {
    if (!form.title.trim()) return setFormErr('起个名字吧')
    setBusy(true); setFormErr('')
    const body = { title: form.title, date: form.date, note: form.note, icon: form.icon || null, location: { lat: form.lat, lng: form.lng, province: form.province, city: form.city, adcode: form.adcode } }
    try {
      if (form.id) await patch(`/api/footprints/${form.id}`, body); else await post('/api/footprints', body)
      setForm(null); setSel(null); await load()
    } catch (e) { if (e.message !== 'unauthorized') setFormErr(e.message || '没保存成功，再试一次') } finally { setBusy(false) }
  }
  const removeFootprint = async (p) => {
    if (!window.confirm(`确定把「${p.title}」从地图上拿掉吗？`)) return
    await del(`/api/footprints/${p.id}`)
    setSel(null); await load()
  }
  const editFootprint = (p) => { setSel(null); setFormErr(''); setForm({ id: p.id, title: p.title, date: p.date, icon: p.icon || '', note: p.note || '', lng: p.lng, lat: p.lat, province: p.province, city: p.city, adcode: p.adcode, address: [p.province, p.city].filter(Boolean).join(' ') }) }

  // ---------- 回放：按日期一站一站走过去 ----------
  useEffect(() => {
    if (!play || !data) return
    const { map } = R.current
    const p = data.pins[play.i]
    map.setZoomAndCenter(9, [p.lng, p.lat], false, 900)
    const t = setTimeout(() => setPlay(play.i + 1 < data.pins.length ? { i: play.i + 1 } : null), 1700)
    return () => clearTimeout(t)
  }, [play, data])
  useEffect(() => { // 回放结束，回到整条路线
    const { map, route } = R.current
    if (ready && !play && fitted.current && route && R.current.wasPlaying) { map.setFitView([route], false, [70, 50, 70, 50]); R.current.wasPlaying = false }
    if (play) R.current.wasPlaying = true
  }, [play, ready])

  const fly = (p) => { setSel(p); R.current.map?.setZoomAndCenter(Math.max(zoom, 11), [p.lng, p.lat], false, 600); box.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
  const zoomBy = (d) => { const m = R.current.map; if (m) (d > 0 ? m.zoomIn() : m.zoomOut()) }

  const s = data?.summary
  return (
    <div className="d-col d-mapcol">
      <header className="d-head">
        <h1 className="d-title">恋爱地图</h1>
        <button className="btn small" onClick={startAdd} disabled={!ready}><Glyph name="plus" size={16} strokeWidth={3} /> 放图钉</button>
      </header>

      {s && (
        <div className="d-mp-stats" aria-label="足迹统计">
          <span><b>{s.pins}</b>个地方</span><span><b>{s.cities}</b>座城市</span><span><b>{s.provinces}</b>个省</span><span><b>{s.km.toLocaleString()}</b>公里</span>
        </div>
      )}

      <div className={`d-mapbox ${adding ? 'adding' : ''}`}>
        <div className="d-mapclip">
          <div ref={box} className="d-mapcanvas" />
          {!ready && !mapErr && <div className="d-map-ph"><Kitty size={90} /><p>地图翻开中…</p></div>}
          {mapErr && <div className="d-map-ph"><Kitty size={90} /><p role="alert">{mapErr}</p></div>}
          {ready && (
            <div className="d-map-btns">
              <button onClick={() => zoomBy(1)} aria-label="放大"><Glyph name="plus" size={22} strokeWidth={3} /></button>
              <button onClick={() => zoomBy(-1)} aria-label="缩小"><Glyph name="minus" size={22} strokeWidth={3} /></button>
            </div>
          )}
          {ready && data?.pins.length > 1 && !adding && (
            <button className="d-map-play" onClick={() => (play ? setPlay(null) : (setSel(null), setPlay({ i: 0 })))}>{play ? <><Glyph name="stop" size={13} /> 停下</> : <><Glyph name="play" size={13} /> 回放我们的路线</>}</button>
          )}
          {play && data.pins[play.i] && (
            <div className="d-map-cap" role="status">
              <b>{fmtDate(data.pins[play.i].date).md}</b> {data.pins[play.i].title}
              <small>第 {play.i + 1} / {data.pins.length} 站</small>
            </div>
          )}
          {adding && (
            <div className="d-map-hint" role="status">
              <span>点一下地图，放一个图钉</span>
              <button className="d-chip" onClick={() => setSearching(true)}><Glyph name="search" size={16} strokeWidth={3} /> 搜地点</button>
              <button className="d-chip" onClick={() => { setAdding(false); setSearching(false) }}>取消</button>
            </div>
          )}
        </div>
      </div>

      {loadErr && <p className="d-loading">{loadErr}，<button className="d-link" onClick={load}>再试一次</button></p>}
      {data && data.pins.length === 0 && (
        <Empty title="还没有去过的地方" hint="写日记的时候标上地点，或者点右上角「放图钉」，你们走过的路就会出现在这里。" />
      )}
      {data && data.pins.length > 0 && (
        <>
          <h2 className="d-h2">一路走过的地方</h2>
          <ul className="d-mp-list">
            {data.pins.map((p) => (
              <li key={p.id}>
                <button className="d-mp-item" onClick={() => fly(p)}>
                  <span className="d-mp-ico">{p.thumbUrl ? <img src={p.thumbUrl} alt="" loading="lazy" /> : <EmojiIcon e={p.icon || '💗'} size={34} />}</span>
                  <span className="d-mp-main"><b>{p.title}</b><small>{fmtDate(p.date).y !== new Date().getFullYear() ? `${fmtDate(p.date).y}.` : ''}{fmtDate(p.date).md} · {p.city || p.province || '位置已标记'}</small></span>
                  <span className="d-mp-n">{shortDate(p.date)}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      <Link to="/" className="d-more">回首页 <Arrow /></Link>

      {searching && <PlacePicker cfg={cfg} onClose={() => setSearching(false)} onPick={(pl) => { R.current.map?.setZoomAndCenter(13, [pl.lng, pl.lat]); dropPin(pl.lng, pl.lat, pl.name) }} />}

      {sel && !form && (
        <div className="d-sheet" onClick={() => setSel(null)}>
          <div className="d-sheet-in" role="dialog" aria-label="这个地方" onClick={(e) => e.stopPropagation()}>
            <h2>{sel.title}</h2>
            <p className="d-meta">
              <span>{fmtDate(sel.date).y}.{fmtDate(sel.date).md} {fmtDate(sel.date).wd}</span>
              {(sel.city || sel.province) && <span><Doodle name="pin" size={18} /> {[sel.province, sel.city].filter((x, i, a) => x && a.indexOf(x) === i).join(' · ')}</span>}
              {sel.author && <span className={`d-who ${AUTHORS[sel.author].cls}`}>{AUTHORS[sel.author].name}</span>}
            </p>
            {sel.place && sel.place !== sel.title && <p className="d-sub plain">{sel.place}</p>}
            {sel.thumbUrl && <img className="d-pin-photo" src={sel.thumbUrl} alt="" />}
            {sel.note && <p className="d-body small">{sel.note}</p>}
            <div className="d-sheet-actions wrap">
              {sel.kind === 'footprint' && <button className="d-chip" onClick={() => removeFootprint(sel)}>拿掉</button>}
              {sel.kind === 'footprint' && <button className="d-chip" onClick={() => editFootprint(sel)}>改一改</button>}
              <button className="d-chip" onClick={() => setSel(null)}>关上</button>
              {sel.entryId && <button className="btn small" onClick={() => nav(`/diary/${sel.entryId}`)}>看这篇日记</button>}
            </div>
          </div>
        </div>
      )}

      {form && !adding && (
        <div className="d-sheet" onClick={() => setForm(null)}>
          <div className="d-sheet-in" role="dialog" aria-label="去过的地方" onClick={(e) => e.stopPropagation()}>
            <h2>{form.id ? '改一改' : '放一个图钉'}</h2>
            <p className="d-note"><Doodle name="pin" size={18} /> {form.address || `${form.lat.toFixed(4)}, ${form.lng.toFixed(4)}`}
              {' · '}<button type="button" className="d-link" onClick={startAdd}>换个位置</button></p>
            <label className="d-field"><span className="d-label">叫什么</span>
              <input className="d-input" maxLength={40} placeholder="比如：第一次看海" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
            <label className="d-field"><span className="d-label">哪一天去的</span>
              <input className="d-input" type="date" max={todayStr()} value={form.date} onChange={(e) => e.target.value && setForm({ ...form, date: e.target.value })} /></label>
            <div className="d-field"><span className="d-label">挑个小图标</span>
              <div className="d-icons" role="group" aria-label="图标">
                {ICON_CHOICES.map((i) => <button key={i} type="button" className={form.icon === i ? 'on' : ''} aria-pressed={form.icon === i} onClick={() => setForm({ ...form, icon: form.icon === i ? '' : i })}><EmojiIcon e={i} size={34} /></button>)}
              </div></div>
            <label className="d-field"><span className="d-label">想记一句话（可以不写）</span>
              <textarea className="d-input d-note-in" rows={2} maxLength={300} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></label>
            {formErr && <p className="d-error" role="alert">{formErr}</p>}
            <div className="d-sheet-actions">
              <button type="button" className="d-chip" onClick={() => setForm(null)}>取消</button>
              <button type="button" className="btn small" disabled={busy} onClick={saveForm}>{busy ? '保存中…' : '保存'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
