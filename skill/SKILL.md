---
name: memory-website
description: 10 分钟搭建带故事回忆路线的个人网站：引导式提问、素材处理、代码生成、一键部署。支持恋爱日记、家庭相册、个人博客等场景。
version: 0.1.0-mvp
author: XIAO (based on xlovey.cn)
license: MIT
triggers:
  - 做一个回忆网站
  - 恋爱日记网站
  - 故事回忆页面
  - 聊天回忆网站
  - 帮我搭建个人网站
---

# Memory Website Builder

为你和 TA 的故事、家人的回忆、个人的成长历程，快速搭建一个炫酷的回忆网站。

## 核心能力

1. **故事回忆路线**：上传照片 → 配上文字和日期 → 生成带滚动动画的故事页（基于 GSAP）
2. **日记应用**：完整的日记本系统，支持照片/视频、纪念日、相册等功能
3. **可选组合**：只要故事页 / 只要日记本 / 完整网站（两者都有）

## 使用场景

- 恋爱纪念日送给 TA 的礼物
- 家庭相册和成长记录
- 个人博客和生活日志
- 毕业回忆册
- 旅行游记

---

## 工作流程

### Step 1: 了解需求

先问用户想做什么类型的网站：

```
你想做哪种类型的网站？

1. 故事回忆页（单页，炫酷滚动动画，适合纪念日礼物）
2. 日记应用（完整功能，可长期记录生活）
3. 完整网站（故事页 + 日记应用）
```

### Step 2: 收集基础信息

无论哪种类型，都需要这些信息：

```
请告诉我：
- 网站名称（比如"XIAO 与英英"）
- 主角（单人/双人/多人？比如"我和女朋友"）
- 主题色（粉色系/蓝色系/暖色系/其他？）
- 视觉风格（手绘蜡笔/复古胶片/现代极简/绘本）
```

---

### Step 3A: 故事回忆页配置（如果选了类型 1 或 3）

#### 3A.1 上传照片

```
请上传照片（3-50 张），我会：
- 自动提取拍摄日期和地点
- 按时间排序
- 生成缩略图
```

用户上传后，处理流程：

```javascript
// 伪代码：照片处理管道
for (const file of uploadedFiles) {
  // 1. 提取 EXIF
  const exif = await extractExif(file)
  const date = exif.DateTimeOriginal || file.lastModified
  const location = exif.GPSLatitude ? { lat: exif.GPSLatitude, lng: exif.GPSLongitude } : null
  
  // 2. 转换为 WebP（如果是 HEIC）
  const webp = file.type.includes('heic') ? await convertToWebP(file) : file
  
  // 3. 压缩（保持质量 85%）
  const compressed = await compressImage(webp, { quality: 85, maxWidth: 1920 })
  
  // 4. 生成缩略图
  const thumb = await generateThumbnail(compressed, { width: 400 })
  
  photos.push({
    original: compressed,
    thumbnail: thumb,
    date,
    location,
    description: '' // 等用户填写
  })
}

// 按日期排序
photos.sort((a, b) => a.date - b.date)
```

显示给用户确认：

```
已处理 {photos.length} 张照片，按时间排序如下：

[缩略图列表，每张显示日期和地点]

请为每张照片补充文字描述（可选，支持 Markdown）：
```

#### 3A.2 文字描述

让用户逐张填写文字描述，或批量导入：

```
你可以：
1. 逐张填写（我会一张张问你）
2. 批量导入（粘贴一段文字，我会按行/段落自动匹配）
3. 跳过（先生成，之后再编辑代码）
```

如果选批量导入，解析逻辑：

```javascript
// 用户粘贴的文字，按段落分割
const paragraphs = userText.split(/\n\n+/).filter(p => p.trim())

// 按顺序匹配照片
photos.forEach((photo, i) => {
  photo.description = paragraphs[i] || ''
})
```

#### 3A.3 动画风格

```
选择动画风格：

1. 滚动触发（推荐）：用户滚动鼠标时，照片依次出现，配合动画效果
2. 自动播放：像幻灯片一样自动切换
3. 点击切换：用户点击按钮才切换到下一张
4. 视频导出：把整个故事导出成视频文件（需要 ffmpeg）
```

#### 3A.4 配音（MVP 暂不支持，留接口）

```
是否需要配音？

1. 不需要
2. 上传音频文件（MP3/WAV）
3. AI 生成（我会朗读每张照片的文字描述）
```

