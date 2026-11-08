import { useEffect, useRef, useState, useMemo } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { CountUp, BlurText } from './bits.jsx'
import { Stamp, ChapterHead } from './ui.jsx'
import { api } from './api.js'

const COLORS = ['#FF8FB1', '#FFB59A', '#7FD6BD', '#FFC26B', '#B79CFF', '#6FB7FF']

function useSeen(ref) {
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setSeen(true), io.disconnect()), { threshold: 0.35 })
    io.observe(el)
    return () => io.disconnect()
  }, [ref])
  return seen
}

function Card({ title, sub, children, wide }) {
  const ref = useRef(null)
  const seen = useSeen(ref)
  return (
    <article ref={ref} className={`stat-card sticker ${seen ? 'go' : ''} ${wide ? 'wide' : ''}`}>
      <h3>{title}</h3>
      {sub && <p className="stat-sub">{sub}</p>}
      {children}
    </article>
  )
}

/* ---------- 词云：气泡云（圆形碰撞，确定性摆放） ---------- */
function Cloud({ words, go }) {
  const ref = useRef(null)
  const items = useMemo(() => {
    const W = 600, H = 440, cx = W / 2, cy = H / 2
    const max = words[0].n
    const placed = []
    words.forEach((w, idx) => {
      const r = 26 + Math.sqrt(w.n / max) * 92 * (idx === 0 ? 1 : 0.78)
      for (let t = 0; t < 4000; t++) {
        const ang = t * 0.35, rho = t * 0.12
        const x = cx + Math.cos(ang) * rho * 1.25, y = cy + Math.sin(ang) * rho * 0.9
        if (x - r < 4 || x + r > W - 4 || y - r < 4 || y + r > H - 4) continue
        if (placed.every((p) => Math.hypot(p.x - x, p.y - y) > p.r + r + 3)) {
          placed.push({ ...w, x, y, r, c: COLORS[idx % COLORS.length] })
          return
        }
      }
    })
    return placed
  }, [words])
  const [pick, setPick] = useState(null)
  useEffect(() => {
    if (!go) return
    const nodes = ref.current.querySelectorAll('.cb')
    // 三批弹出：中心大词 → 中圈 → 外圈
    const tl = gsap.timeline()
    const n = nodes.length
    ;[[0, Math.ceil(n * 0.15)], [Math.ceil(n * 0.15), Math.ceil(n * 0.55)], [Math.ceil(n * 0.55), n]].forEach(([a, b], i) => {
      tl.fromTo([...nodes].slice(a, b), { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.5, stagger: 0.04, ease: 'back.out(2)' }, i * 0.45)
    })
    return () => tl.kill()
  }, [go])
  return (
    <div className="cloud">
      <svg ref={ref} viewBox="0 0 600 440" role="img" aria-label="词云">
        {items.map((p, i) => {
          const fs = Math.min(p.r * 0.72, (p.r * 1.7) / Math.max(2, p.w.length * 0.92))
          return (
            <g key={p.w} className="cb" style={{ transform: go ? undefined : 'scale(0)', transformOrigin: `${p.x}px ${p.y}px`, cursor: 'pointer' }} onClick={() => setPick(p)}>
              <circle cx={p.x} cy={p.y} r={p.r} fill={p.c} fillOpacity=".9" stroke="#5A2B3C" strokeWidth="2.5" />
              <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fontSize={fs} fill="#fff" stroke="#5A2B3C" strokeWidth={fs * 0.12} paintOrder="stroke" fontFamily="ZCOOL KuaiLe, sans-serif">{p.w}</text>
            </g>
          )
        })}
      </svg>
      <p className="tiny">{pick ? <><b>“{pick.w}”</b> 出现了 {pick.n.toLocaleString()} 次</> : '戳一个泡泡，看看我们说了它多少次'}</p>
    </div>
  )
}

