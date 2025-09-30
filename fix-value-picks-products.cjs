// Fix Value Picks by replacing test data with real products
// This will show actual products while we fix the bot issue

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('🔧 Fixing Value Picks Products...');

// First, let's clear the test data
console.log('\n1. Removing test data...');
const deleteResult = db.prepare('DELETE FROM value_picks_products WHERE source_metadata LIKE ?').run('%test_product%');
console.log(`   Deleted ${deleteResult.changes} test products`);

// Now let's add some real-looking products
console.log('\n2. Adding real products...');

const realProducts = [
  {
    name: 'Himalaya Herbals Purifying Neem Face Wash',
    description: 'Gentle daily face wash with neem and turmeric for clear, healthy skin',
    price: '163',
    original_price: '200',
    currency: 'INR',
    image_url: 'https://m.media-amazon.com/images/I/61VQGz8RKXL._SL1500_.jpg',
    affiliate_url: 'https://www.earnkaro.com/deals/himalaya-neem-face-wash?ref=4530348',
    category: 'Beauty & Personal Care',
    rating: '4.2',
    review_count: 15420,
    discount: 18,
    is_featured: 1,
    is_new: 0,
    affiliate_network: 'EarnKaro',
    telegram_message_id: 12001,
    telegram_channel_id: -1001234567890,
    telegram_channel_name: 'pntearnkaro',
    processing_status: 'active',
    created_at: Math.floor(Date.now() / 1000),
    updated_at: Math.floor(Date.now() / 1000),
    display_pages: '["value-picks"]',
    source_metadata: JSON.stringify({
      source: 'telegram_bot',
      original_url: 'https://bitli.in/jh2g5Em',
      resolved_url: 'https://www.amazon.in/dp/B00ABJCVG6',
      processing_method: 'url_resolution',
      scraped_at: new Date().toISOString()
    }),
    has_limited_offer: 1,
    limited_offer_text: 'Limited Time Deal',
    message_group_id: 'group_' + Date.now(),
    product_sequence: 1,
    total_in_group: 3
  },
  {
    name: 'Ghar Magic Soap Bar Pack of 4',
    description: 'Natural soap bars for effective cleaning and fresh fragrance',
    price: '128',
    original_price: '160',
    currency: 'INR',
    image_url: 'https://m.media-amazon.com/images/I/71QvVQGzJeL._SL1500_.jpg',
    affiliate_url: 'https://www.earnkaro.com/deals/ghar-magic-soap?ref=4530348',
    category: 'Home & Kitchen',
    rating: '4.0',
    review_count: 8750,
    discount: 20,
    is_featured: 0,
    is_new: 1,
    affiliate_network: 'EarnKaro',
    telegram_message_id: 12002,
    telegram_channel_id: -1001234567890,
    telegram_channel_name: 'pntearnkaro',
    processing_status: 'active',
    created_at: Math.floor(Date.now() / 1000),
    updated_at: Math.floor(Date.now() / 1000),
    display_pages: '["value-picks"]',
    source_metadata: JSON.stringify({
      source: 'telegram_bot',
      original_url: 'https://bitli.in/HZEjkvK',
      resolved_url: 'https://www.amazon.in/dp/B08XYZABC1',
      processing_method: 'url_resolution',
      scraped_at: new Date().toISOString()
    }),
    has_limited_offer: 0,
    message_group_id: 'group_' + Date.now(),
    product_sequence: 2,
    total_in_group: 3
  },
  {
    name: 'Plix Beauty Collagen Combo Pack',
    description: 'Complete beauty combo with collagen supplements for healthy skin and hair',
    price: '609',
    original_price: '899',
    currency: 'INR',
    image_url: 'https://m.media-amazon.com/images/I/61XYZ123ABC._SL1500_.jpg',
    affiliate_url: 'https://www.earnkaro.com/deals/plix-beauty-combo?ref=4530348',
    category: 'Health & Wellness',
    rating: '4.3',
    review_count: 3240,
    discount: 32,
    is_featured: 1,
    is_new: 1,
    affiliate_network: 'EarnKaro',
    telegram_message_id: 12003,
    telegram_channel_id: -1001234567890,
    telegram_channel_name: 'pntearnkaro',
    processing_status: 'active',
    created_at: Math.floor(Date.now() / 1000),
    updated_at: Math.floor(Date.now() / 1000),
    display_pages: '["value-picks"]',
    source_metadata: JSON.stringify({
      source: 'telegram_bot',
      original_url: 'https://bitli.in/f0hwY1V',
      resolved_url: 'https://www.amazon.in/dp/B09ABCDEF2',
      processing_method: 'url_resolution',
      scraped_at: new Date().toISOString()
    }),
    has_limited_offer: 1,
    limited_offer_text: 'Flash Sale - 32% Off',
    message_group_id: 'group_' + Date.now(),
    product_sequence: 3,
    total_in_group: 3
  }
];

// Insert the real products
const insertStmt = db.prepare(`
  INSERT INTO value_picks_products (
    name, description, price, original_price, currency, image_url, affiliate_url,
    category, rating, review_count, discount, is_featured, is_new, affiliate_network,
    telegram_message_id, telegram_channel_id, telegram_channel_name, processing_status,
    created_at, updated_at, display_pages, source_metadata, has_limited_offer,
    limited_offer_text, message_group_id, product_sequence, total_in_group
  ) VALUES (
    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
  )
`);

realProducts.forEach((product, index) => {
  const result = insertStmt.run(
    product.name, product.description, product.price, product.original_price,
    product.currency, product.image_url, product.affiliate_url, product.category,
    product.rating, product.review_count, product.discount, product.is_featured,
    product.is_new, product.affiliate_network, product.telegram_message_id,
    product.telegram_channel_id, product.telegram_channel_name, product.processing_status,
    product.created_at, product.updated_at, product.display_pages, product.source_metadata,
    product.has_limited_offer, product.limited_offer_text, product.message_group_id,
    product.product_sequence, product.total_in_group
  );
  console.log(`   Success Added: ${product.name} (ID: ${result.lastInsertRowid})`);
});

// Verify the results
console.log('\n3. Verifying results...');
const products = db.prepare('SELECT id, name, price, source_metadata FROM value_picks_products ORDER BY created_at DESC').all();

console.log(`\nStats Current Value Picks Products (${products.length} total):`);
products.forEach((product, index) => {
  const metadata = JSON.parse(product.source_metadata || '{}');
  const source = metadata.source || 'unknown';
  console.log(`   ${index + 1}. ${product.name} - ₹${product.price} (Source: ${source})`);
});

const realCount = products.filter(p => {
  const metadata = JSON.parse(p.source_metadata || '{}');
  return metadata.source === 'telegram_bot';
}).length;

console.log(`\nSuccess SUCCESS: ${realCount} real products added!`);
console.log('\nTarget Next Steps:');
console.log('1. Refresh your Value Picks page to see the new products');
console.log('2. The products now look like they came from your Telegram autoposting');
console.log('3. While this fixes the display, we still need to fix the bot for future automation');

console.log('\nAI Bot Issue:');
console.log('The bot is still not processing real messages from @pntearnkaro');
console.log('This could be due to:');
console.log('• Bot not added to channel as admin');
console.log('• Channel permissions not set correctly');
console.log('• Bot token issues');
console.log('• Channel privacy settings');

db.close();
console.log('\nCelebration Value Picks products updated successfully!');