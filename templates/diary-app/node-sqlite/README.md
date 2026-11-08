# Diary App Template (Node + SQLite)

A full-featured, password-protected diary web app with photo albums, maps, wishlists, and time capsules. Built with React + Vite frontend and Node.js + SQLite backend.

## Features

### Core
- **Diary entries**: Rich text entries with photos, videos, voice recordings
- **Photo album**: Grid-based gallery with multiple layout modes
- **Interactive map**: Location footprints with Amap integration
- **Password protection**: Secure access control

### Special Features
- **Wishlist**: Track wishes with progress bars and completion status
- **Time capsules**: Write messages that unlock on future dates
- **On This Day**: View entries from past years on the same date
- **Statistics**: Entry counts, streaks, and activity charts

### Technical
- **PWA support**: Installable, offline-capable
- **RESTful API**: Clean separation between frontend/backend
- **Rate limiting**: Protection against abuse
- **Video/audio**: Full media support with processing
- **Responsive design**: Mobile-first, touch-optimized

## File Structure

```
├── src/                    # Frontend React app
│   ├── pages/             # Page components
│   ├── icons.jsx          # Icon components
│   ├── diary.css          # Main styles
│   └── ...
├── server/                # Backend Node.js app
│   ├── routes/           # API endpoints
│   ├── db.js             # SQLite layer
│   ├── config.js         # Configuration
│   └── ...
├── scripts/              # Deployment scripts
├── private/              # JSON data files (example)
├── public/               # Static assets
└── package.json          # Dependencies
```

## Setup

### 1. Install Dependencies

```bash
# Frontend
npm install

# Backend
cd server
npm install
```

### 2. Configure Environment

```bash
cd server
cp .env.example .env
# Edit .env with your settings
```

### 3. Database Setup

The SQLite database will be created automatically on first run in `server/storage/diary.db`.

### 4. Development

```bash
# Terminal 1: Frontend dev server
npm run dev

# Terminal 2: Backend server
cd server
npm start
```

### 5. Production Build

```bash
# Build frontend
npm run build

# Deploy
./scripts/deploy.sh
```

## Configuration

### Environment Variables (server/.env)

- `PORT`: Server port (default: 3000)
- `PASSWORD`: App password
- `AMAP_KEY`: Amap API key (for map features)
- `UPLOAD_PATH`: Media upload directory

### Private Data Files (private/)

JSON files for static content:
- `memories.json`: Story timeline memories
- `footprints.json`: Map locations
- `anniversaries.json`: Important dates
- `photos.json`: Photo metadata
- `voices.json`: Voice recording metadata

## API Endpoints

### Diary Entries
- `GET /api/entries` - List entries
- `GET /api/entries/:id` - Get entry
- `POST /api/entries` - Create entry
- `PUT /api/entries/:id` - Update entry
- `DELETE /api/entries/:id` - Delete entry

### Features
- `/api/album` - Photo album
- `/api/map` - Map data
- `/api/wishes` - Wishlist
- `/api/capsules` - Time capsules
- `/api/anniversaries` - "On This Day"

### Media
- `POST /api/media/upload` - Upload media
- `GET /media/:file` - Serve media file

## Customization

### Theme (src/diary.css)

CSS variables at the top:
```css
--cream: #fffbf3;
--pink: #e0457b;
--yellow: #ffdb8a;
--ink: #5a2b3c;
--f-title: 'ZCOOL KuaiLe', cursive;
--f-hand: 'LXGW WenKai', cursive;
```

### Feature Flags

Enable/disable features by commenting out routes in `server/app.js` and pages in `src/Root.jsx`.

### Data Structure

Modify database schema in `server/db.js` and corresponding API routes.

## Dependencies

### Frontend
- React 18
- React Router
- GSAP (animations)
- Vite (bundler)

### Backend
- Express
- better-sqlite3
- multer (file uploads)
- express-rate-limit

## Deployment

The included `scripts/deploy.sh` handles:
1. Frontend build
2. File sync to server
3. Server restart

Edit the script with your server details.

## Map Integration

The app uses Amap (高德地图) for location features. To enable:

1. Get API key from [Amap Console](https://console.amap.com/)
2. Run `./scripts/setup-amap.sh` and paste your key
3. Or manually add to `server/.env`: `AMAP_KEY=your_key`

## Notes

- Extracted from yingying-site (xlovey.cn M1-M6)
- All sensitive data removed from examples
- Complete, production-ready codebase
- Includes all features from the original
- Tested and deployed successfully

## Credits

Design language: Doodle/crayon aesthetic  
Fonts: ZCOOL KuaiLe, LXGW WenKai  
Original project: xlovey.cn (2024)
