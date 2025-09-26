const Database = require('better-sqlite3');
const path = require('path');

console.log('🔍 DIAGNOSING TELEGRAM POSTING ISSUES');
console.log('=====================================');

// Database setup
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

try {
  console.log('\n1. CHECKING RECENT TELEGRAM POSTS:');
  console.log('-'.repeat(50));

  // Get recent posts from unified_content
  const recentPosts = db.prepare(`
    SELECT id, title, price, original_price, discount, image_url, affiliate_url, 
           source_type, display_pages, created_at, updated_at
    FROM unified_content 
    WHERE source_type = 'telegram' 
    ORDER BY created_at DESC 
    LIMIT 10
  `).all();

  console.log(`Found ${recentPosts.length} recent Telegram posts:`);
  
  recentPosts.forEach((post, index) => {
    console.log(`\n   Post ${index + 1} (ID: ${post.id}):`);
    console.log(`   Title: "${post.title}"`);
    console.log(`   Price: ${post.price || 'NULL'}`);
    console.log(`   Original Price: ${post.original_price || 'NULL'}`);
    console.log(`   Discount: ${post.discount || 'NULL'}`);
    console.log(`   Image URL: ${post.image_url || 'NULL'}`);
    console.log(`   Affiliate URL: ${post.affiliate_url ? 'Present' : 'NULL'}`);
    console.log(`   Display Pages: ${post.display_pages}`);
    console.log(`   Created: ${new Date(post.created_at * 1000).toLocaleString()}`);
    
    // Check for issues
    const issues = [];
    if (post.title === 'Product from Telegram') issues.push('Generic title');
    if (!post.price || post.price === '0') issues.push('No price');
    if (!post.image_url || post.image_url.includes('placeholder')) issues.push('No/placeholder image');
    if (!post.affiliate_url) issues.push('No affiliate URL');
    
    if (issues.length > 0) {
      console.log(`   ❌ Issues: ${issues.join(', ')}`);
    } else {
      console.log(`   ✅ No issues detected`);
    }
  });

  console.log('\n2. CHECKING CHANNEL POSTS:');
  console.log('-'.repeat(50));

  // Get recent channel posts
  const channelPosts = db.prepare(`
    SELECT id, channel_name, original_text, processed_text, image_url, is_processed, 
           processing_error, created_at, extracted_title, extracted_price, extracted_original_price, extracted_discount
    FROM channel_posts 
    ORDER BY created_at DESC 
    LIMIT 5
  `).all();

  console.log(`Found ${channelPosts.length} recent channel posts:`);
  
  channelPosts.forEach((post, index) => {
    console.log(`\n   Channel Post ${index + 1} (ID: ${post.id}):`);
    console.log(`   Channel: ${post.channel_name}`);
    console.log(`   Original Text: "${post.original_text?.substring(0, 100)}..."`);
    console.log(`   Processed Text: "${post.processed_text?.substring(0, 100)}..."`);
    console.log(`   Image URL: ${post.image_url || 'NULL'}`);
    console.log(`   Processed: ${post.is_processed ? 'Yes' : 'No'}`);
    console.log(`   Error: ${post.processing_error || 'None'}`);
    console.log(`   Extracted Title: ${post.extracted_title || 'NULL'}`);
    console.log(`   Extracted Price: ${post.extracted_price || 'NULL'}`);
    console.log(`   Extracted Original Price: ${post.extracted_original_price || 'NULL'}`);
    console.log(`   Extracted Discount: ${post.extracted_discount || 'NULL'}`);
    console.log(`   Created: ${new Date(post.created_at * 1000).toLocaleString()}`);
  });

  console.log('\n3. ANALYZING PROCESSING PATTERNS:');
  console.log('-'.repeat(50));

  // Check processing success rate
  const processingStats = db.prepare(`
    SELECT 
      COUNT(*) as total_posts,
      SUM(CASE WHEN is_processed = 1 THEN 1 ELSE 0 END) as processed_posts,
      SUM(CASE WHEN processing_error IS NOT NULL THEN 1 ELSE 0 END) as error_posts
    FROM channel_posts
  `).get();

  console.log(`   Total Channel Posts: ${processingStats.total_posts}`);
  console.log(`   Successfully Processed: ${processingStats.processed_posts}`);
  console.log(`   Posts with Errors: ${processingStats.error_posts}`);
  
  if (processingStats.total_posts > 0) {
    const successRate = Math.round((processingStats.processed_posts / processingStats.total_posts) * 100);
    console.log(`   Success Rate: ${successRate}%`);
  }

  console.log('\n4. CHECKING PRODUCT DATA QUALITY:');
  console.log('-'.repeat(50));

  // Analyze data quality issues
  const qualityStats = db.prepare(`
    SELECT 
      COUNT(*) as total_telegram_products,
      SUM(CASE WHEN title = 'Product from Telegram' THEN 1 ELSE 0 END) as generic_titles,
      SUM(CASE WHEN price IS NULL OR price = '' OR price = '0' THEN 1 ELSE 0 END) as no_price,
      SUM(CASE WHEN image_url IS NULL OR image_url = '' OR image_url LIKE '%placeholder%' THEN 1 ELSE 0 END) as no_image,
      SUM(CASE WHEN affiliate_url IS NULL OR affiliate_url = '' THEN 1 ELSE 0 END) as no_affiliate
    FROM unified_content 
    WHERE source_type = 'telegram'
  `).get();

  console.log(`   Total Telegram Products: ${qualityStats.total_telegram_products}`);
  console.log(`   Generic Titles: ${qualityStats.generic_titles} (${Math.round((qualityStats.generic_titles / qualityStats.total_telegram_products) * 100)}%)`);
  console.log(`   Missing Price: ${qualityStats.no_price} (${Math.round((qualityStats.no_price / qualityStats.total_telegram_products) * 100)}%)`);
  console.log(`   Missing Images: ${qualityStats.no_image} (${Math.round((qualityStats.no_image / qualityStats.total_telegram_products) * 100)}%)`);
  console.log(`   Missing Affiliate URLs: ${qualityStats.no_affiliate} (${Math.round((qualityStats.no_affiliate / qualityStats.total_telegram_products) * 100)}%)`);

  console.log('\n5. SAMPLE MESSAGE ANALYSIS:');
  console.log('-'.repeat(50));

  // Get a sample message for analysis
  const sampleMessage = db.prepare(`
    SELECT original_text, processed_text, image_url, processing_error, extracted_title, extracted_price
    FROM channel_posts 
    WHERE original_text IS NOT NULL 
    ORDER BY created_at DESC 
    LIMIT 1
  `).get();

  if (sampleMessage) {
    console.log(`   Sample Original Text:`);
    console.log(`   "${sampleMessage.original_text}"`);
    console.log(`   Sample Processed Text:`);
    console.log(`   "${sampleMessage.processed_text || 'NULL'}"`);
    console.log(`   Image URL: ${sampleMessage.image_url || 'NULL'}`);
    console.log(`   Processing Error: ${sampleMessage.processing_error || 'None'}`);
    console.log(`   Extracted Title: ${sampleMessage.extracted_title || 'NULL'}`);
    console.log(`   Extracted Price: ${sampleMessage.extracted_price || 'NULL'}`);
    
    // Try to extract info manually
    const text = sampleMessage.original_text;
    
    // Look for prices
    const pricePatterns = [
      /₹\s*(\d+(?:,\d+)*(?:\.\d+)?)/g,
      /(?:price|deal|mrp)[\s:@]*₹?\s*(\d+(?:,\d+)*(?:\.\d+)?)/gi,
      /(\d+(?:,\d+)*(?:\.\d+)?)\s*₹/g
    ];
    
    console.log(`\n   Manual Price Extraction Test:`);
    pricePatterns.forEach((pattern, index) => {
      const matches = [...text.matchAll(pattern)];
      console.log(`   Pattern ${index + 1}: ${matches.length > 0 ? matches.map(m => m[1]).join(', ') : 'No matches'}`);
    });
    
    // Look for URLs
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    const urls = [...text.matchAll(urlPattern)];
    console.log(`   URLs Found: ${urls.length > 0 ? urls.map(u => u[1]).join(', ') : 'None'}`);
    
  } else {
    console.log(`   No sample messages found`);
  }

  console.log('\n6. RECOMMENDATIONS:');
  console.log('-'.repeat(50));

  const recommendations = [];
  
  if (qualityStats.generic_titles > 0) {
    recommendations.push('🔧 Fix title extraction logic in telegram-bot.ts');
  }
  
  if (qualityStats.no_price > 0) {
    recommendations.push('🔧 Improve price extraction patterns');
  }
  
  if (qualityStats.no_image > 0) {
    recommendations.push('🔧 Enhance image URL extraction');
  }
  
  if (processingStats.error_posts > 0) {
    recommendations.push('🔧 Fix processing errors in message handling');
  }
  
  if (recommendations.length === 0) {
    console.log('   ✅ No major issues detected');
  } else {
    recommendations.forEach(rec => console.log(`   ${rec}`));
  }

} catch (error) {
  console.error('❌ Error during diagnosis:', error.message);
  console.error(error.stack);
} finally {
  db.close();
}