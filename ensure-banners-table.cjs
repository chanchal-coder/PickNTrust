const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS banners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      subtitle TEXT,
      imageUrl TEXT,
      linkUrl TEXT,
      buttonText TEXT,
      page TEXT,
      display_order INTEGER DEFAULT 0,
      isActive INTEGER DEFAULT 1,
      icon TEXT,
      iconType TEXT,
      iconPosition TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);
  console.log('✅ Ensured banners table exists');
} catch (e) {
  console.error('❌ Failed to ensure banners table:', e.message);
  process.exit(1);
} finally {
  db.close();
}