import { Glyph, Arrow } from './icons.jsx'
// 可爱小元素：Hello Kitty、蝴蝶结、全屏看图、语音小气泡
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { usePhotoMap, useViewer, closeViewer, bgm, Bow } from './ui.jsx'
export { Bow }
import { VOICES } from './content.js'
import { KP } from './kittyPaths.js'

const INK = '#5A2B3C'

// ---------- Hello Kitty（照着英英喜欢的那张图描成 SVG，保持一模一样） ----------
// bow：可以给蝴蝶结换个颜色；blush=false 去掉腮红
export function Kitty({ size = 90, bow = '#CB383C', className = '', style, blush = true }) {
  return (
    <svg className={`kitty ${className}`} viewBox="70 150 890 620" width={size} height={size * 0.7} style={style} aria-hidden>
      <path fillRule="evenodd" fill="#fff" d={KP.white} />
      {blush && <path fillRule="evenodd" fill="#F7C6D3" d={KP.blush} />}
      <path fillRule="evenodd" fill={bow} d={KP.red} />
      <path fillRule="evenodd" fill="#F8E03A" d={KP.yellow} />
      <path fillRule="evenodd" fill="#292B29" d={KP.black} />
    </svg>
  )
}

// 全屏里放的视频：播放时把背景音乐压低（故事页里有），关掉或放完恢复
function ViewerVideo({ src, poster }) {
  useEffect(() => () => duck(false), [])
  return (
    <video className="pv-video" src={src} poster={poster} controls playsInline autoPlay preload="metadata"
      onPlay={() => duck(true)} onPause={() => duck(false)} onEnded={() => duck(false)} onClick={(e) => e.stopPropagation()} />
  )
}

