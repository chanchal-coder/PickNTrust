// Execute scripts/tag-pages.sql to backfill display_pages for services and apps
// Usage: node scripts/run-tag-pages.cjs
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

try {
  const dbFile = path.join(__dirname, '..', 'database.sqlite');
  const sqlFile = path.join(__dirname, 'tag-pages.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');

  const db = new Database(dbFile);
  db.pragma('journal_mode = WAL');
  db.exec('BEGIN');
  db.exec(sql);
  db.exec('COMMIT');
  db.close();

  console.log('✅ tag-pages.sql executed successfully: display_pages backfilled');
} catch (err) {
  console.error('❌ Failed to execute tag-pages.sql:', err);
  process.exit(1);
}