如果选 AI 生成，调用 mowa-media skill：

```javascript
// 为每张照片的描述生成语音
for (const [i, photo] of photos.entries()) {
  if (photo.description) {
    // 调用 mowa-media 的 TTS
    const audio = await generateTTS({
      text: photo.description,
      voice: userSelectedVoice, // 用户选的音色
      speed: 1.0
    })
    photo.voiceover = `voice-${i}.mp3`
    await saveFile(audio, `assets/voices/voice-${i}.mp3`)
  }
}
```

---

### Step 3B: 日记应用配置（如果选了类型 2 或 3）

#### 3B.1 功能模块

```
日记应用包含以下功能模块，请勾选你需要的：

✅ 日记本（必选）：写日记、上传照片/视频、选择心情
☐ 相册：按日期/地点浏览所有照片
☐ 纪念日：重要日期倒计时/正计时
☐ 愿望清单：记录待完成的事，完成后打勾
☐ 时间胶囊：写给未来的信，定时解锁
☐ 恋爱地图：标记去过的地方，回放路线（需选择地图服务）
☐ 留言评论：每条日记下可以互相留言
```

#### 3B.2 技术栈

```
选择技术栈（影响部署方式和成本）：

1. Node + SQLite（推荐，低成本）
   - 适合：私人使用，访问量不大
   - 部署：单台云服务器（最低 1 核 1GB，约 ￥50/月）
   - 优点：成本低，数据完全掌控
   - 缺点：需要自己管理服务器

2. Node + PostgreSQL（推荐，可扩展）
   - 适合：想分享给更多人，或未来功能扩展
   - 部署：前端 Vercel + 后端 Railway + Supabase 数据库
   - 优点：免费额度内可用，可扩展
   - 缺点：需要注册多个平台账号

3. Serverless（免运维）
   - 适合：不想管服务器，只想用
   - 部署：Cloudflare Workers + D1 数据库
   - 优点：全托管，免费额度慷慨
   - 缺点：冷启动延迟，某些功能受限
```

#### 3B.3 存储方案

```
照片和视频存储在哪？

1. 本地存储（推荐，简单）
   - 文件直接保存在服务器磁盘
   - 适合：Node + SQLite

2. 腾讯云 COS
   - 国内访问快，6 个月 50GB 免费
   - 需要：腾讯云账号 + 实名认证

3. Cloudflare R2
   - 免出站流量费，10GB 免费
   - 适合：国际访问

4. AWS S3
   - 全球可用，按量计费
   - 适合：已有 AWS 账号
```

#### 3B.4 地图方案（如果勾选了"恋爱地图"）

```
使用哪个地图服务？

1. 不要地图
2. 高德地图（推荐，国内使用）
   - 30 万次/日免费
   - 需要：实名认证 + API Key
3. Mapbox（国际使用）
   - 50 万次/月免费
   - 需要：注册 + API Key
```

#### 3B.5 认证方式

```
谁可以访问网站？

1. 单一密码：所有页面共享一个密码（最简单）
2. 分区密码：故事页单独密码，日记本另一个密码
3. 双人账号：两个独立账号，各自管理自己的内容（适合情侣）
4. OAuth 登录：Google / GitHub 登录（需域名 + HTTPS）
```

---

### Step 4: 生成项目

收集完所有信息后，开始生成：

```
正在生成你的网站...

✓ 生成前端代码（React + Vite）
✓ 生成后端代码（Express + SQLite）
✓ 处理照片（压缩 + 转码）
✓ 初始化数据库
✓ 生成部署脚本
✓ 生成文档

完成！项目已保存到：[路径]
```

生成的项目结构：

