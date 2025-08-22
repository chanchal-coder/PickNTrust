const Database = require('better-sqlite3');

try {
  const db = new Database('sqlite.db');
  
  // Check if video_content table exists
  const tableExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='video_content'
  `).get();
  
  console.log('video_content table exists:', !!tableExists);
  
  if (!tableExists) {
    console.log('Creating video_content table...');
    
    db.exec(`
      CREATE TABLE video_content (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        video_url TEXT NOT NULL,
        platform TEXT NOT NULL,
        category TEXT,
        tags TEXT,
        duration TEXT,
        thumbnail_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ video_content table created successfully');
  } else {
    console.log('✅ video_content table already exists');
    
    // Check if there are any records
    const count = db.prepare('SELECT COUNT(*) as count FROM video_content').get();
    console.log('Records in video_content:', count.count);
  }
  
  db.close();
} catch (error) {
  console.error('Error:', error.message);
}
