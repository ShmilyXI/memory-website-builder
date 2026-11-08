# Story Timeline Template - React + GSAP

基于 GSAP ScrollTrigger 的故事回忆页面模板。

## 特性

- 📜 **滚动触发动画**：用户滚动时，照片依次出现，配合淡入/滑动动画
- 📸 **照片墙**：支持 3-50 张照片，自动按时间排序
- ✍️ **文字描述**：每张照片可配上 Markdown 格式的描述文字
- 🎵 **背景音乐**（可选）：循环播放背景音乐
- 🎤 **配音**（可选）：每张照片可配独立语音
- 📱 **响应式**：自适应手机/平板/桌面

## 使用的技术

- React 18
- GSAP 3.12 (ScrollTrigger plugin)
- CSS Grid / Flexbox

## 占位符变量

在生成项目时，skill 会替换以下占位符：

```javascript
{{PROJECT_NAME}}        // 网站名称，如 "XIAO 与英英"
{{PHOTOS}}              // 照片数组，JSON 格式
{{HAS_VOICE}}           // 是否有配音，boolean
{{HAS_BGM}}             // 是否有背景音乐，boolean
{{THEME_COLOR}}         // 主题色，如 "#FF69B4"
```

## 文件结构

```
story-timeline/react-gsap/
├── src/
│   ├── Story.jsx         # 主组件
│   ├── cute.jsx          # 照片查看器组件
│   ├── ui.jsx            # UI 工具函数
│   └── chrome.jsx        # 密码门组件（可选）
└── README.md
```

## 照片数据格式

```javascript
const photos = [
  {
    id: "photo-001",
    url: "/assets/photos/001.webp",
    date: "2024-06-27",
    caption: "第一次见面",
    description: "那天阳光很好，你穿着白色的裙子...",
    voiceover: "/assets/voices/001.mp3" // 可选
  },
  // ...
]
```

## 自定义

### 修改动画效果

编辑 `Story.jsx` 中的 GSAP 配置：

```javascript
gsap.from(element, {
  opacity: 0,
  y: 100,
  duration: 1,
  scrollTrigger: {
    trigger: element,
    start: "top 80%",
    end: "top 20%",
    toggleActions: "play none none reverse"
  }
})
```

### 更换视觉风格

修改 CSS 变量（在 `diary.css` 或独立的 `story.css`）：

```css
:root {
  --story-bg: #FFF5F7;
  --story-text: #333;
  --story-accent: #FF69B4;
}
```

## 示例

完整示例见：[xlovey.cn/story](https://xlovey.cn/story)
