import { Doodle } from '../icons.jsx'
import { useState } from 'react'

// 已经是从桌面图标打开的（独立窗口）就不再提示
const standalone = () => window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true
const ua = () => (typeof navigator === 'undefined' ? '' : navigator.userAgent)

// 把网站加到手机桌面：iPhone 没有一键安装，只能手动「添加到主屏幕」，所以把步骤写清楚
export default function AddToHome() {
  const [open, setOpen] = useState(false)
  if (standalone()) return null
  const wechat = /MicroMessenger/i.test(ua())
  const ios = /iPhone|iPad|iPod/i.test(ua())
  const android = /Android/i.test(ua())
  return (
    <>
      <button className="d-a2hs" onClick={() => setOpen(true)}><Doodle name="house" size={20} /> 把我们的小站加到手机桌面</button>
      {open && (
        <div className="d-sheet" onClick={() => setOpen(false)}>
          <div className="d-sheet-in" role="dialog" aria-label="加到手机桌面" onClick={(e) => e.stopPropagation()}>
            <h2>加到手机桌面</h2>
            <p className="d-sub plain">加好以后，桌面上会有一个小图标，点一下就像打开 App 一样，不用每次再找网址。</p>
            {wechat && <p className="d-note">你现在是在微信里打开的，微信里加不了。先点右上角「…」，选「在浏览器打开」（iPhone 选「在 Safari 中打开」），再按下面的步骤来。</p>}
            {(ios || !android) && (
              <div className={`d-a2hs-box ${ios ? 'me' : ''}`}>
                <b>iPhone（要用 Safari）</b>
                <ol>
                  <li>用 Safari 打开这个网站。</li>
                  <li>点屏幕底部中间的「分享」按钮（一个方框带向上的箭头）。</li>
                  <li>往下滑，点「添加到主屏幕」。</li>
                  <li>点右上角「添加」，桌面上就有啦。</li>
                </ol>
              </div>
            )}
            {(android || !ios) && (
              <div className={`d-a2hs-box ${android ? 'me' : ''}`}>
                <b>安卓（Chrome 或系统浏览器）</b>
                <ol>
                  <li>用浏览器打开这个网站。</li>
                  <li>点右上角的「⋮」菜单。</li>
                  <li>点「添加到主屏幕」或「安装应用」。</li>
                  <li>确认一下，桌面上就有啦。</li>
                </ol>
              </div>
            )}
            <div className="d-sheet-actions"><button type="button" className="btn small" onClick={() => setOpen(false)}>知道啦</button></div>
          </div>
        </div>
      )}
    </>
  )
}
