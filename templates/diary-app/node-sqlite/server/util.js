import crypto from 'node:crypto'
import { storage } from './storage/index.js'

export const newId = () => crypto.randomBytes(8).toString('hex') // 16 位小写十六进制：不好猜，也方便当文件名
export const ID_RE = /^[0-9a-f]{16}$/

// 北京时间的 yyyy / mm，用来给文件分文件夹
export function ym(ts = Date.now()) {
  const [y, m] = new Date(ts + 8 * 3600_000).toISOString().slice(0, 7).split('-')
  return [y, m]
}
// 北京时间的 yyyy-mm-dd
export const ymd = (ts) => new Date(ts + 8 * 3600_000).toISOString().slice(0, 10)

// 数据库里的一行 media → 给前端看的样子
export const mediaOut = (m) => ({
  id: m.id,
  kind: m.kind,
  status: m.status,
  url: m.status === 'ready' ? storage.url(m.key) : null,
  thumbUrl: m.thumb_key ? storage.url(m.thumb_key) : null,
  width: m.width,
  height: m.height,
  duration: m.duration,
  takenAt: m.taken_at,
})
