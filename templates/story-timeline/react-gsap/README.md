# Story Timeline Template

A React + GSAP scroll-triggered timeline for displaying memories and stories in an animated, interactive way.

## Features

- **GSAP ScrollTrigger animations**: Smooth, scroll-based timeline progression
- **Password protection**: Built-in password gate (chrome.jsx)
- **Photo viewer**: Full-featured media viewer with zoom and navigation (cute.jsx)
- **Memory chapters**: Organized story sections with metadata
- **Responsive design**: Mobile-first with safe area support
- **Doodle aesthetic**: Crayon-style UI with playful animations

## Files

```
src/
├── Story.jsx      - Main timeline component
├── chrome.jsx     - Password gate and authentication
├── cute.jsx       - Photo/media viewer
├── ui.jsx         - UI utilities and helpers
└── story.css      - Story-specific styles
```

## Dependencies

- React 18+
- GSAP (GreenSock Animation Platform)
- @gsap/react
- React Router (if used as part of larger app)

## Usage

1. Import the Story component
2. Provide memory/chapter data structure
3. Configure password in chrome.jsx if needed
4. Customize colors and fonts via CSS variables

## Customization Points

- **CSS Variables** (story.css):
  - `--f-title`: Title font family
  - `--f-hand`: Handwriting font family
  - `--f-body`: Body font family
  - `--ink`: Border/outline color
  - `--pink`: Accent color

- **Story Data**: Modify chapter structure in Story.jsx
- **Password**: Update in chrome.jsx
- **Photo Sources**: Replace hardcoded photo references with your data

## Notes

- Extracted from yingying-site (xlovey.cn)
- Complete code preserved
- Ready for integration or standalone use
