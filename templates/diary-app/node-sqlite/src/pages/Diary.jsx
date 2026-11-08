import { Doodle, Arrow } from '../icons.jsx'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api.js'
import EntryCard from './EntryCard.jsx'
import { Empty } from './common.jsx'

const FILTERS = [
  { k: '', t: '全部' },
  { k: 'ying', t: '英英' },
  { k: 'xiao', t: '肖肖' },
  { k: 'story', t: <><Doodle name="star" size={16} /> 在故事里</> },
]

export default function Diary() {
  const [params, setParams] = useSearchParams()
  const who = params.get('a') || ''
  const story = params.get('f') === '1'
  const month = params.get('m') || ''
  const cur = story ? 'story' : who

  const [items, setItems] = useState([])
  const [cursor, setCursor] = useState(null)
  const [state, setState] = useState('loading') // loading | idle | done | error
  const ticket = useRef(0) // 切换筛选后，丢掉还没回来的旧请求
  const sentinel = useRef(null)

  const query = useCallback((after) => {
    const q = new URLSearchParams({ limit: '15' })
    if (who) q.set('author', who)
    if (story) q.set('featured', '1')
    if (month) q.set('month', month)
    if (after) q.set('cursor', after)
    return `/api/entries?${q}`
  }, [who, story, month])

  const fetchPage = useCallback((after) => {
    const t = ++ticket.current
    setState('loading')
    api(query(after)).then((r) => {
      if (t !== ticket.current) return
      setItems((prev) => (after ? [...prev, ...r.items] : r.items))
      setCursor(r.nextCursor)
      setState(r.nextCursor ? 'idle' : 'done')
    }).catch(() => t === ticket.current && setState('error'))
  }, [query])

  useEffect(() => { setItems([]); setCursor(null); fetchPage(null) }, [fetchPage])

  // 滑到底自动加载下一页
  useEffect(() => {
    const el = sentinel.current
    if (!el || state !== 'idle') return
    const io = new IntersectionObserver((es) => es[0].isIntersecting && fetchPage(cursor), { rootMargin: '400px' })
    io.observe(el)
    return () => io.disconnect()
  }, [state, cursor, fetchPage])

  const setFilter = (k) => {
    const n = new URLSearchParams(params)
    n.delete('a'); n.delete('f')
    if (k === 'story') n.set('f', '1'); else if (k) n.set('a', k)
    setParams(n, { replace: true })
  }
  const setMonth = (m) => {
    const n = new URLSearchParams(params)
    if (m) n.set('m', m); else n.delete('m')
    setParams(n, { replace: true })
  }

  return (
    <div className="d-col">
      <header className="d-head"><h1 className="d-title">日记本</h1></header>
      <div className="d-chips" role="group" aria-label="筛选">
        {FILTERS.map((f) => (
          <button key={f.k} className={`d-chip ${cur === f.k ? 'on' : ''}`} aria-pressed={cur === f.k} onClick={() => setFilter(f.k)}>{f.t}</button>
        ))}
      </div>
      <label className="d-month">
        <span>只看某个月</span>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        {month && <button type="button" className="d-chip" onClick={() => setMonth('')}>清除</button>}
      </label>

      <div className="d-list">{items.map((e) => <EntryCard key={e.id} e={e} />)}</div>

      {state === 'loading' && <p className="d-loading">翻页中…</p>}
      {state === 'error' && <p className="d-loading">没加载出来，<button className="d-link" onClick={() => fetchPage(cursor)}>再试一次</button></p>}
      {state === 'idle' && <div ref={sentinel} className="d-loading" aria-hidden>·</div>}
      {state === 'done' && items.length > 0 && <p className="d-end">— 翻到底啦，等你继续写 —</p>}
      {state === 'done' && items.length === 0 && (
        cur || month
          ? <Empty title="这里还没有日记" hint="换个筛选看看，或者现在就记一篇。" to="/write" cta="记一笔" />
          : <Empty title="还没有日记哦" hint="把今天发生的事记下来，哪怕只有一句话。" to="/write" cta="写第一篇" />
      )}
      {state === 'done' && <Link to="/write" className="d-more">记一笔 <Arrow /></Link>}
    </div>
  )
}
