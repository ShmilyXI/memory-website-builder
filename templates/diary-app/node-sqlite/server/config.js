import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')

const need = (k) => {
  const v = process.env[k]
  if (!v) {
    console.error(`缺少环境变量 ${k}。先在 server 目录里运行：npm run passcode`)
    process.exit(1)
  }
  return v
}

// 腾讯云 COS：只有服务器的 .env 里填了密钥才启用；没填（比如你 Mac 上本地开发）就自动存本地磁盘。
// STORAGE=local 可以强制用本地磁盘。
const bucket = process.env.COS_BUCKET
const region = process.env.COS_REGION
const cos = process.env.COS_SECRET_ID && process.env.COS_SECRET_KEY && bucket && region && process.env.STORAGE !== 'local'
  ? {
      secretId: process.env.COS_SECRET_ID,
      secretKey: process.env.COS_SECRET_KEY,
      bucket,
      region,
      // 这个桶是几个项目共用的，本项目所有文件都放在这个前缀下面
      prefix: (process.env.COS_PREFIX || 'xlovey').replace(/^\/|\/$/g, ''),
      baseUrl: (process.env.COS_BASE_URL || `https://${bucket}.cos.${region}.myqcloud.com`).replace(/\/$/, ''),
    }
  : null

// 高德地图（恋爱地图）：Key 是前端要用的，本来就是公开的；安全密钥放在服务器的 Nginx 里转发（见 docs/部署说明.md），
// 不进前端。本机开发没有 Nginx 时，可以在 .env 里填 AMAP_SECURITY_CODE，由 /api/config 直接给前端。
const amap = process.env.AMAP_KEY
  ? {
      key: process.env.AMAP_KEY,
      style: process.env.AMAP_STYLE || 'amap://styles/macaron',
      securityCode: process.env.AMAP_PROXY === '1' ? null : process.env.AMAP_SECURITY_CODE || null,
    }
  : null

export const config = {
  amap,
  port: Number(process.env.PORT || 3020),
  host: process.env.HOST || '127.0.0.1',
  // 日记、数据库、原图都放这里（部署时绝对不覆盖）
  dataDir: path.resolve(process.env.DATA_DIR || path.join(here, 'data')),
  // 故事页的照片 / 语音 / 统计，不对外公开，只能通过带签名的地址访问
  storyDir: path.resolve(process.env.STORY_DIR || path.join(root, 'private')),
  passHash: need('PASS_HASH'), // scrypt$盐$哈希
  signSecret: need('SIGN_SECRET'),
  tokenTtlMs: Number(process.env.TOKEN_TTL_HOURS || 12) * 3600_000,
  cos,
}
