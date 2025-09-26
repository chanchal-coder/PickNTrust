// Simulate cue-picks bot message processing
const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

console.log('🤖 SIMULATING CUE-PICKS BOT MESSAGE PROCESSING');
console.log('==============================================');

// Simulate a channel post message for cue-picks
const mockChannelPost = {
  message_id: 888888,
  channel_id: -1001234567890, // Cue-picks Channel (mock ID)
  channel_name: 'Cuelinks PNT',
  website_page: 'cue-picks',
  original_text: `🔥 CUELINKS DEAL ALERT! 🔥

✨ Test Gaming Mouse RGB
💰 Price: ₹899 (Was ₹2,999)
🎯 70% OFF - Limited Time!

🛒 Buy Now: https://cuelinks.com/test-gaming-mouse
📸 Image: https://images.cuelinks.com/test-gaming-mouse.jpg

#Gaming #Electronics #Cuelinks #Mouse`,
  processed_text: `🔥 CUELINKS DEAL ALERT! 🔥

✨ Test Gaming Mouse RGB
💰 Price: ₹899 (Was ₹2,999)
🎯 70% OFF - Limited Time!

🛒 Buy Now: https://cuelinks.com/test-gaming-mouse?tag=pickntrust03-21
📸 Image: https://images.cuelinks.com/test-gaming-mouse.jpg?tag=pickntrust03-21

#Gaming #Electronics #Cuelinks #Mouse`,
  extracted_urls: JSON.stringify(['https://cuelinks.com/test-gaming-mouse']),
  image_url: 'https://images.cuelinks.com/test-gaming-mouse.jpg',
  is_processed: 1,
  is_posted: 0,
  created_at: Math.floor(Date.now() / 1000)
};

try {
  // Insert the mock channel post
  console.log('1. Inserting mock cue-picks channel post...');
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

  // Now simulate the product creation for cue-picks
  console.log('2. Creating product in unified_content for cue-picks...');
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
    'Test Gaming Mouse RGB',
    'Test cue-picks product from simulated bot message',
    '899',
    '2999',
    'https://images.cuelinks.com/test-gaming-mouse.jpg',
    'https://cuelinks.com/test-gaming-mouse?tag=pickntrust03-21',
    'product',
    'cue-picks',
    'cue-picks',
    'telegram', // source_type
    'telegram', // source_platform
    channelPostResult.lastInsertRowid.toString(),
    'cuelinks',
    '4.5',
    150,
    70, // discount
    'INR',
    1, // is_active
    0, // is_featured
    0, // display_order
    JSON.stringify(['cue-picks']),
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

  const cuePicksProducts = db.prepare(`
    SELECT COUNT(*) as count 
    FROM unified_content 
    WHERE display_pages LIKE '%cue-picks%'
  `).get();
  console.log(`   Cue Picks products now: ${cuePicksProducts.count}`);

  // Show the new product
  const newProduct = db.prepare('SELECT id, title, source_platform, display_pages FROM unified_content WHERE id = ?').get(productResult.lastInsertRowid);
  console.log(`   New product: ID ${newProduct.id} - ${newProduct.title} (${newProduct.source_platform}) - ${newProduct.display_pages}`);

} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  db.close();
}

console.log('\n✅ Cue-picks simulation completed');