const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
console.log('Database path:', dbPath);

const db = new Database(dbPath);

try {
  console.log('=== FIXING UNIFIED_CONTENT TABLE ===\n');

  // First, check if the table exists and its current structure
  console.log('1. Checking current table structure...');
  const tableInfo = db.prepare("PRAGMA table_info(unified_content)").all();
  console.log('Current unified_content columns:', tableInfo.map(col => col.name));

  // Drop the table if it exists to recreate with proper schema
  console.log('\n2. Dropping existing unified_content table...');
  db.prepare("DROP TABLE IF EXISTS unified_content").run();

  // Create the unified_content table with the correct schema from sqlite-schema.ts
  console.log('\n3. Creating unified_content table with proper schema...');
  const createTableSQL = `
    CREATE TABLE unified_content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      price TEXT,
      original_price TEXT,
      image_url TEXT NOT NULL,
      affiliate_url TEXT NOT NULL,
      content_type TEXT NOT NULL,
      page_type TEXT NOT NULL,
      category TEXT NOT NULL,
      subcategory TEXT,
      source_type TEXT NOT NULL,
      source_id TEXT,
      affiliate_platform TEXT,
      rating TEXT,
      review_count INTEGER,
      discount INTEGER,
      currency TEXT DEFAULT 'INR',
      gender TEXT,
      is_active INTEGER DEFAULT 1,
      is_featured INTEGER DEFAULT 0,
      display_order INTEGER DEFAULT 0,
      display_pages TEXT DEFAULT '["home"]',
      has_timer INTEGER DEFAULT 0,
      timer_duration INTEGER,
      timer_start_time INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `;
  
  db.prepare(createTableSQL).run();
  console.log('✅ unified_content table created successfully');

  // Verify the new table structure
  console.log('\n4. Verifying new table structure...');
  const newTableInfo = db.prepare("PRAGMA table_info(unified_content)").all();
  console.log('New unified_content columns:');
  newTableInfo.forEach(col => {
    console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
  });

  // Insert a test Prime Picks product to verify the flow
  console.log('\n5. Inserting test Prime Picks product...');
  const insertSQL = `
    INSERT INTO unified_content (
      title, description, price, original_price, image_url, affiliate_url,
      content_type, page_type, category, source_type, source_id,
      affiliate_platform, display_pages, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const testProduct = {
    title: 'Test Prime Picks Product',
    description: 'This is a test product for Prime Picks verification',
    price: '₹999',
    original_price: '₹1499',
    image_url: 'https://example.com/test-image.jpg',
    affiliate_url: 'https://amazon.in/test-product?tag=primepicks-21',
    content_type: 'product',
    page_type: 'prime-picks',
    category: 'Electronics',
    source_type: 'telegram',
    source_id: 'prime-picks-channel',
    affiliate_platform: 'amazon',
    display_pages: '["prime-picks"]',
    is_active: 1
  };

  const result = db.prepare(insertSQL).run(
    testProduct.title,
    testProduct.description,
    testProduct.price,
    testProduct.original_price,
    testProduct.image_url,
    testProduct.affiliate_url,
    testProduct.content_type,
    testProduct.page_type,
    testProduct.category,
    testProduct.source_type,
    testProduct.source_id,
    testProduct.affiliate_platform,
    testProduct.display_pages,
    testProduct.is_active
  );

  console.log('✅ Test product inserted with ID:', result.lastInsertRowid);

  // Test the Prime Picks API query
  console.log('\n6. Testing Prime Picks API query...');
  const apiQuery = `
    SELECT * FROM unified_content 
    WHERE display_pages LIKE '%prime-picks%' 
    AND is_active = 1 
    ORDER BY created_at DESC 
    LIMIT 10
  `;
  
  const products = db.prepare(apiQuery).all();
  console.log('✅ Found', products.length, 'Prime Picks products');
  
  if (products.length > 0) {
    console.log('Sample product:');
    console.log('  - Title:', products[0].title);
    console.log('  - Category:', products[0].category);
    console.log('  - Display Pages:', products[0].display_pages);
    console.log('  - Page Type:', products[0].page_type);
  }

  // Check other tables for comparison
  console.log('\n7. Checking other tables...');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Available tables:', tables.map(t => t.name).join(', '));

  // Check products table
  const productsCount = db.prepare("SELECT COUNT(*) as count FROM products").get();
  console.log('Products table count:', productsCount.count);

  console.log('\n=== UNIFIED_CONTENT TABLE SETUP COMPLETE ===');
  console.log('✅ The unified_content table is now properly configured');
  console.log('✅ Test data inserted successfully');
  console.log('✅ Prime Picks API query works correctly');
  console.log('\nNext steps:');
  console.log('1. Test the /api/products/page/prime-picks endpoint');
  console.log('2. Verify Telegram bot saves to unified_content table');
  console.log('3. Check Prime Picks page displays products correctly');

} catch (error) {
  console.error('❌ Error setting up unified_content table:', error);
  console.error('Error details:', error.message);
} finally {
  db.close();
}