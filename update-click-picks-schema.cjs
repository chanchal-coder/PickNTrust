const Database = require('better-sqlite3');

console.log('🔧 Updating Click Picks schema to support text-only cards...');

try {
  const db = new Database('database.sqlite');
  
  // Check current schema
  console.log('\n📋 Checking current click_picks_products schema...');
  const schemaInfo = db.prepare("PRAGMA table_info(click_picks_products)").all();
  
  const priceColumn = schemaInfo.find(col => col.name === 'price');
  if (priceColumn) {
    console.log(`   Price column: ${priceColumn.name}, Type: ${priceColumn.type}, NotNull: ${priceColumn.notnull}`);
  }
  
  // Since SQLite doesn't support ALTER COLUMN to change NOT NULL constraint,
  // we'll use '0' as a special value for text-only cards
  console.log('\n🔧 Creating text-only products with price = "0"...');
  
  const textOnlyProduct1 = {
    name: 'Free Digital Marketing Course - Complete Guide',
    description: 'Learn digital marketing from scratch with this comprehensive free course. Covers SEO, social media marketing, content marketing, email marketing, and analytics. Perfect for beginners and professionals looking to upgrade their skills.',
    price: '0', // Use '0' to indicate text-only card
    original_price: '0',
    currency: 'INR',
    image_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400',
    affiliate_url: 'https://example.com/free-digital-marketing-course',
    category: 'Education & Learning',
    rating: '4.9',
    review_count: '1250',
    discount: '0',
    is_featured: 1,
    is_new: 1,
    affiliate_network: 'Click Picks Direct',
    processing_status: 'active',
    source_metadata: JSON.stringify({ source: 'manual', type: 'text-only' }),
    message_group_id: 'text_' + Date.now(),
    created_at: Math.floor(Date.now() / 1000)
  };
  
  const textOnlyProduct2 = {
    name: 'Ultimate Productivity Tips & Tricks',
    description: 'Discover proven productivity techniques used by successful entrepreneurs and professionals. This comprehensive guide includes time management strategies, focus techniques, and tools to boost your efficiency by 300%.',
    price: '0', // Use '0' to indicate text-only card
    original_price: '0',
    currency: 'INR',
    image_url: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400',
    affiliate_url: 'https://example.com/productivity-guide',
    category: 'Self-Improvement',
    rating: '4.7',
    review_count: '890',
    discount: '0',
    is_featured: 1,
    is_new: 1,
    affiliate_network: 'Click Picks Direct',
    processing_status: 'active',
    source_metadata: JSON.stringify({ source: 'manual', type: 'text-only' }),
    message_group_id: 'text_' + Date.now() + '_2',
    created_at: Math.floor(Date.now() / 1000)
  };
  
  const textOnlyProduct3 = {
    name: 'Complete Guide to Remote Work Success',
    description: 'Master the art of remote work with this comprehensive guide. Learn how to set up your home office, manage time effectively, communicate with teams, and maintain work-life balance while working from home.',
    price: '0',
    original_price: '0',
    currency: 'INR',
    image_url: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=400',
    affiliate_url: 'https://example.com/remote-work-guide',
    category: 'Career & Business',
    rating: '4.8',
    review_count: '567',
    discount: '0',
    is_featured: 1,
    is_new: 1,
    affiliate_network: 'Click Picks Direct',
    processing_status: 'active',
    source_metadata: JSON.stringify({ source: 'manual', type: 'text-only' }),
    message_group_id: 'text_' + Date.now() + '_3',
    created_at: Math.floor(Date.now() / 1000)
  };
  
  const insertStmt = db.prepare(`
    INSERT INTO click_picks_products (
      name, description, price, original_price, currency, image_url, affiliate_url,
      category, rating, review_count, discount, is_featured, is_new, affiliate_network,
      processing_status, source_metadata, message_group_id, created_at
    ) VALUES (
      @name, @description, @price, @original_price, @currency, @image_url, @affiliate_url,
      @category, @rating, @review_count, @discount, @is_featured, @is_new, @affiliate_network,
      @processing_status, @source_metadata, @message_group_id, @created_at
    )
  `);
  
  const result1 = insertStmt.run(textOnlyProduct1);
  console.log(`Success Text-only product 1 created with ID: ${result1.lastInsertRowid}`);
  
  const result2 = insertStmt.run(textOnlyProduct2);
  console.log(`Success Text-only product 2 created with ID: ${result2.lastInsertRowid}`);
  
  const result3 = insertStmt.run(textOnlyProduct3);
  console.log(`Success Text-only product 3 created with ID: ${result3.lastInsertRowid}`);
  
  // Verify the products were created
  console.log('\nSearch Verifying text-only products...');
  const textOnlyProducts = db.prepare(`
    SELECT id, name, price, description, processing_status 
    FROM click_picks_products 
    WHERE price = '0'
    ORDER BY created_at DESC
  `).all();
  
  console.log(`Success Found ${textOnlyProducts.length} text-only products:`);
  textOnlyProducts.forEach(product => {
    console.log(`   - ID: ${product.id}, Name: ${product.name}`);
    console.log(`     Price: ${product.price} (text-only), Status: ${product.processing_status}`);
    console.log(`     Description: ${product.description.substring(0, 80)}...`);
    console.log('');
  });
  
  // Check total count
  const totalCount = db.prepare('SELECT COUNT(*) as count FROM click_picks_products WHERE processing_status = ?').get('active');
  console.log(`Stats Total active Click Picks products: ${totalCount.count}`);
  
  // Show mix of products
  const allProducts = db.prepare(`
    SELECT id, name, price, CASE WHEN price = '0' THEN 'Text-Only' ELSE 'Priced' END as type
    FROM click_picks_products 
    WHERE processing_status = 'active'
    ORDER BY created_at DESC
  `).all();
  
  console.log('\n📋 All Click Picks products:');
  allProducts.forEach(product => {
    console.log(`   - ${product.name} (${product.type})`);
  });
  
  db.close();
  console.log('\nCelebration Text-only Click Picks products created successfully!');
  console.log('\nRefresh Test the updated Click Picks page: http://localhost:5000/click-picks');
  console.log('\nBlog You should now see:');
  console.log('   - Products with prices > 0 showing "Buy Now" button');
  console.log('   - Products with price = 0 showing description and "Learn More" button');
  
} catch (error) {
  console.error('Error Error updating schema:', error);
  process.exit(1);
}