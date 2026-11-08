// 轻量实现，接口与视觉参考 React Bits（CountUp / BlurText / ClickSpark / Magnet /
// StarBorder / ShinyText / BounceCards / Stack）。需要时可以直接替换为官方组件源码。
import { useEffect, useRef, useState, Children } from 'react'
import gsap from 'gsap'

const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

function useInView(ref, once = true, margin = '0px 0px -15% 0px') {
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true)
          if (once) io.disconnect()
        }
      },
      { rootMargin: margin }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, once, margin])
  return seen
}

export function CountUp({ to, duration = 1.8, className = '', suffix = '', decimals = 0 }) {
  const ref = useRef(null)
  const seen = useInView(ref)
  useEffect(() => {
    if (!seen) return
    const o = { v: 0 }
    const fmt = (v) =>
      v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    if (reduce()) {
      ref.current.textContent = fmt(to) + suffix
      return
    }
    const t = gsap.to(o, {
      v: to,
      duration,
      ease: 'power2.out',
      onUpdate: () => ref.current && (ref.current.textContent = fmt(o.v) + suffix),
    })
    return () => t.kill()
  }, [seen, to, duration, suffix, decimals])
  return (
    <span ref={ref} className={className}>
      {(0).toFixed(decimals)}
      {suffix}
    </span>
  )
}

export function BlurText({ text, className = '', as: Tag = 'h2', delay = 0.04 }) {
  const ref = useRef(null)
  const seen = useInView(ref)
  useEffect(() => {
    if (!seen || reduce()) return
    const chars = ref.current.querySelectorAll('.bt-c')
    const t = gsap.fromTo(
      chars,
      { opacity: 0, y: 18, filter: 'blur(10px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.7, stagger: delay, ease: 'power3.out' }
    )
    return () => t.kill()
  }, [seen, delay])
  return (
    <Tag ref={ref} className={className} aria-label={text}>
      {[...text].map((c, i) => (
        <span key={i} className="bt-c" style={{ display: 'inline-block', whiteSpace: 'pre', opacity: reduce() ? 1 : 0 }}>
          {c}
        </span>
      ))}
    </Tag>
  )
}

export function ShinyText({ children, className = '' }) {
  return <span className={`shiny ${className}`}>{children}</span>
}

export function StarBorder({ children, className = '', color = '#FF8FB1' }) {
  return (
    <div className={`star-border ${className}`} style={{ '--sb': color }}>
      <div className="star-border-inner">{children}</div>
    </div>
  )
}

export function Magnet({ children, strength = 0.35 }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el || !window.matchMedia('(hover: hover)').matches) return
    const move = (e) => {
      const r = el.getBoundingClientRect()
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      if (Math.hypot(dx, dy) < Math.max(r.width, r.height)) {
        gsap.to(el, { x: dx * strength, y: dy * strength, duration: 0.3 })
      } else gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1,0.4)' })
    }
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [strength])
  return (
    <div ref={ref} style={{ display: 'inline-block' }}>
      {children}
    </div>
  )
}

export function ClickSpark({ children, className = '', style }) {
  const ref = useRef(null)
  const onDown = (e) => {
    if (reduce()) return
    const host = ref.current
    const r = host.getBoundingClientRect()
    for (let i = 0; i < 6; i++) {
      const s = document.createElement('span')
      s.textContent = ['♥', '♡', '✦'][i % 3]
      s.className = 'spark'
      s.style.left = e.clientX - r.left + 'px'
      s.style.top = e.clientY - r.top + 'px'
      host.appendChild(s)
      const a = (Math.PI * 2 * i) / 6 + Math.random() * 0.6
      gsap.to(s, {
        x: Math.cos(a) * 46,
        y: Math.sin(a) * 46 - 14,
        opacity: 0,
        scale: 1.4,
        duration: 0.75,
        ease: 'power2.out',
        onComplete: () => s.remove(),
      })
    }
  }
  return (
    <div ref={ref} className={className} style={{ position: 'relative', ...style }} onPointerDown={onDown}>
      {children}
    </div>
  )
}

export function BounceCards({ children, className = '' }) {
  const ref = useRef(null)
  const seen = useInView(ref)
  const items = Children.toArray(children)
  const rots = [-9, 6, -3, 8, -6]
  const xs = [-170, -85, 0, 85, 170]
  useEffect(() => {
    if (!seen) return
    const cards = ref.current.querySelectorAll('.bc-card')
    const narrow = window.innerWidth < 600
    const k = narrow ? 0.55 : 1
    gsap.fromTo(
      cards,
      { y: 220, opacity: 0, rotate: 0, x: 0 },
      {
        y: (i) => (i % 2 ? 14 : 0),
        x: (i) => xs[i % 5] * k,
        rotate: (i) => rots[i % 5],
        opacity: 1,
        duration: 0.9,
        stagger: 0.09,
        ease: 'back.out(1.6)',
      }
    )
  }, [seen])
  return (
    <div ref={ref} className={`bounce-cards ${className}`}>
      {items.map((c, i) => (
        <div className="bc-card" key={i} style={{ opacity: reduce() ? 1 : 0 }}>
          {c}
        </div>
      ))}
    </div>
  )
}

