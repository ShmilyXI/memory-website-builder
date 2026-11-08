import { Doodle, Glyph } from './icons.jsx'
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { NODES } from './content.js'
import { ClickSpark, Magnet } from './bits.jsx'
import { LOVE, utc, daysSince, Bow } from './ui.jsx'
import { Kitty } from './cute.jsx'
import { login } from './api.js'

// ---------- 口令页 ----------
// 口令由服务器校验（输错太多次会被暂时锁住），页面里不再留着口令。
export function Gate({ onOk, onBack }) {
  const [v, setV] = useState('')
  const [bad, setBad] = useState(false)
  const [msg, setMsg] = useState('')
  const busy = useRef(false)
  const box = useRef(null)
  const check = async (val) => {
    if (val.length !== 4 || busy.current) return
    busy.current = true
    let res
    try { res = await login(val) } catch { res = { ok: false, net: true } }
    busy.current = false
    if (res.ok) return onOk()
    setBad(true)
    setMsg(res.locked
      ? `试了好多次啦，宝宝等 ${Math.ceil(res.retryAfter / 60)} 分钟再来哦`
      : res.net ? '网络好像开小差了，再试一次～' : '')
    gsap.fromTo(box.current, { x: -10 }, { x: 0, duration: 0.5, ease: 'elastic.out(1,0.3)' })
    setTimeout(() => {
      setV('')
      setBad(false)
    }, 600)
  }
  return (
    <div className="screen gate">
      {onBack && <button className="gate-back" onClick={onBack}><Glyph name="back" size={16} strokeWidth={3} /> 回首页</button>}
      <div className="gate-card" ref={box}>
        <div className="gate-emoji"><Kitty size={92} /></div>
        <h1>这是给宝宝的小秘密</h1>
        <p>输入我们在一起的那天（4 位数字哦）</p>
        <input
          inputMode="numeric"
          maxLength={4}
          value={v}
          autoFocus
          className={bad ? 'bad' : ''}
          placeholder="••••"
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '')
            setV(val)
            check(val)
          }}
        />
        <p className="gate-msg" role="status">{msg}</p>
      </div>
    </div>
  )
}

// ---------- 信封 ----------
export function Envelope({ onOpen, onHome }) {
  const root = useRef(null)
  const flap = useRef(null)
  const card = useRef(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    const t = gsap.to(root.current.querySelector('.env'), { y: -8, repeat: -1, yoyo: true, duration: 1.1, ease: 'sine.inOut' })
    return () => t.kill()
  }, [])
  const open = () => {
    if (busy) return
    setBusy(true)
    onOpen() // 在用户手势里启动音乐
    const q = (s) => root.current.querySelector(s)
    const tl = gsap.timeline({ onComplete: () => gsap.to(root.current, { opacity: 0, duration: 0.5, onComplete: () => root.current && (root.current.style.display = 'none') }) })
    // 层级：背板 0 < 信纸 1 < 前袋 2 < 盖子 3（合上时）。盖子翻过 90° 后退到信纸后面，信纸才能从袋口抽出来
    tl.to(q('.env-seal'), { scale: 0, opacity: 0, duration: 0.25, ease: 'back.in(2)' })
      .to(flap.current, { rotateX: 90, duration: 0.3, ease: 'power2.in' })
      .set(flap.current, { zIndex: 0 })
      .to(flap.current, { rotateX: 180, duration: 0.3, ease: 'power2.out' })
      .to(card.current, { y: '-62%', duration: 0.7, ease: 'back.out(1.3)' }, '+=0.05')
      // 放大前先把信纸提到最上层，信封本身淡掉，避免被前袋的三角挡住
      .set(card.current, { zIndex: 5 }, '+=0.25')
      .to([q('.env-front'), q('.env-back'), flap.current], { opacity: 0, duration: 0.25, ease: 'power1.out' }, '<')
      .to(card.current, { scale: 5, y: '-30%', opacity: 0, duration: 0.6, ease: 'power3.in' }, '<')
  }
  return (
    <div className="screen envelope" ref={root}>
      {onHome && <button className="story-back" onClick={onHome}><Glyph name="back" size={16} strokeWidth={3} /> 回首页</button>}
      <ClickSpark style={{ display: 'grid', placeItems: 'center' }}>
        <button className="env" onClick={open} aria-label="打开信封">
          <span className="env-back" />
          <span className="env-card" ref={card}><em><Doodle name="heart" size={22} /></em><small>写给宝宝的</small></span>
          <svg className="env-front" viewBox="0 0 300 200" preserveAspectRatio="none" aria-hidden>
            <path d="M2 14 L150 118 L298 14 L298 180 Q298 198 280 198 L20 198 Q2 198 2 180 Z" fill="#FF8FB1" stroke="#5A2B3C" strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
            <path d="M4 196 L128 104 M296 196 L172 104" stroke="#5A2B3C" strokeOpacity=".22" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
          </svg>
          <span className="env-flap" ref={flap}>
            <svg viewBox="0 0 300 120" preserveAspectRatio="none" aria-hidden>
              <path d="M2 18 Q2 2 20 2 L280 2 Q298 2 298 18 L156 116 Q150 120 144 116 Z" fill="#FFB0C8" stroke="#5A2B3C" strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="env-seal"><Bow size={30} className="seal-bow" />给英英</span>
        </button>
      </ClickSpark>
      <p className="env-hint">宝宝，点一下打开</p>
      <Kitty size={110} className="env-kitty" />
    </div>
  )
}

