const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');
const db = new Database(dbPath);

console.log('🔄 MIGRATING DATA TO UNIFIED_CONTENT');
console.log('===================================');

try {
  // Check existing data in products table
  const products = db.prepare("SELECT * FROM products").all();
  console.log(`📊 Found ${products.length} products to migrate`);
  
  if (products.length === 0) {
    console.log('✅ No products to migrate');
    return;
  }
  
  // Prepare insert statement for unified_content (matching actual table schema)
  const insertUnified = db.prepare(`
    INSERT INTO unified_content (
      title, description, content, content_type, source_platform, source_id,
      media_urls, affiliate_urls, original_urls, tags, category,
      featured_image, status, visibility, created_at, updated_at,
      processing_status, display_pages
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  let migrated = 0;
  let skipped = 0;
  
  for (const product of products) {
    try {
      // Check if already exists in unified_content
      const existing = db.prepare("SELECT id FROM unified_content WHERE title = ? AND source_id = ?")
        .get(product.name, 'migrated_from_products');
      
      if (existing) {
        console.log(`⏭️  Skipping duplicate: ${product.name}`);
        skipped++;
        continue;
      }
      
      // Map product fields to unified_content fields (matching actual schema)
      const unifiedData = [
        product.name,                           // title
        product.description,                    // description
        JSON.stringify({                        // content (as JSON)
          price: product.price,
          originalPrice: product.original_price,
          rating: product.rating,
          reviewCount: product.review_count,
          discount: product.discount,
          currency: product.currency || 'INR',
          gender: product.gender,
          isService: product.is_service,
          isAIApp: product.is_ai_app,
          customFields: product.custom_fields
        }),
        'product',                              // content_type
        'manual',                               // source_platform
        'migrated_from_products',               // source_id
        JSON.stringify([product.image_url]),    // media_urls (as JSON array)
        JSON.stringify([product.affiliate_url]), // affiliate_urls (as JSON array)
        JSON.stringify([product.affiliate_url]), // original_urls (as JSON array)
        JSON.stringify([product.category]),     // tags (as JSON array)
        product.category,                       // category
        product.image_url,                      // featured_image
        product.processing_status || 'active',  // status
        'public',                               // visibility
        product.created_at,                     // created_at
        product.updated_at,                     // updated_at
        product.processing_status || 'active',  // processing_status
        product.display_pages || '["home"]'     // display_pages
      ];
      
      insertUnified.run(...unifiedData);
      console.log(`✅ Migrated: ${product.name}`);
      migrated++;
      
    } catch (error) {
      console.error(`❌ Error migrating ${product.name}:`, error.message);
    }
  }
  
  console.log('\n📊 MIGRATION SUMMARY:');
  console.log(`✅ Migrated: ${migrated} products`);
  console.log(`⏭️  Skipped: ${skipped} duplicates`);
  
  // Verify migration
  const unifiedCount = db.prepare("SELECT COUNT(*) as count FROM unified_content").get();
  console.log(`📋 Total unified_content records: ${unifiedCount.count}`);
  
} catch (error) {
  console.error('❌ Migration error:', error.message);
} finally {
  db.close();
}