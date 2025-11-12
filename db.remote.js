import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { getDatabasePath, getDatabaseOptions } from './config/database.js';
// Ensure __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Resolve database path using centralized config
const dbFilePath = getDatabasePath();
// Ensure parent directory exists (for non-existent DB creation)
try {
    const parentDir = path.dirname(dbFilePath);
    if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
    }
}
catch { }
// Initialize better-sqlite3 connection
export const sqliteDb = new Database(dbFilePath, getDatabaseOptions());
// Initialize drizzle ORM over sqliteDb
export const db = drizzle(sqliteDb);
// Back-compat aliases used across the codebase
export const dbInstance = db;
export const sharedSqliteDb = sqliteDb;
// Optional default export for modules that import default
export default { db, sqliteDb, dbInstance, sharedSqliteDb };
// Ensure critical tables/columns exist to prevent runtime insert errors
// This is safe, idempotent, and does not affect existing data.
try {
    // Currency tables required by /api/currency routes
    sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS exchange_rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_currency TEXT NOT NULL,
      to_currency TEXT NOT NULL,
      rate NUMERIC NOT NULL,
      last_updated INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);
    sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS currency_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      default_currency TEXT DEFAULT 'INR',
      enabled_currencies TEXT DEFAULT '["INR","USD","EUR","GBP","JPY","CAD","AUD","SGD","CNY","KRW"]',
      auto_update_rates INTEGER DEFAULT 1,
      last_rate_update INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);
    // Create video_content table if it doesn't exist (with full expected schema)
    sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS video_content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      video_url TEXT NOT NULL,
      thumbnail_url TEXT,
      platform TEXT NOT NULL,
      category TEXT NOT NULL,
      tags TEXT,
      duration TEXT,
      has_timer INTEGER DEFAULT 0,
      timer_duration INTEGER,
      timer_start_time INTEGER,
      pages TEXT DEFAULT '[]',
      show_on_homepage INTEGER DEFAULT 1,
      cta_text TEXT,
      cta_url TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);
    // Add any missing columns required by newer features
    const cols = new Set(sqliteDb.prepare("PRAGMA table_info(video_content)").all().map((c) => c.name));
    const plannedAdds = [
        { name: 'pages', sql: "ALTER TABLE video_content ADD COLUMN pages TEXT DEFAULT '[]'" },
        { name: 'show_on_homepage', sql: "ALTER TABLE video_content ADD COLUMN show_on_homepage INTEGER DEFAULT 1" },
        { name: 'cta_text', sql: "ALTER TABLE video_content ADD COLUMN cta_text TEXT" },
        { name: 'cta_url', sql: "ALTER TABLE video_content ADD COLUMN cta_url TEXT" },
    ];
    for (const p of plannedAdds) {
        if (!cols.has(p.name)) {
            try {
                sqliteDb.exec(p.sql);
            }
            catch { }
        }
    }
}
catch { }
