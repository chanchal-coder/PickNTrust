const Database = require('better-sqlite3');
const path = require('path');

async function testVideoDatabase() {
  console.log('Testing video content database...');
  
  try {
    const db = new Database('./database.sqlite');
    
    // Check if video_content table exists
    console.log('\n1. Checking if video_content table exists...');
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='video_content'
    `).get();
    
    console.log('Table exists:', !!tableExists);
    
    if (!tableExists) {
      console.log('Creating video_content table...');
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
      console.log('Table created successfully');
    }
    
    // Test insert
    console.log('\n2. Testing insert...');
    const insertStmt = db.prepare(`
      INSERT INTO video_content (
        title, description, video_url, platform, category, tags, duration
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = insertStmt.run(
      'Test Video',
      'Test Description',
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'YouTube',
      'Test',
      '["test"]',
      '3:32'
    );
    
    console.log('Insert result:', result);
    
    // Test select
    console.log('\n3. Testing select...');
    const selectStmt = db.prepare('SELECT * FROM video_content ORDER BY id DESC LIMIT 1');
    const lastVideo = selectStmt.get();
    console.log('Last video:', lastVideo);
    
    // Clean up test data
    if (lastVideo && lastVideo.title === 'Test Video') {
      db.prepare('DELETE FROM video_content WHERE id = ?').run(lastVideo.id);
      console.log('Test data cleaned up');
    }
    
    db.close();
    console.log('\n✅ Database test completed successfully');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

testVideoDatabase();
