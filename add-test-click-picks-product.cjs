const Database = require('better-sqlite3');

console.log('🔧 ADDING TEST CLICK PICKS PRODUCT');
console.log('=' .repeat(50));

try {
  const db = new Database('./database.sqlite');
  
  // Add a test product to click_picks_products table
  const insertStmt = db.prepare(`
    INSERT INTO click_picks_products (
      name, description, price, original_price, currency, image_url, affiliate_url,
      category, rating, review_count, discount, is_featured, affiliate_network,
      processing_status, created_at, has_limited_offer, limited_offer_text
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = insertStmt.run(
    'Test Product for Delete Testing',
    'This is a test product to verify delete functionality works correctly',
    '99.99',
    '149.99',
    'USD',
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=400&fit=crop',
    'https://example.com/test-affiliate-link',
    'Electronics',
    '4.5',
    '150',
    '33',
    1, // is_featured
    'Test Network',
    'active',
    new Date().toISOString(),
    1, // has_limited_offer
    'Limited Time: 33% OFF!'
  );
  
  console.log(`Success Test product added successfully!`);
  console.log(`Blog Product ID: ${result.lastInsertRowid}`);
  console.log(`Link Frontend ID will be: click_picks_${result.lastInsertRowid}`);
  
  // Verify the product was added
  const products = db.prepare('SELECT id, name FROM click_picks_products ORDER BY id DESC LIMIT 3').all();
  console.log('\n📋 Current Click Picks products:');
  products.forEach((p, i) => {
    console.log(`   ${i + 1}. ID: ${p.id} - ${p.name}`);
  });
  
  db.close();
  
  console.log('\nTarget NEXT STEPS:');
  console.log('1. Go to http://localhost:5000/click-picks');
  console.log('2. Look for the test product with delete button');
  console.log('3. Open browser console (F12)');
  console.log('4. Click delete button and watch console messages');
  console.log('5. Check if delete process completes successfully');
  
} catch (error) {
  console.error('Error Error adding test product:', error.message);
}