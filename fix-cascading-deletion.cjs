// Fix Cascading Deletion and Expiration Issues
// Ensure deleted/expired products are removed from everywhere

const Database = require('better-sqlite3');

console.log('🔧 FIXING CASCADING DELETION AND EXPIRATION ISSUES');
console.log('=' .repeat(60));

async function fixCascadingDeletion() {
  try {
    const db = new Database('database.sqlite');
    
    console.log('\n1. Stats ANALYZING CURRENT DATA INCONSISTENCIES...');
    console.log('=' .repeat(50));
    
    // Check for orphaned category_products entries
    const orphanedCategoryProducts = db.prepare(`
      SELECT cp.*, 'amazon_products' as source_table
      FROM category_products cp
      LEFT JOIN amazon_products ap ON cp.product_id = ap.id AND cp.product_table = 'amazon_products'
      WHERE cp.product_table = 'amazon_products' AND ap.id IS NULL
      
      UNION ALL
      
      SELECT cp.*, 'loot_box_products' as source_table
      FROM category_products cp
      LEFT JOIN loot_box_products lbp ON cp.product_id = lbp.id AND cp.product_table = 'loot_box_products'
      WHERE cp.product_table = 'loot_box_products' AND lbp.id IS NULL
      
      UNION ALL
      
      SELECT cp.*, 'cuelinks_products' as source_table
      FROM category_products cp
      LEFT JOIN cuelinks_products clp ON cp.product_id = clp.id AND cp.product_table = 'cuelinks_products'
      WHERE cp.product_table = 'cuelinks_products' AND clp.id IS NULL
      
      UNION ALL
      
      SELECT cp.*, 'value_picks_products' as source_table
      FROM category_products cp
      LEFT JOIN value_picks_products vpp ON cp.product_id = vpp.id AND cp.product_table = 'value_picks_products'
      WHERE cp.product_table = 'value_picks_products' AND vpp.id IS NULL
    `).all();
    
    console.log(`Search Found ${orphanedCategoryProducts.length} orphaned category_products entries`);
    
    if (orphanedCategoryProducts.length > 0) {
      console.log('\n📋 Orphaned entries by table:');
      const orphanedByTable = {};
      orphanedCategoryProducts.forEach(entry => {
        const table = entry.product_table;
        if (!orphanedByTable[table]) orphanedByTable[table] = 0;
        orphanedByTable[table]++;
      });
      
      Object.entries(orphanedByTable).forEach(([table, count]) => {
        console.log(`   ${table}: ${count} orphaned entries`);
      });
    }
    
    // Check for expired products still active
    const currentTime = Math.floor(Date.now() / 1000);
    
    const expiredProducts = {
      amazon: db.prepare(`
        SELECT id, name, expires_at, processing_status
        FROM amazon_products 
        WHERE expires_at IS NOT NULL 
        AND expires_at < ? 
        AND processing_status = 'active'
      `).all(currentTime),
      
      loot_box: db.prepare(`
        SELECT id, name, expires_at, processing_status
        FROM loot_box_products 
        WHERE expires_at IS NOT NULL 
        AND expires_at < ? 
        AND processing_status = 'active'
      `).all(currentTime),
      
      cuelinks: db.prepare(`
        SELECT id, name, expires_at, processing_status
        FROM cuelinks_products 
        WHERE expires_at IS NOT NULL 
        AND expires_at < ? 
        AND processing_status = 'active'
      `).all(currentTime),
      
      value_picks: db.prepare(`
        SELECT id, name, expires_at, processing_status
        FROM value_picks_products 
        WHERE expires_at IS NOT NULL 
        AND expires_at < ? 
        AND processing_status = 'active'
      `).all(currentTime)
    };
    
    const totalExpired = Object.values(expiredProducts).reduce((sum, arr) => sum + arr.length, 0);
    console.log(`\n⏰ Found ${totalExpired} expired products still marked as active`);
    
    Object.entries(expiredProducts).forEach(([table, products]) => {
      if (products.length > 0) {
        console.log(`   ${table}: ${products.length} expired products`);
      }
    });
    
    console.log('\n2. Cleanup CLEANING UP ORPHANED CATEGORY ENTRIES...');
    console.log('=' .repeat(50));
    
    if (orphanedCategoryProducts.length > 0) {
      // Remove orphaned category_products entries
      let cleanedCount = 0;
      
      orphanedCategoryProducts.forEach(entry => {
        const result = db.prepare(`
          DELETE FROM category_products 
          WHERE product_id = ? AND product_table = ?
        `).run(entry.product_id, entry.product_table);
        
        if (result.changes > 0) {
          cleanedCount++;
          console.log(`   Success Removed orphaned entry: ${entry.product_table} ID ${entry.product_id}`);
        }
      });
      
      console.log(`\nStats Cleaned up ${cleanedCount} orphaned category entries`);
    } else {
      console.log('   Success No orphaned category entries found');
    }
    
    console.log('\n3. ⏰ MARKING EXPIRED PRODUCTS AS INACTIVE...');
    console.log('=' .repeat(50));
    
    let expiredCount = 0;
    
    // Mark expired products as inactive in each table
    Object.entries(expiredProducts).forEach(([tableName, products]) => {
      if (products.length > 0) {
        const tableMap = {
          amazon: 'amazon_products',
          loot_box: 'loot_box_products',
          cuelinks: 'cuelinks_products',
          value_picks: 'value_picks_products'
        };
        
        const actualTableName = tableMap[tableName];
        
        products.forEach(product => {
          const result = db.prepare(`
            UPDATE ${actualTableName} 
            SET processing_status = 'expired', updated_at = ?
            WHERE id = ?
          `).run(currentTime, product.id);
          
          if (result.changes > 0) {
            expiredCount++;
            console.log(`   Success Marked as expired: ${actualTableName} ID ${product.id} - ${product.name?.substring(0, 50)}...`);
          }
        });
      }
    });
    
    console.log(`\nStats Marked ${expiredCount} expired products as inactive`);
    
    console.log('\n4. 🔧 CREATING COMPREHENSIVE CLEANUP TRIGGERS...');
    console.log('=' .repeat(50));
    
    // Create triggers for automatic cleanup on deletion
    const tables = ['amazon_products', 'loot_box_products', 'cuelinks_products', 'value_picks_products'];
    
    tables.forEach(tableName => {
      try {
        // Drop existing trigger if it exists
        db.prepare(`DROP TRIGGER IF EXISTS cleanup_${tableName}_categories`).run();
        
        // Create new trigger for category cleanup on deletion
        db.prepare(`
          CREATE TRIGGER cleanup_${tableName}_categories
          AFTER DELETE ON ${tableName}
          BEGIN
            DELETE FROM category_products 
            WHERE product_id = OLD.id AND product_table = '${tableName}';
          END
        `).run();
        
        console.log(`   Success Created cleanup trigger for ${tableName}`);
      } catch (error) {
        console.log(`   Error Failed to create trigger for ${tableName}: ${error.message}`);
      }
    });
    
    console.log('\n5. Blog CREATING EXPIRATION CLEANUP FUNCTION...');
    console.log('=' .repeat(50));
    
    // Create a comprehensive cleanup function
    const cleanupFunction = `
-- Comprehensive Product Cleanup Function
-- Run this periodically to maintain data consistency

-- 1. Mark expired products as inactive
UPDATE amazon_products 
SET processing_status = 'expired', updated_at = strftime('%s', 'now')
WHERE expires_at IS NOT NULL 
AND expires_at < strftime('%s', 'now') 
AND processing_status = 'active';

UPDATE loot_box_products 
SET processing_status = 'expired', updated_at = strftime('%s', 'now')
WHERE expires_at IS NOT NULL 
AND expires_at < strftime('%s', 'now') 
AND processing_status = 'active';

UPDATE cuelinks_products 
SET processing_status = 'expired', updated_at = strftime('%s', 'now')
WHERE expires_at IS NOT NULL 
AND expires_at < strftime('%s', 'now') 
AND processing_status = 'active';

UPDATE value_picks_products 
SET processing_status = 'expired', updated_at = strftime('%s', 'now')
WHERE expires_at IS NOT NULL 
AND expires_at < strftime('%s', 'now') 
AND processing_status = 'active';

-- 2. Clean up orphaned category entries
DELETE FROM category_products 
WHERE product_table = 'amazon_products' 
AND product_id NOT IN (SELECT id FROM amazon_products);

DELETE FROM category_products 
WHERE product_table = 'loot_box_products' 
AND product_id NOT IN (SELECT id FROM loot_box_products);

DELETE FROM category_products 
WHERE product_table = 'cuelinks_products' 
AND product_id NOT IN (SELECT id FROM cuelinks_products);

DELETE FROM category_products 
WHERE product_table = 'value_picks_products' 
AND product_id NOT IN (SELECT id FROM value_picks_products);
`;
    
    // Save cleanup function to file
    require('fs').writeFileSync('database-cleanup.sql', cleanupFunction);
    console.log('   Success Created database-cleanup.sql file');
    
    console.log('\n6. 🧪 TESTING CLEANUP EFFECTIVENESS...');
    console.log('=' .repeat(50));
    
    // Re-check for issues after cleanup
    const remainingOrphaned = db.prepare(`
      SELECT COUNT(*) as count
      FROM category_products cp
      LEFT JOIN amazon_products ap ON cp.product_id = ap.id AND cp.product_table = 'amazon_products'
      LEFT JOIN loot_box_products lbp ON cp.product_id = lbp.id AND cp.product_table = 'loot_box_products'
      LEFT JOIN cuelinks_products clp ON cp.product_id = clp.id AND cp.product_table = 'cuelinks_products'
      LEFT JOIN value_picks_products vpp ON cp.product_id = vpp.id AND cp.product_table = 'value_picks_products'
      WHERE (cp.product_table = 'amazon_products' AND ap.id IS NULL)
         OR (cp.product_table = 'loot_box_products' AND lbp.id IS NULL)
         OR (cp.product_table = 'cuelinks_products' AND clp.id IS NULL)
         OR (cp.product_table = 'value_picks_products' AND vpp.id IS NULL)
    `).get();
    
    const remainingExpired = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM amazon_products WHERE expires_at < ? AND processing_status = 'active') +
        (SELECT COUNT(*) FROM loot_box_products WHERE expires_at < ? AND processing_status = 'active') +
        (SELECT COUNT(*) FROM cuelinks_products WHERE expires_at < ? AND processing_status = 'active') +
        (SELECT COUNT(*) FROM value_picks_products WHERE expires_at < ? AND processing_status = 'active') as count
    `).get(currentTime, currentTime, currentTime, currentTime);
    
    console.log(`\nStats CLEANUP RESULTS:`);
    console.log(`   Remaining orphaned entries: ${remainingOrphaned.count}`);
    console.log(`   Remaining active expired products: ${remainingExpired.count}`);
    
    if (remainingOrphaned.count === 0 && remainingExpired.count === 0) {
      console.log('   Success All data inconsistencies resolved!');
    } else {
      console.log('   Warning Some issues may require manual intervention');
    }
    
    console.log('\n7. 📋 SUMMARY AND RECOMMENDATIONS...');
    console.log('=' .repeat(50));
    
    console.log('\nSuccess COMPLETED FIXES:');
    console.log(`   Cleanup Cleaned ${cleanedCount} orphaned category entries`);
    console.log(`   ⏰ Marked ${expiredCount} expired products as inactive`);
    console.log(`   🔧 Created cleanup triggers for ${tables.length} product tables`);
    console.log(`   Blog Generated database-cleanup.sql for periodic maintenance`);
    
    console.log('\nRefresh ONGOING MAINTENANCE:');
    console.log('   1. Run database-cleanup.sql periodically (daily/weekly)');
    console.log('   2. Monitor category_products table for orphaned entries');
    console.log('   3. Ensure frontend cache invalidation works properly');
    console.log('   4. Consider implementing automatic expiration in API queries');
    
    console.log('\nTip FRONTEND IMPROVEMENTS NEEDED:');
    console.log('   1. Update category page queries to exclude expired products');
    console.log('   2. Add processing_status = "active" filters to all product queries');
    console.log('   3. Implement real-time cache invalidation on deletion');
    console.log('   4. Add expiration checks in product display components');
    
    db.close();
    
    console.log('\nCelebration CASCADING DELETION FIX COMPLETED!');
    console.log('   Products deleted/expired should now be removed from everywhere');
    
  } catch (error) {
    console.error('Error Error fixing cascading deletion:', error.message);
  }
}

// Run the fix
fixCascadingDeletion().catch(console.error);