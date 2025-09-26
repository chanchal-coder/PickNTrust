const Database = require('better-sqlite3');
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('🔍 Checking recent bot activity and database entries...\n');

try {
  // Check recent unified_content entries from Telegram
  console.log('📊 Recent unified_content entries from Telegram (last 24 hours):');
  const recentTelegramEntries = db.prepare(`
    SELECT id, title, page_type, source_type, created_at, updated_at, status, visibility
    FROM unified_content 
    WHERE source_type = 'telegram' 
    AND created_at > ? 
    ORDER BY created_at DESC 
    LIMIT 10
  `).all(Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000));
  
  if (recentTelegramEntries.length > 0) {
    recentTelegramEntries.forEach(entry => {
      const createdDate = new Date(entry.created_at * 1000);
      console.log(`  - ID: ${entry.id}, Title: "${entry.title}", Page: ${entry.page_type}, Created: ${createdDate.toLocaleString()}`);
    });
  } else {
    console.log('  ❌ No recent Telegram entries found in the last 24 hours');
  }
  
  console.log('\n📈 Total unified_content entries by source:');
  const sourceStats = db.prepare(`
    SELECT source_type, COUNT(*) as count 
    FROM unified_content 
    GROUP BY source_type 
    ORDER BY count DESC
  `).all();
  
  sourceStats.forEach(stat => {
    console.log(`  - ${stat.source_type}: ${stat.count} entries`);
  });
  
  console.log('\n📋 Recent unified_content entries (all sources, last 10):');
  const recentEntries = db.prepare(`
    SELECT id, title, page_type, source_type, created_at, status
    FROM unified_content 
    ORDER BY created_at DESC 
    LIMIT 10
  `).all();
  
  recentEntries.forEach(entry => {
    const createdDate = new Date(entry.created_at * 1000);
    console.log(`  - ID: ${entry.id}, Title: "${entry.title.substring(0, 50)}...", Source: ${entry.source_type}, Page: ${entry.page_type}, Created: ${createdDate.toLocaleString()}`);
  });
  
  console.log('\n🔍 Checking if channel_posts table exists:');
  const tableExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='channel_posts'
  `).get();
  
  if (tableExists) {
    console.log('  ✅ channel_posts table exists');
    
    const channelPostsCount = db.prepare(`SELECT COUNT(*) as count FROM channel_posts`).get();
    console.log(`  📊 Total channel_posts entries: ${channelPostsCount.count}`);
    
    if (channelPostsCount.count > 0) {
      console.log('\n📋 Recent channel_posts entries:');
      const recentChannelPosts = db.prepare(`
        SELECT id, title, channel_id, created_at 
        FROM channel_posts 
        ORDER BY created_at DESC 
        LIMIT 5
      `).all();
      
      recentChannelPosts.forEach(post => {
        const createdDate = new Date(post.created_at);
        console.log(`  - ID: ${post.id}, Title: "${post.title}", Channel: ${post.channel_id}, Created: ${createdDate.toLocaleString()}`);
      });
    }
  } else {
    console.log('  ❌ channel_posts table does not exist');
  }
  
} catch (error) {
  console.error('❌ Error checking bot activity:', error.message);
} finally {
  db.close();
}