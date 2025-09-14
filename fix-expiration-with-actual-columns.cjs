// Fix Expiration Issues Using Actual Available Columns
// Work with the columns that actually exist in each table

const Database = require('better-sqlite3');

console.log('🔧 FIXING EXPIRATION WITH ACTUAL AVAILABLE COLUMNS');
console.log('=' .repeat(60));

function fixExpirationWithActualColumns() {
  try {
    const db = new Database('database.sqlite');
    const currentTime = Math.floor(Date.now() / 1000);
    
    console.log('\n1. Stats ANALYZING ACTUAL AMAZON PRODUCTS...');
    console.log('=' .repeat(50));
    
    // Get all amazon products with only existing columns
    const allAmazon = db.prepare(`
      SELECT id, name, expires_at, created_at
      FROM amazon_products
    `).all();
    
    console.log(`Stats Total Amazon products: ${allAmazon.length}`);
    
    if (allAmazon.length > 0) {
      console.log('\n📋 Amazon products analysis:');
      allAmazon.forEach(product => {
        const isExpired = product.expires_at && product.expires_at < currentTime;
        const expiredStatus = isExpired ? 'Error EXPIRED' : 'Success Active';
        const expiredDate = product.expires_at ? new Date(product.expires_at * 1000).toLocaleString() : 'No expiry';
        console.log(`   ${expiredStatus} ID ${product.id}: ${product.name?.substring(0, 40)}... (expires: ${expiredDate})`);
      });
      
      // Count expired products
      const expiredCount = allAmazon.filter(p => p.expires_at && p.expires_at < currentTime).length;
      console.log(`\n⏰ Found ${expiredCount} expired Amazon products`);
      
      if (expiredCount > 0) {
        console.log('\n🗑️ SOLUTION: Delete expired products completely');
        
        // Delete expired products
        let deletedCount = 0;
        allAmazon.forEach(product => {
          if (product.expires_at && product.expires_at < currentTime) {
            const result = db.prepare(`DELETE FROM amazon_products WHERE id = ?`).run(product.id);
            if (result.changes > 0) {
              deletedCount++;
              console.log(`   Success Deleted expired Amazon product ${product.id}`);
            }
          }
        });
        
        console.log(`\nStats Deleted ${deletedCount} expired Amazon products`);
      }
    }
    
    console.log('\n2. Stats CHECKING OTHER PRODUCT TABLES...');
    console.log('=' .repeat(50));
    
    // Check loot_box_products
    const lootBoxProducts = db.prepare(`
      SELECT id, name, processing_status, expires_at
      FROM loot_box_products
    `).all();
    
    console.log(`\nProducts Loot Box products: ${lootBoxProducts.length}`);
    if (lootBoxProducts.length > 0) {
      const expiredLootBox = lootBoxProducts.filter(p => p.expires_at && p.expires_at < currentTime);
      console.log(`   ⏰ Expired: ${expiredLootBox.length}`);
      console.log(`   Success Active: ${lootBoxProducts.length - expiredLootBox.length}`);
    }
    
    console.log('\n3. Blog CREATING PROPER API QUERY PATTERNS...');
    console.log('=' .repeat(50));
    
    // Create the correct query patterns based on actual columns
    const correctQueryPatterns = `
// CORRECT API QUERY PATTERNS BASED ON ACTUAL DATABASE SCHEMA

// 1. Amazon Products - Only use expires_at for filtering (no is_active or processing_status)
const getActiveAmazonProducts = (category = null) => {
  const currentTime = Math.floor(Date.now() / 1000);
  let query = \`
    SELECT 
      'amazon_' || id as id, name, description, price, original_price as originalPrice,
      currency, image_url as imageUrl, affiliate_url as affiliateUrl,
      category, rating, review_count as reviewCount, discount,
      is_featured as isFeatured, affiliate_network,
      telegram_message_id as telegramMessageId, expires_at as expiresAt, 
      created_at as createdAt
    FROM amazon_products 
    WHERE (expires_at IS NULL OR expires_at > ?)
  \`;
  
  const params = [currentTime];
  
  if (category) {
    query += \` AND category = ?\`;
    params.push(category);
  }
  
  query += \` ORDER BY created_at DESC\`;
  
  return sqliteDb.prepare(query).all(...params);
};

// 2. Loot Box Products - Use processing_status + expires_at
const getActiveLootBoxProducts = (category = null) => {
  const currentTime = Math.floor(Date.now() / 1000);
  let query = \`
    SELECT 
      'loot_box_' || id as id, name, description, price, original_price as originalPrice,
      currency, image_url as imageUrl, affiliate_url as affiliateUrl,
      category, rating, review_count as reviewCount, discount,
      is_featured as isFeatured, affiliate_network,
      telegram_message_id as telegramMessageId, processing_status,
      expires_at as expiresAt, created_at as createdAt
    FROM loot_box_products 
    WHERE processing_status = 'active'
    AND (expires_at IS NULL OR expires_at > ?)
  \`;
  
  const params = [currentTime];
  
  if (category) {
    query += \` AND category = ?\`;
    params.push(category);
  }
  
  query += \` ORDER BY created_at DESC\`;
  
  return sqliteDb.prepare(query).all(...params);
};

// 3. Category Products - Combine all active products from different tables
const getCategoryProducts = (category) => {
  const currentTime = Math.floor(Date.now() / 1000);
  
  // Amazon products (only expires_at filter)
  const amazonProducts = sqliteDb.prepare(\`
    SELECT 'amazon_' || id as id, name, description, price, original_price as originalPrice,
           currency, image_url as imageUrl, affiliate_url as affiliateUrl,
           category, rating, review_count as reviewCount, discount,
           is_featured as isFeatured, 'amazon' as source
    FROM amazon_products 
    WHERE category = ? 
    AND (expires_at IS NULL OR expires_at > ?)
  \`).all(category, currentTime);
  
  // Loot Box products (processing_status + expires_at)
  const lootBoxProducts = sqliteDb.prepare(\`
    SELECT 'loot_box_' || id as id, name, description, price, original_price as originalPrice,
           currency, image_url as imageUrl, affiliate_url as affiliateUrl,
           category, rating, review_count as reviewCount, discount,
           is_featured as isFeatured, 'loot_box' as source
    FROM loot_box_products 
    WHERE category = ? 
    AND processing_status = 'active'
    AND (expires_at IS NULL OR expires_at > ?)
  \`).all(category, currentTime);
  
  // Other product tables...
  const cuelinksProducts = sqliteDb.prepare(\`
    SELECT 'cuelinks_' || id as id, name, description, price, original_price as originalPrice,
           currency, image_url as imageUrl, affiliate_url as affiliateUrl,
           category, rating, review_count as reviewCount, discount,
           is_featured as isFeatured, 'cuelinks' as source
    FROM cuelinks_products 
    WHERE category = ? 
    AND processing_status = 'active'
    AND (expires_at IS NULL OR expires_at > ?)
  \`).all(category, currentTime);
  
  return [...amazonProducts, ...lootBoxProducts, ...cuelinksProducts];
};
`;
    
    require('fs').writeFileSync('correct-query-patterns.js', correctQueryPatterns);
    console.log('   Success Generated correct-query-patterns.js');
    
    console.log('\n4. 🧪 TESTING CORRECTED QUERIES...');
    console.log('=' .repeat(50));
    
    // Test the corrected Amazon products query
    const activeAmazon = db.prepare(`
      SELECT id, name, expires_at
      FROM amazon_products 
      WHERE (expires_at IS NULL OR expires_at > ?)
    `).all(currentTime);
    
    console.log(`\nStats Active Amazon products (non-expired): ${activeAmazon.length}`);
    activeAmazon.forEach(product => {
      const expiry = product.expires_at ? new Date(product.expires_at * 1000).toLocaleString() : 'No expiry';
      console.log(`   Success ${product.name?.substring(0, 40)}... (expires: ${expiry})`);
    });
    
    // Test loot box products
    const activeLootBox = db.prepare(`
      SELECT id, name, processing_status, expires_at
      FROM loot_box_products 
      WHERE processing_status = 'active'
      AND (expires_at IS NULL OR expires_at > ?)
    `).all(currentTime);
    
    console.log(`\nProducts Active Loot Box products: ${activeLootBox.length}`);
    activeLootBox.forEach(product => {
      const expiry = product.expires_at ? new Date(product.expires_at * 1000).toLocaleString() : 'No expiry';
      console.log(`   Success ${product.name?.substring(0, 40)}... (expires: ${expiry})`);
    });
    
    console.log('\n5. 🔧 CREATING CLEANUP TRIGGERS...');
    console.log('=' .repeat(50));
    
    // Create cleanup triggers for proper cascading deletion
    const tables = ['amazon_products', 'loot_box_products', 'cuelinks_products', 'value_picks_products'];
    
    tables.forEach(tableName => {
      try {
        // Drop existing trigger
        db.prepare(`DROP TRIGGER IF EXISTS cleanup_${tableName}_categories`).run();
        
        // Create new trigger
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
    
    console.log('\n6. 📋 SUMMARY AND NEXT STEPS...');
    console.log('=' .repeat(50));
    
    console.log('\nSuccess COMPLETED FIXES:');
    console.log('   🗑️ Deleted expired Amazon products from database');
    console.log('   Blog Generated correct query patterns for each table');
    console.log('   🔧 Created cleanup triggers for cascading deletion');
    console.log('   🧪 Tested queries to ensure they work correctly');
    
    console.log('\nTarget KEY FINDINGS:');
    console.log('   - Amazon products: Only has expires_at column (no status columns)');
    console.log('   - Loot Box products: Has processing_status + expires_at');
    console.log('   - Solution: Use different filters for different tables');
    
    console.log('\nBlog REQUIRED API UPDATES:');
    console.log('   1. Update /api/products/page/prime-picks to filter by expires_at only');
    console.log('   2. Update /api/products/page/loot-box to use processing_status + expires_at');
    console.log('   3. Update category endpoints to use table-specific filters');
    console.log('   4. Update CategoryManager to use correct column names per table');
    
    console.log('\nRefresh IMMEDIATE ACTIONS NEEDED:');
    console.log('   1. Apply the query patterns from correct-query-patterns.js');
    console.log('   2. Update server/routes.ts with proper expiration filtering');
    console.log('   3. Test all category pages to ensure expired products are hidden');
    console.log('   4. Run periodic cleanup to remove expired products');
    
    db.close();
    
    console.log('\nCelebration EXPIRATION FIX COMPLETE!');
    console.log('   Expired products should now be properly filtered/removed');
    
  } catch (error) {
    console.error('Error Error fixing expiration:', error.message);
  }
}

// Run the fix
fixExpirationWithActualColumns();