// ---------- 唱片机 ----------
export function Gramophone({ playing, toggle, hasSrc }) {
  return (
    <button className={`gramo ${playing ? 'on' : ''}`} onClick={toggle} aria-label={playing ? '暂停音乐' : '播放音乐'} title={hasSrc ? '' : '音频待补充'}>
      <Bow size={24} className="gramo-bow" />
      <svg className="gramo-svg" viewBox="0 0 56 56" width="44" height="44" aria-hidden>
        {/* 唱片 */}
        <g className="disc">
          <circle cx="26" cy="29" r="21" fill="#5A2B3C" />
          <circle cx="26" cy="29" r="17" fill="none" stroke="#fff" strokeOpacity=".16" strokeWidth="1" />
          <circle cx="26" cy="29" r="13.5" fill="none" stroke="#fff" strokeOpacity=".16" strokeWidth="1" />
          <path d="M11 22 A16.5 16.5 0 0 1 19 13.8" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="2" strokeLinecap="round" />
          <path d="M41 36 A16.5 16.5 0 0 1 35.5 42.8" fill="none" stroke="#fff" strokeOpacity=".3" strokeWidth="2" strokeLinecap="round" />
          <circle cx="26" cy="29" r="8.5" fill="#FF8FB1" stroke="#5A2B3C" strokeWidth="1.6" />
          <path d="M26 26.6 C24.6 24.6 21.6 25.6 22.6 28 C23.3 29.6 26 31.4 26 31.4 C26 31.4 28.7 29.6 29.4 28 C30.4 25.6 27.4 24.6 26 26.6 Z" fill="#fff" />
          <circle cx="26" cy="29" r="1.3" fill="#5A2B3C" />
        </g>
        {/* 唱臂 */}
        <g className="arm">
          <path d="M48 8 L46 26 L39 33" fill="none" stroke="#5A2B3C" strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M48 8 L46 26 L39 33" fill="none" stroke="#FFE9A3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="34.5" y="30.5" width="7" height="5" rx="1.5" transform="rotate(45 38 33)" fill="#FFB6CC" stroke="#5A2B3C" strokeWidth="1.8" />
          <circle cx="48" cy="8" r="4" fill="#FFC4B0" stroke="#5A2B3C" strokeWidth="2.2" />
        </g>
      </svg>
      <span className="gramo-notes" aria-hidden><i>♪</i><i>♫</i></span>
    </button>
  )
}

// ---------- 时间线 ----------
const pad = (n) => String(n).padStart(2, '0')
export function nodeLabel(n) {
  const t = utc(n.m, n.d)
  const dd = daysSince(LOVE, t)
  return `${n.m}.${n.d}` + (dd >= 0 ? ` · 第 ${dd} 天` : '')
}

