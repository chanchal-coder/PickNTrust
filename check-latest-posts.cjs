const Database = require('better-sqlite3');
const path = require('path');

console.log('🔍 Checking Latest Posts in Database');
console.log('====================================');

// Connect to database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

try {
  // Check latest channel_posts
  console.log('\n📺 LATEST CHANNEL POSTS:');
  const channelPosts = db.prepare(`
    SELECT 
      channel_name,
      website_page,
      message_id,
      original_text,
      is_processed,
      is_posted,
      datetime(created_at, 'unixepoch') as created_at
    FROM channel_posts 
    ORDER BY created_at DESC 
    LIMIT 10
  `).all();

  if (channelPosts.length > 0) {
    channelPosts.forEach((post, index) => {
      console.log(`\n${index + 1}. ${post.channel_name} (${post.website_page})`);
      console.log(`   Message ID: ${post.message_id}`);
      console.log(`   Processed: ${post.is_processed ? '✅' : '❌'}`);
      console.log(`   Posted: ${post.is_posted ? '✅' : '❌'}`);
      console.log(`   Created: ${post.created_at}`);
      console.log(`   Text: ${post.original_text.substring(0, 100)}...`);
    });
  } else {
    console.log('   ❌ No channel posts found');
  }

  // Check latest unified_content
  console.log('\n\n🛍️ LATEST UNIFIED CONTENT:');
  const unifiedContent = db.prepare(`
    SELECT 
      title,
      page_type,
      price,
      affiliate_url,
      datetime(created_at, 'unixepoch') as created_at
    FROM unified_content 
    ORDER BY created_at DESC 
    LIMIT 10
  `).all();

  if (unifiedContent.length > 0) {
    unifiedContent.forEach((product, index) => {
      console.log(`\n${index + 1}. ${product.title}`);
      console.log(`   Page: ${product.page_type}`);
      console.log(`   Price: ${product.price}`);
      console.log(`   Created: ${product.created_at}`);
      console.log(`   URL: ${product.affiliate_url.substring(0, 50)}...`);
    });
  } else {
    console.log('   ❌ No unified content found');
  }

  // Summary
  const totalChannelPosts = db.prepare('SELECT COUNT(*) as count FROM channel_posts').get().count;
  const totalUnifiedContent = db.prepare('SELECT COUNT(*) as count FROM unified_content').get().count;
  const processedPosts = db.prepare('SELECT COUNT(*) as count FROM channel_posts WHERE is_processed = 1').get().count;
  const postedContent = db.prepare('SELECT COUNT(*) as count FROM channel_posts WHERE is_posted = 1').get().count;

  console.log('\n\n📊 DATABASE SUMMARY:');
  console.log(`   Total Channel Posts: ${totalChannelPosts}`);
  console.log(`   Total Unified Content: ${totalUnifiedContent}`);
  console.log(`   Processed Posts: ${processedPosts}/${totalChannelPosts}`);
  console.log(`   Posted Content: ${postedContent}/${totalChannelPosts}`);

  if (totalChannelPosts > 0 && processedPosts === totalChannelPosts) {
    console.log('\n✅ All posts have been processed successfully!');
  } else if (totalChannelPosts > 0) {
    console.log('\n⚠️ Some posts are still being processed...');
  } else {
    console.log('\n❌ No posts found in database');
  }

} catch (error) {
  console.error('❌ Error checking database:', error.message);
} finally {
  db.close();
}