import express from 'express'
import multer from 'multer'
import { login, requireAuth } from './auth.js'
import { story } from './routes/story.js'
import { media } from './routes/media.js'
import { mediaApi } from './routes/media-api.js'
import { entries } from './routes/entries.js'
import { album } from './routes/album.js'
import { anniversaries } from './routes/anniversaries.js'
import { home } from './routes/home.js'
import { limitWrites } from './rate.js'
import { map, footprints } from './routes/map.js'
import { config } from './config.js'
import { wishes } from './routes/wishes.js'
import { capsules } from './routes/capsules.js'
import './db.js'

export const app = express()
app.disable('x-powered-by')
app.set('trust proxy', 'loopback') // 前面是本机的 Nginx，才信它传来的真实 IP

app.use((_req, res, next) => {
  res.set({ 'X-Robots-Tag': 'noindex, nofollow', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin' })
  next()
})
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => res.json({ ok: true }))
app.use('/api', limitWrites)
app.post('/api/auth', login)
// 只有「我们的故事」（照片、语音、聊天统计）要口令；日记、相册、纪念日、愿望、时间胶囊、留言都不用
app.use('/api/story', requireAuth, story)
app.use('/api/entries', entries)
app.use('/api/media', mediaApi)
app.use('/api/album', album)
app.use('/api/anniversaries', anniversaries)
app.use('/api/home', home)
app.use('/api/wishes', wishes)
app.use('/api/capsules', capsules)
app.use('/api/map', map)
app.use('/api/footprints', footprints)
// 前端要的配置：高德 Key 等（没配就是 null，前端就不显示地图）
app.get('/api/config', (_req, res) => {
  res.set('Cache-Control', 'no-store')
  res.json({ map: config.amap ? { key: config.amap.key, style: config.amap.style, securityCode: config.amap.securityCode } : null })
})
app.use('/media', media)

app.use('/api', (_req, res) => res.status(404).json({ error: 'not found' }))
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    return res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'too large' : 'bad upload', message: err.code === 'LIMIT_FILE_SIZE' ? '文件太大啦（图片最大 50MB，视频最大 300MB）' : '上传出错了' })
  }
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'bad json' })
  console.error(err)
  res.status(500).json({ error: 'server error' })
})
