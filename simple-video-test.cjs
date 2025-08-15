const Database = require('better-sqlite3');

console.log('🔍 Testing Video Content Database Operations...');

try {
  const db = new Database('./database.sqlite');
  
  // Test 1: Check if video_content table exists
  console.log('\n1. Checking video_content table...');
  const tableInfo = db.prepare('PRAGMA table_info(video_content)').all();
  console.log('✅ Table exists with', tableInfo.length, 'columns');
  
  // Test 2: Insert a test video
  console.log('\n2. Inserting test video...');
  const insertStmt = db.prepare(`
    INSERT INTO video_content (
      title, description, video_url, platform, category, tags, duration, 
      has_timer, timer_duration, timer_start_time, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = insertStmt.run(
    'Test Video Content',
    'This is a test video for debugging',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'youtube',
    'Entertainment',
    JSON.stringify(['test', 'debug']),
    '3:32',
    0, // has_timer = false
    null, // timer_duration
    null, // timer_start_time
    Date.now() // created_at
  );
  
  console.log('✅ Video inserted with ID:', result.lastInsertRowid);
  
  // Test 3: Retrieve the video
  console.log('\n3. Retrieving videos...');
  const videos = db.prepare('SELECT * FROM video_content ORDER BY created_at DESC LIMIT 5').all();
  console.log('📊 Found', videos.length, 'video(s)');
  videos.forEach(video => {
    console.log(`  - ${video.title} (${video.platform})`);
  });
  
  db.close();
  console.log('\n✅ Database operations completed successfully!');
  
} catch (error) {
  console.error('❌ Database test failed:', error.message);
  console.error('Stack:', error.stack);
}
