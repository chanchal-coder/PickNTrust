const Database = require('better-sqlite3');
const path = require('path');

console.log('🔍 Comprehensive Issue Analysis...\n');

// Connect to database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('📊 DATABASE ANALYSIS');
console.log('='.repeat(50));

// 1. Check recent unified_content entries
console.log('\n1️⃣ Recent unified_content entries (last 24 hours):');
try {
  const recentContent = db.prepare(`
    SELECT id, title, source_type, source_id, created_at, processing_status, status
    FROM unified_content 
    WHERE created_at >= datetime('now', '-1 day')
    ORDER BY created_at DESC
    LIMIT 10
  `).all();
  
  if (recentContent.length === 0) {
    console.log('❌ No entries in last 24 hours');
  } else {
    recentContent.forEach(entry => {
      console.log(`  📝 ID: ${entry.id} | ${entry.source_type} | ${entry.title?.substring(0, 50)}... | Status: ${entry.status}`);
    });
  }
} catch (error) {
  console.error('❌ Error checking unified_content:', error.message);
}

// 2. Check channel_posts entries
console.log('\n2️⃣ Recent channel_posts entries:');
try {
  const recentPosts = db.prepare(`
    SELECT id, channel_name, is_processed, is_posted, processing_error, created_at
    FROM channel_posts 
    ORDER BY created_at DESC
    LIMIT 10
  `).all();
  
  if (recentPosts.length === 0) {
    console.log('❌ No channel_posts entries found');
  } else {
    recentPosts.forEach(post => {
      console.log(`  📺 ID: ${post.id} | ${post.channel_name} | Processed: ${post.is_processed} | Posted: ${post.is_posted} | Error: ${post.processing_error || 'None'}`);
    });
  }
} catch (error) {
  console.error('❌ Error checking channel_posts:', error.message);
}

// 3. Check for orphaned entries (unified_content without matching channel_posts)
console.log('\n3️⃣ Checking data consistency:');
try {
  const orphanedEntries = db.prepare(`
    SELECT uc.id, uc.title, uc.source_type, uc.source_id
    FROM unified_content uc
    LEFT JOIN channel_posts cp ON uc.source_id = cp.id
    WHERE uc.source_type = 'telegram' AND cp.id IS NULL
    LIMIT 5
  `).all();
  
  if (orphanedEntries.length > 0) {
    console.log(`⚠️  Found ${orphanedEntries.length} orphaned unified_content entries (no matching channel_posts):`);
    orphanedEntries.forEach(entry => {
      console.log(`  🔗 UC ID: ${entry.id} | Source ID: ${entry.source_id} | ${entry.title?.substring(0, 40)}...`);
    });
  } else {
    console.log('✅ No orphaned entries found');
  }
} catch (error) {
  console.error('❌ Error checking consistency:', error.message);
}

// 4. Check website display data
console.log('\n4️⃣ Current website display data:');
try {
  const displayData = db.prepare(`
    SELECT id, title, page_type, is_active, is_featured, created_at
    FROM unified_content 
    WHERE is_active = 1 AND status = 'published'
    ORDER BY created_at DESC
    LIMIT 5
  `).all();
  
  if (displayData.length === 0) {
    console.log('❌ No active published content for website display');
  } else {
    console.log(`✅ Found ${displayData.length} active entries for website:`);
    displayData.forEach(entry => {
      console.log(`  🌐 ID: ${entry.id} | ${entry.page_type} | ${entry.title?.substring(0, 40)}... | Featured: ${entry.is_featured}`);
    });
  }
} catch (error) {
  console.error('❌ Error checking display data:', error.message);
}

// 5. Check for recent errors or issues
console.log('\n5️⃣ Recent processing errors:');
try {
  const errorEntries = db.prepare(`
    SELECT id, channel_name, processing_error, created_at
    FROM channel_posts 
    WHERE processing_error IS NOT NULL AND processing_error != ''
    ORDER BY created_at DESC
    LIMIT 5
  `).all();
  
  if (errorEntries.length === 0) {
    console.log('✅ No recent processing errors in channel_posts');
  } else {
    console.log(`⚠️  Found ${errorEntries.length} entries with processing errors:`);
    errorEntries.forEach(entry => {
      console.log(`  ❌ ID: ${entry.id} | ${entry.channel_name} | Error: ${entry.processing_error}`);
    });
  }
} catch (error) {
  console.error('❌ Error checking processing errors:', error.message);
}

console.log('\n📋 SUMMARY & RECOMMENDATIONS');
console.log('='.repeat(50));

// Check if bot should be receiving messages
const totalChannelPosts = db.prepare('SELECT COUNT(*) as count FROM channel_posts').get();
const totalUnifiedContent = db.prepare('SELECT COUNT(*) as count FROM unified_content').get();

console.log(`📊 Total channel_posts: ${totalChannelPosts.count}`);
console.log(`📊 Total unified_content: ${totalUnifiedContent.count}`);

if (totalChannelPosts.count === 0) {
  console.log('\n🚨 CRITICAL: No messages in channel_posts table');
  console.log('   This suggests the bot is not receiving or processing any messages');
  console.log('   Possible causes:');
  console.log('   - Bot is not running');
  console.log('   - Bot is not added to channels');
  console.log('   - Bot lacks admin permissions in channels');
  console.log('   - Network connectivity issues');
}

if (totalUnifiedContent.count > totalChannelPosts.count) {
  console.log('\n⚠️  More unified_content than channel_posts entries');
  console.log('   This suggests some data was added manually or through other means');
}

// Close database
db.close();

console.log('\n💡 Next steps:');
console.log('   1. Check if bot is actually running and connected');
console.log('   2. Verify bot has admin permissions in all channels');
console.log('   3. Test with a manual message to see if bot responds');
console.log('   4. Check server logs for any bot errors');