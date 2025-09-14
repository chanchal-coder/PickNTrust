// Create test Value Picks products
const Database = require('better-sqlite3');

try {
  const db = new Database('database.sqlite');
  
  console.log('Target Creating test Value Picks products...');
  
  const currentTime = Math.floor(Date.now() / 1000);
  const expiresAt = currentTime + (7 * 24 * 60 * 60); // 7 days from now
  
  const testProducts = [
    {
      name: 'Premium Wireless Headphones - Value Pick',
      description: 'High-quality wireless headphones with noise cancellation and 30-hour battery life. Perfect for music lovers and professionals.',
      price: '2999',
      original_price: '4999',
      currency: 'INR',
      image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
      affiliate_url: 'https://valuepicks.com/redirect?url=https://amazon.in/headphones',
      category: 'Electronics & Gadgets',
      rating: '4.5',
      review_count: 1250,
      discount: 40,
      is_featured: 1,
      is_new: 1,
      affiliate_network: 'value-picks',
      telegram_message_id: 1001,
      telegram_channel_id: -1001234567890,
      telegram_channel_name: 'Value Picks',
      has_limited_offer: 1,
      limited_offer_text: 'Flash Sale - Today Only!'
    },
    {
      name: 'Smart Fitness Watch - Best Value',
      description: 'Feature-packed fitness tracker with heart rate monitoring, GPS, and 7-day battery life. Track your health goals effectively.',
      price: '1999',
      original_price: '3499',
      currency: 'INR',
      image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80',
      affiliate_url: 'https://valuepicks.com/redirect?url=https://amazon.in/smartwatch',
      category: 'Electronics & Gadgets',
      rating: '4.3',
      review_count: 890,
      discount: 43,
      is_featured: 1,
      is_new: 0,
      affiliate_network: 'value-picks',
      telegram_message_id: 1002,
      telegram_channel_id: -1001234567890,
      telegram_channel_name: 'Value Picks',
      has_limited_offer: 0,
      limited_offer_text: null
    },
    {
      name: 'Ergonomic Office Chair - Value Deal',
      description: 'Comfortable ergonomic office chair with lumbar support and adjustable height. Perfect for long working hours.',
      price: '4999',
      original_price: '7999',
      currency: 'INR',
      image_url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=80',
      affiliate_url: 'https://valuepicks.com/redirect?url=https://amazon.in/office-chair',
      category: 'Home & Kitchen',
      rating: '4.4',
      review_count: 567,
      discount: 38,
      is_featured: 0,
      is_new: 1,
      affiliate_network: 'value-picks',
      telegram_message_id: 1003,
      telegram_channel_id: -1001234567890,
      telegram_channel_name: 'Value Picks',
      has_limited_offer: 1,
      limited_offer_text: 'Limited Stock - Hurry Up!'
    },
    {
      name: 'Premium Coffee Maker - Great Value',
      description: 'Professional-grade coffee maker with multiple brewing options and thermal carafe. Make café-quality coffee at home.',
      price: '3499',
      original_price: '5999',
      currency: 'INR',
      image_url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&q=80',
      affiliate_url: 'https://valuepicks.com/redirect?url=https://amazon.in/coffee-maker',
      category: 'Home & Kitchen',
      rating: '4.6',
      review_count: 423,
      discount: 42,
      is_featured: 1,
      is_new: 0,
      affiliate_network: 'value-picks',
      telegram_message_id: 1004,
      telegram_channel_id: -1001234567890,
      telegram_channel_name: 'Value Picks',
      has_limited_offer: 0,
      limited_offer_text: null
    },
    {
      name: 'Wireless Gaming Mouse - Value Pick',
      description: 'High-precision wireless gaming mouse with RGB lighting and programmable buttons. Perfect for gamers and professionals.',
      price: '1499',
      original_price: '2499',
      currency: 'INR',
      image_url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&q=80',
      affiliate_url: 'https://valuepicks.com/redirect?url=https://amazon.in/gaming-mouse',
      category: 'Electronics & Gadgets',
      rating: '4.2',
      review_count: 789,
      discount: 40,
      is_featured: 0,
      is_new: 1,
      affiliate_network: 'value-picks',
      telegram_message_id: 1005,
      telegram_channel_id: -1001234567890,
      telegram_channel_name: 'Value Picks',
      has_limited_offer: 1,
      limited_offer_text: 'Deal of the Day'
    }
  ];
  
  const insertQuery = db.prepare(`
    INSERT INTO value_picks_products (
      name, description, price, original_price, currency, image_url,
      affiliate_url, category, rating, review_count,
      discount, is_featured, is_new, affiliate_network,
      telegram_message_id, telegram_channel_id, telegram_channel_name,
      click_count, conversion_count, processing_status, expires_at,
      created_at, updated_at, display_pages, source_metadata, tags,
      has_limited_offer, limited_offer_text
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);
  
  testProducts.forEach((product, index) => {
    try {
      const result = insertQuery.run(
        product.name,
        product.description,
        product.price,
        product.original_price,
        product.currency,
        product.image_url,
        product.affiliate_url,
        product.category,
        product.rating,
        product.review_count,
        product.discount,
        product.is_featured,
        product.is_new,
        product.affiliate_network,
        product.telegram_message_id,
        product.telegram_channel_id,
        product.telegram_channel_name,
        0, // click_count
        0, // conversion_count
        'active',
        expiresAt,
        currentTime,
        currentTime,
        'value-picks', // display_pages
        JSON.stringify({
          source: 'test_data',
          created_by: 'admin',
          test_product: true
        }),
        JSON.stringify(['value-picks', 'test', 'sample']),
        product.has_limited_offer,
        product.limited_offer_text
      );
      
      console.log(`Success Created Value Picks product ${index + 1}: ${product.name} (ID: ${result.lastInsertRowid})`);
    } catch (error) {
      console.error(`Error Error creating product ${index + 1}:`, error.message);
    }
  });
  
  // Verify products were created
  const count = db.prepare('SELECT COUNT(*) as count FROM value_picks_products').get();
  console.log(`\nStats Total Value Picks products in database: ${count.count}`);
  
  // Show sample products
  const sampleProducts = db.prepare(`
    SELECT id, name, price, original_price, discount, has_limited_offer, limited_offer_text 
    FROM value_picks_products 
    ORDER BY created_at DESC 
    LIMIT 5
  `).all();
  
  console.log('\nProducts Sample Value Picks products:');
  sampleProducts.forEach(product => {
    console.log(`   ${product.id}. ${product.name}`);
    console.log(`      Price: ₹${product.price} (was ₹${product.original_price}) - ${product.discount}% OFF`);
    if (product.has_limited_offer) {
      console.log(`      Hot Limited Offer: ${product.limited_offer_text}`);
    }
    console.log('');
  });
  
  db.close();
  console.log('Target Value Picks test products created successfully!');
  
} catch (error) {
  console.error('Error Error creating Value Picks test products:', error.message);
  process.exit(1);
}