```
my-memory-website/
├── README.md                # 项目说明
├── package.json
├── vite.config.js
├── index.html
├── src/                     # 前端代码
│   ├── Root.jsx             # 路由入口
│   ├── pages/               # 页面组件
│   │   ├── Story.jsx        # 故事页（如果选了）
│   │   ├── Home.jsx         # 日记本首页
│   │   ├── Write.jsx        # 写日记
│   │   └── ...              # 其他页面
│   ├── assets/              # 静态资源
│   │   ├── photos/          # 用户照片（已处理）
│   │   ├── voices/          # 配音（如果有）
│   │   └── doodle/          # 图标资源
│   └── styles/              # 样式
│       ├── diary.css
│       └── story.css
├── server/                  # 后端代码
│   ├── index.js             # Express 入口
│   ├── app.js               # 路由配置
│   ├── db.js                # 数据库初始化
│   ├── config.js            # 配置读取
│   ├── routes/              # API 路由
│   │   ├── entries.js       # 日记 CRUD
│   │   ├── media.js         # 媒体上传
│   │   └── ...              # 其他路由
│   └── .env.example         # 环境变量模板
├── private/                 # 私人数据（gitignore）
│   ├── anniversaries.json   # 纪念日配置
│   ├── footprints.json      # 地图足迹（如果有）
│   └── data/                # SQLite 数据库文件
├── scripts/
│   ├── deploy.sh            # 部署脚本
│   └── backup.sh            # 备份脚本
└── docs/
    ├── 部署指南.md
    ├── 二次开发指南.md
    └── 常见问题.md
```

---

### Step 5: 本地测试

生成项目后，引导用户本地测试：

```
## 本地测试

1. 安装依赖：
   ```bash
   npm install
   cd server && npm install && cd ..
   ```

2. 启动开发服务器：
   ```bash
   npm run dev
   ```

3. 打开浏览器访问：
   - 前端：http://localhost:5173
   - 后端：http://localhost:3020

现在你可以：
- 查看故事页
- 写第一篇日记
- 测试所有功能

满意后，我们开始部署到服务器。
```

---

### Step 6: 部署指导

根据用户选择的技术栈，提供对应的部署方案。

#### 方案 A: Node + SQLite 部署到云服务器

```
## 部署到云服务器

### 1. 购买服务器

推荐配置：
- 腾讯云轻量应用服务器（首年 ￥50）
- 配置：1 核 2GB 内存，40GB 硬盘
- 系统：CentOS 8 / Ubuntu 22.04

购买链接：[腾讯云轻量应用服务器]

### 2. 连接服务器

```bash
ssh root@your-server-ip
```

### 3. 安装环境

```bash
# 安装 Node.js 22
curl -fsSL https://rpm.nodesource.com/setup_22.x | bash -
yum install -y nodejs

# 安装 Git
yum install -y git

# 验证
node -v  # 应该显示 v22.x.x
npm -v
```

### 4. 配置部署密钥

在本地生成 SSH 密钥（如果没有）：

```bash
ssh-keygen -t ed25519 -f .deploy/id_ed25519 -N ""
```

把公钥添加到服务器：

```bash
ssh-copy-id -i .deploy/id_ed25519.pub root@your-server-ip
```

### 5. 配置部署脚本

编辑 `scripts/deploy.sh`，修改这两行：

```bash
SERVER_USER="root"
SERVER_HOST="your-server-ip"
```

### 6. 一键部署

在本地运行：

```bash
bash scripts/deploy.sh
```

脚本会自动：
- ✓ 构建前端
- ✓ 打包代码
- ✓ 上传到服务器
- ✓ 安装依赖
- ✓ 配置 systemd 服务
- ✓ 启动网站
- ✓ 健康检查

### 7. 配置域名（可选）

如果有域名，需要：
1. 域名解析：添加 A 记录指向服务器 IP
2. 安装 Nginx + SSL 证书
3. 配置反向代理

详细步骤见：docs/部署指南.md#域名配置
```

#### 方案 B: Serverless 部署到 Vercel

```
## 部署到 Vercel（免费）

### 1. 安装 Vercel CLI

```bash
npm i -g vercel
```

### 2. 登录

```bash
vercel login
```

### 3. 部署

```bash
vercel deploy
```

按提示操作：
- 项目名称：my-memory-website
- 是否链接到现有项目？No
- 配置环境变量：根据提示输入

部署完成后，会得到一个 .vercel.app 域名。

### 4. 配置环境变量

在 Vercel Dashboard 配置：
- `DATABASE_URL`: Supabase 数据库连接字符串
- `COS_SECRET_ID` / `COS_SECRET_KEY`: 如果用了腾讯云存储
- `AMAP_KEY`: 如果用了高德地图

详细步骤见：docs/部署指南.md#Vercel部署
```

---

### Step 7: 后续支持

生成完成后，告诉用户：

