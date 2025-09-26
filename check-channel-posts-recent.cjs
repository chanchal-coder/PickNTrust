const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('🔍 Checking Recent Channel Posts...');
console.log('=====================================\n');

try {
  // Check recent channel posts
  console.log('📋 Recent Channel Posts (Last 10):');
  const recentPosts = db.prepare(`
    SELECT id, channel_name, website_page, original_text, 
           is_processed, is_posted, processing_error,
           telegram_timestamp, processed_at, posted_at, created_at
    FROM channel_posts 
    ORDER BY created_at DESC 
    LIMIT 10
  `).all();

  if (recentPosts.length === 0) {
    console.log('   ❌ No channel posts found in database');
  } else {
    recentPosts.forEach(post => {
      console.log(`\n   📝 Post ID: ${post.id}`);
      console.log(`      Channel: ${post.channel_name}`);
      console.log(`      Page: ${post.website_page}`);
      console.log(`      Text: ${post.original_text?.substring(0, 100)}...`);
      console.log(`      Processed: ${post.is_processed ? '✅' : '❌'}`);
      console.log(`      Posted: ${post.is_posted ? '✅' : '❌'}`);
      console.log(`      Error: ${post.processing_error || 'None'}`);
      console.log(`      Created: ${new Date(post.created_at).toLocaleString()}`);
    });
  }

  // Check processing status distribution
  console.log('\n📊 Processing Status Distribution:');
  const statusStats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN is_processed = 1 THEN 1 ELSE 0 END) as processed,
      SUM(CASE WHEN is_posted = 1 THEN 1 ELSE 0 END) as posted,
      SUM(CASE WHEN processing_error IS NOT NULL THEN 1 ELSE 0 END) as errors
    FROM channel_posts
  `).get();

  console.log(`   Total Posts: ${statusStats.total}`);
  console.log(`   Processed: ${statusStats.processed}`);
  console.log(`   Posted: ${statusStats.posted}`);
  console.log(`   Errors: ${statusStats.errors}`);

  // Check products created from channel posts
  console.log('\n🛍️ Products from Channel Posts:');
  const channelProducts = db.prepare(`
    SELECT id, name, description, source, display_pages, created_at
    FROM products 
    WHERE source LIKE '%telegram%' OR source LIKE '%channel%'
    ORDER BY created_at DESC
    LIMIT 5
  `).all();

  if (channelProducts.length === 0) {
    console.log('   ❌ No products found from channel posts');
  } else {
    channelProducts.forEach(product => {
      console.log(`   📦 ID ${product.id}: ${product.name}`);
      console.log(`      Source: ${product.source}`);
      console.log(`      Pages: ${product.display_pages}`);
      console.log(`      Created: ${new Date(product.created_at).toLocaleString()}`);
    });
  }

} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  db.close();
}