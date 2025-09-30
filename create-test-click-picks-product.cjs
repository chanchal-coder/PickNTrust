const Database = require('better-sqlite3');

console.log('🧪 Creating test Click Picks product...');

try {
  const db = new Database('database.sqlite');
  
  // Check if click_picks_products table exists
  console.log('\n📋 Checking click_picks_products table...');
  const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='click_picks_products'").get();
  
  if (!tableExists) {
    console.log('Error click_picks_products table does not exist!');
    console.log('🔧 Creating click_picks_products table...');
    
    // Create the table based on the schema from click-picks-service.ts
    db.exec(`
      CREATE TABLE IF NOT EXISTS click_picks_products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        description TEXT,
        price TEXT,
        original_price TEXT,
        currency TEXT DEFAULT 'INR',
        image_url TEXT,
        affiliate_url TEXT,
        category TEXT,
        rating TEXT,
        review_count TEXT,
        discount TEXT,
        is_featured BOOLEAN DEFAULT 0,
        is_new BOOLEAN DEFAULT 1,
        affiliate_network TEXT,
        telegram_message_id INTEGER,
        processing_status TEXT DEFAULT 'active',
        source_metadata TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        message_group_id TEXT,
        product_sequence INTEGER DEFAULT 1,
        total_in_group INTEGER DEFAULT 1,
        has_limited_offer BOOLEAN DEFAULT 0,
        limited_offer_text TEXT,
        offer_expires_at INTEGER
      )
    `);
    console.log('Success click_picks_products table created');
  } else {
    console.log('Success click_picks_products table exists');
  }
  
  // Create a test product
  console.log('\n🧪 Creating test product...');
  const testProduct = {
    name: 'Matrix Europe eSIM - Test Product',
    description: 'Get the best eSIM for Europe with Unlimited Data plans and High-Speed 5G/4G/LTE. Enjoy 7-28 days of validity, a UK-based number, instant activation & reliable connectivity.',
    price: '499',
    original_price: '699',
    currency: 'INR',
    image_url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400',
    affiliate_url: 'https://matrix.in/products/europe-esim',
    category: 'Travel & Services',
    rating: '4.5',
    review_count: '150',
    discount: '29',
    is_featured: 1,
    is_new: 1,
    affiliate_network: 'direct',
    processing_status: 'active',
    source_metadata: JSON.stringify({ source: 'telegram', channel: '@pntclickpicks' }),
    message_group_id: 'test_' + Date.now(),
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
  
  const result = insertStmt.run(testProduct);
  console.log(`Success Test product created with ID: ${result.lastInsertRowid}`);
  
  // Verify the product was created
  console.log('\nSearch Verifying test product...');
  const createdProduct = db.prepare('SELECT id, name, processing_status, created_at FROM click_picks_products WHERE id = ?').get(result.lastInsertRowid);
  
  if (createdProduct) {
    console.log('Success Test product verified:');
    console.log(`   ID: ${createdProduct.id}`);
    console.log(`   Name: ${createdProduct.name}`);
    console.log(`   Status: ${createdProduct.processing_status}`);
    console.log(`   Created: ${new Date(createdProduct.created_at * 1000).toLocaleString()}`);
  } else {
    console.log('Error Test product not found after creation');
  }
  
  // Check total count
  const totalCount = db.prepare('SELECT COUNT(*) as count FROM click_picks_products WHERE processing_status = ?').get('active');
  console.log(`\nStats Total active Click Picks products: ${totalCount.count}`);
  
  db.close();
  console.log('\nCelebration Test product creation completed!');
  console.log('\nRefresh Now test the API endpoint: http://localhost:5000/api/products/page/click-picks');
  
} catch (error) {
  console.error('Error Error creating test product:', error);
  process.exit(1);
}