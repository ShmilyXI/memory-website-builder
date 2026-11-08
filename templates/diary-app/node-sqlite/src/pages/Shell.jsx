import { Glyph } from '../icons.jsx'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

const Tab = ({ to, icon, label, end }) => (
  <NavLink to={to} end={end} className={({ isActive }) => `d-tab ${isActive ? 'active' : ''}`}>
    <Glyph name={icon} size={27} strokeWidth={2.4} />
    <span>{label}</span>
  </NavLink>
)

// 日记本这几页共用的外壳：底部导航。写日记时收起来，让位给键盘。
export default function Shell() {
  const { pathname } = useLocation()
  const writing = pathname.startsWith('/write') || pathname === '/capsules/new'
  return (
    <div className={`d-app ${writing ? 'writing' : ''}`}>
      <Outlet />
      {!writing && (
        <nav className="d-tabs" aria-label="日记本导航">
          <div className="d-tabs-in">
            <Tab to="/" end icon="home" label="首页" />
            <Tab to="/diary" icon="book" label="日记" />
            <NavLink to="/write" className="d-tab plus" aria-label="记一笔">
              <span className="d-plus"><Glyph name="plus" size={28} strokeWidth={3.6} /></span>
              <span>记一笔</span>
            </NavLink>
            <Tab to="/album" icon="photo" label="相册" />
            <Tab to="/story" icon="heart" label="故事" />
          </div>
        </nav>
      )}
    </div>
  )
}
