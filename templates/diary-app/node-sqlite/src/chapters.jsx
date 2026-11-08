import { Doodle, Arrow } from './icons.jsx'
import { useRef, useEffect, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { useGSAP } from '@gsap/react'
import { BlurText, CountUp, Magnet, StarBorder, ShinyText, BounceCards, CardStack, ClickSpark } from './bits.jsx'
import boyImg from './hg-boy.webp'
import girlImg from './hg-girl.webp'
import { Photo, Bubble, Stamp, ChapterHead, Gallery, daysSince, MET, LOVE, BAI, today, utc } from './ui.jsx'
import { RAIL, NOTES, HENG, ROAD, CATS, CAT_DAYS, LETTER } from './content.js'
import { Kitty, Voice, Bow, duck } from './cute.jsx'
import { api } from './api.js'
import { useNavigate } from 'react-router-dom'
import { AUTHORS, fmtDate, moodOf, thisYear } from './pages/common.jsx'
import { openViewer } from './ui.jsx'

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin)

const Wave = ({ from }) => (
  <svg className="wave" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden>
    <path d="M0 0H1440V30C1320 60 1200 6 1080 26S840 62 720 36 480 4 360 26 120 58 0 30Z" fill={from} />
  </svg>
)

// 通用：随整段滚动进度驱动的时间线
const scrubTl = (trigger, extra = {}) =>
  gsap.timeline({ scrollTrigger: { trigger, start: 'top top', end: 'bottom bottom', scrub: 0.6, ...extra } })
const reveal = (el, vars = {}) =>
  gsap.from(el, { opacity: 0, y: 40, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 85%' }, ...vars })

/* ============ 屏 1 封面 ============ */
export function Cover() {
  const ref = useRef(null)
  useGSAP(() => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: ref.current, start: 'top top', end: 'bottom top', scrub: 0.5 } })
    tl.to('.cover-photo', { scale: 0.86, y: -30 }, 0).to('.cover-top', { opacity: 0, y: -30 }, 0)
  }, { scope: ref })
  return (
    <section className="sec cover theme-pink" id="cover" ref={ref}>
      <div className="cover-top">
        <Stamp>2026 · 从夏天到秋天</Stamp>
        <h1 className="cover-title">XIAO <span>&amp;</span> 英英</h1>
      </div>
      <div className="cover-photo">
        <Kitty size={96} className="cover-kitty" />
        <Bow size={46} className="cover-bow" color="#FFC4D6" />
        <ClickSpark>
          <Photo id="cover" ratio="4 / 5" hint="封面照片" tilt={-2} className="lg" />
        </ClickSpark>
      </div>
      <div className="cover-days">
        <div><small>我们在一起</small><span className="big-row"><CountUp to={daysSince(LOVE)} className="big" /><em>天啦</em></span></div>
        <div><small>认识宝宝</small><span className="big-row"><CountUp to={daysSince(MET)} className="big" /><em>天啦</em></span></div>
      </div>
      <Magnet>
        <button className="btn" onClick={() => document.getElementById('c-meet')?.scrollIntoView({ behavior: 'smooth' })}>宝宝，往下看看我们的故事 ↓</button>
      </Magnet>
    </section>
  )
}

/* ============ 屏 2 相识 ============ */
export function Meet() {
  const ref = useRef(null)
  useGSAP(() => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: ref.current, start: 'top 55%', end: 'bottom 75%', scrub: 0.6 } })
    tl.from('.b1', { x: -120, opacity: 0, duration: 1 }).from('.b2', { x: 120, opacity: 0, duration: 1 }, '+=0.3').from('.meet-note', { opacity: 0, y: 20 }, '+=0.2')
  }, { scope: ref })
  return (
    <section className="sec theme-pink meet" id="c-meet" data-node="0" ref={ref}>
      <ChapterHead date="6.12 · 那天加上了你" title="我是英英." />
      <div className="stage-col">
        <div className="b1"><Bubble who="英英" text="我是英英." /></div>
        <div className="b2"><Bubble who="XIAO" text="英英你好 我叫肖肖" /></div>
      </div>
      <p className="meet-note">这就是我们说的第一句话呀。那时候的我还不知道，这个说「我是英英」的小朋友，后来会变成我的宝宝。</p>
    </section>
  )
}

/* ============ 屏 3 约定与电话 ============ */
export function Call() {
  const ref = useRef(null)
  useGSAP(() => {
    gsap.from('.pr .bubble', { opacity: 0, y: 30, scale: 0.9, stagger: 0.25, duration: 0.6, ease: 'back.out(1.6)', scrollTrigger: { trigger: '.pr', start: 'top 80%' } })
    const bars = gsap.utils.toArray('.wave-bars i')
    gsap.from(bars, { scaleY: 0, transformOrigin: '50% 50%', stagger: 0.02, ease: 'none', scrollTrigger: { trigger: '.call-card', start: 'top 80%', end: 'top 35%', scrub: true } })
  }, { scope: ref })
  const heights = Array.from({ length: 34 }, (_, i) => 20 + Math.abs(Math.sin(i * 0.9) * 60) + (i % 5) * 4)
  return (
    <section className="sec theme-pink call" id="c-call" data-node="1" ref={ref}>
      <ChapterHead date="6.23 → 6.26" title="偷偷拉了钩，还打了第一通电话" />
      <div className="pr stage-col">
        <Bubble who="XIAO" text="要在一起吗" />
        <Bubble who="英英" text="好啊" />
        <Bubble who="XIAO" text="一言为定" />
        <p className="tiny">这是我们悄悄的小约定哦，真正的纪念日，要等到 6.30 才来。</p>
      </div>
      <div className="call-card sticker">
        <Stamp>6.26 · 晚上</Stamp>
        <div className="wave-bars">{heights.map((h, i) => <i key={i} style={{ height: h + '%' }} />)}</div>
        <div className="call-time">第一次语音通话 <b>2:10</b></div>
      </div>
      <Voice id="voice-1" />
    </section>
  )
}

