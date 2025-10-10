#!/usr/bin/env node
// Ensure channel_posts table exists with canonical schema using better-sqlite3
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

require('dotenv').config();

const dbPath = process.env.DATABASE_URL || path.resolve(process.cwd(), 'database.sqlite');
console.log('Using DB:', dbPath);
const db = new Database(dbPath);

// Apply PRAGMAs for stability
try {
  db.pragma('busy_timeout = 10000');
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
} catch {}

const has = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='channel_posts'").get();
if (!has) {
  console.log('Creating channel_posts table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS channel_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel_id TEXT NOT NULL,
      channel_name TEXT,
      website_page TEXT,
      message_id INTEGER NOT NULL,
      original_text TEXT,
      processed_text TEXT,
      extracted_urls TEXT,
      image_url TEXT,
      is_processed INTEGER DEFAULT 0,
      is_posted INTEGER DEFAULT 0,
      telegram_timestamp INTEGER,
      created_at INTEGER,
      updated_at INTEGER,
      processed_at INTEGER,
      processing_error TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_channel_posts_channel_message ON channel_posts(channel_id, message_id);
    CREATE INDEX IF NOT EXISTS idx_channel_posts_processed ON channel_posts(is_processed, is_posted);
    CREATE INDEX IF NOT EXISTS idx_channel_posts_created ON channel_posts(created_at);
  `);
  console.log('✅ channel_posts created');
} else {
  console.log('channel_posts already exists');
  const cols = db.prepare('PRAGMA table_info(channel_posts)').all();
  const names = new Set(cols.map(c => c.name));
  const ensure = (name, ddl) => {
    if (!names.has(name)) {
      try {
        db.exec(`ALTER TABLE channel_posts ADD COLUMN ${ddl}`);
        console.log(`Added missing column: ${name}`);
      } catch (e) {
        console.warn(`Failed adding column ${name}:`, e.message);
      }
    }
  };
  ensure('channel_id', 'channel_id TEXT');
  ensure('message_id', 'message_id INTEGER');
  ensure('image_url', 'image_url TEXT');
  ensure('processed_at', 'processed_at INTEGER');
  ensure('processing_error', 'processing_error TEXT');
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_channel_posts_channel_message ON channel_posts(channel_id, message_id);
    CREATE INDEX IF NOT EXISTS idx_channel_posts_processed ON channel_posts(is_processed, is_posted);
    CREATE INDEX IF NOT EXISTS idx_channel_posts_created ON channel_posts(created_at);
  `);
}

console.log('Done.');