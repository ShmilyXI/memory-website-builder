import { useEffect, useState } from 'react'
import { loadAMap, regeo, searchPlaces } from '../mapUtil.js'

// 搜一个地方，选中后返回 { name, lat, lng, province, city, adcode }。写日记标地点、地图上放图钉都用它。
export default function PlacePicker({ cfg, onPick, onClose }) {
  const [q, setQ] = useState('')
  const [tips, setTips] = useState([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    const kw = q.trim()
    if (!kw) { setTips([]); setSearched(false); return }
    let on = true
    const t = setTimeout(async () => {
      try {
        const AMap = await loadAMap(cfg)
        const r = await searchPlaces(AMap, kw)
        if (on) { setTips(r); setSearched(true); setErr('') }
      } catch (e) { if (on) setErr(e.message) }
    }, 300)
    return () => { on = false; clearTimeout(t) }
  }, [q, cfg])

  const pick = async (t) => {
    setBusy(true)
    try {
      const AMap = await loadAMap(cfg)
      const g = await regeo(AMap, t.lng, t.lat)
      onPick({ name: t.name, lat: t.lat, lng: t.lng, province: g.province, city: g.city, adcode: g.adcode || t.adcode })
    } catch (e) { setErr(e.message); setBusy(false) }
  }

  return (
    <div className="d-sheet" onClick={onClose}>
      <div className="d-sheet-in" role="dialog" aria-label="标记地点" onClick={(e) => e.stopPropagation()}>
        <h2>在地图上标一个地方</h2>
        <input className="d-input" autoFocus placeholder="搜一个地方，比如：衡山、壹方城" value={q} onChange={(e) => setQ(e.target.value)} aria-label="搜地点" />
        {err && <p className="d-error" role="alert">{err}</p>}
        {tips.length > 0 && (
          <ul className="d-tips">
            {tips.map((t, i) => (
              <li key={`${t.name}-${i}`}>
                <button type="button" disabled={busy} onClick={() => pick(t)}>
                  <b>{t.name}</b>
                  <small>{t.district}</small>
                </button>
              </li>
            ))}
          </ul>
        )}
        {searched && tips.length === 0 && <p className="d-hint">没找到，换个说法试试？</p>}
        <div className="d-sheet-actions"><button type="button" className="d-chip" onClick={onClose}>取消</button></div>
      </div>
    </div>
  )
}
