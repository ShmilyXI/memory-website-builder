#!/bin/bash
# 发布到 GitHub 的辅助脚本

echo "📦 Memory Website Builder - GitHub 发布助手"
echo ""

# 检查是否在项目根目录
if [ ! -f "skill/SKILL.md" ]; then
  echo "❌ 错误：请在项目根目录运行此脚本"
  exit 1
fi

# 检查 git 状态
if [ -z "$(git status --porcelain)" ]; then
  echo "✅ Git 工作区干净"
else
  echo "⚠️  警告：有未提交的更改"
  git status --short
  read -p "是否继续？(y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

echo ""
echo "请先在 GitHub 上创建新仓库："
echo "1. 访问 https://github.com/new"
echo "2. 仓库名：memory-website-builder"
echo "3. 描述：10分钟搭建带故事回忆路线的个人网站"
echo "4. Public（公开）"
echo "5. 不要勾选任何初始化选项（README/License/.gitignore）"
echo "6. 创建仓库"
echo ""

read -p "已创建仓库？按回车继续... " -r
echo ""

read -p "请输入你的 GitHub 用户名: " username
echo ""

if [ -z "$username" ]; then
  echo "❌ 错误：用户名不能为空"
  exit 1
fi

# 设置远程仓库
REPO_URL="https://github.com/${username}/memory-website-builder.git"
echo "🔗 设置远程仓库: $REPO_URL"
git remote add origin "$REPO_URL" 2>/dev/null || git remote set-url origin "$REPO_URL"

# 推送代码
echo "📤 推送代码到 GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ 发布成功！"
  echo ""
  echo "🌐 你的仓库地址："
  echo "   https://github.com/${username}/memory-website-builder"
  echo ""
  echo "📝 建议下一步："
  echo "   1. 在 GitHub 仓库设置中添加话题（Topics）："
  echo "      claude-skill, memory-website, diary-app, gsap-animation"
  echo "   2. 编辑仓库描述"
  echo "   3. 设置仓库主页（使用 README.md）"
  echo "   4. 启用 GitHub Pages（可选）"
  echo ""
else
  echo ""
  echo "❌ 推送失败！"
  echo ""
  echo "可能的原因："
  echo "1. GitHub 用户名错误"
  echo "2. 仓库不存在或未创建"
  echo "3. 没有推送权限（需要配置 SSH key 或 Personal Access Token）"
  echo ""
  echo "详细错误信息见上方输出。"
  echo ""
  echo "手动推送命令："
  echo "  git remote add origin $REPO_URL"
  echo "  git push -u origin main"
fi
