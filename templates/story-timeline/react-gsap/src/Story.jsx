import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { useGSAP } from '@gsap/react'
import { Envelope, Gramophone, Timeline, AutoPlay, holdAuto } from './chrome.jsx'
import { Cover, Meet, Call, First, Love, Birthday, Letter, Month, Apart, Home, Roadtrip, Hengshan, Cats, Autumn, Notes, Memories, Future, End } from './chapters.jsx'
import Stats from './Stats.jsx'
import { bgm } from './ui.jsx'

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin)
ScrollTrigger.config({ ignoreMobileResize: true })

// 「我们的故事」：信封 → 一路往下滑的整段回忆。口令页和照片地址的加载都在 Root 里做过了。
export default function Story() {
  const nav = useNavigate()
  const [opened, setOpened] = useState(false)
  const [active, setActive] = useState(0)
  const [progress, setProgress] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [hasSrc, setHasSrc] = useState(true)
  const [songTip, setSongTip] = useState(false)
  const audio = useRef(null)
  const main = useRef(null)

  useEffect(() => {
    const a = new Audio('/audio/bgm.mp3')
    a.loop = true
    a.volume = 0
    let told = false
    a.addEventListener('play', () => { setPlaying(true); if (!told) { told = true; setSongTip(true); setTimeout(() => setSongTip(false), 4200) } })
    a.addEventListener('pause', () => setPlaying(false))
    a.addEventListener('error', () => setHasSrc(false))
    audio.current = a
    bgm.el = a
    const vis = () => document.hidden && a.pause()
    document.addEventListener('visibilitychange', vis)
    return () => {
      // 离开故事页：音乐停掉、页面解除锁定，别带到日记本里
      document.removeEventListener('visibilitychange', vis)
      gsap.killTweensOf(a)
      a.pause()
      a.removeAttribute('src')
      a.load()
      bgm.el = null
      document.body.classList.remove('locked')
    }
  }, [])

  useEffect(() => {
    document.body.classList.toggle('locked', !opened)
  }, [opened])

  const startMusic = () => {
    const a = audio.current
    a.play().then(() => gsap.to(a, { volume: 0.4, duration: 1.5 })).catch(() => {})
  }
  const toggleMusic = () => {
    const a = audio.current
    if (a.paused) a.play().then(() => gsap.to(a, { volume: 0.4, duration: 0.6 })).catch(() => {})
    else gsap.to(a, { volume: 0, duration: 0.4, onComplete: () => a.pause() })
  }

  useGSAP(() => {
    if (!opened) return
    // 花纹对齐：每段背景按它在页面里的位置偏移，段与段之间就不会断开
    const align = () => gsap.utils.toArray('main > section', main.current).forEach((el) => {
      const top = el.getBoundingClientRect().top + window.scrollY
      el.style.setProperty('--py', -(top % 140) + 'px')
    })
    ScrollTrigger.addEventListener('refresh', align)
    const ro = new ResizeObserver(align)
    ro.observe(main.current)
    align()
    const refresh = () => ScrollTrigger.refresh()
    document.fonts?.ready.then(refresh)
    window.addEventListener('load', refresh)
    gsap.utils.toArray('[data-node]').forEach((el) => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: (s) => s.isActive && setActive(+el.dataset.node),
      })
    })
    ScrollTrigger.create({ trigger: main.current, start: 'top top', end: 'bottom bottom', onUpdate: (s) => setProgress(s.progress) })
    return () => { window.removeEventListener('load', refresh); ScrollTrigger.removeEventListener('refresh', align); ro.disconnect() }
  }, { dependencies: [opened], scope: main })

  const jump = (id) => {
    const el = document.getElementById(id)
    if (!el) return
    holdAuto(1700)
    gsap.to(window, { scrollTo: { y: el, offsetY: 0 }, duration: 1.1, ease: 'power2.inOut' })
  }

  return (
    <>
      {!opened && <Envelope onOpen={() => { startMusic(); setTimeout(() => setOpened(true), 2300) }} onHome={() => nav('/')} />}
      <div className={`site ${opened ? 'show' : ''}`}>
        {opened && (
          <>
            <Timeline active={active} progress={progress} jump={jump} onHome={() => nav('/')} />
            <AutoPlay progress={progress} onStart={() => audio.current?.paused && toggleMusic()} />
            <Gramophone playing={playing} toggle={toggleMusic} hasSrc={hasSrc} />
            <div className={`song-tip ${songTip ? 'show' : ''}`} aria-hidden={!songTip}>♪ 狂恋你 · 沈以诚</div>
          </>
        )}
        <main ref={main}>
          <Cover />
          <Meet />
          <Call />
          <First />
          <Love />
          <Birthday />
          <Letter />
          <Month />
          <Apart />
          <Home />
          <Roadtrip />
          <Hengshan />
          <Cats />
          <Autumn />
          <Stats />
          <Notes />
          <Memories />
          <Future />
          <End onHome={() => nav('/')} />
        </main>
      </div>
    </>
  )
}
