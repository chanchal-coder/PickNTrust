const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
console.log('Database path:', dbPath);

const db = new Database(dbPath);

try {
  console.log('=== FIXING PROCESSING_STATUS FIELD ===\n');

  // Check current table structure
  console.log('1. Checking current unified_content table structure...');
  const tableInfo = db.prepare("PRAGMA table_info(unified_content)").all();
  console.log('Current columns:', tableInfo.map(col => col.name));

  // Check if processing_status column exists
  const hasProcessingStatus = tableInfo.some(col => col.name === 'processing_status');
  
  if (!hasProcessingStatus) {
    console.log('\n2. Adding processing_status column...');
    db.prepare("ALTER TABLE unified_content ADD COLUMN processing_status TEXT DEFAULT 'active'").run();
    console.log('✅ processing_status column added');
  } else {
    console.log('\n2. processing_status column already exists');
  }

  // Update existing records to have processing_status = 'active'
  console.log('\n3. Updating existing records...');
  const updateResult = db.prepare("UPDATE unified_content SET processing_status = 'active' WHERE processing_status IS NULL OR processing_status = ''").run();
  console.log('✅ Updated', updateResult.changes, 'records with processing_status = active');

  // Verify the API query works
  console.log('\n4. Testing the API query...');
  const apiQuery = `
    SELECT * FROM unified_content 
    WHERE display_pages LIKE '%' || ? || '%'
    AND processing_status = 'active'
    ORDER BY created_at DESC 
    LIMIT 10
  `;
  
  const products = db.prepare(apiQuery).all('prime-picks');
  console.log('✅ Found', products.length, 'Prime Picks products with processing_status = active');
  
  if (products.length > 0) {
    console.log('Sample product:');
    console.log('  - ID:', products[0].id);
    console.log('  - Title:', products[0].title);
    console.log('  - Category:', products[0].category);
    console.log('  - Display Pages:', products[0].display_pages);
    console.log('  - Processing Status:', products[0].processing_status);
  }

  // Add a few more test products for better testing
  console.log('\n5. Adding more test Prime Picks products...');
  const insertSQL = `
    INSERT INTO unified_content (
      title, description, price, original_price, image_url, affiliate_url,
      content_type, page_type, category, source_type, source_id,
      affiliate_platform, display_pages, is_active, processing_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const testProducts = [
    {
      title: 'Premium Wireless Headphones',
      description: 'High-quality wireless headphones with noise cancellation',
      price: '₹2,999',
      original_price: '₹4,999',
      image_url: 'https://example.com/headphones.jpg',
      affiliate_url: 'https://amazon.in/headphones?tag=primepicks-21',
      content_type: 'product',
      page_type: 'prime-picks',
      category: 'Electronics',
      source_type: 'telegram',
      source_id: 'prime-picks-channel',
      affiliate_platform: 'amazon',
      display_pages: '["prime-picks"]',
      is_active: 1,
      processing_status: 'active'
    },
    {
      title: 'Smart Fitness Watch',
      description: 'Track your fitness goals with this advanced smartwatch',
      price: '₹1,799',
      original_price: '₹2,999',
      image_url: 'https://example.com/smartwatch.jpg',
      affiliate_url: 'https://amazon.in/smartwatch?tag=primepicks-21',
      content_type: 'product',
      page_type: 'prime-picks',
      category: 'Fitness',
      source_type: 'telegram',
      source_id: 'prime-picks-channel',
      affiliate_platform: 'amazon',
      display_pages: '["prime-picks"]',
      is_active: 1,
      processing_status: 'active'
    },
    {
      title: 'Portable Power Bank',
      description: '20000mAh fast charging power bank for all devices',
      price: '₹899',
      original_price: '₹1,499',
      image_url: 'https://example.com/powerbank.jpg',
      affiliate_url: 'https://amazon.in/powerbank?tag=primepicks-21',
      content_type: 'product',
      page_type: 'prime-picks',
      category: 'Electronics',
      source_type: 'telegram',
      source_id: 'prime-picks-channel',
      affiliate_platform: 'amazon',
      display_pages: '["prime-picks"]',
      is_active: 1,
      processing_status: 'active'
    }
  ];

  let insertedCount = 0;
  for (const product of testProducts) {
    try {
      const result = db.prepare(insertSQL).run(
        product.title,
        product.description,
        product.price,
        product.original_price,
        product.image_url,
        product.affiliate_url,
        product.content_type,
        product.page_type,
        product.category,
        product.source_type,
        product.source_id,
        product.affiliate_platform,
        product.display_pages,
        product.is_active,
        product.processing_status
      );
      insertedCount++;
      console.log(`  ✅ Inserted: ${product.title} (ID: ${result.lastInsertRowid})`);
    } catch (error) {
      console.log(`  ⚠️ Skipped: ${product.title} (might already exist)`);
    }
  }

  console.log(`✅ Added ${insertedCount} new test products`);

  // Final verification
  console.log('\n6. Final verification...');
  const finalProducts = db.prepare(apiQuery).all('prime-picks');
  console.log('✅ Total Prime Picks products:', finalProducts.length);

  // Test different categories
  const categories = db.prepare(`
    SELECT DISTINCT category FROM unified_content 
    WHERE display_pages LIKE '%prime-picks%'
    AND processing_status = 'active'
  `).all();
  
  console.log('✅ Available categories:', categories.map(c => c.category).join(', '));

  console.log('\n=== PROCESSING_STATUS FIELD FIX COMPLETE ===');
  console.log('✅ The unified_content table now has the processing_status field');
  console.log('✅ All products have processing_status = "active"');
  console.log('✅ Prime Picks API query should now work correctly');
  console.log('\nNext step: Test the /api/products/page/prime-picks endpoint');

} catch (error) {
  console.error('❌ Error fixing processing_status field:', error);
  console.error('Error details:', error.message);
} finally {
  db.close();
}