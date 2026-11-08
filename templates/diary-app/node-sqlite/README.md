# Diary App Template - Node + SQLite

完整的日记应用模板，包含前后端、数据库、部署脚本。

## 特性

### 核心功能
- ✍️ **日记本**：写日记、上传照片/视频、选择心情、标记地点
- 📷 **相册**：按日期/地点浏览所有照片
- 🎂 **纪念日**：重要日期倒计时/正计时

### 可选模块
- 🌟 **愿望清单**：待完成事项 + 完成记录
- 💌 **时间胶囊**：定时解锁的信件
- 🗺️ **恋爱地图**：足迹标记、路线回放
- 💬 **留言评论**：每条日记下的互动

## 技术栈

### 前端
- React 18
- React Router DOM 6
- Vite 5

### 后端
- Node.js 22
- Express 5
- better-sqlite3

### 存储
- SQLite (数据库)
- 本地文件系统 (媒体文件)
- 可选：腾讯云 COS / AWS S3 / Cloudflare R2

## 占位符变量

```javascript
{{PROJECT_NAME}}            // 项目名称
{{DESCRIPTION}}             // 项目描述
{{THEME_COLOR}}             // 主题色
{{HAS_ALBUM}}               // 是否包含相册模块
{{HAS_ANNIVERSARY}}         // 是否包含纪念日模块
{{HAS_WISH}}                // 是否包含愿望清单模块
{{HAS_CAPSULE}}             // 是否包含时间胶囊模块
{{HAS_MAP}}                 // 是否包含恋爱地图模块
{{HAS_COMMENT}}             // 是否包含留言评论模块
{{STORAGE_TYPE}}            // 存储类型：local / cos / s3 / r2
{{MAP_PROVIDER}}            // 地图提供商：amap / mapbox / none
{{AUTH_MODE}}               // 认证模式：single / zone / dual / oauth
```

## 文件结构

```
diary-app/node-sqlite/
├── src/                    # 前端代码
│   ├── Root.jsx           # 路由入口
│   ├── api.js             # API 调用封装
│   ├── icons.jsx          # 图标组件
│   ├── mapUtil.js         # 地图工具（如果有）
│   ├── pages/             # 页面组件
│   │   ├── Home.jsx       # 首页
│   │   ├── Write.jsx      # 写日记
│   │   ├── Diary.jsx      # 日记列表
│   │   ├── Entry.jsx      # 单篇日记
│   │   ├── Album.jsx      # 相册（可选）
│   │   ├── Days.jsx       # 纪念日（可选）
│   │   ├── Wishes.jsx     # 愿望清单（可选）
│   │   ├── Capsules.jsx   # 时间胶囊（可选）
│   │   └── MapPage.jsx    # 地图（可选）
│   ├── diary.css          # 样式
│   └── styles.css         # 基础样式
├── server/                 # 后端代码
│   ├── index.js           # 入口
│   ├── app.js             # Express 配置
│   ├── db.js              # 数据库初始化
│   ├── config.js          # 配置读取
│   ├── routes/            # API 路由
│   │   ├── entries.js     # 日记 CRUD
│   │   ├── media.js       # 媒体上传
│   │   ├── anniversaries.js
│   │   ├── wishes.js
│   │   ├── capsules.js
│   │   ├── map.js
│   │   └── home.js
│   └── .env.example       # 环境变量模板
└── scripts/
    └── deploy.sh          # 部署脚本
```

## 数据库 Schema

核心表（必有）：

```sql
CREATE TABLE entries (
  id INTEGER PRIMARY KEY,
  author TEXT NOT NULL,
  date TEXT NOT NULL,
  mood TEXT,
  body TEXT NOT NULL,
  place TEXT,
  lat REAL,
  lng REAL,
  province TEXT,
  city TEXT,
  adcode TEXT,
  in_story BOOLEAN DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE media (
  id INTEGER PRIMARY KEY,
  entry_id INTEGER,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  thumb_url TEXT,
  size INTEGER,
  width INTEGER,
  height INTEGER,
  duration INTEGER,
  upload_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE
);
```

可选表（根据模块）：

```sql
-- 纪念日
CREATE TABLE anniversaries (...);

-- 愿望清单
CREATE TABLE wishes (...);

-- 时间胶囊
CREATE TABLE capsules (...);

-- 地图足迹
CREATE TABLE footprints (...);

-- 留言评论
CREATE TABLE comments (...);
```

## 环境变量

```bash
# 服务器配置
PORT=3020
DATA_DIR=./private/data
STORY_DIR=./public/story

# 认证
PASSCODE_HASH=<bcrypt hash>
SIGN_SECRET=<random string>

# 存储（如果使用云存储）
COS_SECRET_ID=<腾讯云 ID>
COS_SECRET_KEY=<腾讯云 Key>
COS_BUCKET=<桶名称>
COS_REGION=<区域>

# 地图（如果使用）
AMAP_KEY=<高德 Key>
AMAP_SECURITY=<高德安全密钥>
```

## 部署

### 本地开发

```bash
# 安装依赖
npm install
cd server && npm install && cd ..

# 启动开发服务器
npm run dev
```

### 部署到服务器

```bash
# 修改 scripts/deploy.sh 中的服务器地址
SERVER_USER="root"
SERVER_HOST="your-server-ip"

# 一键部署
bash scripts/deploy.sh
```

脚本会自动：
1. 构建前端
2. 打包代码
3. 上传到服务器
4. 安装依赖
5. 配置 systemd 服务
6. 启动网站
7. 健康检查

## 自定义

### 添加新功能模块

1. **前端**：在 `src/pages/` 添加页面组件
2. **后端**：在 `server/routes/` 添加 API 路由
3. **数据库**：在 `server/db.js` 添加建表语句
4. **路由**：在 `src/Root.jsx` 添加路由规则

### 修改视觉风格

编辑 `src/diary.css` 中的 CSS 变量：

```css
:root {
  --theme: #FF69B4;
  --bg: #FFF5F7;
  --text: #333;
  --card-bg: #FFF;
}
```

### 更换存储方案

修改 `server/routes/media.js` 的上传逻辑：

```javascript
// 本地存储 → 云存储
const uploadToCOS = async (file) => {
  // 使用 cos-nodejs-sdk-v5
}
```

## 示例

完整示例见：[xlovey.cn](https://xlovey.cn)
