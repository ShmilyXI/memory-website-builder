import { Doodle, Arrow } from '../icons.jsx'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import { CountUp } from '../bits.jsx'
import { Kitty } from '../cute.jsx'
import { daysSince, LOVE, usePhotoMap } from '../ui.jsx'
import DayCard from './DayCard.jsx'
import EntryCard from './EntryCard.jsx'
import { Empty, WhoAmI } from './common.jsx'
import { useMapConfig } from '../mapUtil.js'
import AddToHome from './AddToHome.jsx'

export default function Home() {
  const days = daysSince(LOVE) // 和故事页一样：6.30 算第 0 天
  const cover = usePhotoMap().cover
  const [recent, setRecent] = useState(null)
  const [home, setHome] = useState(null) // { upcoming, counts }
  useEffect(() => {
    api('/api/entries?limit=3').then((r) => setRecent(r.items)).catch(() => setRecent([]))
    api('/api/home').then(setHome).catch(() => setHome({ upcoming: [], counts: null }))
  }, [])
  const upcoming = home?.upcoming || []
  const otd = home?.onThisDay || []
  const wishes = home?.wishes
  const caps = home?.capsules
  const mapCfg = useMapConfig() // 配了高德才显示恋爱地图
  const mp = home?.map
  const today = upcoming[0]?.daysLeft === 0 ? upcoming[0] : null

  return (
    <div className="d-col">
      <section className="d-hero">
        <Kitty size={92} className="d-hero-kitty" />
        <p>今天是我们在一起的第</p>
        <div className="d-day"><CountUp to={days} className="big" /><em>天</em></div>
        <WhoAmI className="center" />
      </section>

      {today && <p className="d-today-banner">今天是「{today.label}」，宝宝！</p>}

      {caps?.ready > 0 && <Link to="/capsules" className="d-today-banner d-cap-banner"><Doodle name="capsule" size={26} /> 有 {caps.ready} 封时间胶囊到日子啦，去拆开</Link>}

      <div className="d-actions">
        <Link className="btn" to="/write">记一笔</Link>
        <Link to="/story" className="d-story">
          <span className="d-story-img">{cover ? <img src={cover} alt="" /> : <span className="d-story-lock" aria-hidden><Doodle name="heart" size={46} /></span>}</span>
          <span><b>我们的故事</b><small>从第一通电话开始，我把和你的每一天，都悄悄收在这里。</small></span>
        </Link>
      </div>

      {mapCfg && (
        <Link to="/map" className="d-mapcard">
          <span className="d-mapcard-ico" aria-hidden><Doodle name="map" size={50} /></span>
          <span><b>恋爱地图</b><small>{mp && mp.pins > 0 ? `一起去过 ${mp.pins} 个地方 · ${mp.cities} 座城市 · ${mp.km.toLocaleString()} 公里` : '把我们走过的路，一个一个钉上去'}</small></span>
        </Link>
      )}

      <div className="d-corners">
        <Link to="/wishes" className="d-corner">
          <span aria-hidden><Doodle name="wish" size={44} /></span>
          <b>愿望清单</b>
          <small>{wishes && wishes.open + wishes.done > 0 ? `已做到 ${wishes.done} / ${wishes.open + wishes.done}` : '想一起做的事'}</small>
        </Link>
        <Link to="/capsules" className="d-corner">
          <span aria-hidden><Doodle name="capsule" size={44} /></span>
          <b>时间胶囊</b>
          <small>{caps?.sealed > 0 ? `${caps.sealed} 封封存中` : '写给未来的信'}</small>
        </Link>
      </div>

      {upcoming.length > 0 && (
        <>
          <h2 className="d-h2">接下来的日子</h2>
          <div className="d-list tight">{upcoming.map((u) => <DayCard key={`${u.date}-${u.label}`} u={u} />)}</div>
          <Link to="/days" className="d-more">全部纪念日 <Arrow /></Link>
        </>
      )}

      {otd.length > 0 && (
        <>
          <h2 className="d-h2">那年今天</h2>
          <div className="d-list">
            {otd.map((x) => (
              <div key={x.entry.id} className="d-otd">
                <p className="d-otd-label">{x.label}</p>
                <EntryCard e={x.entry} />
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="d-h2">最近的日记</h2>
      {home?.counts?.entries > 0 && <p className="d-count-line">写了 {home.counts.entries} 篇日记，放了 {home.counts.photos} 张照片</p>}
      {recent === null ? <p className="d-loading">翻页中…</p>
        : recent.length === 0 ? <Empty title="还没有日记哦" hint="把今天发生的事记下来，哪怕只有一句话。" to="/write" cta="写第一篇" />
        : <>
            <div className="d-list">{recent.map((e) => <EntryCard key={e.id} e={e} />)}</div>
            <Link to="/diary" className="d-more">看全部日记 <Arrow /></Link>
          </>}

      <AddToHome />
    </div>
  )
}
