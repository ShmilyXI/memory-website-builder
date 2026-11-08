import { Glyph } from './icons.jsx'
import { useEffect, useRef, useState } from 'react'

// ---------- 日期 ----------
const DAY = 86400000
const bj = () => {
  const s = new Date().toLocaleString('en-CA', { timeZone: 'Asia/Shanghai', hour12: false })
  const [y, m, d] = s.slice(0, 10).split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}
export const utc = (m, d) => Date.UTC(2026, m - 1, d)
export const MET = utc(6, 12)
export const LOVE = utc(6, 30)
export const BAI = utc(10, 8)
export const daysSince = (from, to = bj()) => Math.round((to - from) / DAY)
export const today = bj

const INK = '#5A2B3C'
// ---------- 蝴蝶结 ----------
export function Bow({ color = '#FF5C8A', size = 40, className = '', style }) {
  return (
    <svg className={`bow ${className}`} viewBox="0 0 60 40" width={size} height={size * 0.66} style={style} aria-hidden>
      <path d="M26 22 L20 38 L27 35 L30 39 L31 24 Z M34 22 L40 38 L33 35 L30 39 L29 24 Z" fill={color} stroke={INK} strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M30 19 C22 4 6 1 3.5 10 C1 19 4 29 14 30.5 C21 31.5 26 25 30 19 Z" fill={color} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M30 19 C38 4 54 1 56.5 10 C59 19 56 29 46 30.5 C39 31.5 34 25 30 19 Z" fill={color} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M11 11 Q14 8 18 10" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" opacity=".85" />
      <path d="M13 18 Q18 22 24 20 M47 18 Q42 22 36 20" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" opacity=".45" />
      <ellipse cx="30" cy="19.5" rx="6" ry="7" fill={color} stroke={INK} strokeWidth="3" />
    </svg>
  )
}

// ---------- 全屏看图：一个很小的全局开关 ----------
let viewCur = null
const vsubs = new Set()
export const openViewer = (v) => { viewCur = v; vsubs.forEach((f) => f(v)) }
export const closeViewer = () => openViewer(null)
export function useViewer() {
  const [v, setV] = useState(viewCur)
  useEffect(() => { vsubs.add(setV); return () => vsubs.delete(setV) }, [])
  return v
}
// 背景音乐的引用，放语音时把它调小
export const bgm = { el: null }

const ZoomBtn = ({ onOpen }) => (
  <button className="photo-zoom" aria-label="放大看这张照片" title="放大看"
    onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onOpen() }}>
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <circle cx="10.5" cy="10.5" r="6.5" fill="#fff" stroke="#5A2B3C" strokeWidth="2.6" />
      <path d="M15.5 15.5 L21 21" stroke="#5A2B3C" strokeWidth="3" strokeLinecap="round" />
      <path d="M10.5 7.5 V13.5 M7.5 10.5 H13.5" stroke="#FF5C8A" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  </button>
)
const hashId = (s = '') => [...s].reduce((a, c) => a + c.charCodeAt(0), 0)

// ---------- 照片占位 / 真图 ----------
// private/photos.json: { "cover": "photos/cover.webp", ... }，没填的位置显示占位相纸。
// 照片不再公开：登录后由 App 向后端要一份带签名的地址表，再调用 setPhotoMap 交进来。
let photoMap = null
const listeners = []
export function setPhotoMap(m) {
  photoMap = m || {}
  listeners.slice().forEach((f) => f(photoMap))
}

export function usePhotoMap() {
  const [m, setM] = useState(photoMap)
  useEffect(() => {
    if (photoMap) return setM(photoMap)
    listeners.push(setM)
    return () => listeners.splice(listeners.indexOf(setM), 1)
  }, [])
  return m || {}
}