```
✓ 网站已部署！

你现在可以：
- 访问网站，分享给 TA
- 继续写日记，上传照片
- 查看文档，了解更多功能

需要帮助？
- 文档：docs/ 目录下有详细说明
- 常见问题：docs/常见问题.md
- 二次开发：docs/二次开发指南.md

---

如果你觉得这个 skill 有用，欢迎：
- 在 GitHub 上 star ⭐️
- 分享给朋友
- 提交你的作品到 Showcase
```

---

## 技术实现细节

### 占位符替换系统

模板文件使用 Handlebars 风格的占位符：

```javascript
const templateVars = {
  PROJECT_NAME: userConfig.projectName,
  DESCRIPTION: userConfig.description,
  THEME_COLOR: userConfig.themeColor,
  HAS_STORY: userConfig.modules.includes('story'),
  HAS_DIARY: userConfig.modules.includes('diary'),
  HAS_MAP: userConfig.modules.includes('map'),
  HAS_ANNIVERSARY: userConfig.modules.includes('anniversary'),
  // ...
}

// 替换模板
const rendered = Handlebars.compile(templateContent)(templateVars)
```

### 模块组装逻辑

```javascript
// 根据用户勾选的模块，复制对应的文件
const modulesToCopy = []

if (userConfig.modules.includes('diary')) {
  modulesToCopy.push('src/pages/Home.jsx', 'src/pages/Write.jsx', 'server/routes/entries.js')
}

if (userConfig.modules.includes('album')) {
  modulesToCopy.push('src/pages/Album.jsx', 'server/routes/media.js')
}

if (userConfig.modules.includes('anniversary')) {
  modulesToCopy.push('src/pages/Anniversary.jsx', 'server/routes/anniversaries.js')
}

// 如果勾选了地图，还需要复制地图相关文件
if (userConfig.modules.includes('map')) {
  modulesToCopy.push(
    'src/pages/MapPage.jsx',
    'src/mapUtil.js',
    'server/routes/map.js',
    'server/geo.js'
  )
  
  // 如果选了高德，复制高德配置脚本
  if (userConfig.mapProvider === 'amap') {
    modulesToCopy.push('scripts/setup-amap.sh', '配置高德地图.command')
  }
}

// 复制文件到生成目录
for (const file of modulesToCopy) {
  const src = path.join(TEMPLATE_DIR, file)
  const dest = path.join(outputDir, file)
  await fs.copy(src, dest)
}
```

### 数据库初始化

```javascript
// 根据模块生成建表 SQL
function generateDbSchema(modules) {
  const tables = [
    // 基础表（必有）
    `CREATE TABLE entries (...)`,
    `CREATE TABLE media (...)`
  ]
  
  if (modules.includes('anniversary')) {
    tables.push(`CREATE TABLE anniversaries (...)`)
  }
  
  if (modules.includes('wish')) {
    tables.push(`CREATE TABLE wishes (...)`)
  }
  
  if (modules.includes('capsule')) {
    tables.push(`CREATE TABLE capsules (...)`)
  }
  
  if (modules.includes('map')) {
    tables.push(`CREATE TABLE footprints (...)`)
  }
  
  if (modules.includes('comment')) {
    tables.push(`CREATE TABLE comments (...)`)
  }
  
  return tables.join(';\n\n') + ';'
}

// 写入 server/db.js
const dbCode = `
const Database = require('better-sqlite3')
const db = new Database('./private/data/diary.db')

