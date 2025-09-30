const Database = require('better-sqlite3');
const path = require('path');

console.log('🔍 DIAGNOSING POSTING ISSUES');
console.log('='.repeat(60));

// Database setup
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

try {
  console.log('📊 1. OVERALL DATA ANALYSIS:');
  console.log('-'.repeat(60));

  // Check total posts in each table
  const channelPostsCount = db.prepare(`SELECT COUNT(*) as count FROM channel_posts`).get();
  const unifiedContentCount = db.prepare(`SELECT COUNT(*) as count FROM unified_content`).get();
  const telegramPostsCount = db.prepare(`SELECT COUNT(*) as count FROM unified_content WHERE source_type = 'telegram'`).get();

  console.log(`   📄 Channel Posts: ${channelPostsCount.count}`);
  console.log(`   📄 Unified Content (Total): ${unifiedContentCount.count}`);
  console.log(`   📄 Unified Content (Telegram): ${telegramPostsCount.count}`);

  console.log('\n🚫 2. FAILED POSTS ANALYSIS:');
  console.log('-'.repeat(60));

  // Check for posts that failed to process
  const unprocessedPosts = db.prepare(`
    SELECT cp.id, cp.channel_id, cp.website_page, cp.original_text, cp.created_at
    FROM channel_posts cp
    LEFT JOIN unified_content uc ON uc.source_id = cp.id AND uc.source_type = 'telegram'
    WHERE uc.id IS NULL
    ORDER BY cp.created_at DESC
    LIMIT 10
  `).all();

  if (unprocessedPosts.length > 0) {
    console.log(`   ❌ Found ${unprocessedPosts.length} unprocessed posts:`);
    unprocessedPosts.forEach((post, index) => {
      console.log(`   ${index + 1}. Channel: ${post.channel_id}, Page: ${post.website_page}`);
      console.log(`      Text: ${post.original_text?.substring(0, 100)}...`);
      console.log(`      Created: ${new Date(post.created_at * 1000).toLocaleString()}`);
    });
  } else {
    console.log('   ✅ All channel posts have been processed');
  }

  console.log('\n🖼️ 3. IMAGE ISSUES ANALYSIS:');
  console.log('-'.repeat(60));

  // Check image URLs
  const imageAnalysis = db.prepare(`
    SELECT 
      image_url,
      COUNT(*) as count,
      CASE 
        WHEN image_url IS NULL THEN 'NULL'
        WHEN image_url LIKE '%placeholder%' THEN 'PLACEHOLDER'
        WHEN image_url LIKE 'https://via.placeholder.com%' THEN 'DEFAULT_PLACEHOLDER'
        WHEN image_url LIKE 'http%' THEN 'VALID_URL'
        ELSE 'OTHER'
      END as image_type
    FROM unified_content 
    WHERE source_type = 'telegram'
    GROUP BY image_url
    ORDER BY count DESC
  `).all();

  console.log('   📊 Image URL Distribution:');
  imageAnalysis.forEach(img => {
    console.log(`   ${img.image_type}: ${img.count} posts`);
    if (img.image_url && img.image_url.length < 100) {
      console.log(`      URL: ${img.image_url}`);
    }
  });

  console.log('\n💰 4. PRICE DATA ANALYSIS:');
  console.log('-'.repeat(60));

  // Check price data
  const priceAnalysis = db.prepare(`
    SELECT 
      COUNT(*) as total_posts,
      COUNT(price) as posts_with_price,
      COUNT(original_price) as posts_with_original_price,
      COUNT(CASE WHEN price IS NOT NULL AND original_price IS NOT NULL THEN 1 END) as posts_with_both_prices
    FROM unified_content 
    WHERE source_type = 'telegram'
  `).get();

  console.log(`   📊 Total Telegram Posts: ${priceAnalysis.total_posts}`);
  console.log(`   💰 Posts with Price: ${priceAnalysis.posts_with_price} (${Math.round(priceAnalysis.posts_with_price/priceAnalysis.total_posts*100)}%)`);
  console.log(`   💰 Posts with Original Price: ${priceAnalysis.posts_with_original_price} (${Math.round(priceAnalysis.posts_with_original_price/priceAnalysis.total_posts*100)}%)`);
  console.log(`   💰 Posts with Both Prices: ${priceAnalysis.posts_with_both_prices} (${Math.round(priceAnalysis.posts_with_both_prices/priceAnalysis.total_posts*100)}%)`);

  // Sample posts with missing price data
  const missingPriceData = db.prepare(`
    SELECT id, title, description, price, original_price, display_pages
    FROM unified_content 
    WHERE source_type = 'telegram' AND (price IS NULL OR price = '')
    LIMIT 5
  `).all();

  if (missingPriceData.length > 0) {
    console.log('\n   📄 Sample posts missing price data:');
    missingPriceData.forEach((post, index) => {
      console.log(`   ${index + 1}. ID: ${post.id} | Page: ${post.display_pages}`);
      console.log(`      Title: ${post.title?.substring(0, 80)}...`);
      console.log(`      Description: ${post.description?.substring(0, 100)}...`);
      console.log(`      Price: ${post.price || 'NULL'} | Original: ${post.original_price || 'NULL'}`);
    });
  }

  console.log('\n📱 5. RECENT TELEGRAM POSTS SAMPLE:');
  console.log('-'.repeat(60));

  // Check recent telegram posts for data quality
  const recentPosts = db.prepare(`
    SELECT id, title, description, price, original_price, image_url, display_pages, created_at
    FROM unified_content 
    WHERE source_type = 'telegram'
    ORDER BY created_at DESC
    LIMIT 5
  `).all();

  recentPosts.forEach((post, index) => {
    console.log(`\n   📄 Post ${index + 1} (ID: ${post.id}):`);
    console.log(`      Page: ${post.display_pages}`);
    console.log(`      Title: ${post.title?.substring(0, 80)}...`);
    console.log(`      Price: ${post.price || 'NULL'} | Original: ${post.original_price || 'NULL'}`);
    console.log(`      Image: ${post.image_url?.substring(0, 80)}...`);
    console.log(`      Created: ${new Date(post.created_at * 1000).toLocaleString()}`);
  });

  console.log('\n🔍 6. CHANNEL-SPECIFIC ANALYSIS:');
  console.log('-'.repeat(60));

  // Check posts by channel/page
  const channelAnalysis = db.prepare(`
    SELECT 
      display_pages,
      COUNT(*) as total_posts,
      COUNT(price) as posts_with_price,
      COUNT(CASE WHEN image_url NOT LIKE '%placeholder%' THEN 1 END) as posts_with_real_images
    FROM unified_content 
    WHERE source_type = 'telegram'
    GROUP BY display_pages
    ORDER BY total_posts DESC
  `).all();

  channelAnalysis.forEach(channel => {
    const pricePercent = Math.round(channel.posts_with_price/channel.total_posts*100);
    const imagePercent = Math.round(channel.posts_with_real_images/channel.total_posts*100);
    console.log(`   📄 ${channel.display_pages}:`);
    console.log(`      Total: ${channel.total_posts} | Price: ${channel.posts_with_price} (${pricePercent}%) | Real Images: ${channel.posts_with_real_images} (${imagePercent}%)`);
  });

  console.log('\n📋 7. RECOMMENDATIONS:');
  console.log('-'.repeat(60));

  if (unprocessedPosts.length > 0) {
    console.log('   ❌ Fix unprocessed posts in channel_posts table');
  }
  
  const placeholderCount = imageAnalysis.find(img => img.image_type === 'DEFAULT_PLACEHOLDER')?.count || 0;
  if (placeholderCount > 0) {
    console.log(`   🖼️  Fix ${placeholderCount} posts using placeholder images`);
  }

  if (priceAnalysis.posts_with_price < priceAnalysis.total_posts * 0.8) {
    console.log('   💰 Improve price extraction from Telegram messages');
  }

  console.log('\n✅ DIAGNOSIS COMPLETE');
  console.log('='.repeat(60));

} catch (error) {
  console.error('❌ Error during diagnosis:', error.message);
  console.error(error.stack);
} finally {
  db.close();
}