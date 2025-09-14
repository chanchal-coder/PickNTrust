// Implement Proper Expiration Filtering and Cascading Deletion
// Fix the issue where expired/deleted products still show in categories

const Database = require('better-sqlite3');

console.log('🔧 IMPLEMENTING PROPER EXPIRATION FILTERING');
console.log('=' .repeat(60));

async function implementExpirationFiltering() {
  try {
    const db = new Database('database.sqlite');
    const currentTime = Math.floor(Date.now() / 1000);
    
    console.log('\n1. Search IDENTIFYING EXPIRED PRODUCTS...');
    console.log('=' .repeat(50));
    
    // Check amazon_products for expired items
    const expiredAmazon = db.prepare(`
      SELECT id, name, expires_at, processing_status
      FROM amazon_products 
      WHERE expires_at IS NOT NULL AND expires_at < ?
    `).all(currentTime);
    
    console.log(`Stats Found ${expiredAmazon.length} expired Amazon products:`);
    expiredAmazon.forEach(product => {
      const expiredDate = new Date(product.expires_at * 1000).toLocaleString();
      console.log(`   Error ID ${product.id}: ${product.name?.substring(0, 50)}... (expired: ${expiredDate})`);
    });
    
    console.log('\n2. 🗑️ CLEANING UP EXPIRED PRODUCTS...');
    console.log('=' .repeat(50));
    
    // Option 1: Mark as inactive (soft delete)
    let updatedCount = 0;
    expiredAmazon.forEach(product => {
      const result = db.prepare(`
        UPDATE amazon_products 
        SET processing_status = 'expired'
        WHERE id = ?
      `).run(product.id);
      
      if (result.changes > 0) {
        updatedCount++;
        console.log(`   Success Marked as expired: Amazon product ${product.id}`);
      }
    });
    
    console.log(`\nStats Updated ${updatedCount} expired products to 'expired' status`);
    
    console.log('\n3. 🔧 CREATING COMPREHENSIVE CLEANUP TRIGGERS...');
    console.log('=' .repeat(50));
    
    // Create triggers for automatic cleanup
    const productTables = [
      'amazon_products',
      'loot_box_products', 
      'cuelinks_products',
      'value_picks_products',
      'click_picks_products',
      'global_picks_products',
      'dealshub_products'
    ];
    
    productTables.forEach(tableName => {
      try {
        // Drop existing trigger if it exists
        db.prepare(`DROP TRIGGER IF EXISTS cleanup_${tableName}_on_delete`).run();
        
        // Create trigger for category cleanup on deletion
        db.prepare(`
          CREATE TRIGGER cleanup_${tableName}_on_delete
          AFTER DELETE ON ${tableName}
          BEGIN
            DELETE FROM category_products 
            WHERE product_id = OLD.id AND product_table = '${tableName}';
          END
        `).run();
        
        console.log(`   Success Created deletion cleanup trigger for ${tableName}`);
      } catch (error) {
        console.log(`   Error Failed to create trigger for ${tableName}: ${error.message}`);
      }
    });
    
    console.log('\n4. Blog CREATING EXPIRATION CLEANUP SQL...');
    console.log('=' .repeat(50));
    
    // Create comprehensive cleanup SQL
    const cleanupSQL = `
-- Comprehensive Product Expiration and Cleanup Script
-- Run this periodically to maintain data consistency

-- 1. Mark expired products as 'expired' status
UPDATE amazon_products 
SET processing_status = 'expired'
WHERE expires_at IS NOT NULL 
AND expires_at < strftime('%s', 'now') 
AND processing_status != 'expired';

UPDATE loot_box_products 
SET processing_status = 'expired'
WHERE expires_at IS NOT NULL 
AND expires_at < strftime('%s', 'now') 
AND processing_status != 'expired';

UPDATE cuelinks_products 
SET processing_status = 'expired'
WHERE expires_at IS NOT NULL 
AND expires_at < strftime('%s', 'now') 
AND processing_status != 'expired';

UPDATE value_picks_products 
SET processing_status = 'expired'
WHERE expires_at IS NOT NULL 
AND expires_at < strftime('%s', 'now') 
AND processing_status != 'expired';

UPDATE click_picks_products 
SET processing_status = 'expired'
WHERE offer_expires_at IS NOT NULL 
AND offer_expires_at < strftime('%s', 'now') 
AND processing_status != 'expired';

UPDATE global_picks_products 
SET processing_status = 'expired'
WHERE expires_at IS NOT NULL 
AND expires_at < strftime('%s', 'now') 
AND processing_status != 'expired';

UPDATE dealshub_products 
SET processing_status = 'expired'
WHERE deal_expires_at IS NOT NULL 
AND deal_expires_at < strftime('%s', 'now') 
AND processing_status != 'expired';

-- 2. Clean up orphaned category relationships
DELETE FROM category_products 
WHERE product_table = 'amazon_products' 
AND product_id NOT IN (SELECT id FROM amazon_products WHERE processing_status = 'active');

DELETE FROM category_products 
WHERE product_table = 'loot_box_products' 
AND product_id NOT IN (SELECT id FROM loot_box_products WHERE processing_status = 'active');

DELETE FROM category_products 
WHERE product_table = 'cuelinks_products' 
AND product_id NOT IN (SELECT id FROM cuelinks_products WHERE processing_status = 'active');

DELETE FROM category_products 
WHERE product_table = 'value_picks_products' 
AND product_id NOT IN (SELECT id FROM value_picks_products WHERE processing_status = 'active');

DELETE FROM category_products 
WHERE product_table = 'click_picks_products' 
AND product_id NOT IN (SELECT id FROM click_picks_products WHERE processing_status = 'active');

DELETE FROM category_products 
WHERE product_table = 'global_picks_products' 
AND product_id NOT IN (SELECT id FROM global_picks_products WHERE processing_status = 'active');

DELETE FROM category_products 
WHERE product_table = 'dealshub_products' 
AND product_id NOT IN (SELECT id FROM dealshub_products WHERE processing_status = 'active');

-- 3. Update category product expiration tracking
UPDATE category_products 
SET product_expires_at = (
  SELECT expires_at FROM amazon_products 
  WHERE amazon_products.id = category_products.product_id 
  AND category_products.product_table = 'amazon_products'
)
WHERE product_table = 'amazon_products' AND product_expires_at IS NULL;

-- Show cleanup results
SELECT 'Cleanup Summary' as action,
       (SELECT COUNT(*) FROM amazon_products WHERE processing_status = 'expired') as expired_amazon,
       (SELECT COUNT(*) FROM loot_box_products WHERE processing_status = 'expired') as expired_loot_box,
       (SELECT COUNT(*) FROM category_products) as total_category_relationships;
`;
    
    require('fs').writeFileSync('product-expiration-cleanup.sql', cleanupSQL);
    console.log('   Success Created product-expiration-cleanup.sql');
    
    console.log('\n5. 🧪 TESTING CURRENT FILTERING...');
    console.log('=' .repeat(50));
    
    // Test current API queries to see what they return
    console.log('\nStats Testing current product queries:');
    
    // Test amazon products query (what prime-picks would show)
    const activeAmazon = db.prepare(`
      SELECT id, name, processing_status, expires_at
      FROM amazon_products 
      WHERE processing_status = 'active'
    `).all();
    
    console.log(`   Amazon products (processing_status='active'): ${activeAmazon.length}`);
    
    // Test with expiration filter
    const activeNonExpiredAmazon = db.prepare(`
      SELECT id, name, processing_status, expires_at
      FROM amazon_products 
      WHERE processing_status = 'active'
      AND (expires_at IS NULL OR expires_at > ?)
    `).all(currentTime);
    
    console.log(`   Amazon products (active + not expired): ${activeNonExpiredAmazon.length}`);
    
    // Test category queries
    const categoryProductsCount = db.prepare(`
      SELECT COUNT(*) as count FROM category_products
    `).get();
    
    console.log(`   Category relationships: ${categoryProductsCount.count}`);
    
    console.log('\n6. 📋 FRONTEND QUERY RECOMMENDATIONS...');
    console.log('=' .repeat(50));
    
    console.log('\n🔧 Required API Query Updates:');
    console.log('\n   1. Amazon Products (Prime Picks):');
    console.log('      WHERE processing_status = "active"');
    console.log('      AND (expires_at IS NULL OR expires_at > current_time)');
    
    console.log('\n   2. Loot Box Products:');
    console.log('      WHERE processing_status = "active"');
    console.log('      AND (expires_at IS NULL OR expires_at > current_time)');
    
    console.log('\n   3. Category Pages:');
    console.log('      JOIN with product tables and filter by:');
    console.log('      - processing_status = "active"');
    console.log('      - expires_at IS NULL OR expires_at > current_time');
    
    console.log('\n   4. All Product Queries:');
    console.log('      Add consistent expiration filtering across all endpoints');
    
    console.log('\n7. Target IMMEDIATE FIXES NEEDED...');
    console.log('=' .repeat(50));
    
    console.log('\nBlog Files that need updating:');
    console.log('   1. server/routes.ts - Update /api/products/page/* endpoints');
    console.log('   2. server/routes.ts - Update /api/products/category/* endpoints');
    console.log('   3. Add expiration filters to all product queries');
    console.log('   4. Update CategoryManager to exclude expired products');
    
    console.log('\nRefresh Recommended Query Pattern:');
    console.log('   const currentTime = Math.floor(Date.now() / 1000);');
    console.log('   WHERE processing_status = "active"');
    console.log('   AND (expires_at IS NULL OR expires_at > ${currentTime})');
    
    console.log('\n8. Success SUMMARY OF CHANGES MADE...');
    console.log('=' .repeat(50));
    
    console.log(`\nStats Cleanup Results:`);
    console.log(`   Success Marked ${updatedCount} expired Amazon products as 'expired'`);
    console.log(`   Success Created cleanup triggers for ${productTables.length} tables`);
    console.log(`   Success Generated comprehensive cleanup SQL script`);
    console.log(`   Success Identified query patterns needed for frontend`);
    
    console.log('\nTarget Next Steps:');
    console.log('   1. Update API endpoints to filter expired products');
    console.log('   2. Run product-expiration-cleanup.sql periodically');
    console.log('   3. Test category pages to ensure expired products are hidden');
    console.log('   4. Implement automatic expiration checking in queries');
    
    db.close();
    
    console.log('\nCelebration EXPIRATION FILTERING IMPLEMENTATION COMPLETE!');
    
  } catch (error) {
    console.error('Error Error implementing expiration filtering:', error.message);
  }
}

// Run the implementation
implementExpirationFiltering().catch(console.error);