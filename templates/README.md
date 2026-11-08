# Memory Website Templates

Templates extracted from yingying-site (xlovey.cn) for creating memory/diary websites.

## Available Templates

### 1. Story Timeline (React + GSAP)
**Location**: `story-timeline/react-gsap/`  
**Size**: ~56KB | 5 files

A scroll-triggered animated timeline for displaying memories in a cinematic way.

**Best for**:
- Story-focused presentations
- Memory timelines
- Photo narratives
- Anniversary websites

**Key features**: GSAP animations, photo viewer, password gate

---

### 2. Diary App (Node + SQLite)
**Location**: `diary-app/node-sqlite/`  
**Size**: ~5.7MB | 127 files

A complete diary web application with backend, database, and advanced features.

**Best for**:
- Personal diary/journal sites
- Couple memory websites
- Photo/video albums
- Travel logs

**Key features**: Full CRUD, map integration, wishlists, time capsules, PWA

---

## Quick Start

### Story Timeline
```bash
cd story-timeline/react-gsap/
# Add to your React app or adapt standalone
# See README.md in template directory
```

### Diary App
```bash
cd diary-app/node-sqlite/

# Frontend
npm install
npm run dev

# Backend (separate terminal)
cd server
npm install
npm start
```

## Template Comparison

| Feature | Story Timeline | Diary App |
|---------|---------------|-----------|
| **Frontend** | React + GSAP | React + Vite |
| **Backend** | None | Node + Express |
| **Database** | None | SQLite |
| **Complexity** | Low | High |
| **Setup Time** | 5 min | 30 min |
| **Features** | Basic display | Full featured |
| **Customization** | Easy | Moderate |
| **Best Use** | Display only | Interactive app |

## Design Language

Both templates share a consistent aesthetic:
- **Colors**: Cream background (#fffbf3), pink (#e0457b), yellow (#ffdb8a)
- **Typography**: ZCOOL KuaiLe (titles), LXGW WenKai (handwriting)
- **Style**: Doodle/crayon with hard shadows and rounded borders
- **Layout**: Mobile-first, responsive

## Source

Extracted from **yingying-site** (xlovey.cn) — a private couple's memory website with 6 milestones:
- M1: Story timeline
- M2: Diary system
- M3: Photo album
- M4: Map footprints
- M5: Video integration
- M6: Advanced features (wishes, capsules, anniversaries)

All code is complete, tested, and production-ready.

## Customization

### Common Changes
1. **Colors**: Edit CSS variables in `.css` files
2. **Fonts**: Update font family references
3. **Password**: Modify in `chrome.jsx`
4. **Content**: Replace data structures with your content
5. **Features**: Enable/disable in routing config

### Story Timeline
- Simplest to customize
- Just update Story.jsx data structure
- Modify styles in story.css

### Diary App
- More complex but more powerful
- Database schema in `server/db.js`
- API routes in `server/routes/`
- UI components in `src/pages/`

## File Structure Summary

```
templates/
├── story-timeline/
│   └── react-gsap/
│       ├── src/
│       │   ├── Story.jsx
│       │   ├── chrome.jsx
│       │   ├── cute.jsx
│       │   ├── ui.jsx
│       │   └── story.css
│       └── README.md
│
├── diary-app/
│   └── node-sqlite/
│       ├── src/              # Frontend React app
│       │   ├── pages/       # Page components
│       │   └── ...
│       ├── server/          # Backend Node app
│       │   ├── routes/     # API endpoints
│       │   └── ...
│       ├── scripts/         # Deploy scripts
│       ├── private/         # JSON data (examples)
│       └── README.md
│
└── FILE_STRUCTURE.txt       # Detailed file listing
```

## Notes

- **Sensitive data removed**: All passwords, API keys, personal data cleaned
- **Complete code**: No functionality removed, ready to run
- **Production tested**: Both templates deployed and tested successfully
- **No dependencies on original**: Standalone, self-contained

## Next Steps

1. Choose a template based on your needs
2. Read the template's README.md
3. Install dependencies
4. Customize content and styling
5. Deploy

For detailed file descriptions, see `FILE_STRUCTURE.txt`.

---

**Extracted**: 2024-11  
**Source Project**: yingying-site (xlovey.cn)  
**Maintainer**: xiaox
