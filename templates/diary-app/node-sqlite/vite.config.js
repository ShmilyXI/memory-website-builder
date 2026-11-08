import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 开发时前端在 5173，后端在 3020；把 /api 和 /media 转过去，这样前后端像在同一个网站里。
const backend = 'http://127.0.0.1:3020'

// 有了多级页面（/diary/xxx），资源路径必须从根开始，所以 base 是 '/'。
export default defineConfig({
  plugins: [react()],
  base: '/',
  server: { proxy: { '/api': backend, '/media': backend } },
})
