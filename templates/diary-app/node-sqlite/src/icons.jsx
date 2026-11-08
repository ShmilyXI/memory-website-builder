// 图标：两套，风格统一成「手绘蜡笔涂鸦」。
//  · Doodle：用蜡笔画的小贴纸（心情、首页入口、纪念日 / 图钉的小图标），是 webp 图片，在 src/assets/doodle/ 里。
//  · Glyph：按钮上的小符号和底部导航（＋ ✕ ✓ ‹ › ▶ 爱心 星星……），是 SVG，线条带一点手抖和蜡笔的颗粒感，颜色跟着文字走。
// 数据库里「纪念日 / 图钉」的图标存的还是 emoji 字符（老数据不用迁移），显示时用 EMOJI_ICON 换成对应的涂鸦图。

const files = import.meta.glob('./assets/doodle/*.webp', { eager: true, query: '?url', import: 'default' })
const URLS = Object.fromEntries(Object.entries(files).map(([p, u]) => [p.match(/\/([^/]+)\.webp$/)[1], u]))
export const doodleUrl = (name) => URLS[name]

export function Doodle({ name, size = 24, className = '', alt = '', style }) {
  const src = URLS[name]
  if (!src) return null
  return <img className={`doodle ${className}`} src={src} width={size} height={size} alt={alt} aria-hidden={alt ? undefined : true} draggable={false} style={style} />
}

// emoji → 涂鸦图名（纪念日 / 图钉可选的图标，加上老数据里出现过的）
export const EMOJI_ICON = {
  '💗': 'heart', '❤️': 'heart', '🎂': 'cake', '💍': 'ring', '✈️': 'plane', '🎁': 'gift', '🌊': 'wave', '🍰': 'cakeslice',
  '🏠': 'house', '⭐': 'star', '🌟': 'star', '🎡': 'ferris', '🏔️': 'mountain', '🍜': 'noodles', '🏨': 'hotel', '🚗': 'car',
  '🎬': 'movie', '👋': 'hello', '📞': 'phone', '💞': 'hearts2', '🌲': 'trees', '🏕️': 'tent', '✨': 'sparkle',
  '🎉': 'party', '📍': 'pin', '📷': 'camera', '🗺️': 'map', '💌': 'capsule', '📖': 'story',
  '🌙': 'moon', '💯': 'badge', '🏅': 'badge', '🌹': 'bouquet', '💐': 'bouquet', '🐱': 'cat', '🐈': 'cat',
  '🌈': 'rainbow', '🧋': 'bubbletea', '🎆': 'fireworks', '🍓': 'strawberry', '🎈': 'balloon',
}
// 纪念日 / 图钉里可以挑的图标（顺序就是界面里的顺序）
export const ICON_CHOICES = ['💗', '🎂', '💍', '🎁', '🍰', '🏠', '🚗', '✈️', '🏔️', '🌲', '🏕️', '🌊', '🎡', '🍜', '🏨', '🎬', '📞', '👋', '💞', '⭐', '🌙', '🏅', '🌹', '🐱', '🌈', '🧋', '🎆', '🍓', '🎈']
// 没有对应涂鸦图的 emoji（老数据里可能有）统一显示成小闪光，不再露出系统的 emoji
export const emojiUrl = (e) => URLS[EMOJI_ICON[e] || 'sparkle']
// 一个 emoji 字符 → 涂鸦图；没有对应的就还是显示字符
export function EmojiIcon({ e, size = 24, className = '' }) {
  return <Doodle name={EMOJI_ICON[e] || 'sparkle'} size={size} className={className} />
}

