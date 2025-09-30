// Simulate bot message processing directly
const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

console.log('🤖 SIMULATING BOT MESSAGE PROCESSING');
console.log('====================================');

// Simulate a channel post message
const mockChannelPost = {
  message_id: 999999,
  channel_id: -1002955338551, // Prime Picks Channel
  channel_name: 'Prime Picks Channel',
  website_page: 'prime-picks',
  original_text: `🔥 TEST PRODUCT ALERT! 🔥

✨ Test Wireless Headphones
💰 Price: ₹1,999 (Was ₹4,999)
🎯 60% OFF - Test Deal!

🛒 Buy Now: https://amazon.in/dp/B08TEST123
📸 Image: https://images.amazon.com/test-headphones.jpg

#Electronics #Test #Amazon #Headphones`,
  processed_text: `🔥 TEST PRODUCT ALERT! 🔥

✨ Test Wireless Headphones
💰 Price: ₹1,999 (Was ₹4,999)
🎯 60% OFF - Test Deal!

🛒 Buy Now: https://amazon.in/dp/B08TEST123?tag=pickntrust03-21
📸 Image: https://images.amazon.com/test-headphones.jpg?tag=pickntrust03-21

#Electronics #Test #Amazon #Headphones`,
  extracted_urls: JSON.stringify(['https://amazon.in/dp/B08TEST123']),
  image_url: 'https://images.amazon.com/test-headphones.jpg',
  is_processed: 1,
  is_posted: 0,
  created_at: Math.floor(Date.now() / 1000)
};

try {
  // Insert the mock channel post
  console.log('1. Inserting mock channel post...');
  const insertChannelPost = db.prepare(`
    INSERT INTO channel_posts (
      message_id, channel_id, channel_name, website_page, original_text, 
      processed_text, extracted_urls, image_url, is_processed, is_posted, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const channelPostResult = insertChannelPost.run(
    mockChannelPost.message_id,
    mockChannelPost.channel_id,
    mockChannelPost.channel_name,
    mockChannelPost.website_page,
    mockChannelPost.original_text,
    mockChannelPost.processed_text,
    mockChannelPost.extracted_urls,
    mockChannelPost.image_url,
    mockChannelPost.is_processed,
    mockChannelPost.is_posted,
    mockChannelPost.created_at
  );
  
  console.log(`   ✅ Channel post inserted with ID: ${channelPostResult.lastInsertRowid}`);

  // Now simulate the product creation
  console.log('2. Creating product in unified_content...');
  const insertProduct = db.prepare(`
    INSERT INTO unified_content (
      title, description, price, original_price, image_url, affiliate_url,
      content_type, page_type, category, source_type, source_platform, source_id,
      affiliate_platform, rating, review_count, discount, currency,
      is_active, is_featured, display_order, display_pages,
      has_timer, timer_duration, timer_start_time, processing_status,
      status, visibility, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const productResult = insertProduct.run(
    'Test Wireless Headphones',
    'Test product from simulated bot message',
    '1999',
    '4999',
    'https://images.amazon.com/test-headphones.jpg',
    'https://amazon.in/dp/B08TEST123?tag=pickntrust03-21',
    'product',
    'prime-picks',
    'prime-picks',
    'telegram', // source_type
    'telegram', // source_platform
    channelPostResult.lastInsertRowid.toString(),
    'amazon',
    '4.0',
    100,
    60, // discount
    'INR',
    1, // is_active
    0, // is_featured
    0, // display_order
    JSON.stringify(['prime-picks']),
    0, // has_timer
    null, // timer_duration
    null, // timer_start_time
    'active', // processing_status
    'active', // status
    'public', // visibility
    Math.floor(Date.now() / 1000), // created_at
    Math.floor(Date.now() / 1000)  // updated_at
  );

  console.log(`   ✅ Product inserted with ID: ${productResult.lastInsertRowid}`);

  // Verify the insertion
  console.log('3. Verifying insertion...');
  const telegramProducts = db.prepare('SELECT COUNT(*) as count FROM unified_content WHERE source_platform = ?').get('telegram');
  console.log(`   Telegram products now: ${telegramProducts.count}`);

  const primePicksProducts = db.prepare(`
    SELECT COUNT(*) as count 
    FROM unified_content 
    WHERE display_pages LIKE '%prime-picks%'
  `).get();
  console.log(`   Prime Picks products now: ${primePicksProducts.count}`);

  // Show the new product
  const newProduct = db.prepare('SELECT id, title, source_platform, display_pages FROM unified_content WHERE id = ?').get(productResult.lastInsertRowid);
  console.log(`   New product: ID ${newProduct.id} - ${newProduct.title} (${newProduct.source_platform}) - ${newProduct.display_pages}`);

} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  db.close();
}

console.log('\n✅ Simulation completed');