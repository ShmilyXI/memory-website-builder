import { Doodle, Glyph } from '../icons.jsx'
import { Link } from 'react-router-dom'
import { AUTHORS, fmtDate, moodOf, thisYear } from './common.jsx'

// 日记卡片：英英的靠左（粉），肖肖的靠右（黄）——和故事页里聊天气泡的左右一样
export default function EntryCard({ e }) {
  const a = AUTHORS[e.author]
  const { y, md, wd } = fmtDate(e.date)
  const mood = moodOf(e.mood)
  const thumbs = e.media.slice(0, 3)
  const more = e.media.length - thumbs.length
  return (
    <Link to={`/diary/${e.id}`} className={`d-card ${a.cls}`}>
      <header className="d-card-top">
        <span className="d-date"><b>{md}</b><small>{y !== thisYear() ? `${y} ` : ''}{wd}</small></span>
        <span className={`d-who ${a.cls}`}>{a.name}</span>
      </header>
      {e.title && <h3 className="d-card-title">{e.title}</h3>}
      {e.body && <p className="d-card-body">{e.body}</p>}
      {thumbs.length > 0 && (
        <div className={`d-thumbs n${thumbs.length}`}>
          {thumbs.map((m, i) => (
            <span key={m.id} className="d-thumb">
              {m.thumbUrl && <img src={m.thumbUrl} alt="" loading="lazy" />}
              {m.kind === 'video' && <b className="d-vbadge" aria-hidden><Glyph name="play" size={12} /></b>}
              {more > 0 && i === thumbs.length - 1 && <em>+{more}</em>}
            </span>
          ))}
        </div>
      )}
      {(mood || e.place || e.featured || e.hearts.length > 0 || e.commentCount > 0) && (
        <footer className="d-card-foot">
          {mood && <span>{mood.e} {mood.t}</span>}
          {e.place && <span><Doodle name="pin" size={16} /> {e.place}</span>}
          {e.featured && <span className="d-feat"><Doodle name="star" size={16} /> 在故事里</span>}
          {e.commentCount > 0 && <span className="d-cmts-n"><Glyph name="chat" size={16} /> {e.commentCount}</span>}
          {e.hearts.length > 0 && <span className="d-hearts"><Doodle name="heart" size={16} /> {e.hearts.length}</span>}
        </footer>
      )}
    </Link>
  )
}
