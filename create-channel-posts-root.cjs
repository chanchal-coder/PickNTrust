const Database = require('better-sqlite3');
const path = require('path');

console.log('🔧 Creating channel_posts table in ROOT database.sqlite...');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS channel_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel_id TEXT NOT NULL,
      channel_name TEXT NOT NULL,
      website_page TEXT NOT NULL,
      message_id INTEGER NOT NULL,
      original_text TEXT NOT NULL,
      processed_text TEXT NOT NULL,
      extracted_urls TEXT,
      image_url TEXT,
      is_processed INTEGER DEFAULT 0,
      is_posted INTEGER DEFAULT 0,
      processing_error TEXT,
      telegram_timestamp INTEGER,
      processed_at INTEGER,
      posted_at INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);
  console.log('✅ channel_posts table ensured in root database');
} catch (err) {
  console.error('❌ Failed to create channel_posts:', err.message);
  process.exit(1);
} finally {
  db.close();
}

console.log('✅ Done');