const Database = require('better-sqlite3');

console.log('Creating video_content table...');

const db = new Database('sqlite.db');

try {
  // Create video_content table
  const createTableSQL = `
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
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `;
  
  db.exec(createTableSQL);
  console.log('✅ video_content table created successfully');
  
  // Verify table exists
  const tableInfo = db.prepare("PRAGMA table_info(video_content)").all();
  console.log('Video content table columns:', tableInfo.map(col => col.name));
  
} catch (error) {
  console.error('❌ Error creating video_content table:', error);
} finally {
  db.close();
}