/* ---------- 热力图 ---------- */
function Heat({ days }) {
  const start = Date.UTC(2026, 5, 8) // 6.8 周一
  const cols = 16
  const vals = Object.values(days)
  const max = Math.max(...vals)
  const lvl = (v) => (v === undefined ? 0 : v < max * 0.25 ? 1 : v < max * 0.5 ? 2 : v < max * 0.75 ? 3 : 4)
  const cells = []
  for (let c = 0; c < cols; c++)
    for (let r = 0; r < 7; r++) {
      const d = new Date(start + (c * 7 + r) * 86400000)
      const key = d.toISOString().slice(0, 10)
      const v = days[key]
      cells.push(<i key={key} className={`h l${lvl(v)} ${v === max ? 'peak' : ''}`} style={{ gridColumn: c + 1, gridRow: r + 1 }} title={`${key}: ${v ?? 0}`} />)
    }
  return (
    <div className="heat-wrap">
      <div className="heat">{cells}</div>
      <p className="tiny">颜色越深，那天我们越黏人。最深的一格是 <b>7.13</b>，那天说了差不多 2,000 条呢。</p>
    </div>
  )
}

function Hours({ hour }) {
  const max = Math.max(...hour)
  return (
    <div className="hours-wrap">
      <div className="hours">
        {hour.map((v, i) => (
          <div key={i} className="hcol">
            <i style={{ '--h': `${Math.max(3, (v / max) * 100)}%`, background: i === 23 || i === 22 ? '#FF8FB1' : '#FFC4B0' }} />
          </div>
        ))}
      </div>
      <div className="hours-axis">
        {hour.map((_, i) => <span key={i}>{i % 6 === 0 || i === 23 ? i : ''}</span>)}
      </div>
    </div>
  )
}

