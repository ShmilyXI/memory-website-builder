# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Wish list, time capsule, and comment modules
- Love map with Gaode/Mapbox integration
- Cloud storage support (COS/S3/R2)
- Dual account system
- AI voiceover (upload/TTS)
- Serverless deployment (Cloudflare Workers + D1)
- One-click Vercel deployment
- Additional visual styles (vintage, minimal, storybook)

## [0.1.0] - 2026-10-12

### Added
- Initial release of Memory Website Builder skill
- Story timeline page with GSAP scroll animations
- Basic diary app with CRUD operations
- Photo upload with EXIF extraction and processing
- Album and anniversary modules
- Node.js + SQLite tech stack template
- Hand-drawn crayon doodle icon style
- Local storage for media files
- Single password authentication
- Manual deployment script for cloud servers
- Comprehensive documentation (deployment guide, customization guide, FAQ)

### Templates
- `story-timeline/react-gsap` - Story page with scroll-triggered animations
- `diary-app/node-sqlite` - Full-featured diary application

### Scripts
- Photo processing pipeline (compression, EXIF, format conversion)
- Database initialization
- Deployment automation

---

## Release Notes

### v0.1.0 - MVP Release

This is the first public release of Memory Website Builder, based on the [xlovey.cn](https://xlovey.cn) project.

**What's included:**
- ✅ Complete story timeline with photo upload and animation
- ✅ Diary system with photo/video support
- ✅ Album and anniversary features
- ✅ Guided CLI workflow for project generation
- ✅ One-click deployment script
- ✅ Full documentation in Chinese and English

**Known limitations:**
- Map feature not yet included (coming in v0.2.0)
- Serverless deployment not yet supported
- Only one visual style (crayon doodle) available
- Voiceover feature not yet implemented

**Tested environment:**
- Node.js 22.x
- macOS / Linux
- Claude Desktop with Skills enabled

For upgrade instructions and migration guides, see [UPGRADING.md](./docs/UPGRADING.md).
