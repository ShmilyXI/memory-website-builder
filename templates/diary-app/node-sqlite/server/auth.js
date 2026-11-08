import crypto from 'node:crypto'
import { config } from './config.js'

// ---------- 口令：只存哈希，不存明文 ----------
export function hashPasscode(code, salt = crypto.randomBytes(16).toString('hex')) {
  const h = crypto.scryptSync(String(code), salt, 32).toString('hex')
  return `scrypt$${salt}$${h}`
}
function checkPasscode(code) {
  const [, salt, h] = config.passHash.split('$')
  const got = crypto.scryptSync(String(code), salt, 32)
  const want = Buffer.from(h, 'hex')
  return got.length === want.length && crypto.timingSafeEqual(got, want)
}

// ---------- 限流：4 位数字只有一万种可能，必须挡住连续乱试 ----------
const IP_FAILS = 5, IP_LOCK_MS = 15 * 60_000
const ALL_FAILS = 30, ALL_WINDOW_MS = 3600_000
const ipState = new Map() // ip -> { fails, lockedUntil }
let allFails = [] // 最近一小时所有人输错的时间
let allLockedUntil = 0

export const _resetLimits = () => { ipState.clear(); allFails = []; allLockedUntil = 0 }

function lockedFor(ip, now) {
  const s = ipState.get(ip)
  return Math.max(s?.lockedUntil || 0, allLockedUntil) - now
}
function recordFail(ip, now) {
  const s = ipState.get(ip) || { fails: 0, lockedUntil: 0 }
  s.fails += 1
  if (s.fails >= IP_FAILS) { s.lockedUntil = now + IP_LOCK_MS; s.fails = 0 }
  ipState.set(ip, s)
  allFails = allFails.filter((t) => now - t < ALL_WINDOW_MS)
  allFails.push(now)
  if (allFails.length >= ALL_FAILS) { allLockedUntil = now + ALL_WINDOW_MS; allFails = [] }
}

// ---------- 令牌：放在服务器内存里，重启就全部失效（反正每次打开都要重新输口令） ----------
const tokens = new Map() // token -> expiresAt
function issue() {
  const t = crypto.randomBytes(32).toString('base64url')
  const expiresAt = Date.now() + config.tokenTtlMs
  tokens.set(t, expiresAt)
  return { token: t, expiresAt }
}
setInterval(() => {
  const now = Date.now()
  for (const [t, e] of tokens) if (e < now) tokens.delete(t)
}, 600_000).unref()

export function requireAuth(req, res, next) {
  const m = /^Bearer (.+)$/.exec(req.get('authorization') || '')
  const exp = m && tokens.get(m[1])
  if (!exp || exp < Date.now()) return res.status(401).json({ error: 'unauthorized' })
  next()
}

export function login(req, res) {
  const now = Date.now()
  const wait = lockedFor(req.ip, now)
  if (wait > 0) return res.status(429).set('Retry-After', Math.ceil(wait / 1000)).json({ error: 'locked', retryAfter: Math.ceil(wait / 1000) })
  const code = req.body?.code
  if (typeof code !== 'string' || !/^\d{4}$/.test(code) || !checkPasscode(code)) {
    recordFail(req.ip, now)
    return res.status(401).json({ error: 'wrong' })
  }
  ipState.delete(req.ip)
  res.json(issue())
}
