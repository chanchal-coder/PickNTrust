// Ensures the video_content table exists and has at least one sample video
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

function resolveDbPath() {
  const envUrl = process.env.DATABASE_URL;
  if (envUrl && fs.existsSync(envUrl)) return envUrl;
  const cwdPath = path.join(process.cwd(), 'database.sqlite');
  if (fs.existsSync(cwdPath)) return cwdPath;
  const serverPath = path.join(process.cwd(), 'server', 'database.sqlite');
  if (fs.existsSync(serverPath)) return serverPath;
  // Fall back to cwd even if not exists; SQLite will create it
  return cwdPath;
}

function ensureTable(db) {
  // Create minimal schema if table is missing; avoid conflicting columns
  db.exec(`
    CREATE TABLE IF NOT EXISTS video_content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      video_url TEXT NOT NULL,
      thumbnail_url TEXT,
      platform TEXT,
      category TEXT,
      tags TEXT,
      duration TEXT,
      has_timer INTEGER DEFAULT 0,
      timer_duration INTEGER,
      timer_start_time INTEGER,
      created_at INTEGER DEFAULT (strftime('%s','now'))
    );
  `);
}

function getColumns(db) {
  const rows = db.prepare(`PRAGMA table_info(video_content)`).all();
  return rows.map(r => r.name);
}

function insertSampleIfEmpty(db) {
  const count = db.prepare(`SELECT COUNT(*) as c FROM video_content`).get().c;
  if (count > 0) {
    console.log(`Found ${count} existing video(s); no seeding needed.`);
    return;
  }

  const sample = {
    title: 'Sample Video: Getting Started',
    description: 'A short demo video seeded for testing the admin and UI.',
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnail_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    platform: 'youtube',
    category: 'General',
    tags: JSON.stringify(['demo','getting-started']),
    duration: '3:33',
    has_timer: 0,
    timer_duration: null,
    timer_start_time: null,
    created_at: Math.floor(Date.now() / 1000)
  };

  const cols = getColumns(db);
  const availableKeys = Object.keys(sample).filter(k => cols.includes(k));
  const placeholders = availableKeys.map(() => '?').join(',');
  const sql = `INSERT INTO video_content (${availableKeys.join(',')}) VALUES (${placeholders})`;
  const values = availableKeys.map(k => sample[k]);
  const info = db.prepare(sql).run(values);
  console.log(`Inserted sample video with rowid=${info.lastInsertRowid}`);
}

function main() {
  console.log('🔧 Ensuring video_content has at least one entry...');
  const dbPath = resolveDbPath();
  console.log(`Using database: ${dbPath}`);
  const db = new Database(dbPath);
  try {
    ensureTable(db);
    insertSampleIfEmpty(db);
    const row = db.prepare(`SELECT id, title, platform FROM video_content ORDER BY id ASC LIMIT 1`).get();
    if (row) {
      console.log('✅ Sample video ready:');
      console.log(`- ID: ${row.id}`);
      console.log(`- Title: ${row.title}`);
      console.log(`- Platform: ${row.platform}`);
    }
    console.log('✅ Video content setup completed!');
    console.log('\n🎯 Next steps:');
    console.log('1. Open the Admin page: http://localhost:5173/admin');
    console.log('2. Check the "videos" tab for the sample video');
  } finally {
    db.close();
  }
}

main();