// 可拖拽叠放卡片：拖动顶牌超过阈值则送到底部
// 仿 React Bits「Stack」：拖着会跟手倾斜，甩出去的卡片弹簧般回到最底下，后面的卡片错落叠着
export function CardStack({ cards, className = '' }) {
  const root = useRef(null)
  const refs = useRef([])
  const order = useRef(cards.map((_, i) => i))
  const busy = useRef(false)
  const drag = useRef(null)
  // 每张卡一个固定的小歪角度，看起来像随手叠起来的照片
  const tilt = useRef(cards.map((_, i) => [-7, 6, -4, 8, -6, 5, -8, 3][i % 8]))
  const layout = (instant) => {
    order.current.forEach((idx, depth) => {
      const el = refs.current[idx]
      if (!el) return
      const d = Math.min(depth, 4)
      const v = {
        x: d * 9 * (depth % 2 ? 1 : -1),
        y: d * 14,
        rotate: depth === 0 ? 0 : tilt.current[idx],
        rotateX: 0,
        rotateY: 0,
        scale: 1 - d * 0.045,
        zIndex: 20 - depth,
        opacity: depth > 4 ? 0 : 1,
      }
      if (instant) gsap.set(el, v)
      else gsap.to(el, { ...v, duration: 0.9, ease: 'elastic.out(1,0.62)', overwrite: 'auto' })
    })
  }
  useEffect(() => {
    gsap.set(refs.current, { transformPerspective: 700 })
    layout(true)
  }, [])
  const send = (dx = 1, dy = 0) => {
    if (busy.current) return
    busy.current = true
    const top = order.current[0]
    const el = refs.current[top]
    const len = Math.hypot(dx, dy) || 1
    const dist = Math.min(root.current.offsetWidth * 0.62, 240)
    gsap.to(el, {
      x: (dx / len) * dist,
      y: (dy / len) * dist * 0.5 - 20,
      rotate: (dx >= 0 ? 1 : -1) * 16,
      rotateX: 0,
      rotateY: 0,
      duration: 0.28,
      ease: 'power2.out',
      overwrite: 'auto',
      onComplete: () => {
        order.current = [...order.current.slice(1), top]
        gsap.set(el, { zIndex: 1 })
        layout()
        busy.current = false
      },
    })
  }
  const down = (e) => {
    if (busy.current || e.button > 0) return
    const el = refs.current[order.current[0]]
    if (e.currentTarget !== el) return
    drag.current = { x: e.clientX, y: e.clientY, t: performance.now(), vx: 0, vy: 0, lx: e.clientX, ly: e.clientY, moved: false }
    el.setPointerCapture(e.pointerId)
    gsap.to(el, { scale: 1.03, duration: 0.2, overwrite: 'auto' })
  }
  const move = (e) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.x, dy = e.clientY - d.y
    if (Math.hypot(dx, dy) > 6) d.moved = true
    const now = performance.now(), dt = Math.max(16, now - d.t)
    d.vx = (e.clientX - d.lx) / dt; d.vy = (e.clientY - d.ly) / dt
    d.lx = e.clientX; d.ly = e.clientY; d.t = now
    const w = root.current.offsetWidth
    gsap.to(refs.current[order.current[0]], {
      x: dx, y: dy * 0.6,
      rotate: dx / 16,
      rotateY: gsap.utils.clamp(-22, 22, (dx / w) * 40),
      rotateX: gsap.utils.clamp(-18, 18, (-dy / w) * 36),
      duration: 0.25, ease: 'power3.out', overwrite: 'auto',
    })
  }
  const up = () => {
    const d = drag.current
    if (!d) return
    drag.current = null
    const el = refs.current[order.current[0]]
    const m = gsap.getProperty(el, 'x'), n = gsap.getProperty(el, 'y')
    const fast = Math.hypot(d.vx, d.vy) > 0.6
    if (!d.moved) return send(1, 0) // 轻点一下 = 翻到下一张
    if (Math.abs(m) > 70 || Math.abs(n) > 90 || fast) send(m || d.vx, n || d.vy)
    else layout()
  }
  return (
    <div className={`card-stack ${className}`} ref={root}>
      {cards.map((c, idx) => (
        <div
          key={idx}
          ref={(el) => (refs.current[idx] = el)}
          className="cs-card"
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={() => { drag.current = null; layout() }}
        >
          {c}
        </div>
      ))}
      <button className="cs-next" onClick={() => send(1, 0)} aria-label="下一张">
        下一张 →
      </button>
    </div>
  )
}
