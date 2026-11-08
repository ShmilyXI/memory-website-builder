import crypto from 'node:crypto'
import { config } from './config.js'

// <img> / <video> 加载文件时带不了令牌，所以文件地址自己带签名：
//   /media/photos/cover.webp?e=过期时间&s=签名
// 过期时间取整到整点再往后推 12 小时：同一个小时里地址不变，浏览器能缓存。
const HOUR = 3600_000
const mac = (key, e) => crypto.createHmac('sha256', config.signSecret).update(`${key}\n${e}`).digest('base64url')

export function signedUrl(key, now = Date.now()) {
  const e = Math.ceil(now / HOUR) * HOUR + 12 * HOUR
  const q = new URLSearchParams({ e: String(e), s: mac(key, e) })
  return `/media/${key.split('/').map(encodeURIComponent).join('/')}?${q}`
}

export function verify(key, e, s, now = Date.now()) {
  if (!/^\d+$/.test(e || '') || Number(e) < now || typeof s !== 'string') return false
  const a = Buffer.from(mac(key, e)), b = Buffer.from(s)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}
