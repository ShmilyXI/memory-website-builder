import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import Database from 'better-sqlite3'
import { config } from './config.js'

fs.mkdirSync(config.dataDir, { recursive: true })
export const db = new Database(path.join(config.dataDir, 'diary.db'))
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
CREATE TABLE IF NOT EXISTS entries (
  id          TEXT PRIMARY KEY,
  date        TEXT NOT NULL,
  title       TEXT,
  body        TEXT NOT NULL DEFAULT '',
  mood        TEXT,
  place       TEXT,
  author      TEXT NOT NULL CHECK (author IN ('xiao','ying')),
  featured    INTEGER NOT NULL DEFAULT 0,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL,
  deleted_at  INTEGER
);
CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(date DESC) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS media (
  id          TEXT PRIMARY KEY,
  entry_id    TEXT REFERENCES entries(id),
  kind        TEXT NOT NULL CHECK (kind IN ('image','video')),
  status      TEXT NOT NULL DEFAULT 'ready',
  key         TEXT NOT NULL,
  thumb_key   TEXT,
  orig_key    TEXT,
  width INTEGER, height INTEGER, duration REAL, size INTEGER,
  taken_at    INTEGER,
  lat REAL, lng REAL,
  sort        INTEGER NOT NULL DEFAULT 0,
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_media_entry ON media(entry_id);

CREATE TABLE IF NOT EXISTS reactions (
  entry_id   TEXT NOT NULL REFERENCES entries(id),
  author     TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (entry_id, author)
);

CREATE TABLE IF NOT EXISTS anniversaries (
  id        TEXT PRIMARY KEY,
  title     TEXT NOT NULL,
  date      TEXT NOT NULL,
  calendar  TEXT NOT NULL DEFAULT 'solar' CHECK (calendar IN ('solar','lunar')),
  repeat    TEXT NOT NULL DEFAULT 'yearly' CHECK (repeat IN ('yearly','once')),
  icon      TEXT,
  builtin   INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

-- 愿望清单：想一起做的事。done_at 是做到的那天；entry_id 是做到后写的那篇日记（不加外键，日记被清理后链接自动失效）
CREATE TABLE IF NOT EXISTS wishes (
  id         TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  note       TEXT,
  author     TEXT NOT NULL CHECK (author IN ('xiao','ying')),
  created_at INTEGER NOT NULL,
  done_at    TEXT,
  entry_id   TEXT
);

-- 时间胶囊：到 open_date（北京时间零点）之前，body 不会从任何接口返回
CREATE TABLE IF NOT EXISTS capsules (
  id         TEXT PRIMARY KEY,
  author     TEXT NOT NULL CHECK (author IN ('xiao','ying')),
  title      TEXT,
  body       TEXT NOT NULL,
  open_date  TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  opened_at  INTEGER
);

-- 日记下面的留言（平铺，按时间排）
CREATE TABLE IF NOT EXISTS comments (
  id         TEXT PRIMARY KEY,
  entry_id   TEXT NOT NULL REFERENCES entries(id),
  author     TEXT NOT NULL CHECK (author IN ('xiao','ying')),
  body       TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_comments_entry ON comments(entry_id, created_at);

-- 恋爱地图：不属于某篇日记的「去过的地方」（旅途中的某一站、补上的老地方……）。
-- 坐标是高德用的 GCJ-02；adcode 是区县级的 6 位行政区划代码，前两位 + 0000 就是省，前四位 + 00 就是市。
CREATE TABLE IF NOT EXISTS footprints (
  id         TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  date       TEXT NOT NULL,
  lat        REAL NOT NULL,
  lng        REAL NOT NULL,
  province   TEXT,
  city       TEXT,
  adcode     TEXT,
  note       TEXT,
  icon       TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);
`)

// 日记上的地点（M11）：旧库补几列
const entryCols = db.prepare('PRAGMA table_info(entries)').all().map((c) => c.name)
for (const [col, type] of [['lat', 'REAL'], ['lng', 'REAL'], ['province', 'TEXT'], ['city', 'TEXT'], ['adcode', 'TEXT']]) {
  if (!entryCols.includes(col)) db.exec(`ALTER TABLE entries ADD COLUMN ${col} ${type}`)
}

// 预置的「去过的地方」：故事里的老路线。内容放在 private/footprints.json（不进公开仓库），只在第一次启动时写一次，
// 以后你删了、改了都不会再被写回来。格式：[{ title, date, lat, lng, province, city, adcode, note, icon }]
if (!db.prepare("SELECT 1 FROM meta WHERE key = 'footprints_seeded'").get()) {
  let seed = null
  try { seed = JSON.parse(fs.readFileSync(path.join(config.storyDir, 'footprints.json'), 'utf8')) } catch { /* 没有这个文件就不预置 */ }
  if (Array.isArray(seed)) {
    const ins = db.prepare('INSERT INTO footprints (id,title,date,lat,lng,province,city,adcode,note,icon,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
    const now = Date.now()
    db.transaction(() => {
      seed.forEach((p, i) => ins.run(crypto.randomBytes(8).toString('hex'), p.title, p.date, p.lat, p.lng, p.province ?? null, p.city ?? null, p.adcode ?? null, p.note ?? null, p.icon ?? null, now + i))
      db.prepare("INSERT INTO meta (key, value) VALUES ('footprints_seeded', '1')").run()
    })()
  }
}

// 预置的纪念日，只在表是空的时候写一次。
// 内容放在 private/anniversaries.json（不进公开仓库，因为里面有生日）：
//   [{ "title": "...", "date": "2026-06-30", "calendar": "solar"|"lunar", "icon": "💗", "builtin": true }]
// 农历生日的 date 填「出生那年的农历月日」。文件不存在就只预置「在一起」。
if (db.prepare('SELECT COUNT(*) n FROM anniversaries').get().n === 0) {
  let seed = [{ title: '在一起', date: '2026-06-30', calendar: 'solar', icon: '💗', builtin: true }]
  try { seed = JSON.parse(fs.readFileSync(path.join(config.storyDir, 'anniversaries.json'), 'utf8')) } catch { /* 用默认的 */ }
  const ins = db.prepare('INSERT INTO anniversaries (id,title,date,calendar,repeat,icon,builtin,created_at) VALUES (?,?,?,?,?,?,?,?)')
  const now = Date.now()
  db.transaction(() => seed.forEach((a) => ins.run(crypto.randomUUID(), a.title, a.date, a.calendar === 'lunar' ? 'lunar' : 'solar', 'yearly', a.icon ?? null, a.builtin ? 1 : 0, now)))()
}