export function Timeline({ active, progress, jump, onHome }) {
  const [open, setOpen] = useState(false)
  const cur = NODES[active] || NODES[0]
  const capRef = useRef(null)
  // 桌面：切换章节时标签亮一下再收起来，平时只留小圆点，不挡内容
  const [flash, setFlash] = useState(true)
  useEffect(() => {
    setFlash(true)
    const t = setTimeout(() => setFlash(false), 2200)
    return () => clearTimeout(t)
  }, [active])
  useEffect(() => {
    if (capRef.current) gsap.fromTo(capRef.current, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3 })
  }, [active])
  const go = (id) => {
    setOpen(false)
    jump(id)
  }
  return (
    <>
      {/* 桌面：回首页，固定在左上角（时间线上面是自动播放按钮，不能放在一起） */}
      {onHome && <button className="tl-home" onClick={onHome}><Glyph name="back" size={14} strokeWidth={3} /> 首页</button>}
      {/* 桌面：左侧竖线 */}
      <nav className="tl-rail" aria-label="时间线">
        <div className="tl-line"><i style={{ height: `${progress * 84}%` }} /></div>
        <ul>
          {NODES.map((n, i) => (
            <li key={n.id} className={(i === active ? 'on' : i < active ? 'past' : i >= NODES.length - 1 ? 'future' : '') + (i === active && flash ? ' flash' : '')}>
              <button onClick={() => go(n.id)}>
                <span className="dot" />
                <span className="lbl">{n.m}.{n.d}<small>{n.label}</small></span>
              </button>
            </li>
          ))}
        </ul>
        {/* 尾巴：不收口，虚线一直往下淡出去 */}
        <div className="tl-tail" aria-hidden><span>未完待续</span><i /><i /><i /><i /></div>
      </nav>
      {/* 移动：顶部进度条 + 日期胶囊 */}
      <div className="tl-top">
        <div className="tl-bar"><i style={{ width: `${progress * 80}%` }} /></div>
        <span className="tl-cap" ref={capRef}><Bow size={18} className="cap-bow" />{nodeLabel(cur)} · {cur.label}</span>
      </div>
      <button className="tl-fab" onClick={() => setOpen(true)} aria-label="章节目录"><Glyph name="menu" size={22} strokeWidth={3} /></button>
      <div className={`tl-sheet ${open ? 'open' : ''}`} onClick={() => setOpen(false)}>
        <div className="tl-sheet-in" onClick={(e) => e.stopPropagation()}>
          {onHome && <button className="tl-home-m" onClick={onHome}><Glyph name="back" size={16} strokeWidth={3} /> 回首页</button>}
          <h3>去哪一天</h3>
          <ul>
            {NODES.map((n, i) => (
              <li key={n.id}>
                <button className={i === active ? 'on' : ''} onClick={() => go(n.id)}>
                  <b>{n.m}.{n.d}</b> {n.label}
                </button>
              </li>
            ))}
            <li><span className="tl-more">…… 未完待续，还有好多页</span></li>
          </ul>
        </div>
      </div>
    </>
  )
}

// ---------- 自动播放：像看视频一样，页面自己慢慢往下走 ----------
// 跳章节时 App 调 holdAuto(ms) 让它先让开，免得和跳转动画打架
const bus = { holdUntil: 0 }
export const holdAuto = (ms = 1500) => { bus.holdUntil = performance.now() + ms }
const SPEEDS = [
  { k: 0.07, name: '慢慢' },
  { k: 0.11, name: '正常' },
  { k: 0.18, name: '快快' },
]
const RESUME = 2600 // 宝宝自己滑了一下：停手这么久后接着放

// 有章节标题的那一整块（section），以它的上边缘为准
const chapterTops = () => [...new Set([...document.querySelectorAll('.ch-head')].map((h) => h.closest('section') || h))]

