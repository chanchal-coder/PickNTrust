const Database = require('better-sqlite3');

try {
  const db = new Database('database.sqlite');
  
  console.log('Creating video_content table...');
  
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
  
  console.log('✅ video_content table created successfully');
  
  // Check if table exists and show structure
  const tableInfo = db.prepare("PRAGMA table_info(video_content)").all();
  console.log('📋 Table structure:');
  tableInfo.forEach(col => {
    console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
  });
  
  db.close();
  console.log('✅ Database connection closed');
  
} catch (error) {
  console.error('❌ Error:', error.message);
}