// 建表
db.exec(\`
${generateDbSchema(userConfig.modules)}
\`)

module.exports = db
`

await fs.writeFile(path.join(outputDir, 'server/db.js'), dbCode)
```

### 照片处理实现

使用 sharp 库：

```javascript
const sharp = require('sharp')
const exifParser = require('exif-parser')

async function processPhoto(file) {
  // 读取 EXIF
  const buffer = await fs.readFile(file.path)
  const parser = exifParser.create(buffer)
  const exif = parser.parse()
  
  // 提取日期
  const date = exif.tags.DateTimeOriginal 
    ? new Date(exif.tags.DateTimeOriginal * 1000) 
    : new Date(file.mtime)
  
  // 提取 GPS
  const location = exif.tags.GPSLatitude ? {
    lat: exif.tags.GPSLatitude,
    lng: exif.tags.GPSLongitude
  } : null
  
  // 压缩原图（保持宽高比，长边不超过 1920px）
  const compressed = await sharp(buffer)
    .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer()
  
  // 生成缩略图
  const thumb = await sharp(buffer)
    .resize(400, 400, { fit: 'cover' })
    .webp({ quality: 80 })
    .toBuffer()
  
  return {
    original: compressed,
    thumbnail: thumb,
    date,
    location
  }
}
```

### 配音生成（调用 mowa-media）

```javascript
async function generateVoiceovers(photos, voice) {
  for (const [i, photo] of photos.entries()) {
    if (!photo.description) continue
    
    // 调用 mowa-media skill 的 TTS
    const result = await callMcpTool('mcp__mowa-media__tts', {
      text: photo.description,
      voice: voice, // 如 'zh-CN-XiaoxiaoNeural'
      speed: 1.0
    })
    
    // 保存音频
    const audioPath = `assets/voices/voice-${i}.mp3`
    await fs.writeFile(
      path.join(outputDir, 'src', audioPath),
      Buffer.from(result.audio, 'base64')
    )
    
    photo.voiceover = audioPath
  }
}
```

---

## MVP 范围控制

第一版只做核心功能，快速验证：

### 支持
- ✅ 故事回忆页（React + GSAP，滚动触发动画）
- ✅ 日记本（CRUD + 照片上传）
- ✅ 相册（按日期浏览）
- ✅ 纪念日（倒计时/正计时）
- ✅ Node + SQLite 技术栈
- ✅ 本地存储
- ✅ 单一密码认证
- ✅ 手绘蜡笔视觉风格
- ✅ 手动部署到服务器

### 不支持（留到 Phase 2）
- ☐ 自动播放/点击切换/视频导出
- ☐ 配音（上传/AI 生成）
- ☐ 愿望清单/时间胶囊/留言
- ☐ 恋爱地图
- ☐ 云存储（COS/S3/R2）
- ☐ Serverless 部署
- ☐ 双人账号
- ☐ 其他视觉风格

---

## 错误处理

### 照片上传失败

```
✗ 照片 {filename} 处理失败：{error}

可能原因：
- 文件格式不支持（支持：JPG, PNG, HEIC, WebP）
- 文件损坏
- 文件过大（单张不超过 20MB）

请重新上传，或跳过这张。
```

### 部署失败

```
✗ 部署失败：无法连接到服务器

请检查：
1. 服务器 IP 是否正确
2. SSH 密钥是否已添加到服务器
3. 服务器防火墙是否开放 22 端口

详细错误：{error}

需要帮助？运行：bash scripts/deploy.sh --debug
```

### 数据库初始化失败

```
✗ 数据库初始化失败：{error}

请检查：
1. private/data/ 目录是否存在
2. 是否有写入权限
3. 磁盘空间是否充足

如果问题持续，删除 private/data/diary.db 后重试。
```

---

## 下一步计划

MVP 完成后，逐步添加功能：

### Phase 2: 功能扩展
- 愿望清单 + 时间胶囊 + 留言
- 恋爱地图（高德 + Mapbox）
- 云存储（COS / S3 / R2）
- 双人账号

### Phase 3: 部署优化
- Serverless 模板（Cloudflare Workers + D1）
- 一键部署到 Vercel
- Docker 镜像

### Phase 4: 视觉多样化
- 复古胶片风
- 现代极简风
- 绘本风
- 自定义主题色

### Phase 5: 高级功能
- 配音（上传 / AI TTS）
- 视频导出
- 日记搜索 + 回收站
- 记忆相册导出
- 周年提醒推送

---

## 成功案例

第一个用这个 skill 生成的网站：**xlovey.cn**（XIAO 与英英）

包含功能：
- 故事回忆页（35 张照片 + 滚动动画 + 背景音乐）
- 完整日记本（已写 50+ 篇日记）
- 相册、纪念日、愿望清单、时间胶囊、留言
- 恋爱地图（高德 API + 自定义蜡笔风标记）
- 手绘蜡笔图标（45 张）

技术栈：React + GSAP + Express + SQLite
部署：腾讯云首尔轻量服务器（￥50/月）

> "从零到部署只用了 3 天，其中 2 天在画图标 😂" —— XIAO

---

## 许可

本 skill 使用 MIT 协议，生成的代码同样是 MIT 协议，你可以：
- 自由使用、修改、分发
- 用于商业项目
- 移除版权声明

但请保留原作者信息，让更多人发现这个工具。

---

## 贡献

欢迎贡献新模板、新功能、新视觉风格！

GitHub: [memory-website-builder]
文档站: [docs.memory-website.dev]
Showcase: [showcase.memory-website.dev]