export function AutoPlay({ progress, onStart }) {
  const [on, setOn] = useState(false)
  const [sp, setSp] = useState(1)
  const [held, setHeld] = useState(false)
  const [tip, setTip] = useState('')
  const st = useRef({ sp: 1 })
  st.current.sp = sp
  // 平时只露一个圆按钮；状态一变（开/停/等你/换速度）就把文字弹出来一小会儿再收起
  const [peek, setPeek] = useState(false)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) { first.current = false; return }
    setPeek(true)
    const t = setTimeout(() => setPeek(false), 2200)
    return () => clearTimeout(t)
  }, [on, held, sp])
  const toast = (t, ms = 2600) => {
    setTip(t)
    clearTimeout(st.current.tt)
    st.current.tt = setTimeout(() => setTip(''), ms)
  }

  useEffect(() => {
    if (!on) return
    const s = st.current
    let y = window.scrollY, v = 0, last = performance.now(), raf, dwell = 0, wasHeld = false
    const armed = new Set()
    const userHold = () => { bus.holdUntil = performance.now() + RESUME }
    const keys = (e) => ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(e.key) && userHold()
    window.addEventListener('wheel', userHold, { passive: true })
    window.addEventListener('touchstart', userHold, { passive: true })
    window.addEventListener('touchmove', userHold, { passive: true })
    window.addEventListener('keydown', keys)
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const H = window.innerHeight
      // 别人动了滚动条（手指、滚轮、拖动、跳章节）：跟上它的位置，并暂停一会儿
      if (Math.abs(window.scrollY - y) > 4) { y = window.scrollY; if (now > bus.holdUntil) bus.holdUntil = now + RESUME }
      const viewing = !!document.querySelector('.lightbox')
      const hold = now < bus.holdUntil || viewing
      if (hold !== wasHeld) { wasHeld = hold; setHeld(hold) }
      // 每个章节的开头刚好贴到屏幕顶上时停一小下，像翻到新的一页（不会露出上一章的边）；快到时按剩余距离刹车，速度再快也不会冲过头
      const line = 0, brake = H * 0.3
      let bf = 1, snap = null
      chapterTops().forEach((el) => {
        const t = el.getBoundingClientRect().top
        if (t > H * 0.6) armed.add(el)
        else if (armed.has(el)) {
          if (t < line - H * 0.2) armed.delete(el) // 跳章节直接越过去的，不补停
          else if (t <= line + 1.5) { armed.delete(el); dwell = now + 1200; snap = t - line } // 对齐到像素
          else if (t < line + brake) bf = Math.min(bf, Math.max(0.1, Math.sqrt((t - line) / brake))) // 匀减速：稳稳停在线上
        }
      })
      // 情书这种要慢慢读的地方放慢
      let mult = 1
      document.querySelectorAll('[data-slow]').forEach((el) => {
        const r = el.getBoundingClientRect()
        if (r.top < H * 0.65 && r.bottom > H * 0.35) mult = Math.min(mult, +el.dataset.slow)
      })
      const target = hold || now < dwell ? 0 : SPEEDS[s.sp].k * H * mult * bf
      if (snap !== null) { y += snap; v = 0; window.scrollTo(0, y) }
      if (bf < 1 && v > target) v = target
      v += (target - v) * Math.min(1, dt * 2.6) // 起步、停下都是缓的
      if (v > 0.5) {
        y += v * dt
        window.scrollTo(0, y)
      }
      const max = document.documentElement.scrollHeight - H
      if (y >= max - 2) {
        setOn(false)
        toast('看完啦～ 后面的故事，未完待续', 3600)
        return
      }
      raf = requestAnimationFrame(tick)
    }
    // 刚打开时，把当前看得见的标题先登记上，避免一开就停
    chapterTops().forEach((el) => el.getBoundingClientRect().top > window.innerHeight * 0.6 && armed.add(el))
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('wheel', userHold)
      window.removeEventListener('touchstart', userHold)
      window.removeEventListener('touchmove', userHold)
      window.removeEventListener('keydown', keys)
      setHeld(false)
    }
  }, [on])

  const toggle = () => {
    if (on) { setOn(false); toast('自动播放停啦'); return }
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4) window.scrollTo(0, 0)
    bus.holdUntil = 0
    setOn(true)
    onStart?.()
    if (!st.current.told) { st.current.told = true; toast('宝宝靠着看就好～ 想停下随时滑一下', 3400) }
  }
  const cycle = () => {
    const n = (sp + 1) % SPEEDS.length
    setSp(n)
  }
  // 桌面：贴在时间线第一个圆点正上方
  const box = useRef(null)
  useEffect(() => {
    const place = () => {
      const ul = document.querySelector('.tl-rail ul')
      if (!box.current) return
      if (!ul || !ul.offsetParent) { box.current.style.top = ''; return }
      box.current.style.top = ul.getBoundingClientRect().top + 9 - 40 + 'px'
    }
    place()
    const t = setTimeout(place, 400)
    window.addEventListener('resize', place)
    return () => { clearTimeout(t); window.removeEventListener('resize', place) }
  }, [])
  const C = 2 * Math.PI * 19
  return (
    <div ref={box} className={`auto ${on ? 'on' : ''} ${held ? 'held' : ''} ${peek ? 'peek' : ''}`}>
      <button className="auto-btn" onClick={toggle} aria-label={on ? '停止自动播放' : '自动播放'} aria-pressed={on}>
        <svg viewBox="0 0 44 44" aria-hidden>
          <circle cx="22" cy="22" r="19" fill="none" stroke="#f3d6de" strokeWidth="3.5" />
          <circle cx="22" cy="22" r="19" fill="none" stroke="#FF8FB1" strokeWidth="3.5" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - progress)} transform="rotate(-90 22 22)" />
          {on ? (
            <g fill="#5A2B3C"><rect x="15.5" y="14" width="4.6" height="16" rx="2" /><rect x="23.9" y="14" width="4.6" height="16" rx="2" /></g>
          ) : (
            <path d="M17 13.5 L31 22 L17 30.5 Z" fill="#5A2B3C" stroke="#5A2B3C" strokeWidth="2" strokeLinejoin="round" />
          )}
        </svg>
        <span className="auto-lbl">{on ? (held ? '等你一下下…' : '自动播放中') : '自动播放'}</span>
      </button>
      {on && <button className="auto-sp" onClick={cycle} aria-label="切换速度">{SPEEDS[sp].name}</button>}
      <span className={`auto-tip ${tip ? 'show' : ''}`} aria-live="polite">{tip}</span>
    </div>
  )
}
