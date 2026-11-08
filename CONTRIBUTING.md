# Contributing to Memory Website Builder

感谢你考虑为 Memory Website Builder 做出贡献！这份文档将帮助你了解如何参与这个项目。

## 🌟 贡献方式

我们欢迎各种形式的贡献：

### 1. 报告 Bug
如果你发现了 Bug，请：
- 先搜索 [Issues](https://github.com/xiaox/memory-website-builder/issues) 确认没有重复
- [创建新 Issue](https://github.com/xiaox/memory-website-builder/issues/new)，包含：
  - 清晰的标题和描述
  - 复现步骤
  - 预期行为 vs 实际行为
  - 环境信息（操作系统、Node 版本、Claude 版本）
  - 相关日志或截图

### 2. 功能建议
如果你有新功能的想法：
- 先查看 [Roadmap](./README.md#-roadmap) 确认是否已计划
- [创建 Feature Request](https://github.com/xiaox/memory-website-builder/issues/new)，说明：
  - 功能描述和使用场景
  - 为什么这个功能有用
  - 可能的实现方案

### 3. 提交代码
如果你想贡献代码：
- Fork 本仓库
- 创建特性分支（`git checkout -b feature/amazing-feature`）
- 提交你的改动（`git commit -m 'Add amazing feature'`）
- 推送到分支（`git push origin feature/amazing-feature`）
- 提交 Pull Request

### 4. 改进文档
文档永远可以更好：
- 修正拼写/语法错误
- 补充缺失的说明
- 添加示例和最佳实践
- 翻译成其他语言

### 5. 贡献模板
你可以贡献新的：
- 视觉风格（复古、极简、绘本等）
- 功能模块（搜索、标签、导出等）
- 技术栈模板（Deno、Go、Python 后端等）

## 📋 开发指南

### 环境准备

```bash
# 克隆仓库
git clone https://github.com/xiaox/memory-website-builder.git
cd memory-website-builder

# 安装依赖
npm install
cd skill && npm install && cd ..

# 链接到 Claude
ln -s "$(pwd)/skill" ~/.claude/skills/memory-website
```

### 项目结构

```
memory-website-builder/
├── skill/              # Skill 核心逻辑
│   ├── SKILL.md       # 引导流程
│   ├── scripts/       # 工具脚本
│   └── lib/           # 共享代码
├── templates/         # 项目模板
│   ├── story-timeline/
│   └── diary-app/
├── docs/              # 文档
├── examples/          # 示例项目
└── tests/             # 测试
```

### 代码规范

- 使用 ESLint 和 Prettier
- 提交前运行 `npm run lint` 和 `npm test`
- 遵循现有代码风格
- 添加必要的注释和文档

### 提交信息规范

使用语义化提交信息：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type：**
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具相关

**示例：**

```
feat(diary): 添加日记搜索功能

- 实现全文搜索
- 支持按日期范围筛选
- 添加搜索结果高亮

Closes #123
```

## 🎨 贡献模板

### 视觉风格模板

如果你想贡献新的视觉风格：

1. 在 `templates/styles/` 创建新目录，如 `vintage/`
2. 提供完整的 CSS 文件
3. 添加截图到 `assets/styles-preview/`
4. 更新 `docs/STYLE_GUIDE.md`

**模板结构：**

```
templates/styles/vintage/
├── README.md           # 风格说明
├── variables.css       # CSS 变量
├── components.css      # 组件样式
├── animations.css      # 动画效果
└── preview.png         # 预览图
```

### 功能模块模板

如果你想添加新的功能模块：

1. 在 `templates/modules/` 创建模块目录
2. 提供前后端代码、数据库 Schema、API 文档
3. 添加测试用例
4. 更新主 Skill 的引导流程

**模块结构：**

```
templates/modules/search/
├── README.md           # 模块说明
├── frontend/           # 前端组件
│   ├── SearchBar.jsx
│   └── SearchResults.jsx
├── backend/            # 后端路由
│   └── routes/search.js
├── schema.sql          # 数据库变更
└── tests/              # 测试用例
```

## 🧪 测试

运行测试：

```bash
# 单元测试
npm test

# 集成测试
npm run test:integration

# E2E 测试
npm run test:e2e
```

添加测试：
- 新功能必须包含测试
- 测试覆盖率至少 80%
- E2E 测试覆盖核心用户流程

## 📝 文档

更新文档时请注意：

- 保持中英文版本同步
- 使用清晰的标题和结构
- 提供代码示例
- 添加截图说明（如需要）

## 🔍 代码审查

Pull Request 提交后：

- 维护者会在 3-5 天内审查
- 可能会要求修改或补充说明
- 保持友好和建设性的讨论
- 审查通过后会合并到主分支

## 📜 许可证

贡献的代码将使用 MIT License，与项目保持一致。

提交 PR 即表示你同意：
- 你拥有代码的版权
- 你授权项目使用你的代码

## 🙏 行为准则

参与项目时请：

- 尊重他人，保持友好和专业
- 欢迎新手，耐心解答问题
- 接受建设性的批评
- 关注项目的最佳利益

我们致力于营造一个开放、包容、友好的社区。

## 💬 联系方式

- **GitHub Issues**: 技术问题和 Bug 报告
- **GitHub Discussions**: 功能讨论和使用交流
- **Email**: xiaox@example.com（紧急问题）

---

再次感谢你的贡献！每一份帮助都让这个项目变得更好。

如果你是第一次贡献开源项目，可以参考 [First Contributions](https://github.com/firstcontributions/first-contributions)。
