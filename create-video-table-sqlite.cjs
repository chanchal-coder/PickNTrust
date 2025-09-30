const Database = require('better-sqlite3');

try {
  const db = new Database('sqlite.db');
  
  console.log('Creating video_content table in sqlite.db...');
  
  // Create the video_content table
  db.exec(`
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
  `);
  
  console.log('Success video_content table created successfully in sqlite.db');
  
  // Check if table exists and show structure
  const tableInfo = db.prepare("PRAGMA table_info(video_content)").all();
  console.log('📋 Table structure:');
  tableInfo.forEach(col => {
    console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
  });
  
  // List all tables in the database
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('📋 All tables in database:');
  tables.forEach(table => {
    console.log(`  - ${table.name}`);
  });
  
  db.close();
  console.log('Success Database connection closed');
  
} catch (error) {
  console.error('Error Error:', error.message);
}
