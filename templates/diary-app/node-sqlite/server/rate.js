// 网站现在不再整站挡口令（只有「我们的故事」要口令），所以要防一下被外面的人乱刷：
// 按来访 IP 限制写操作（发日记、留言、删除……）和上传的频率。两个人正常使用远远碰不到这些上限。
// 记在内存里，服务重启就清零。
export function rateLimit({ max, windowMs, message }) {
  const hits = new Map() // ip -> 最近的时间戳
  setInterval(() => {
    const now = Date.now()
    for (const [ip, ts] of hits) if (!ts.some((t) => now - t < windowMs)) hits.delete(ip)
  }, 600_000).unref()
  const mw = (req, res, next) => {
    const now = Date.now()
    const ts = (hits.get(req.ip) || []).filter((t) => now - t < windowMs)
    if (ts.length >= max) {
      res.set('Retry-After', Math.ceil((ts[0] + windowMs - now) / 1000))
      return res.status(429).json({ error: 'slow down', message })
    }
    ts.push(now)
    hits.set(req.ip, ts)
    next()
  }
  mw.reset = () => hits.clear()
  return mw
}

const WRITE = ['POST', 'PUT', 'PATCH', 'DELETE']
// 所有写操作：每个 IP 10 分钟最多 300 次（登录 /api/auth 另有自己的限流，不算在内）
export const writeLimit = rateLimit({ max: 300, windowMs: 10 * 60_000, message: '操作太频繁啦，歇一会儿再来' })
export const limitWrites = (req, res, next) => (WRITE.includes(req.method) && req.path !== '/auth' ? writeLimit(req, res, next) : next())
// 上传文件（图片、视频）：每个 IP 每小时最多 120 个——一篇日记最多 30 个，足够用；也防止被人拿来塞满磁盘和 COS
export const uploadLimit = rateLimit({ max: 120, windowMs: 3600_000, message: '上传太频繁啦，过一会儿再传' })