/* ============ 屏 4 初见（一屏一张图 + 字幕） ============ */
export function First() {
  const ref = useRef(null)
  useGSAP(() => {
    const caps = gsap.utils.toArray('.cap')
    const tl = scrubTl(ref.current)
    tl.to('.first-photo .photo-frame > img, .first-photo .photo-frame > .ph', { scale: 1.06, duration: caps.length * 2, ease: 'none' }, 0)
    caps.forEach((c, i) => {
      tl.fromTo(c, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5 }, i * 2 + 0.2)
      if (i < caps.length - 1) tl.to(c, { opacity: 0, y: -20, duration: 0.5 }, i * 2 + 1.7)
    })
  }, { scope: ref })
  return (
    <section className="tall theme-pink" id="c-first" data-node="2" ref={ref} style={{ height: '320svh' }}>
      <div className="sticky-in first">
        <div className="first-photo"><Photo id="first" ratio="auto" hint="6.27 壹方城 · 第一次见面" tape={false} className="full" /></div>
        <div className="first-head"><Stamp>6.27 · 深圳宝安壹方城</Stamp><h2 className="ch-title white">第一次见到你呀</h2></div>
        <div className="caps">
          <div className="cap"><b>12:45</b>「我看到你了」<br />人那么多，还是一眼就找到你啦</div>
          <div className="cap"><b>见面前</b>我说「还没这么约过会呢」，你说「我都害怕」<br />小胆小鬼，其实我也好紧张</div>
          <div className="cap"><b>16:00</b>「我回家咯」<br />走了没几步，还是忍不住问你：「还会再见吗 英子」</div>
        </div>
      </div>
    </section>
  )
}

/* ============ 屏 5 在一起（心形擦除） ============ */
export function Love() {
  const ref = useRef(null)
  useGSAP(() => {
    const tl = scrubTl(ref.current)
    tl.fromTo('.heart-wipe', { scale: 0.05 }, { scale: 42, ease: 'power1.in', duration: 3 }, 0)
      .from('.love-in', { opacity: 0, y: 30, duration: 1 }, 0.6)
  }, { scope: ref })
  return (
    <section className="tall theme-pink love" id="c-love" data-node="3" ref={ref} style={{ height: '240svh' }}>
      <div className="sticky-in love-stage">
        <div className="heart-wipe" />
        <div className="love-in">
          <Stamp>第 0 天</Stamp>
          <BlurText text="6.30 · 我们在一起啦" className="love-title" />
          <ClickSpark>
            <Gallery className="love-gal" hint="左右滑一滑还有哦，点一下照片会冒爱心～" items={[
              { id: 'love-1', hint: '6.30 的照片 1' },
              { id: 'love-2', hint: '6.30 的照片 2' },
            ]} />
          </ClickSpark>
          <Bubble who="XIAO" text="我们在上半年的最后一天在一起啦" />
        </div>
      </div>
    </section>
  )
}

/* ============ 屏 6 生日与爱你 ============ */
export function Birthday() {
  const ref = useRef(null)
  useGSAP(() => {
    reveal('.bd-1')
    const tl = gsap.timeline({ scrollTrigger: { trigger: '.love-pair', start: 'top 75%' } })
    tl.from('.lp-a', { x: -140, opacity: 0, duration: 0.7 }).from('.lp-b', { x: 140, opacity: 0, duration: 0.7 }, 0).from('.lp-heart', { scale: 0, rotate: -40, duration: 0.6, ease: 'back.out(2.4)' }, 0.55)
  }, { scope: ref })
  return (
    <section className="sec theme-peach" id="c-bday" data-node="4" ref={ref}>
      <ChapterHead date="7.5 · 7.6" title="28 岁这年，最好的礼物是你说爱我" />
      <div className="bd-1 stage-col">
        <Stamp>7.5 零点刚过</Stamp>
        <Bubble who="英英" text="肖肖生日快乐" />
        <Bubble who="XIAO" text="28 岁了，又要喜欢你一岁" />
        <Photo id="bday" ratio="1 / 1" hint="生日礼物 / 生日那天" tilt={-3} className="sm" />
      </div>
      <div className="love-pair">
        <Stamp>7.6 · 我们都说了爱你</Stamp>
        <div className="lp-row">
          <div className="lp-a"><Bubble who="英英" text="爱你哟～" /></div>
          <span className="lp-heart">♥</span>
          <div className="lp-b"><Bubble who="XIAO" text="爱你" /></div>
        </div>
      </div>
      <Kitty size={84} className="side-kitty r" />
    </section>
  )
}

