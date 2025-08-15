const Database = require('better-sqlite3');
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('Adding video_content table to database...');

try {
  // Create video_content table
  const createVideoContentTable = `
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

  db.exec(createVideoContentTable);
  console.log('✅ video_content table created successfully');

  // Check if table exists and show structure
  const tableInfo = db.prepare("PRAGMA table_info(video_content)").all();
  console.log('📋 Table structure:');
  tableInfo.forEach(column => {
    console.log(`  - ${column.name}: ${column.type} ${column.notnull ? 'NOT NULL' : ''} ${column.dflt_value ? `DEFAULT ${column.dflt_value}` : ''}`);
  });

  console.log('🎉 Database migration completed successfully!');

} catch (error) {
  console.error('❌ Error creating video_content table:', error);
} finally {
  db.close();
}