// ---------- 全屏看图 ----------
// openViewer({ id, hint, title }) 看一张；openViewer({ list:[{id,hint}], index, title }) 左右翻着看
// 每张可以直接给 src（日记里上传的图），也可以带 entryId，看图时多一个「去看这篇日记」
// 视频：{ kind: 'video', src, poster }，会放一个带控制条的播放器
export function PhotoViewer() {
  const cur = useViewer()
  const map = usePhotoMap()
  const nav = useNavigate()
  const [zoom, setZoom] = useState(false)
  const [idx, setIdx] = useState(0)
  const stage = useRef(null)
  const box = useRef(null)
  const sw = useRef(null)
  const list = cur ? cur.list || [cur] : []
  const n = list.length
  const go = (d) => {
    if (n < 2) return
    setZoom(false)
    setIdx((v) => (v + d + n) % n)
    gsap.fromTo(box.current, { x: d * 60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' })
  }
  useEffect(() => {
    setZoom(false)
    if (!cur) return
    setIdx(cur.index || 0)
    const html = document.documentElement
    const prev = html.style.overflow
    html.style.overflow = 'hidden'
    gsap.fromTo(box.current, { scale: 0.8, opacity: 0, rotate: -3 }, { scale: 1, opacity: 1, rotate: 0, duration: 0.45, ease: 'back.out(1.6)' })
    return () => { html.style.overflow = prev }
  }, [cur])
  useEffect(() => {
    if (!cur) return
    const key = (e) => {
      if (e.key === 'Escape') closeViewer()
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === 'ArrowRight') go(1)
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  })
  if (!cur) return null
  const item = list[Math.min(idx, n - 1)] || cur
  const src = item.src || map[item.id]
  const tapImg = (e) => {
    e.stopPropagation()
    if (sw.current && sw.current.moved) return
    const el = stage.current
    const r = e.currentTarget.getBoundingClientRect()
    const fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height
    setZoom((z) => {
      if (!z) requestAnimationFrame(() => { el.scrollLeft = el.scrollWidth * fx - el.clientWidth / 2; el.scrollTop = el.scrollHeight * fy - el.clientHeight / 2 })
      return !z
    })
  }
  // 左右滑一下翻页（放大时不翻）
  const sDown = (e) => { sw.current = zoom || n < 2 || e.target.tagName === 'VIDEO' ? null : { x: e.clientX, moved: false } } // 在视频上拖是拖进度条，不翻页
  const sMove = (e) => { if (sw.current && Math.abs(e.clientX - sw.current.x) > 12) sw.current.moved = true }
  const sUp = (e) => {
    const s0 = sw.current
    if (!s0) return
    const dx = e.clientX - s0.x
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1)
    setTimeout(() => (sw.current = null), 0)
  }
  const title = (cur.title || item.hint || '我们的照片') + (n > 1 ? ` · ${idx + 1}/${n}` : '')
  return (
    <div className="pv" role="dialog" aria-label="全屏看照片" onClick={() => !(sw.current && sw.current.moved) && closeViewer()}>
      <div className="pv-top" onClick={(e) => e.stopPropagation()}>
        <span className="pv-title"><Bow size={26} />{title}</span>
        <button className="pv-x" onClick={closeViewer} aria-label="关掉"><Glyph name="close" size={18} strokeWidth={3.2} /></button>
      </div>
      <div className={`pv-stage ${zoom ? 'z' : ''}`} ref={stage} onPointerDown={sDown} onPointerMove={sMove} onPointerUp={sUp}>
        <div className="pv-box" ref={box}>
          {src && item.kind === 'video' ? (
            <ViewerVideo key={item.id || src} src={src} poster={item.poster} />
          ) : src ? (
            <img src={src} alt={item.hint || ''} onClick={tapImg} draggable={false} />
          ) : (
            <div className="pv-ph" onClick={(e) => e.stopPropagation()}>
              <Kitty size={130} />
              <b>{item.hint || '这张照片'}</b>
              <span>照片还没放进来哦，放进来以后就能在这里看大图啦</span>
            </div>
          )}
        </div>
        {n > 1 && !zoom && (
          <>
            <button className="pv-nav l" onClick={(e) => { e.stopPropagation(); go(-1) }} aria-label="上一张"><Glyph name="back" size={26} strokeWidth={3.2} /></button>
            <button className="pv-nav r" onClick={(e) => { e.stopPropagation(); go(1) }} aria-label="下一张"><Glyph name="next" size={26} strokeWidth={3.2} /></button>
          </>
        )}
      </div>
      {n > 1 && <div className="pv-dots">{list.map((_, k) => <i key={k} className={k === idx ? 'on' : ''} />)}</div>}
      {item.entryId && <button className="pv-link" onClick={(e) => { e.stopPropagation(); closeViewer(); nav(`/diary/${item.entryId}`) }}>去看这篇日记 <Arrow /></button>}
      <p className="pv-tip">{src && item.kind === 'video' ? (n > 1 ? '左右两边的箭头换一张 · 点空白处收起来' : '点空白处收起来') : src ? (zoom ? '再点一下缩回去 · 可以拖着看细节' : n > 1 ? '左右滑一滑换一张 · 点照片放大' : '点照片放大一点 · 点空白处收起来') : n > 1 ? '左右滑一滑换一张 · 点空白处收起来' : '点空白处收起来'}</p>
    </div>
  )
}

// ---------- 语音小气泡 ----------
// private/voices.json: { "voice-1": "voices/xxx.mp3" }；没放的会显示成虚线「待补充」
// 登录后由 App 向后端要带签名的地址表，再调用 setVoiceMap 交进来。
let voiceMap = null
const vls = []
export function setVoiceMap(m) { voiceMap = m || {}; vls.slice().forEach((f) => f(voiceMap)) }
function useVoiceMap() {
  const [m, setM] = useState(voiceMap)
  useEffect(() => {
    if (voiceMap) return setM(voiceMap)
    vls.push(setM)
    return () => vls.splice(vls.indexOf(setM), 1)
  }, [])
  return m
}
const player = typeof Audio !== 'undefined' ? new Audio() : null
let owner = null // 当前在播的那个气泡的 setter
let ducked = false
export const duck = (on) => {
  const a = bgm.el
  if (!a) return
  if (on && !a.paused) { ducked = true; gsap.to(a, { volume: 0.06, duration: 0.3 }) }
  if (!on && ducked) { ducked = false; gsap.to(a, { volume: 0.4, duration: 0.8 }) }
}
if (player) {
  player.addEventListener('ended', () => { owner && owner('idle'); owner = null; duck(false) })
}

export function Voice({ id, className = '' }) {
  const meta = VOICES[id] || { who: '英英', label: '一小段语音' }
  const map = useVoiceMap()
  const [st, setSt] = useState('idle')
  const [dur, setDur] = useState(null)
  const [tip, setTip] = useState(false)
  const btn = useRef(null)
  const src = map && map[id]
  useEffect(() => {
    if (!src) return
    const a = new Audio()
    a.preload = 'metadata'
    a.src = src
    const f = () => isFinite(a.duration) && setDur(Math.max(1, Math.round(a.duration)))
    a.addEventListener('loadedmetadata', f)
    return () => a.removeEventListener('loadedmetadata', f)
  }, [src])
  useEffect(() => () => { if (owner === setSt) { player.pause(); owner = null; duck(false) } }, [])
  if (map && !src && map._hideEmpty) return null
  const click = (e) => {
    e.stopPropagation()
    if (!src) {
      setTip(true)
      gsap.fromTo(btn.current, { rotate: -6 }, { rotate: 0, duration: 0.6, ease: 'elastic.out(1,0.3)' })
      setTimeout(() => setTip(false), 1800)
      return
    }
    if (owner === setSt && !player.paused) { player.pause(); setSt('idle'); owner = null; duck(false); return }
    if (owner) owner('idle')
    owner = setSt
    player.src = src
    player.currentTime = 0
    duck(true)
    player.play().then(() => setSt('play')).catch(() => { setSt('idle'); duck(false) })
  }
  const x = meta.who === 'XIAO'
  const w = dur ? Math.min(190, 96 + dur * 6) : 110
  return (
    <div className={`voice ${x ? 'vx' : 'vy'} ${src ? '' : 'empty'} ${st} ${className}`} onPointerDown={(e) => e.stopPropagation()}>
      <small className="voice-lbl">{x ? '我' : '你'}的语音 · {meta.label}</small>
      <button ref={btn} className="voice-btn" onClick={click} style={{ minWidth: w }} aria-label={`播放语音：${meta.label}`}>
        <svg className="voice-ic" viewBox="0 0 24 24" width="22" height="22" aria-hidden>
          <circle cx="5" cy="12" r="2.4" fill={INK} />
          <path className="w1" d="M9 7.5 Q12.5 12 9 16.5" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
          <path className="w2" d="M13 4.5 Q18.5 12 13 19.5" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
        </svg>
        <span className="voice-bars">{[0, 1, 2, 3, 4].map((i) => <i key={i} />)}</span>
        <b>{src ? (dur ? `${dur}″` : '点我听') : '待补充'}</b>
        <Bow size={22} className="voice-bow" color={x ? '#7FC8FF' : '#FF5C8A'} />
      </button>
      {tip && <span className="voice-tip">这里会放一段语音哦，等肖肖放进来～</span>}
    </div>
  )
}