// zoom：右下角放大镜，点开全屏看；title：全屏时顶上显示的字
// group：同一组的几张照片 [{id, hint}]，点放大镜后可以在全屏里左右翻
export function Photo({ id, ratio = '4 / 5', hint = '待补照片', tilt = 0, tape = true, className = '', caption, focus = '50% 40%', zoom = true, title, group }) {
  const map = usePhotoMap()
  const src = map[id]
  const bow = tape && hashId(id) % 2 === 0 // 一半贴胶带，一半别个蝴蝶结
  const canZoom = zoom && !/\bxs\b/.test(className)
  return (
    <figure className={`photo ${tape ? 'taped' : ''} ${className}`} style={{ transform: tilt ? `rotate(${tilt}deg)` : undefined }}>
      {tape && (bow ? <i className="photo-bow"><Bow size={58} /></i> : <i className="tape" />)}
      <div className="photo-frame" style={{ aspectRatio: ratio }}>
        {src ? (
          <img src={src} alt={hint} loading="lazy" style={{ objectPosition: focus }} />
        ) : (
          <div className="ph">
            <svg viewBox="0 0 64 64" width="44" height="44" aria-hidden>
              <rect x="6" y="16" width="52" height="38" rx="9" fill="#fff" stroke="#5A2B3C" strokeWidth="3" />
              <circle cx="32" cy="35" r="10" fill="#FFC4B0" stroke="#5A2B3C" strokeWidth="3" />
              <rect x="22" y="9" width="20" height="9" rx="4" fill="#FF8FB1" stroke="#5A2B3C" strokeWidth="3" />
              <circle cx="28.5" cy="33" r="1.6" fill="#5A2B3C" />
              <circle cx="35.5" cy="33" r="1.6" fill="#5A2B3C" />
              <path d="M28 38 Q32 42 36 38" fill="none" stroke="#5A2B3C" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span>{hint}</span>
          </div>
        )}
        <span className="pink-wash" />
        {canZoom && <ZoomBtn onOpen={() => openViewer(group
          ? { list: group, index: Math.max(0, group.findIndex((g) => g.id === id)), title: title || caption || hint }
          : { id, hint, title: title || caption || hint })} />}
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  )
}

// 英英的话在左，XIAO 的话在右
export function Bubble({ who, text, side }) {
  const x = who === 'XIAO'
  return (
    <div className={`bubble ${side || (x ? 'r' : 'l')} who-${x ? 'x' : 'y'}`}>
      <b>{who}</b>
      <p>{text}</p>
    </div>
  )
}

// 可左右滑的小图册：原生 scroll-snap（手机手指滑），桌面用左右按钮
export function Gallery({ items, className = '', hint = '左右滑一滑，还有哦' }) {
  const box = useRef(null)
  const [i, setI] = useState(0)
  const step = () => {
    const el = box.current
    const a = el.children[0], b = el.children[1]
    return b ? b.offsetLeft - a.offsetLeft : el.clientWidth
  }
  const onScroll = () => setI(Math.round(box.current.scrollLeft / step()))
  const go = (n) => {
    const k = Math.max(0, Math.min(items.length - 1, n))
    box.current.scrollTo({ left: k * step(), behavior: 'smooth' })
  }
  return (
    <div className={`gallery ${className}`}>
      <div className="gal-track" ref={box} onScroll={onScroll}>
        {items.map((it, k) => (
          <div className={`gal-slide ${k === i ? 'on' : ''}`} key={it.id}>
            <Photo id={it.id} ratio={it.ratio || '4 / 5'} hint={it.hint} tilt={it.tilt ?? (k % 2 ? 1.5 : -1.5)} tape={k === i} />
          </div>
        ))}
      </div>
      <div className="gal-ctrl">
        <button onClick={() => go(i - 1)} disabled={i === 0} aria-label="上一张"><Glyph name="back" size={22} strokeWidth={3.2} /></button>
        <span className="gal-dots">{items.map((_, k) => <i key={k} className={k === i ? 'on' : ''} />)}</span>
        <button onClick={() => go(i + 1)} disabled={i === items.length - 1} aria-label="下一张"><Glyph name="next" size={22} strokeWidth={3.2} /></button>
      </div>
      {hint && <p className="tiny gal-hint">{hint}</p>}
    </div>
  )
}

export function Stamp({ children, className = '' }) {
  return <span className={`stamp ${className}`}>{children}</span>
}

export function ChapterHead({ date, title, sub }) {
  return (
    <header className="ch-head">
      <span className="ch-stamp"><Bow size={34} className="ch-bow" /><Stamp>{date}</Stamp></span>
      <h2 className="ch-title">{title}</h2>
      {sub && <p className="ch-sub">{sub}</p>}
    </header>
  )
}