/* ============ 7.11 车里的情书 ============ */
const DAY711 = [1, 2, 3].map((n) => ({ id: `day711-${n}`, hint: `7.11 的照片 ${n}` }))
export function Letter() {
  const ref = useRef(null)
  useGSAP(() => {
    reveal('.lt-radio')
    gsap.utils.toArray('.lt-p', ref.current).forEach((el) => {
      gsap.fromTo(el, { opacity: 0, y: 16, filter: 'blur(4px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', ease: 'none', scrollTrigger: { trigger: el, start: 'top 88%', end: 'top 64%', scrub: 0.5 } })
    })
    gsap.fromTo('.lt-mark', { backgroundSize: '0% 42%' }, { backgroundSize: '100% 42%', ease: 'none', scrollTrigger: { trigger: '.lt-mark', start: 'top 72%', end: 'top 52%', scrub: 0.5 } })
    const rt = gsap.timeline({ scrollTrigger: { trigger: '.rings', start: 'top 78%' } })
    rt.from('.ring-a', { x: -70, rotate: -90, opacity: 0, duration: 0.8, ease: 'back.out(1.6)' })
      .from('.ring-b', { x: 70, rotate: 90, opacity: 0, duration: 0.8, ease: 'back.out(1.6)' }, 0)
      .from('.ring-spark', { scale: 0, opacity: 0, transformOrigin: '50% 50%', duration: 0.4, stagger: 0.08, ease: 'back.out(3)' }, 0.7)
    reveal('.tokens')
  }, { scope: ref })
  return (
    <section className="sec theme-pink letter-sec" id="c-letter" data-node="5" ref={ref}>
      <ChapterHead date="7.11" title="在车里，给宝宝的正式表白" sub="我一笔一划，亲手给宝宝写了一封情书。抱着鲜花，在车里一句一句念给你听。" />
      <div className="lt-radio"><i className="lt-note">♪</i>车里放着沈以诚的歌<small><s>《狂恋你》</s> 没版权了，可恶</small></div>
      <article className="letter" data-slow="0.45">
        <Bow size={46} className="letter-bow" />
        {LETTER.map((p, i) => (
          <p key={i} className={`lt-p ${p.k ? 'lt-' + p.k : ''}${p.k === 'mark' ? ' lt-mark-p' : ''}`} style={{ '--r': `${((i * 37) % 7 - 3) * 0.25}deg` }}>
            {p.k === 'mark' ? <span className="lt-mark">{p.t}</span> : p.t}
          </p>
        ))}
        <p className="lt-p lt-sign">—— 肖肖　7.11</p>
      </article>
      <Photo id="letter" ratio="4 / 3" hint="那封手写的情书" tilt={2} className="sm" />
      <div className="rings">
        <Stamp>从这天起，我们有情侣信物啦</Stamp>
        <svg viewBox="0 0 200 110" width="200" height="110" aria-hidden>
          <g className="ring-a"><circle cx="80" cy="62" r="30" fill="none" stroke="#5A2B3C" strokeWidth="13" /><circle cx="80" cy="62" r="30" fill="none" stroke="#FFD27A" strokeWidth="7" /><path d="M58 46 A28 28 0 0 1 74 34" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" /></g>
          <g className="ring-b"><circle cx="120" cy="62" r="30" fill="none" stroke="#5A2B3C" strokeWidth="13" /><circle cx="120" cy="62" r="30" fill="none" stroke="#FFB6CC" strokeWidth="7" /><path d="M98 46 A28 28 0 0 1 114 34" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" /><path d="M100 30 L106 22 L114 22 L120 30 L110 38 Z" fill="#E9F4FF" stroke="#5A2B3C" strokeWidth="2.4" strokeLinejoin="round" /></g>
          <path className="ring-spark" d="M40 22 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3 Z" fill="#FF8FB1" stroke="#5A2B3C" strokeWidth="1.6" />
          <path className="ring-spark" d="M166 18 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2 Z" fill="#FFE9A3" stroke="#5A2B3C" strokeWidth="1.6" />
          <path className="ring-spark" d="M160 92 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 Z" fill="#B79BFF" stroke="#5A2B3C" strokeWidth="1.4" />
        </svg>
      </div>
      <div className="tokens">
        {DAY711.map((t, i) => (
          <div key={t.id} className="token">
            <Photo id={t.id} ratio="3 / 4" hint={t.hint} tape={false} tilt={[-3, 2, -1][i]} className="tk" group={DAY711} title="7.11 · 那天晚上" />
          </div>
        ))}
      </div>
      <div className="bubble-col"><Bubble who="XIAO" text="宝宝，那天念给你的每一句，到现在也一个字都没变哦。" /></div>
    </section>
  )
}

/* ============ 屏 7 第一个月（竖向逐张贴上） ============ */
const MONTH = [
  { id: 'month-1', hint: '送你的鲜花', ratio: '3 / 4' },
  { id: 'month-2', hint: '送你的蛋糕', ratio: '4 / 3' },
  { id: 'month-3', hint: '送你的耳环', ratio: '3 / 4', focus: '50% 50%' },
  { id: 'month-4', hint: '你送我的键盘', ratio: '16 / 10', focus: '50% 50%' },
]
export function Month() {
  const ref = useRef(null)
  useGSAP(() => {
    gsap.utils.toArray('.drop').forEach((el, i) => {
      gsap.fromTo(el, { y: -80, opacity: 0, rotate: i % 2 ? 8 : -8 }, { y: 0, opacity: 1, rotate: i % 2 ? 2.5 : -2.5, ease: 'back.out(1.4)', scrollTrigger: { trigger: el, start: 'top 92%', end: 'top 60%', scrub: 0.6 } })
    })
  }, { scope: ref })
  return (
    <section className="sec theme-peach month" id="c-month" data-node="6" ref={ref}>
      <ChapterHead date="7.30" title="满一个月啦，宝宝" sub="才一个月呀，我就已经想不起没有你的日子，是什么样子了。" />
      <div className="drops">
        {MONTH.map((m, i) => (
          <div key={i} className={`drop ${i % 2 ? 'dr' : 'dl'}`}>
            <Photo id={m.id} ratio={m.ratio} hint={m.hint} focus={m.focus} className="sm" group={MONTH} title="7.30 · 满一个月" />
          </div>
        ))}
      </div>
      <Bubble who="英英" text="键盘是给你敲代码，不管你工作还是游戏都能想起我" />
      <Voice id="voice-2" />
    </section>
  )
}

