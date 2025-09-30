// Check channel_posts table schema
const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

console.log('🔍 CHECKING CHANNEL_POSTS TABLE SCHEMA');
console.log('======================================');

try {
  const tableInfo = db.prepare('PRAGMA table_info(channel_posts)').all();
  console.log('Columns in channel_posts table:');
  tableInfo.forEach(col => {
    console.log(`   ${col.name}: ${col.type}`);
  });

  // Check recent posts with available columns
  console.log('\nRecent channel posts:');
  const recentPosts = db.prepare('SELECT * FROM channel_posts ORDER BY created_at DESC LIMIT 3').all();
  console.log(`Found ${recentPosts.length} recent posts`);
  recentPosts.forEach((post, index) => {
    console.log(`\nPost ${index + 1}:`);
    Object.keys(post).forEach(key => {
      console.log(`   ${key}: ${post[key]}`);
    });
  });

} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  db.close();
}