// ---------- 手绘符号 ----------
// 都画在 24×24 里，描边用 currentColor；fill 的符号（播放、停止、爱心、星星）可以实心。
const P = {
  plus: ['M12 5.6 L12.2 18.4', 'M5.5 12.1 L18.5 11.9'],
  minus: ['M5.6 12 L18.4 12.2'],
  close: ['M6 6.2 L18 17.9', 'M17.9 6 L6.1 18'],
  check: ['M5 12.8 L9.8 17.4 L19 7'],
  back: ['M14.8 5.3 L8.2 12 L14.9 18.7'],
  next: ['M9.2 5.3 L15.8 12 L9.1 18.7'],
  search: ['M10.6 4.9 C7.4 4.8 4.9 7.4 5 10.5 C5.1 13.7 7.7 16.1 10.8 16 C13.9 15.9 16.3 13.3 16.2 10.2 C16.1 7.2 13.7 4.9 10.6 4.9 Z', 'M14.9 14.7 L19.4 19.3'],
  play: ['M8 5.4 L18.5 12 L8.1 18.7 Z'],
  stop: ['M7 7.1 L17 6.9 L17.1 17 L6.9 17.1 Z'],
  heart: ['M12 19.6 C5.4 15.2 3.7 11.7 3.7 9.4 C3.7 7.1 5.4 5.5 7.6 5.5 C9.4 5.5 11 6.5 12 8.1 C13 6.5 14.6 5.5 16.4 5.5 C18.6 5.5 20.3 7.1 20.3 9.4 C20.3 11.7 18.6 15.2 12 19.6 Z'],
  star: ['M12 3.8 L14.4 9.2 L20.2 9.8 L15.8 13.7 L17.1 19.5 L12 16.5 L6.9 19.5 L8.2 13.7 L3.8 9.8 L9.6 9.2 Z'],
  lock: ['M6.6 11 L17.5 10.9 L17.4 19.2 L6.5 19.3 Z', 'M8.9 10.9 L8.8 8.6 C8.8 6.6 10.2 5.3 12 5.3 C13.8 5.3 15.2 6.6 15.2 8.6 L15.1 10.9'],
  chat: ['M5.2 6.2 L18.8 6 C19.5 6 19.9 6.4 19.9 7.1 L19.8 14.3 C19.8 15 19.4 15.4 18.7 15.4 L12.6 15.5 L8.3 18.9 L8.4 15.5 L5.3 15.5 C4.6 15.5 4.2 15.1 4.2 14.4 L4.3 7.2 C4.3 6.5 4.6 6.2 5.2 6.2 Z'],
  menu: ['M5 7.2 L19 6.9', 'M5 12.1 L19 11.9', 'M5 17 L19 17.2'],
  // 底部导航
  home: ['M3.5 11.6 L12 4.2 L20.5 11.5', 'M5.8 10.2 L5.9 19 C5.9 19.7 6.4 20 7 20 L17 20 C17.6 20 18.1 19.7 18.1 19 L18.2 10.2', 'M10 20 L10.1 14.6 L14 14.5 L14 20'],
  book: ['M6 4.6 L17.2 4.5 C18.4 4.5 19 5.2 19 6.4 L19 19.5 L8.3 19.6 C6.9 19.6 6 18.8 6 17.4 Z', 'M6 17.4 C6 16.1 6.9 15.5 8.3 15.5 L19 15.5', 'M9.6 8.6 L15.4 8.5'],
  photo: ['M4 6.3 C4 5.4 4.5 5 5.3 5 L18.7 5 C19.5 5 20 5.4 20 6.3 L20 17.7 C20 18.6 19.5 19 18.7 19 L5.3 19 C4.5 19 4 18.6 4 17.7 Z', 'M4.6 16.6 L9.2 11.6 L12.4 15 L15 12.4 L19.4 16.9', 'M15.5 8.4 C15.9 8.4 16.2 8.7 16.2 9.1 C16.2 9.5 15.9 9.8 15.5 9.8 C15.1 9.8 14.8 9.5 14.8 9.1 C14.8 8.7 15.1 8.4 15.5 8.4 Z'],
}
const SOLID = new Set(['play', 'stop'])

export function Glyph({ name, size = 20, fill = false, strokeWidth = 2.6, className = '', title }) {
  const d = P[name]
  if (!d) return null
  const solid = fill || SOLID.has(name)
  return (
    <svg className={`glyph ${className}`} viewBox="0 0 24 24" width={size} height={size} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true} focusable="false">
      <g filter="url(#crayon)" fill={solid ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        {d.map((p, i) => <path key={i} d={p} />)}
      </g>
    </svg>
  )
}
// 文字链接后面的小箭头（代替「›」）
export const Arrow = () => <Glyph name="next" size={16} strokeWidth={3.2} className="arr" />

// 蜡笔滤镜：线条轻轻抖一下（手画的感觉）+ 蜡笔的颗粒（线条上有一点点没涂到的小白点）。整个页面放一份，符号用 filter="url(#crayon)" 引用。
// filterUnits 用 userSpaceOnUse：笔直的横线、竖线包围盒的高 / 宽是 0，用默认的包围盒单位会整条消失。
export function CrayonDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden focusable="false">
      <defs>
        <filter id="crayon" filterUnits="userSpaceOnUse" x="-2" y="-2" width="28" height="28" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="grain" />
          <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.6 2.75" result="holes" />
          <feComposite in="SourceGraphic" in2="holes" operator="in" result="textured" />
          <feTurbulence type="turbulence" baseFrequency="0.06" numOctaves="2" seed="9" result="warp" />
          <feDisplacementMap in="textured" in2="warp" scale="1.5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  )
}
