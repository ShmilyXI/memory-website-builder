<div align="center">

![Memory Website Builder](./assets/hero-banner.png)

# 💌 Memory Website Builder

**10 分钟搭建专属回忆网站 · 用 AI 讲述你们的故事**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Claude Skill](https://img.shields.io/badge/Claude-Skill-purple.svg)](https://github.com/anthropics/claude-desktop)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

[快速开始](#快速开始) · [功能展示](#功能展示) · [在线案例](#在线案例) · [技术文档](#技术文档)

</div>

---

## ✨ 这是什么？

这是一个 Claude Skill，帮你快速搭建一个**带故事回忆路线**的个人网站。

无需编程基础，只需：
1. 🗣️ **回答几个问题**（网站名称、视觉风格、功能模块）
2. 📸 **上传照片**（AI 自动提取日期地点，生成时间线）
3. ⚡ **一键生成**（完整项目代码 + 部署脚本 + 详细文档）

适用场景：
- 💑 **恋爱纪念日**：送给 TA 的礼物
- 👨‍👩‍👧‍👦 **家庭相册**：记录孩子成长、家人回忆
- 📝 **个人博客**：生活日志、旅行游记
- 🎓 **毕业纪念**：班级回忆录

---

## 🎬 功能展示

### 故事回忆路线 - 滚动触发动画

![Story Timeline](./assets/feature-story.png)

**核心特性**：
- 📸 上传 3-50 张照片，自动按时间排序
- ✍️ 为每张照片配上文字描述（支持 Markdown）
- 🎬 GSAP 滚动动画，依次展现每个瞬间
- 🎵 可选配音（上传音频 / AI 朗读）
- 📱 响应式设计，手机/电脑都能完美展示

---

### 日记应用 - 完整功能模块

![Diary App](./assets/feature-diary.png)

**可选模块**（自由组合）：
- ✅ **日记本**（必选）：CRUD、照片/视频、心情标签、位置
- 📷 **相册**：按日期/地点/标签浏览照片
- 🎂 **纪念日**：重要日期倒计时/正计时
- 🌟 **愿望清单**：待完成事项 + 完成记录
- 💌 **时间胶囊**：定时解锁的信件
- 🗺️ **恋爱地图**：足迹标记、路线回放
- 💬 **留言评论**：每条日记下的互动

---

### 恋爱地图 - 自定义风格标记

![Love Map](./assets/feature-map.png)

**地图特色**：
- 🎨 **手绘风格**：不是标准 Google Maps，而是独特的绘本风格标记
- 📍 **多种来源**：
  - 日记地理位置（写日记时标记）
  - 照片 GPS 信息（自动提取）
  - 手动添加的足迹点
- 🛣️ **路线回放**：按时间顺序播放你们的旅程
- 🌈 **省份高亮**：去过的省份自动高亮显示
- 🎯 **聚合显示**：地图缩小时，附近的点自动聚合

---

## 🚀 快速开始

### 1. 安装 Claude Desktop

下载并安装 [Claude Desktop](https://claude.ai/download)（需要 Pro 订阅以使用 Skills）。

### 2. 添加 Skill

**方法一：从 GitHub 安装**

```bash
# 克隆仓库
git clone https://github.com/xiaox/memory-website-builder.git

# 将 skill 目录链接到 Claude
ln -s "$(pwd)/memory-website-builder/skill" ~/.claude/skills/memory-website
```

**方法二：直接下载**

1. 下载本仓库的 `skill/` 目录
2. 放到 `~/.claude/skills/memory-website/`
3. 重启 Claude Desktop

### 3. 开始使用

在 Claude Desktop 中输入：

```
做一个回忆网站
```

或者

```
/memory-website
```

然后跟随 AI 的引导，回答问题、上传照片，10 分钟后你就能得到一个完整的网站项目！

---

## 📦 生成的项目包含什么？

```
my-memory-website/
├── 📄 README.md              # 项目说明
├── 📦 package.json
├── ⚙️ vite.config.js
├── 🏠 index.html
├── 📁 src/                   # 前端代码
│   ├── Root.jsx              # 路由入口
│   ├── pages/                # 页面组件
│   │   ├── Story.jsx         # 故事页
│   │   ├── Home.jsx          # 日记首页
│   │   ├── Write.jsx         # 写日记
│   │   └── ...
│   ├── assets/               # 你的照片（已处理）
│   │   ├── photos/
│   │   ├── voices/           # 配音（如果有）
│   │   └── doodle/           # 图标资源
│   └── styles/               # 样式文件
├── 📁 server/                # 后端代码
│   ├── index.js              # Express 入口
│   ├── db.js                 # 数据库初始化
│   ├── routes/               # API 路由
│   └── .env.example          # 环境变量模板
├── 📁 scripts/
│   ├── deploy.sh             # 一键部署脚本
│   └── backup.sh             # 备份脚本
└── 📁 docs/
    ├── 部署指南.md
    ├── 二次开发指南.md
    └── 常见问题.md
```

---

## 🎨 技术栈选项

生成项目时，你可以选择不同的技术栈：

### 前端（固定）
- **React 18** + **Vite** + **GSAP**（滚动动画）

### 后端选项

| 方案 | 适合场景 | 部署方式 | 成本 |
|------|---------|---------|------|
| **Node + SQLite** | 私人使用，访问量不大 | 云服务器 | ￥50-100/月 |
| **Node + PostgreSQL** | 需要分享，未来扩展 | Vercel + Railway + Supabase | 免费额度内可用 |
| **Serverless** | 不想管服务器 | Cloudflare Workers + D1 | 免费额度内可用 |

### 存储选项

| 方案 | 速度 | 成本 | 备注 |
|------|------|------|------|
| **本地存储** | 快 | 0 | 文件保存在服务器磁盘 |
| **腾讯云 COS** | 国内快 | 6 个月 50GB 免费 | 需实名认证 |
| **Cloudflare R2** | 全球可用 | 10GB 免费 | 免出站流量费 |
| **AWS S3** | 全球可用 | 按量计费 | 适合已有 AWS 账号 |

### 地图选项（可选）

- **高德地图**：国内使用，30 万次/日免费
- **Mapbox**：国际使用，50 万次/月免费

---

## 🌟 在线案例

<table>
<tr>
<td width="50%">

### [xlovey.cn](https://xlovey.cn) - XIAO 与英英

完整功能演示：
- 故事回忆页（35 张照片）
- 日记本（50+ 篇日记）
- 相册 + 纪念日
- 愿望清单 + 时间胶囊
- 恋爱地图（高德 API）
- 45 个手绘蜡笔图标

**技术栈**：React + GSAP + Express + SQLite  
**部署**：腾讯云首尔服务器（￥50/月）

> "从零到部署只用了 3 天，其中 2 天在画图标 😂" —— XIAO

</td>
<td width="50%">

### 征集你的作品！

如果你用这个 Skill 做了自己的回忆网站，欢迎提交到 Showcase！

**提交方式**：
1. Fork 本仓库
2. 在 `examples/` 目录添加你的项目截图和介绍
3. 提交 PR

我们会在 README 和文档站展示你的作品。

</td>
</tr>
</table>

---

## 📚 技术文档

- [完整使用指南](./docs/USER_GUIDE.md) - 详细的使用流程和配置说明
- [部署指南](./docs/DEPLOYMENT.md) - 各种部署方案的详细步骤
- [二次开发指南](./docs/CUSTOMIZATION.md) - 如何修改代码、添加功能
- [模板开发指南](./docs/TEMPLATE_DEV.md) - 如何贡献新的视觉风格和模板
- [常见问题](./docs/FAQ.md) - 疑难解答

---

## 🤝 贡献指南

我们欢迎各种形式的贡献：

- 🐛 **报告 Bug**：[提交 Issue](https://github.com/xiaox/memory-website-builder/issues)
- ✨ **新功能建议**：[提交 Feature Request](https://github.com/xiaox/memory-website-builder/issues)
- 🎨 **贡献新模板**：提交新的视觉风格、功能模块
- 📖 **改进文档**：修正错误、补充说明
- 💬 **分享经验**：[GitHub Discussions](https://github.com/xiaox/memory-website-builder/discussions)

详细的贡献流程见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

---

## 🗺️ Roadmap

### ✅ Phase 1: MVP（当前版本 v0.1.0）
- [x] 故事回忆页（React + GSAP）
- [x] 日记本基础功能（CRUD + 照片）
- [x] 相册 + 纪念日
- [x] Node + SQLite 技术栈
- [x] 手动部署到服务器
- [x] 手绘蜡笔视觉风格

### 🚧 Phase 2: 功能扩展（计划中）
- [ ] 愿望清单 + 时间胶囊 + 留言
- [ ] 恋爱地图（高德 + Mapbox）
- [ ] 云存储（COS / S3 / R2）
- [ ] 双人账号系统
- [ ] AI 配音（上传 / TTS）

### 🔮 Phase 3: 部署优化（计划中）
- [ ] Serverless 模板（Cloudflare Workers + D1）
- [ ] 一键部署到 Vercel
- [ ] Docker 镜像
- [ ] Vercel Template 一键启动

### 🎨 Phase 4: 视觉多样化（计划中）
- [ ] 复古胶片风
- [ ] 现代极简风
- [ ] 绘本风
- [ ] 自定义主题色生成器

### 🚀 Phase 5: 高级功能（未来）
- [ ] 视频导出（把整个故事导出成视频）
- [ ] 日记搜索 + 回收站
- [ ] 记忆相册 PDF 导出
- [ ] 周年提醒推送
- [ ] 多语言支持

---

## 📄 许可证

本项目使用 [MIT License](./LICENSE)。

生成的项目代码同样是 MIT 协议，你可以：
- ✅ 自由使用、修改、分发
- ✅ 用于商业项目
- ✅ 移除版权声明

---

## 💖 致谢

- 灵感来源：[xlovey.cn](https://xlovey.cn) - XIAO 送给英英的第一个回忆网站
- 动画库：[GSAP](https://greensock.com/gsap/) - 强大的 Web 动画引擎
- 地图 API：[高德地图](https://lbs.amap.com/) / [Mapbox](https://www.mapbox.com/)
- 图标生成：AI 绘画（gpt-image-2.5）

---

## 🌐 相关链接

- **GitHub 仓库**：[https://github.com/xiaox/memory-website-builder](https://github.com/xiaox/memory-website-builder)
- **文档站**：[https://memory-website.dev](https://memory-website.dev)（筹建中）
- **示例作品**：[Showcase](./examples/)
- **社区讨论**：[GitHub Discussions](https://github.com/xiaox/memory-website-builder/discussions)

---

<div align="center">

**用 AI 讲述你们的故事，把回忆留在指尖**

如果这个项目对你有帮助，请给一个 ⭐️ Star 支持！

Made with 💖 by [XIAO](https://github.com/xiaox)

</div>
