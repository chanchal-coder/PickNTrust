const Database = require('better-sqlite3');

console.log('🧪 Creating text-only Click Picks product...');

try {
  const db = new Database('database.sqlite');
  
  // Create a text-only Click Picks product (no price)
  console.log('\n🔧 Creating text-only product...');
  
  const textOnlyProduct = {
    name: 'Free Digital Marketing Course - Complete Guide',
    description: 'Learn digital marketing from scratch with this comprehensive free course. Covers SEO, social media marketing, content marketing, email marketing, and analytics. Perfect for beginners and professionals looking to upgrade their skills.',
    price: null, // No price for text-only card
    original_price: null,
    currency: 'INR',
    image_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400',
    affiliate_url: 'https://example.com/free-digital-marketing-course',
    category: 'Education & Learning',
    rating: '4.9',
    review_count: '1250',
    discount: null,
    is_featured: 1,
    is_new: 1,
    affiliate_network: 'Click Picks Direct',
    processing_status: 'active',
    source_metadata: JSON.stringify({ source: 'manual', type: 'text-only' }),
    message_group_id: 'text_' + Date.now(),
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
  
  const result = insertStmt.run(textOnlyProduct);
  console.log(`Success Text-only product created with ID: ${result.lastInsertRowid}`);
  
  // Create another text-only product with different content
  const textOnlyProduct2 = {
    name: 'Ultimate Productivity Tips & Tricks',
    description: 'Discover proven productivity techniques used by successful entrepreneurs and professionals. This comprehensive guide includes time management strategies, focus techniques, and tools to boost your efficiency by 300%.',
    price: null,
    original_price: null,
    currency: 'INR',
    image_url: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400',
    affiliate_url: 'https://example.com/productivity-guide',
    category: 'Self-Improvement',
    rating: '4.7',
    review_count: '890',
    discount: null,
    is_featured: 1,
    is_new: 1,
    affiliate_network: 'Click Picks Direct',
    processing_status: 'active',
    source_metadata: JSON.stringify({ source: 'manual', type: 'text-only' }),
    message_group_id: 'text_' + Date.now() + '_2',
    created_at: Math.floor(Date.now() / 1000)
  };
  
  const result2 = insertStmt.run(textOnlyProduct2);
  console.log(`Success Second text-only product created with ID: ${result2.lastInsertRowid}`);
  
  // Verify the products were created
  console.log('\nSearch Verifying text-only products...');
  const textOnlyProducts = db.prepare(`
    SELECT id, name, price, description, processing_status 
    FROM click_picks_products 
    WHERE price IS NULL OR price = '' OR price = '0'
    ORDER BY created_at DESC
  `).all();
  
  console.log(`Success Found ${textOnlyProducts.length} text-only products:`);
  textOnlyProducts.forEach(product => {
    console.log(`   - ID: ${product.id}, Name: ${product.name}`);
    console.log(`     Price: ${product.price || 'NULL'}, Status: ${product.processing_status}`);
    console.log(`     Description: ${product.description.substring(0, 80)}...`);
    console.log('');
  });
  
  // Check total count
  const totalCount = db.prepare('SELECT COUNT(*) as count FROM click_picks_products WHERE processing_status = ?').get('active');
  console.log(`Stats Total active Click Picks products: ${totalCount.count}`);
  
  db.close();
  console.log('\nCelebration Text-only Click Picks products created successfully!');
  console.log('\nRefresh Test the updated Click Picks page: http://localhost:5000/click-picks');
  console.log('\nBlog You should now see:');
  console.log('   - Products with prices showing "Buy Now" button');
  console.log('   - Text-only products showing description and "Learn More" button');
  
} catch (error) {
  console.error('Error Error creating text-only products:', error);
  process.exit(1);
}