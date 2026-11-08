# 🚀 发布到 GitHub 指南

## 准备工作

✅ 已完成：
- Git 仓库已初始化（3 个 commits）
- 所有代码和文档已提交
- 项目结构完整
- LICENSE 和 README 齐全

## 发布步骤

### 1. 在 GitHub 创建仓库

访问 https://github.com/new，填写：

- **Repository name**: `memory-website-builder`
- **Description**: `10 分钟搭建带故事回忆路线的个人网站 | Build your memory website in 10 minutes with AI`
- **Public** ✅（勾选公开）
- ⚠️ **不要勾选** "Add a README file"
- ⚠️ **不要勾选** "Add .gitignore"
- ⚠️ **不要勾选** "Choose a license"

点击 **Create repository**。

### 2. 推送代码到 GitHub

在 **Mac 本地**（不是沙箱）运行：

```bash
cd ~/WorkShop/memory-website-builder

# 添加远程仓库（替换 YOUR_USERNAME）
git remote add origin https://github.com/YOUR_USERNAME/memory-website-builder.git

# 推送代码
git push -u origin main
```

**或者使用辅助脚本**：

```bash
cd ~/WorkShop/memory-website-builder
bash publish.sh
```

### 3. 配置仓库设置

推送成功后，在 GitHub 仓库页面：

#### 3.1 添加话题（Topics）

点击仓库页面右上角的 ⚙️ 设置图标旁边的"Add topics"，添加：

```
claude-skill
memory-website
diary-app
love-diary
gsap-animation
react
nodejs
sqlite
```

#### 3.2 设置仓库主页

在 "About" 部分：
- Website: `https://memory-website.dev`（等文档站搭建好）
- 勾选 ✅ "Use your README.md"

#### 3.3 启用 Discussions（可选）

Settings → General → Features → 勾选 **Discussions**

用于社区讨论和用户交流。

#### 3.4 配置 Issue 模板（可选）

Settings → Features → Set up templates

创建：
- Bug report
- Feature request
- Question

#### 3.5 添加标签（Labels）

Settings → Labels，添加：
- `enhancement` - 新功能
- `bug` - Bug
- `documentation` - 文档
- `good first issue` - 适合新手
- `help wanted` - 需要帮助
- `template` - 模板相关
- `question` - 问题

### 4. 创建 Release（可选）

在仓库页面点击右侧的 **Releases** → **Create a new release**：

- **Tag version**: `v0.1.0`
- **Release title**: `v0.1.0 - Initial MVP Release`
- **Description**: 复制 CHANGELOG.md 中的内容
- 勾选 ✅ **This is a pre-release**（因为还在测试阶段）
- 点击 **Publish release**

### 5. 宣传推广（可选）

#### 5.1 发布到 Claude Community

在 Claude Desktop 的 Community 频道分享：

```
🎉 开源了一个 Claude Skill：Memory Website Builder

10 分钟搭建带故事回忆路线的个人网站，适合恋爱纪念日、家庭相册、个人博客。

包含：
- 完整的前后端模板
- GSAP 滚动动画故事页
- 日记本 + 相册 + 地图等功能
- 一键部署脚本

GitHub: https://github.com/YOUR_USERNAME/memory-website-builder

基于真实案例 xlovey.cn 提取，生产级可用。欢迎试用和反馈！
```

#### 5.2 发到 V2EX / 少数派 / 即刻（可选）

写一篇使用教程或开发日志，附上 GitHub 链接。

#### 5.3 提交到 Awesome Lists（可选）

- Awesome Claude Skills（如果有）
- Awesome React Projects
- Awesome GSAP

### 6. 后续维护

- **Watch Issues**: 及时回复用户问题
- **Review PRs**: 审查社区贡献
- **更新文档**: 根据反馈完善文档
- **发布新版本**: 添加新功能时创建新 Release

---

## 常见问题

### Q: git push 失败，提示 403

A: 需要配置 GitHub 认证。两种方式：

**方式 1：SSH（推荐）**

```bash
# 生成 SSH 密钥（如果没有）
ssh-keygen -t ed25519 -C "your_email@example.com"

# 复制公钥
cat ~/.ssh/id_ed25519.pub

# 添加到 GitHub：Settings → SSH and GPG keys → New SSH key

# 修改远程仓库地址为 SSH
git remote set-url origin git@github.com:YOUR_USERNAME/memory-website-builder.git

# 再次推送
git push -u origin main
```

**方式 2：Personal Access Token**

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token
2. 勾选 `repo` 权限
3. 复制生成的 token（只显示一次！）
4. 推送时输入：
   - Username: 你的 GitHub 用户名
   - Password: 粘贴刚才的 token

### Q: 推送成功但 README 图片不显示

A: 确保图片路径正确。GitHub 上相对路径是：
```markdown
![Image](./assets/hero-banner.png)
```

### Q: 想修改仓库名称

A: 
1. GitHub → Settings → Repository name → Rename
2. 本地更新远程地址：
   ```bash
   git remote set-url origin https://github.com/YOUR_USERNAME/NEW_NAME.git
   ```

---

## 检查清单

发布前确认：

- [ ] 代码已全部提交
- [ ] README 完整且图片正常显示
- [ ] LICENSE 文件存在
- [ ] .gitignore 排除了 node_modules 等
- [ ] 敏感信息已移除（API keys、密码等）
- [ ] GitHub 仓库创建成功
- [ ] 代码推送成功
- [ ] Topics 已添加
- [ ] README 设置为主页
- [ ] （可选）Discussions 已启用
- [ ] （可选）Release 已创建

---

准备好了就运行 `bash publish.sh` 开始发布吧！🚀
