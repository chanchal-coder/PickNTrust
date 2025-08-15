const Database = require('better-sqlite3');

console.log('🔧 Fixing video content functionality...');

try {
  const db = new Database('./database.sqlite');
  
  // Drop existing table if it exists (to ensure clean state)
  console.log('1. Dropping existing video_content table...');
  db.exec('DROP TABLE IF EXISTS video_content');
  
  // Create the video_content table with correct schema
  console.log('2. Creating video_content table...');
  db.exec(`
    CREATE TABLE video_content (
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
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    )
  `);
  
  console.log('3. Verifying table creation...');
  const tableInfo = db.prepare("PRAGMA table_info(video_content)").all();
  console.log('Table columns:', tableInfo.map(col => col.name));
  
  // Test insert
  console.log('4. Testing insert...');
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
  
  console.log('Insert successful, ID:', result.lastInsertRowid);
  
  // Test select
  console.log('5. Testing select...');
  const selectStmt = db.prepare('SELECT * FROM video_content WHERE id = ?');
  const testVideo = selectStmt.get(result.lastInsertRowid);
  console.log('Retrieved video:', testVideo);
  
  // Clean up test data
  db.prepare('DELETE FROM video_content WHERE id = ?').run(result.lastInsertRowid);
  console.log('6. Test data cleaned up');
  
  db.close();
  console.log('✅ Video content functionality fixed successfully!');
  console.log('\n🎯 Next steps:');
  console.log('1. Restart your development server: npm run dev');
  console.log('2. Go to /admin and navigate to the Videos tab');
  console.log('3. Try adding a video content entry');
  
} catch (error) {
  console.error('❌ Fix failed:', error);
}
