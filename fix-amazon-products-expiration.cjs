// Fix Amazon Products Expiration Issue
// The amazon_products table doesn't have processing_status, so we need a different approach

const Database = require('better-sqlite3');

console.log('🔧 FIXING AMAZON PRODUCTS EXPIRATION ISSUE');
console.log('=' .repeat(60));

function fixAmazonProductsExpiration() {
  try {
    const db = new Database('database.sqlite');
    const currentTime = Math.floor(Date.now() / 1000);
    
    console.log('\n1. Stats CHECKING AMAZON PRODUCTS TABLE STRUCTURE...');
    console.log('=' .repeat(50));
    
    // Get amazon_products schema
    const amazonSchema = db.prepare(`PRAGMA table_info(amazon_products)`).all();
    console.log('\n📋 Amazon Products columns:');
    amazonSchema.forEach(col => {
      console.log(`   ${col.name}: ${col.type}`);
    });
    
    // Check what columns are available for status/expiration
    const statusColumns = amazonSchema.filter(col => 
      col.name.includes('status') || 
      col.name.includes('active') || 
      col.name.includes('expire')
    );
    
    console.log('\nTarget Status/Expiration columns found:');
    statusColumns.forEach(col => {
      console.log(`   Success ${col.name}: ${col.type}`);
    });
    
    console.log('\n2. Search ANALYZING CURRENT AMAZON PRODUCTS...');
    console.log('=' .repeat(50));
    
    // Get all amazon products
    const allAmazon = db.prepare(`
      SELECT id, name, expires_at, is_active
      FROM amazon_products
    `).all();
    
    console.log(`Stats Total Amazon products: ${allAmazon.length}`);
    
    allAmazon.forEach(product => {
      const expiredStatus = product.expires_at && product.expires_at < currentTime ? 'Error EXPIRED' : 'Success Active';
      const expiredDate = product.expires_at ? new Date(product.expires_at * 1000).toLocaleString() : 'No expiry';
      console.log(`   ${expiredStatus} ID ${product.id}: ${product.name?.substring(0, 40)}... (expires: ${expiredDate})`);
    });
    
    // Count expired products
    const expiredCount = allAmazon.filter(p => p.expires_at && p.expires_at < currentTime).length;
    console.log(`\n⏰ Found ${expiredCount} expired Amazon products`);
    
    console.log('\n3. 🔧 IMPLEMENTING SOFT DELETE FOR EXPIRED PRODUCTS...');
    console.log('=' .repeat(50));
    
    // Since amazon_products doesn't have processing_status, we'll use is_active
    let updatedCount = 0;
    
    allAmazon.forEach(product => {
      if (product.expires_at && product.expires_at < currentTime && product.is_active !== 0) {
        const result = db.prepare(`
          UPDATE amazon_products 
          SET is_active = 0
          WHERE id = ?
        `).run(product.id);
        
        if (result.changes > 0) {
          updatedCount++;
          console.log(`   Success Marked as inactive: Amazon product ${product.id}`);
        }
      }
    });
    
    console.log(`\nStats Updated ${updatedCount} expired products to inactive (is_active=0)`);
    
    console.log('\n4. Blog CREATING PROPER API QUERY FILTERS...');
    console.log('=' .repeat(50));
    
    // Create the correct query patterns for each table
    const queryPatterns = {
      amazon_products: {
        table: 'amazon_products',
        activeFilter: 'is_active = 1',
        expirationFilter: '(expires_at IS NULL OR expires_at > ?)',
        combinedFilter: 'is_active = 1 AND (expires_at IS NULL OR expires_at > ?)'
      },
      loot_box_products: {
        table: 'loot_box_products', 
        activeFilter: 'processing_status = "active"',
        expirationFilter: '(expires_at IS NULL OR expires_at > ?)',
        combinedFilter: 'processing_status = "active" AND (expires_at IS NULL OR expires_at > ?)'
      },
      cuelinks_products: {
        table: 'cuelinks_products',
        activeFilter: 'processing_status = "active"',
        expirationFilter: '(expires_at IS NULL OR expires_at > ?)',
        combinedFilter: 'processing_status = "active" AND (expires_at IS NULL OR expires_at > ?)'
      },
      value_picks_products: {
        table: 'value_picks_products',
        activeFilter: 'processing_status = "active"',
        expirationFilter: '(expires_at IS NULL OR expires_at > ?)',
        combinedFilter: 'processing_status = "active" AND (expires_at IS NULL OR expires_at > ?)'
      }
    };
    
    console.log('\n📋 Query patterns for each table:');
    Object.entries(queryPatterns).forEach(([table, pattern]) => {
      console.log(`\n   ${table}:`);
      console.log(`      Active Filter: ${pattern.activeFilter}`);
      console.log(`      Expiration Filter: ${pattern.expirationFilter}`);
      console.log(`      Combined Filter: ${pattern.combinedFilter}`);
    });
    
    console.log('\n5. 🧪 TESTING CORRECTED QUERIES...');
    console.log('=' .repeat(50));
    
    // Test the corrected queries
    console.log('\nStats Testing corrected Amazon products query:');
    
    const activeAmazon = db.prepare(`
      SELECT id, name, is_active, expires_at
      FROM amazon_products 
      WHERE is_active = 1
    `).all();
    
    console.log(`   Active Amazon products (is_active=1): ${activeAmazon.length}`);
    
    const activeNonExpiredAmazon = db.prepare(`
      SELECT id, name, is_active, expires_at
      FROM amazon_products 
      WHERE is_active = 1 AND (expires_at IS NULL OR expires_at > ?)
    `).all(currentTime);
    
    console.log(`   Active + Non-expired Amazon products: ${activeNonExpiredAmazon.length}`);
    
    activeNonExpiredAmazon.forEach(product => {
      const expiry = product.expires_at ? new Date(product.expires_at * 1000).toLocaleString() : 'No expiry';
      console.log(`      Success ${product.name?.substring(0, 40)}... (expires: ${expiry})`);
    });
    
    console.log('\n6. Blog GENERATING UPDATED API ENDPOINT CODE...');
    console.log('=' .repeat(50));
    
    // Generate the corrected API endpoint code
    const apiEndpointCode = `
// CORRECTED API ENDPOINT QUERIES FOR EXPIRATION FILTERING

// 1. Amazon Products (Prime Picks) - Use is_active instead of processing_status
app.get('/api/products/page/prime-picks', async (req, res) => {
  try {
    const currentTime = Math.floor(Date.now() / 1000);
    const { category } = req.query;
    
    let query = \`
      SELECT 
        'amazon_' || id as id, name, description, price, original_price as originalPrice,
        currency, image_url as imageUrl, affiliate_url as affiliateUrl,
        category, rating, review_count as reviewCount, discount,
        is_featured as isFeatured, affiliate_network,
        telegram_message_id as telegramMessageId, telegram_channel_id as telegramChannelId,
        click_count as clickCount, conversion_count as conversionCount,
        expires_at as expiresAt, created_at as createdAt
      FROM amazon_products 
      WHERE is_active = 1 
      AND (expires_at IS NULL OR expires_at > ?)
    \`;
    
    const params = [currentTime];
    
    if (category && category !== '') {
      query += \` AND category = ?\`;
      params.push(category);
    }
    
    query += \` ORDER BY created_at DESC\`;
    
    const amazonProducts = sqliteDb.prepare(query).all(...params);
    res.json(amazonProducts);
  } catch (error) {
    console.error('Error fetching Amazon products:', error);
    res.status(500).json({ message: 'Failed to fetch Amazon products' });
  }
});

// 2. Loot Box Products - Already has processing_status
app.get('/api/products/page/loot-box', async (req, res) => {
  try {
    const currentTime = Math.floor(Date.now() / 1000);
    const { category } = req.query;
    
    let query = \`
      SELECT 
        'loot_box_' || id as id, name, description, price, original_price as originalPrice,
        currency, image_url as imageUrl, affiliate_url as affiliateUrl,
        category, rating, review_count as reviewCount, discount,
        is_featured as isFeatured, affiliate_network,
        telegram_message_id as telegramMessageId, telegram_channel_id as telegramChannelId,
        click_count as clickCount, conversion_count as conversionCount,
        processing_status, expires_at as expiresAt, created_at as createdAt
      FROM loot_box_products 
      WHERE processing_status = 'active'
      AND (expires_at IS NULL OR expires_at > ?)
    \`;
    
    const params = [currentTime];
    
    if (category && category !== '') {
      query += \` AND category = ?\`;
      params.push(category);
    }
    
    query += \` ORDER BY created_at DESC\`;
    
    const lootBoxProducts = sqliteDb.prepare(query).all(...params);
    res.json(lootBoxProducts);
  } catch (error) {
    console.error('Error fetching Loot Box products:', error);
    res.status(500).json({ message: 'Failed to fetch Loot Box products' });
  }
});

// 3. Category Pages - Filter by active and non-expired products
app.get('/api/products/category/:category', async (req, res) => {
  try {
    const currentTime = Math.floor(Date.now() / 1000);
    const { category } = req.params;
    
    // Amazon products
    const amazonProducts = sqliteDb.prepare(\`
      SELECT 'amazon_' || id as id, name, description, price, original_price as originalPrice,
             currency, image_url as imageUrl, affiliate_url as affiliateUrl,
             category, rating, review_count as reviewCount, discount,
             is_featured as isFeatured, 'amazon' as source
      FROM amazon_products 
      WHERE category = ? 
      AND is_active = 1 
      AND (expires_at IS NULL OR expires_at > ?)
    \`).all(category, currentTime);
    
    // Loot Box products
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
    
    const allProducts = [...amazonProducts, ...lootBoxProducts];
    res.json(allProducts);
  } catch (error) {
    console.error('Error fetching category products:', error);
    res.status(500).json({ message: 'Failed to fetch category products' });
  }
});
`;
    
    require('fs').writeFileSync('corrected-api-endpoints.js', apiEndpointCode);
    console.log('   Success Generated corrected-api-endpoints.js');
    
    console.log('\n7. Success SUMMARY OF FIXES APPLIED...');
    console.log('=' .repeat(50));
    
    console.log(`\nStats Results:`);
    console.log(`   Success Identified Amazon products table uses 'is_active' not 'processing_status'`);
    console.log(`   Success Marked ${updatedCount} expired Amazon products as inactive`);
    console.log(`   Success Generated correct query patterns for all product tables`);
    console.log(`   Success Created corrected API endpoint code`);
    
    console.log('\nTarget Key Findings:');
    console.log('   - Amazon products: Use is_active=1 AND (expires_at IS NULL OR expires_at > current_time)');
    console.log('   - Other products: Use processing_status="active" AND expiration filter');
    console.log('   - Category pages need to filter each table with its appropriate columns');
    
    console.log('\nBlog Next Steps:');
    console.log('   1. Update server/routes.ts with the corrected query patterns');
    console.log('   2. Apply expiration filters to all product endpoints');
    console.log('   3. Test category pages to ensure expired products are hidden');
    console.log('   4. Update CategoryManager to use correct column names');
    
    db.close();
    
    console.log('\nCelebration AMAZON PRODUCTS EXPIRATION FIX COMPLETE!');
    console.log('   Expired products should now be properly filtered out');
    
  } catch (error) {
    console.error('Error Error fixing Amazon products expiration:', error.message);
  }
}

// Run the fix
fixAmazonProductsExpiration();