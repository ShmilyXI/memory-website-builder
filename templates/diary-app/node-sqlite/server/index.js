import { app } from './app.js'
import { config } from './config.js'
import { storage } from './storage/index.js'
import { startCleanup } from './jobs/cleanup.js'
import { resumeVideos } from './media/video.js'

app.listen(config.port, config.host, () => {
  console.log(`恋爱日记后端已启动 http://${config.host}:${config.port}  文件存储：${storage.name === 'cos' ? `腾讯云 COS（${config.cos.bucket} / ${config.cos.prefix}）` : '本地磁盘'}`)
})
startCleanup()
resumeVideos() // 上次重启时没转完的视频，接着转