export default function Stats() {
  const ref = useRef(null)
  const [s, setS] = useState(null)
  useEffect(() => {
    api('/api/story/stats').then((d) => d && setS(d)).catch(() => {})
  }, [])
  useGSAP(() => {
    if (!s) return
    const mm = gsap.matchMedia()
    mm.add('(min-width: 900px)', () => {
      const track = ref.current.querySelector('.stats-track')
      const tl = gsap.timeline({ scrollTrigger: { trigger: ref.current, start: 'top top', end: 'bottom bottom', scrub: 0.7, invalidateOnRefresh: true } })
      tl.to(track, { x: () => -(track.scrollWidth - window.innerWidth + 80), ease: 'none' })
    })
    return () => mm.revert()
  }, { scope: ref, dependencies: [s] })
  if (!s) return <section className="sec theme-yellow" id="c-stats" data-node="11" />
  const c = s.chatlab
  const pct = Math.round((c.initXIAO / c.dialogs) * 100)
  const C = 2 * Math.PI * 52
  const trend = c.trend.map((v, i) => `${20 + i * 53},${85 - v * 0.9}`).join(' ')
  const mon = Object.entries(s.month)
  const monMax = Math.max(...mon.map(([, v]) => v))
  const k = s.kinds
  return (
    <section className="tall theme-stats stats" id="c-stats" data-node="11" ref={ref}>
      <div className="sticky-in statsin">
        <div className="stats-head">
          <ChapterHead date="数据小屋" title="宝宝，我们说了好多好多话呀" sub="记录范围：6.12 → 9.29" />
        </div>
        <div className="stats-track">
          <Card title="一共">
            <div className="bignum"><CountUp to={s.total} /></div>
            <p className="stat-sub">条消息，从夏天一直说到秋天</p>
            <div className="mini-row">
              <div><b><CountUp to={s.activeDays} /></b><small>天都在聊天（一共 110 天）</small></div>
              <div><b><CountUp to={c.streak} /></b><small>天一天都没断过哦</small></div>
              <div><b>98%</b><small>活跃率</small></div>
            </div>
            <div className="vs"><span style={{ flex: s.per.XIAO }}>XIAO {s.per.XIAO.toLocaleString()}</span><span className="y" style={{ flex: s.per['英英'] }}>英英 {s.per['英英'].toLocaleString()}</span></div>
            <p className="tiny">只差 1,368 条，我们俩一样是小话痨～</p>
          </Card>
          <Card title="说得最多的词" wide><GoCloud words={s.words} /></Card>
          <Card title="什么时候在说话" wide>
            <Heat days={s.days} />
            <Hours hour={s.hour} />
            <p className="tiny">最舍不得说晚安的是晚上 11 点（{s.hour[23].toLocaleString()} 条），深夜聊天 {c.late.toLocaleString()} 条，占 8%。凌晨 3 点也还有 {s.hour[3]} 条。</p>
          </Card>
          <Card title={`一共 ${c.dialogs} 次对话`} sub="来自聊天分析">
            <div className="ring-row">
              <svg viewBox="0 0 130 130" className="ring"><circle cx="65" cy="65" r="52" fill="none" stroke="#FFE1EA" strokeWidth="18" /><circle cx="65" cy="65" r="52" fill="none" stroke="#FF8FB1" strokeWidth="18" strokeDasharray={C} className="ring-fill" style={{ '--off': C * (1 - pct / 100) }} transform="rotate(-90 65 65)" /><text x="65" y="62" textAnchor="middle" fontFamily="Fredoka" fontWeight="700" fontSize="26" fill="#5A2B3C">{pct}%</text><text x="65" y="82" textAnchor="middle" fontSize="11" fill="#5A2B3C">XIAO 先开口</text></svg>
              <svg viewBox="0 0 180 100" className="trend"><line x1="10" x2="170" y1="40" y2="40" stroke="#5A2B3C" strokeOpacity=".25" strokeDasharray="4 4" /><polyline className="trend-line" points={trend} fill="none" stroke="#6FB7FF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" pathLength="1" />{['6月', '7月', '8月', '9月'].map((m, i) => <text key={m} x={20 + i * 53} y="98" fontSize="9" textAnchor="middle" fill="#5A2B3C">{m}</text>)}</svg>
            </div>
            <table className="duo"><tbody>
              <tr><td></td><th>XIAO</th><th>英英</th></tr>
              <tr><td>谁先开口</td><td>{c.initXIAO} 次</td><td>{c.initYY} 次</td></tr>
              <tr><td>最后一句留给谁</td><td>{c.endXIAO} 次</td><td>{c.endYY} 次</td></tr>
              <tr><td>多久回你</td><td>{c.replyXIAO}</td><td>{c.replyYY}</td></tr>
              <tr><td>再戳你一下</td><td>{c.pokeXIAO.toLocaleString()} 次</td><td>{c.pokeYY} 次</td></tr>
              <tr><td>先低头的人</td><td>{c.iceXIAO} 次</td><td>{c.iceYY} 次</td></tr>
            </tbody></table>
            <p className="tiny">“先低头”是说好久没说话之后，谁先来找对方。1 : 1，扯平啦。</p>
          </Card>
          <Card title="聊天足迹" wide>
            <ol className="miles">
              <li><b>6.12</b>记录里的第一条消息</li>
              <li><b>6.16–6.18</b>最久没说话的一次，{c.longestSilence.dur}。那时候还不太熟，后来就再也没有过啦</li>
              <li><b>7 月</b>最热闹的月份，{s.month['07'].toLocaleString()} 条</li>
              <li><b>8.5</b>最长的一次畅聊，{c.longestChat.dur}，{c.longestChat.n.toLocaleString()} 条</li>
              <li><b>9.29</b>记到这里，但还没说完哦</li>
            </ol>
            <div className="months">
              {mon.map(([m, v]) => <div key={m}><i style={{ '--h': `${(v / monMax) * 100}%` }} /><span>{+m} 月</span></div>)}
            </div>
            <div className="kinds">
              <span>图片 <b>{k.image.toLocaleString()}</b></span><span>视频 <b>{k.video}</b></span><span>语音通话 <b>{k.voicecall}</b> 次</span><span>视频通话 <b>{k.videocall}</b> 次</span><span>语音转文字 <b>{k.voice}</b></span><span>位置 <b>{k.location}</b></span><span>表情 <b>约 {Math.round(k.sticker / 1000) / 10} 万</b></span>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}

// Card 的 go 状态要传进 Cloud，这里用 DOM 上的 .go 类判断
function GoCloud({ words }) {
  const ref = useRef(null)
  const [go, setGo] = useState(false)
  useEffect(() => {
    const card = ref.current.closest('.stat-card')
    const mo = new MutationObserver(() => card.classList.contains('go') && setGo(true))
    mo.observe(card, { attributes: true })
    if (card.classList.contains('go')) setGo(true)
    return () => mo.disconnect()
  }, [])
  return <div ref={ref}><Cloud words={words} go={go} /></div>
}