/* ============ 屏 8 路上的 33 天（横向轨道） ============ */
export function Apart() {
  const ref = useRef(null)
  useGSAP(() => {
    const track = ref.current.querySelector('.rail-track')
    const dist = () => track.scrollWidth - window.innerWidth
    const num = ref.current.querySelector('.rail-count b')
    const tl = gsap.timeline({ scrollTrigger: { trigger: ref.current, start: 'top top', end: 'bottom bottom', scrub: 0.7, invalidateOnRefresh: true,
      onUpdate: (s) => { num.textContent = Math.max(0, Math.round(32 * (1 - Math.min(1, s.progress / 0.95)))) } } })
    tl.to(track, { x: () => -dist(), ease: 'none' })
    gsap.fromTo('.route path', { drawSVG: '0%' }, { drawSVG: '100%', ease: 'none', scrollTrigger: { trigger: ref.current, start: '12% top', end: '30% top', scrub: true } })
    ScrollTrigger.create({ trigger: ref.current, start: '88% bottom', once: true, onEnter: () => gsap.to('.dot-a', { x: 40, duration: 1.2, ease: 'power2.inOut' }) && gsap.to('.dot-b', { x: -40, duration: 1.2, ease: 'power2.inOut' }) })
  }, { scope: ref })
  return (
    <section className="tall theme-sky apart" id="c-apart" data-node="7" ref={ref} style={{ height: '520svh' }}>
      <div className="sticky-in rail">
        <div className="rail-count"><span>还有</span><b>32</b><span>天就见到你</span></div>
        <div className="rail-track">
          <div className="rail-panel intro"><ChapterHead date="8.2 → 9.3" title="想你的 32 天" sub="宝宝往右走走，走着走着就见到啦。" /></div>
          {RAIL.map((p, i) => (
            <div className="rail-panel" key={i}>
              <div className="rp-card sticker">
                <Stamp>{p.k}</Stamp>
                <h3>{p.t}</h3>
                {p.route && (
                  <svg className="route" viewBox="0 0 200 60" aria-hidden>
                    <path d="M8 46 C40 10, 90 58, 120 28 S180 14, 192 18" fill="none" stroke="#5A2B3C" strokeWidth="2.5" strokeDasharray="1 7" strokeLinecap="round" />
                    <text x="2" y="58" fontSize="9" fill="#5A2B3C">深圳</text><text x="150" y="10" fontSize="9" fill="#5A2B3C">宁远</text>
                  </svg>
                )}
                {p.meet && (
                  <div className="meet-dots"><i className="dot-a" /><i className="dot-b" /></div>
                )}
                {p.photos
                  ? <Slides className="rp-photo rp-slides" ratio={p.ratio || '4 / 5'} title={`${p.k} · ${p.t}`} slides={p.photos.map((id, n) => ({ id, hint: `${p.hint} ${n + 1}`, focus: p.focus }))} />
                  : <Photo id={p.photo} ratio={p.ratio || '4 / 5'} hint={p.hint} focus={p.focus} className="rp-photo" title={`${p.k} · ${p.t}`} />}
                {p.lines.map((l, j) => <p key={j} className="rp-line">{l}</p>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ============ 屏 9 第一次陪你回家 ============ */
const HOME = [1, 2, 3, 4, 5, 6, 7].map((n) => ({ id: `home-${n}`, hint: `回湖南的照片 ${n}` }))
export function Home() {
  const ref = useRef(null)
  useGSAP(() => { reveal('.home-1') }, { scope: ref })
  return (
    <section className="sec theme-yellow home" id="c-home" data-node="8" ref={ref}>
      <ChapterHead date="9.11 → 9.13" title="第一次陪你回家" sub="陪你去看住院的奶奶。我在门口徘徊了好久，最后还是鼓起勇气，走了进去。" />
      <div className="home-1 stage-col">
        <Stamp>9.12 · 湖南</Stamp>
        <CardStack cards={HOME.map((h) => <Photo key={h.id} id={h.id} ratio="4 / 5" hint={h.hint} tape={false} group={HOME} title="9.11 → 9.13 · 第一次陪你回家" />)} />
        <p className="tiny gal-hint">一共 {HOME.length} 张，往旁边甩一甩，下一张就出来啦</p>
        <div className="home-firsts">
          <p className="hf-title">这几天，好多个第一次</p>
          <div className="hf-grid">
            {['跑长途', '一起算命', '一起喝酒', '一起过夜'].map((t) => <span key={t}><small>第一次</small>{t}</span>)}
          </div>
          <p className="hf-fate"><b>算命先生说</b>我们大概率是彼此的正缘，<br />明年结婚，还会有小宝宝～</p>
        </div>
      </div>
    </section>
  )
}

/* ============ 屏 9.4 衡山前奏：说走就走的一路 ============ */
export function Roadtrip() {
  const ref = useRef(null)
  useGSAP(() => {
    const root = ref.current
    const line = root.querySelector('.rt-line i')
    const car = root.querySelector('.rt-car')
    gsap.fromTo(line, { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.rt-list', start: 'top 60%', end: 'bottom 60%', scrub: 0.5 } })
    gsap.fromTo(car, { top: '0%' }, { top: '100%', ease: 'none', scrollTrigger: { trigger: '.rt-list', start: 'top 60%', end: 'bottom 60%', scrub: 0.5 } })
    gsap.utils.toArray('.rt-stop', root).forEach((el) => {
      gsap.from(el, { opacity: 0, x: 40, duration: 0.6, ease: 'back.out(1.4)', scrollTrigger: { trigger: el, start: 'top 72%' } })
    })
  }, { scope: ref })
  return (
    <section className="sec road" id="c-heng" data-node="9" ref={ref}>
      <ChapterHead date="9.17 → 9.18" title="说走就走，去衡山" sub="宝宝，我们这一路呀，是边聊边改了好几次方向，才走到衡山的哦。" />
      <div className="rt-list stage-col">
        <div className="rt-line" aria-hidden><i /></div>
        <span className="rt-car" aria-hidden>
          <svg viewBox="0 0 40 28" width="36" height="26"><path d="M5 18 L8 10 Q9 7 12 7 L26 7 Q29 7 31 10 L35 16 Q37 17 37 20 L37 22 L3 22 L3 20 Q3 18 5 18 Z" fill="#FF8FB1" stroke="#5A2B3C" strokeWidth="2.4" strokeLinejoin="round" /><path d="M11 10 L25 10 L29 16 L9 16 Z" fill="#DDF0FF" stroke="#5A2B3C" strokeWidth="1.8" strokeLinejoin="round" /><circle cx="11" cy="22" r="4" fill="#5A2B3C" /><circle cx="29" cy="22" r="4" fill="#5A2B3C" /><circle cx="11" cy="22" r="1.5" fill="#fff" /><circle cx="29" cy="22" r="1.5" fill="#fff" /></svg>
        </span>
        {ROAD.map((r, i) => (
          <div className={`rt-stop ${r.detour ? 'detour' : ''} ${r.end ? 'end' : ''}`} key={i}>
            <i className="rt-dot" />
            <div className="rt-card sticker">
              <div className="rt-top"><Stamp>{r.k}</Stamp><b className="rt-place">{r.place}</b></div>
              <p>{r.t}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ============ 屏 9.5 衡山：横向蜿蜒夜爬 · 沿途照片卡 · 银河 · 流星 ============ */
// 世界坐标 2000×600，按屏幕高度缩放；镜头跟着两个小人横向移动
const HW = 2000, HH = 600
const TRAIL = 'M60 560 C160 540 200 578 300 532 S440 470 520 482 S640 446 700 414 S820 404 880 364 S1000 326 1060 302 S1180 252 1250 232 S1400 282 1480 330 S1620 402 1700 430 S1860 480 1960 500'
const SUMMIT = 0.585 // 山顶在路线上的位置（getTotalLength 比例，下面会重新测量）
const PINS = [
  // 每个点位都是几张照片轮流切换；想加照片就往 slides 里继续写
  { id: 'hengshan-fog', p: 0.3, side: 'up', t: '雾里的山路', k: '18:30 以后',
    slides: [1, 2, 3].map((n) => ({ id: `hengshan-fog-${n}`, hint: `雾里的山路 ${n}` })) },
  { id: 'hengshan-top', p: SUMMIT, side: 'down', t: '到山顶啦', k: '山顶',
    slides: [1, 2].map((n) => ({ id: `hengshan-top-${n}`, hint: `到山顶啦 ${n}`, focus: '42% 50%' })) },
  { id: 'hengshan-sky', p: 0.86, side: 'up', t: '头顶的银河', k: '下山的路',
    slides: [1, 2, 3].map((n) => ({ id: `hengshan-sky-${n}`, hint: `头顶的银河 ${n}`, focus: '50% 50%' })) },
]
const STARS = Array.from({ length: 46 }, (_, i) => {
  const r = (n) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1
  return { x: r(1) * 100, y: r(2) * 55, s: 2 + r(3) * 3.5, tw: i % 6 === 0 }
})

// 两个小人：照着肖肖给的参考图抠出来的贴纸（src/hg-boy.webp / hg-girl.webp），想换表情就替换这两张图
const KID_W = 44
function Girl() {
  return <g className="hg-girl"><image href={girlImg} x={-KID_W / 2} y={-2 - KID_W * 282 / 220} width={KID_W} height={KID_W * 282 / 220} /></g>
}
function Boy() {
  return <g className="hg-boy"><image href={boyImg} x={-KID_W / 2} y={-2 - KID_W * 303 / 220} width={KID_W} height={KID_W * 303 / 220} /></g>
}

const openPin = (p) => openViewer(p.slides
  ? { list: p.slides, index: 0, title: `9.18 · ${p.t}` }
  : { id: p.id, hint: p.t, title: `9.18 · ${p.k} · ${p.t}` })
// 银河那张卡：几张照片自己慢慢切换，点开能左右翻着看
// 多张照片：自己慢慢淡入淡出地切换；给了 title 就带放大镜，点开能左右翻着看
function Slides({ slides, ratio = '4 / 5', title, className = '' }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % slides.length), 2600)
    return () => clearInterval(t)
  }, [slides.length])
  return (
    <div className={`hg-slides ${className}`} data-i={i}>
      {slides.map((sl, k) => (
        <div className={`hg-slide ${k === i ? 'on' : ''}`} key={sl.id}>
          <Photo id={sl.id} ratio={ratio} hint={sl.hint} focus={sl.focus} tape={false} zoom={!!title && k === i} group={slides} title={title} />
        </div>
      ))}
      <span className="hg-dots">{slides.map((_, k) => <i key={k} className={k === i ? 'on' : ''} />)}</span>
    </div>
  )
}

export function Hengshan() {
  const ref = useRef(null)
  useGSAP(() => {
    const root = ref.current
    const path = root.querySelector('#hg-trail')
    const len = path.getTotalLength()
    const world = root.querySelector('.hg-world')
    const far = root.querySelector('.hg-far')
    const walk = root.querySelector('.hg-walk')
    const pins = gsap.utils.toArray('.hg-pin', root)
    // 量出山顶（路线最高点）在路线上的比例
    let sp = 0.5, minY = 1e9
    for (let k = 0; k <= 400; k++) { const y = path.getPointAtLength((k / 400) * len).y; if (y < minY) { minY = y; sp = k / 400 } }
    PINS[1].p = sp
    // 把照片点位放到路线上
    PINS.forEach((pin, i) => {
      const pt = path.getPointAtLength(pin.p * len)
      pins[i].style.left = (pt.x / HW) * 100 + '%'
      pins[i].style.top = (pt.y / HH) * 100 + '%'
    })
    const st = { p: 0 }
    const place = () => {
      const pt = path.getPointAtLength(st.p * len)
      walk.setAttribute('transform', `translate(${pt.x} ${pt.y})`)
      const ww = world.offsetWidth, vw = window.innerWidth
      const cam = Math.max(-(ww - vw), Math.min(0, -((pt.x / HW) * ww - vw * 0.42)))
      gsap.set(world, { x: cam })
      gsap.set(far, { x: cam * 0.3 })
      pins.forEach((el, i) => el.classList.toggle('pop', Math.abs(st.p - PINS[i].p) < 0.05))
    }
    place()
    const caps = gsap.utils.toArray('.hg-cap', root)
    const tl = scrubTl(root, { onRefresh: place })
    const U = 2
    caps.forEach((c, i) => {
      tl.fromTo(c, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.5 }, i * U + 0.2)
      if (i < caps.length - 1) tl.to(c, { opacity: 0, y: -16, duration: 0.5 }, i * U + 1.7)
    })
    // 走路：山脚下先站一会儿（买外套、塞零食），再慢慢爬到山顶，再往下走
    // 碰到照片点位会停一小会儿，让照片卡弹出来
    const P1 = PINS[0].p, P3 = PINS[2].p
    const w = (p, d, at) => tl.to(st, { p, duration: d, ease: 'sine.inOut', onUpdate: place }, at)
    // 下山走到一半停下来抬头：银河 → 流星先划过去，之后才走到银河照片卡那里（卡片不会挡住流星）
    const MID = sp + (P3 - sp) * 0.45
    w(P1, 1.5, 1.4); w(sp, 2.0, 3.6); w(MID, 1.2, 6.2); w(P3, 1.2, 9.0); w(1, 0.8, 10.8)
    // 天色、雾、星星
    tl.to('.hg-night', { opacity: 1, duration: 4.5, ease: 'none' }, 1.2)
      .to('.hg-h1', { attr: { fill: '#5B3D78' }, duration: 4.5, ease: 'none' }, 1.2)
      .to('.hg-h2', { attr: { fill: '#3F2858' }, duration: 4.5, ease: 'none' }, 1.2)
      .to('.hg-far path', { attr: { fill: '#4A3066' }, duration: 4.5, ease: 'none' }, 1.2)
      .to('.hg-fog', { opacity: 0.8, duration: 1, stagger: 0.3 }, 1.6)
      .fromTo('.hg-fog.f1', { xPercent: 0 }, { xPercent: -18, duration: 5, ease: 'none' }, 1.8)
      .fromTo('.hg-fog.f2', { xPercent: -20 }, { xPercent: 0, duration: 5, ease: 'none' }, 1.8)
      .to('.hg-fog', { opacity: 0, duration: 1 }, 5.6)
      .to('.hg-milky', { opacity: 0.85, duration: 1.4 }, 6.2)
      .to('.hg-star', { opacity: 1, duration: 0.6, stagger: { each: 0.02, from: 'random' } }, 6.2)
    // 流星：按真实时间"嗖"地划一下（不跟着滚动拖泥带水）；在"那一秒"字幕出来时划过，这时照片卡还没弹出
    const meteor = root.querySelector('.hg-meteor i')
    const fire = () => {
      const d = Math.min(window.innerWidth * 0.32, 240)
      gsap.timeline({ overwrite: true })
        .fromTo(meteor, { x: 0, y: 0, opacity: 0, scaleX: 0.2 }, { x: -d, opacity: 1, scaleX: 1, duration: 0.5, ease: 'power1.out' })
        .to(meteor, { x: -d * 1.45, opacity: 0, scaleX: 0.3, duration: 0.45, ease: 'power1.in' })
    }
    tl.call(fire, null, 8.0)
      .fromTo('.hg-end', { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.6)' }, 9.4)
      .to({}, { duration: 0.8 }, 11.6)
  }, { scope: ref })
  return (
    <section className="tall heng" id="c-heng-climb" data-node="9" ref={ref} style={{ height: '720svh' }}>
      <div className="sticky-in hg-stage">
        <div className="hg-dusk" />
        <div className="hg-night" />
        <div className="hg-milky" />
        <div className="hg-stars">{STARS.map((s, i) => <i key={i} className={`hg-star ${s.tw ? 'tw' : ''}`} style={{ left: s.x + '%', top: s.y + '%', width: s.s, height: s.s }} />)}</div>
        <div className="hg-meteor"><i /></div>
        <svg className="hg-far" viewBox="0 0 2000 600" preserveAspectRatio="none" aria-hidden>
          <path d="M0 600 L0 420 L180 330 L360 390 L560 280 L780 360 L980 250 L1200 330 L1420 240 L1640 330 L1840 280 L2000 340 L2000 600 Z" fill="#E7C9EE" opacity=".8" />
        </svg>
        <div className="hg-world">
          <svg viewBox={`0 0 ${HW} ${HH}`} aria-hidden>
            <path className="hg-h1" d="M0 600 L0 540 L220 498 L420 432 L600 380 L760 330 L940 282 L1100 240 L1250 186 L1400 246 L1600 326 L1800 396 L2000 436 L2000 600 Z" fill="#C9A6E4" stroke="#5A2B3C" strokeWidth="3" strokeLinejoin="round" />
            <path className="hg-h2" d="M0 600 L0 574 L260 582 L520 566 L820 590 L1100 572 L1400 590 L1700 568 L2000 584 L2000 600 Z" fill="#9D72B8" stroke="#5A2B3C" strokeWidth="3" strokeLinejoin="round" />
            <path id="hg-trail" d={TRAIL} fill="none" stroke="#FFF4F0" strokeWidth="3" strokeDasharray="3 9" strokeLinecap="round" opacity=".9" />
            <g transform="translate(1250 232)">
              <path d="M0 0 V-44" stroke="#5A2B3C" strokeWidth="3" strokeLinecap="round" />
              <path d="M0 -44 L24 -37 L0 -30 Z" fill="#FF8FB1" stroke="#5A2B3C" strokeWidth="2.5" strokeLinejoin="round" />
              <text x="-62" y="-50" fontSize="22" fill="#FFF4F0" stroke="#5A2B3C" strokeWidth="4" paintOrder="stroke" fontFamily="ZCOOL KuaiLe">衡山</text>
            </g>
            <g className="hg-walk">
              <g transform="translate(-21 0)"><Boy /></g>
              <g transform="translate(22 0)"><Girl /></g>
            </g>
          </svg>
          {PINS.map((p) => (
            <div className={`hg-pin ${p.side}`} key={p.id}>
              <i className="hg-pin-dot" />
              <div className="hg-card" role="button" tabIndex={0} aria-label={`看大图：${p.t}`}
                onClick={() => openPin(p)}
                onKeyDown={(e) => e.key === 'Enter' && openPin(p)}>
                {p.slides ? <Slides slides={p.slides} /> : <Photo id={p.id} ratio="4 / 5" hint={p.t} tape={false} zoom={false} />}
                <i className="hg-zoom" aria-hidden>⌕</i>
                <span className="hg-card-t">{p.t}<small>{p.slides ? `${p.slides.length} 张 · 点开翻着看` : '点开看大图'}</small></span>
              </div>
            </div>
          ))}
        </div>
        <div className="hg-fog f1" /><div className="hg-fog f2" />
        <div className="hg-caps">
          {HENG.map((h, i) => (
            <div className="hg-cap" key={i}>
              <Stamp>{h.k}</Stamp>
              <p>{h.t}</p>
              {h.end && <p className="hg-end">{h.end}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ============ 屏 9.7 第一次来我家 · 三只猫 ============ */
// 旺仔小馒头五子棋：黑=我（小馒头），白=宝宝；最后我连成五个
const GO_MOVES = [[3, 3, 0], [3, 4, 1], [4, 3, 0], [2, 3, 1], [4, 4, 0], [5, 5, 1], [4, 2, 0], [4, 5, 1], [5, 3, 0], [2, 2, 1], [6, 3, 0], [4, 1, 1], [1, 3, 0], [2, 4, 1], [5, 2, 1], [7, 3, 0]]
const GO_WIN = [[3, 3], [4, 3], [5, 3], [6, 3], [7, 3]]
export function Cats() {
  const ref = useRef(null)
  useGSAP(() => {
    reveal('.cats-1'); reveal('.cats-2'); reveal('.cats-4')
    gsap.from('.cat-card', { y: 50, opacity: 0, rotate: (i) => [-8, 6, -4][i], stagger: 0.15, duration: 0.7, ease: 'back.out(1.5)', scrollTrigger: { trigger: '.cat-row', start: 'top 80%' } })
    const pcs = gsap.utils.toArray('.go-p', ref.current)
    const tl = gsap.timeline({ scrollTrigger: { trigger: '.gomoku', start: 'top 75%' } })
    tl.from(pcs, { scale: 0, duration: 0.28, stagger: 0.14, ease: 'back.out(3)' })
      .to('.go-p.win', { scale: 1.25, duration: 0.3, yoyo: true, repeat: 3, ease: 'sine.inOut' })
      .from('.go-say', { opacity: 0, y: 10, duration: 0.4 })
  }, { scope: ref })
  const W = 9, S = 28
  return (
    <section className="sec cats-sec" id="c-cats" data-node="10" ref={ref}>
      <ChapterHead date="9.20 → 9.22" title="宝宝第一次来我家啦" sub="你跟我一起回了深圳，第一次来到我家。家里的三只「活爹」，早就在家等着你啦。" />
      <div className="cats-1 stage-col">
        <div className="cat-row">
          {CATS.map((c) => (
            <div className={`cat-card sticker ${c.fav ? 'fav' : ''}`} key={c.name}>
              {c.fav && <span className="cat-fav">宝宝最喜欢</span>}
              <Photo id={c.photo} ratio="1 / 1" hint={c.name} tape={false} />
              <b className="cat-name">{c.name}</b>
            </div>
          ))}
        </div>
        <p className="cat-note">蹦蹦被宝宝一眼看中啦，你说它是<b>大卡车</b>，老胖了～</p>
      </div>
      <div className="cats-2 stage-col">
        {CAT_DAYS.map((d) => (
          <div className="cat-day sticker" key={d.k}>
            <Stamp>{d.k}</Stamp>
            {d.chips ? <div className="cat-chips">{d.chips.map((c) => <span key={c}>{c}</span>)}</div> : <p>{d.t}</p>}
          </div>
        ))}
        <Stamp>9.20 · 刚好也是认识你的第 100 天</Stamp>
      </div>
      <div className="gomoku sticker">
        <h3>旺仔小馒头五子棋</h3>
        <svg viewBox={`0 0 ${W * S} ${W * S}`} className="go-board" aria-label="五子棋">
          {Array.from({ length: W }, (_, i) => (
            <g key={i} stroke="#C99A6B" strokeWidth="1.4">
              <line x1={S / 2} x2={W * S - S / 2} y1={S / 2 + i * S} y2={S / 2 + i * S} />
              <line y1={S / 2} y2={W * S - S / 2} x1={S / 2 + i * S} x2={S / 2 + i * S} />
            </g>
          ))}
          {GO_MOVES.map(([x, y, who], i) => {
            const win = who === 0 && GO_WIN.some(([a, b]) => a === x && b === y)
            return (
              <g key={i} className={`go-p ${win ? 'win' : ''}`} style={{ transformOrigin: `${S / 2 + x * S}px ${S / 2 + y * S}px`, transformBox: 'view-box' }}>
                <circle cx={S / 2 + x * S} cy={S / 2 + y * S} r={S * 0.4} fill={who ? '#fff' : '#F2B35E'} stroke="#5A2B3C" strokeWidth="2" />
                {who === 0 && <circle cx={S / 2 + x * S - 3} cy={S / 2 + y * S - 3} r="2.6" fill="#FFE2B0" />}
              </g>
            )
          })}
        </svg>
        <p className="go-say">后来宝宝喝得迷迷糊糊的，就怎么也下不过我啦～ 下次清醒的时候，我们再比一局好不好</p>
      </div>
      <div className="cats-4 stage-col">
        <p className="cat-quote">后来宝宝说，那几天好像和我体验了一次同居生活。</p>
        <Bubble who="XIAO" text="宝宝，我也觉得好温馨，好美好。" />
      </div>
    </section>
  )
}

/* ============ 屏 9.8 一百天 · 中秋 · 90 天 ============ */
export function Autumn() {
  const ref = useRef(null)
  useGSAP(() => { reveal('.home-3'); reveal('.home-4') }, { scope: ref })
  return (
    <section className="sec theme-yellow home autumn" id="c-autumn" ref={ref}>
      <ChapterHead date="9.25 → 9.28" title="第一个中秋，第 90 天" />
      <div className="home-3 stage-col">
        <Stamp>9.25 · 我们的第一个中秋</Stamp>
        <Photo id="midautumn" ratio="1 / 1" hint="中秋的照片" tilt={2} className="sm" />
        <Bubble who="XIAO" text="很高兴在这第 105 天的时候和你共度中秋" />
      </div>
      <div className="home-4 stage-col">
        <Stamp>9.28 · 在一起第 90 天</Stamp>
        <Bubble who="XIAO" text="今天是我们在一起的第九十天，也是我们认识的第一百零八天" />
      </div>
    </section>
  )
}

/* ============ 关键话语精选 ============ */
export function Notes() {
  return (
    <section className="sec theme-yellow notes" id="c-notes">
      <ChapterHead date="便利贴" title="我们写下的悄悄话" sub="点一下，或者往旁边拖拖看。" />
      <CardStack cards={NOTES.map((n, i) => (
        <div key={i} className={`note n${i % 4}`}>
          <p>{n.t}</p>
          <small>{n.d} · {n.from}</small>
        </div>
      ))} />
      <Kitty size={78} className="side-kitty l" />
    </section>
  )
}

/* ============ 后续追加的回忆：日记里勾了「收进故事」的，按日期从早到晚排在这里 ============ */
// 也兼容以前的 private/memories.json（空着就没有）。
const bjTime = (ms) => new Date(ms + 8 * 3600_000).toISOString() // 北京时间的 YYYY-MM-DDTHH:mm
function MemPhotos({ m }) {
  const n = m.photos.length
  const open = (i) => openViewer({
    list: m.photos.map((src) => ({ id: src, src, hint: m.date, entryId: m.id })),
    index: i,
    title: m.title || m.date,
  })
  return (
    <div className={`mem-photos ${n === 1 ? 'n1' : n === 2 ? 'n2' : 'nm'} ${n > 2 && (n - 1) % 2 === 1 ? 'wide-last' : ''}`}>
      {m.photos.map((src, j) => (
        <button key={j} onClick={() => open(j)} aria-label={`放大第 ${j + 1} 张照片`}><img src={src} alt="" loading="lazy" /></button>
      ))}
    </div>
  )
}
export function Memories() {
  const nav = useNavigate()
  const [list, setList] = useState([])
  useEffect(() => {
    Promise.all([
      api('/api/story/memories').catch(() => []),
      api('/api/entries?featured=1&limit=50').then((r) => r.items).catch(() => []),
    ]).then(([old, entries]) => {
      const fromDiary = [...entries].reverse().map((e) => {
        const { y, md, wd } = fmtDate(e.date)
        const wrote = bjTime(e.createdAt)
        const day = wrote.slice(0, 10)
        return {
          id: e.id,
          date: `${y !== thisYear() ? `${y}.` : ''}${md} ${wd}`,
          title: e.title || '',
          body: e.body,
          photos: e.media.filter((x) => x.kind !== 'video').map((x) => x.url).filter(Boolean),
          videos: e.media.filter((x) => x.kind === 'video' && x.url), // 还在转码的没有地址，先不显示
          author: e.author,
          mood: moodOf(e.mood),
          place: e.place,
          hearts: e.hearts,
          wrote: day === e.date ? `${wrote.slice(11, 16)} 写下` : `${fmtDate(day).md} 补记`,
        }
      })
      setList([...(Array.isArray(old) ? old : []), ...fromDiary])
    })
  }, [])
  if (!list.length) return null
  return (
    <section className="sec theme-lav memories" id="c-memories">
      {list.map((m, i) => (
        <article className={`stage-col mem ${m.author || ''}`} key={m.id || i}>
          <Stamp>{m.date}</Stamp>
          {m.title && <h3 className="ch-title">{m.title}</h3>}
          {(m.author || m.mood || m.place) && (
            <p className="mem-meta">
              {m.author && <span className={`d-who ${AUTHORS[m.author].cls}`}>{AUTHORS[m.author].name}</span>}
              {m.mood && <span>{m.mood.e} {m.mood.t}</span>}
              {m.place && <span>📍 {m.place}</span>}
            </p>
          )}
          {m.photos?.length > 0 && <MemPhotos m={m} />}
          {m.videos?.map((v) => (
            <video key={v.id} className="mem-video" src={v.url} poster={v.thumbUrl} controls playsInline preload="metadata"
              onPlay={() => duck(true)} onPause={() => duck(false)} onEnded={() => duck(false)} />
          ))}
          {m.body && <div className="mem-paper"><p className="mem-body">{m.body}</p></div>}
          {m.quote && <Bubble who={m.quote.who} text={m.quote.text} />}
          {m.id && (
            <p className="mem-foot">
              {m.hearts.length > 0 && <span className="heart"><Doodle name="heart" size={16} /> {m.hearts.map((h) => AUTHORS[h].name).join('、')}</span>}
              <span>{m.wrote}</span>
              <button className="d-link" onClick={() => nav(`/diary/${m.id}`)}>在日记本里看 <Arrow /></button>
            </p>
          )}
        </article>
      ))}
    </section>
  )
}

/* ============ 未来章节 ============ */
export function Future() {
  const ref = useRef(null)
  const [up, setUp] = useState(null) // 接下来最近的日子，来自纪念日（不用再手写日期了）
  useEffect(() => { api('/api/home').then((h) => setUp(h.upcoming)).catch(() => setUp([])) }, [])
  useGSAP(() => {
    gsap.from('.fu-card', { y: 60, opacity: 0, stagger: 0.18, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: ref.current, start: 'top 60%' } })
    gsap.to('.fu-card', { yPercent: -3, repeat: -1, yoyo: true, duration: 3, ease: 'sine.inOut', stagger: 0.4 })
  }, { scope: ref, dependencies: [up], revertOnUpdate: true })
  const colors = [undefined, '#B79CFF']
  return (
    <section className="sec theme-lav future" id="c-future" data-node="12" ref={ref}>
      <ChapterHead date="还没发生哦" title="接下来的故事" sub="空着的地方，我们一起慢慢填。" />
      <div className="fu-list">
        {(up || []).slice(0, 2).map((u, i) => (
          <StarBorder key={`${u.date}-${u.label}`} className="fu-card" color={colors[i]}>
            <ShinyText>{u.daysLeft === 0 ? '就是今天' : u.daysLeft <= 7 ? '快到啦' : '等着它'}</ShinyText>
            <h3>{fmtDate(u.date).md} · {u.label}</h3>
            <p>{u.daysLeft === 0 ? '就是今天呀，宝宝！' : <>再等 <CountUp to={u.daysLeft} className="big2" /> 天就到啦</>}</p>
          </StarBorder>
        ))}
        <StarBorder className="fu-card" color="#7fd6bd"><ShinyText>等你来填</ShinyText><h3>换我带宝宝回我的家乡</h3><Photo id="future-home" ratio="4 / 3" hint="等你来填" className="sm" tape={false} /></StarBorder>
        <StarBorder className="fu-card" color="#FFC26B"><ShinyText>还有好多</ShinyText><h3>以后的每一个 moment</h3><p>都会被我一个一个记录下来哦。</p></StarBorder>
      </div>
    </section>
  )
}

/* ============ 尾屏 ============ */
export function End({ onHome }) {
  const [next, setNext] = useState(null)
  useEffect(() => { api('/api/home').then((h) => setNext(h.upcoming[0] || null)).catch(() => {}) }, [])
  const sub = !next ? '宝宝，故事还在慢慢写呢。' : next.daysLeft === 0 ? `今天是「${next.label}」，宝宝！` : `宝宝，${fmtDate(next.date).md} 见哦。`
  return (
    <section className="sec theme-lav end" id="c-end">
      <BounceCards className="end-cards">
        {[1, 2, 3, 4, 5].map((n) => <Photo key={n} id={`end-${n}`} ratio="4 / 5" hint="" tape={false} className="xs" />)}
      </BounceCards>
      <Kitty size={130} className="end-kitty" />
      <h2 className="ch-title">故事还长着呢，未完待续～</h2>
      <p className="ch-sub">{sub}</p>
      <Magnet>
        <button className="btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>再从头看一遍 ↑</button>
      </Magnet>
      {onHome && <button className="btn ghost" onClick={onHome}>去日记本 <Arrow /></button>}
    </section>
  )
}
