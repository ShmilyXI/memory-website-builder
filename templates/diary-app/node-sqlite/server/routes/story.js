import fs from 'node:fs'
import path from 'node:path'
import { Router } from 'express'
import { config } from '../config.js'
import { signedUrl } from '../sign.js'

const readJson = (name, fallback) => {
  try { return JSON.parse(fs.readFileSync(path.join(config.storyDir, name), 'utf8')) } catch { return fallback }
}

// { id: "photos/xx.webp", _hideEmpty: true } → 路径换成带签名的地址，下划线开头的说明字段原样带回
const signMap = (m) => Object.fromEntries(Object.entries(m).map(([k, v]) =>
  [k, typeof v === 'string' && !k.startsWith('_') ? signedUrl(v) : v]))

export const story = Router()

story.get('/assets', (_req, res) => {
  res.set('Cache-Control', 'no-store')
  res.json({ photos: signMap(readJson('photos.json', {})), voices: signMap(readJson('voices.json', {})) })
})
story.get('/stats', (_req, res) => { res.set('Cache-Control', 'no-store'); res.json(readJson('data/stats.json', null)) })
story.get('/memories', (_req, res) => {
  const list = readJson('memories.json', [])
  res.set('Cache-Control', 'no-store')
  res.json(list.map((m) => ({ ...m, photos: (m.photos || []).map((p) => (/^https?:|^\//.test(p) ? p : signedUrl(p))) })))
})
