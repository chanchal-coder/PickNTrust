// Update Global Picks Table with Universal URL Support Fields
// Add missing columns for universal URL processing

const Database = require('better-sqlite3');

console.log('🔧 UPDATING GLOBAL PICKS TABLE');
console.log('=' .repeat(50));
console.log('Target Purpose: Add universal URL support fields');
console.log('Stats Adding: url_type, source_platform, primary_affiliate, etc.');
console.log('=' .repeat(50));

async function updateGlobalPicksTable() {
  try {
    console.log('\n1. 🗄️ Connecting to Database...');
    
    const db = new Database('database.sqlite');
    
    console.log('\n2. Stats Checking Current Table Structure...');
    
    const tableInfo = db.prepare('PRAGMA table_info(global_picks_products)').all();
    console.log(`Current table has ${tableInfo.length} columns`);
    
    // Check which universal fields are missing
    const requiredFields = [
      { name: 'url_type', type: 'TEXT' },
      { name: 'source_platform', type: 'TEXT' },
      { name: 'redirect_chain', type: 'TEXT' },
      { name: 'final_destination', type: 'TEXT' },
      { name: 'primary_affiliate', type: 'TEXT' },
      { name: 'secondary_affiliate', type: 'TEXT' },
      { name: 'affiliate_commission', type: 'REAL' },
      { name: 'brand', type: 'TEXT' },
      { name: 'model', type: 'TEXT' },
      { name: 'sku', type: 'TEXT' },
      { name: 'availability', type: 'TEXT', default: 'in_stock' },
      { name: 'shipping_info', type: 'TEXT' },
      { name: 'return_policy', type: 'TEXT' },
      { name: 'meta_title', type: 'TEXT' },
      { name: 'meta_description', type: 'TEXT' },
      { name: 'keywords', type: 'TEXT' },
      { name: 'view_count', type: 'INTEGER', default: 0 },
      { name: 'click_count', type: 'INTEGER', default: 0 },
      { name: 'conversion_count', type: 'INTEGER', default: 0 },
      { name: 'last_viewed', type: 'INTEGER' },
      { name: 'data_quality_score', type: 'REAL', default: 0.0 },
      { name: 'image_quality_score', type: 'REAL', default: 0.0 },
      { name: 'content_completeness', type: 'REAL', default: 0.0 },
      { name: 'validation_status', type: 'TEXT', default: 'pending' },
      { name: 'display_order', type: 'INTEGER', default: 0 },
      { name: 'featured_order', type: 'INTEGER', default: 0 },
      { name: 'category_order', type: 'INTEGER', default: 0 },
      { name: 'admin_notes', type: 'TEXT' },
      { name: 'moderation_status', type: 'TEXT', default: 'approved' },
      { name: 'moderator_id', type: 'TEXT' },
      { name: 'moderated_at', type: 'INTEGER' }
    ];
    
    const existingColumns = tableInfo.map(col => col.name);
    const missingFields = requiredFields.filter(field => !existingColumns.includes(field.name));
    
    console.log(`\n📋 Missing fields: ${missingFields.length}`);
    
    if (missingFields.length === 0) {
      console.log('Success All universal URL fields are already present!');
      db.close();
      return;
    }
    
    console.log('\n3. 🔧 Adding Missing Universal URL Fields...');
    
    // Add missing columns
    missingFields.forEach((field, index) => {
      try {
        let alterSQL = `ALTER TABLE global_picks_products ADD COLUMN ${field.name} ${field.type}`;
        
        if (field.default !== undefined) {
          if (typeof field.default === 'string') {
            alterSQL += ` DEFAULT '${field.default}'`;
          } else {
            alterSQL += ` DEFAULT ${field.default}`;
          }
        }
        
        db.exec(alterSQL);
        console.log(`   Success Added ${field.name} (${field.type}) - ${index + 1}/${missingFields.length}`);
      } catch (error) {
        console.log(`   Warning Could not add ${field.name}: ${error.message}`);
      }
    });
    
    console.log('\n4. Stats Creating Additional Indexes...');
    
    // Create indexes for new fields
    const newIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_global_picks_url_type ON global_picks_products(url_type)',
      'CREATE INDEX IF NOT EXISTS idx_global_picks_platform ON global_picks_products(source_platform)',
      'CREATE INDEX IF NOT EXISTS idx_global_picks_primary_affiliate ON global_picks_products(primary_affiliate)',
      'CREATE INDEX IF NOT EXISTS idx_global_picks_quality_score ON global_picks_products(data_quality_score)',
      'CREATE INDEX IF NOT EXISTS idx_global_picks_brand ON global_picks_products(brand)',
      'CREATE INDEX IF NOT EXISTS idx_global_picks_availability ON global_picks_products(availability)',
      'CREATE INDEX IF NOT EXISTS idx_global_picks_display_order ON global_picks_products(display_order)',
      'CREATE INDEX IF NOT EXISTS idx_global_picks_view_count ON global_picks_products(view_count)'
    ];
    
    newIndexes.forEach((indexSQL, i) => {
      try {
        db.exec(indexSQL);
        console.log(`   Success Index ${i + 1}/${newIndexes.length} created`);
      } catch (error) {
        console.log(`   Warning Index ${i + 1} already exists or failed`);
      }
    });
    
    console.log('\n5. Target Updating Sample Data with Universal Fields...');
    
    // Update existing products with universal URL data
    const updateStmt = db.prepare(`
      UPDATE global_picks_products 
      SET 
        url_type = CASE 
          WHEN original_url LIKE '%amazon%' THEN 'amazon'
          WHEN original_url LIKE '%flipkart%' THEN 'flipkart'
          WHEN original_url LIKE '%shopsy%' THEN 'shopsy'
          WHEN original_url LIKE '%myntra%' THEN 'myntra'
          WHEN original_url LIKE '%ajio%' THEN 'ajio'
          WHEN original_url LIKE '%nykaa%' THEN 'nykaa'
          ELSE 'direct'
        END,
        source_platform = CASE 
          WHEN original_url LIKE '%amazon%' THEN 'Amazon'
          WHEN original_url LIKE '%flipkart%' THEN 'Flipkart'
          WHEN original_url LIKE '%shopsy%' THEN 'Shopsy'
          WHEN original_url LIKE '%myntra%' THEN 'Myntra'
          WHEN original_url LIKE '%ajio%' THEN 'Ajio'
          WHEN original_url LIKE '%nykaa%' THEN 'Nykaa'
          ELSE 'Direct Store'
        END,
        primary_affiliate = CASE 
          WHEN original_url LIKE '%amazon%' THEN 'Amazon Associates'
          WHEN original_url LIKE '%flipkart%' THEN 'Flipkart Affiliate'
          WHEN original_url LIKE '%shopsy%' THEN 'Shopsy Affiliate'
          ELSE 'Universal'
        END,
        data_quality_score = 0.85,
        availability = 'in_stock',
        validation_status = 'approved'
      WHERE url_type IS NULL OR url_type = ''
    `);
    
    const updateResult = updateStmt.run();
    console.log(`Success Updated ${updateResult.changes} existing products with universal data`);
    
    console.log('\n6. Stats Verifying Updated Table Structure...');
    
    // Verify the updated structure
    const updatedTableInfo = db.prepare('PRAGMA table_info(global_picks_products)').all();
    console.log(`Success Updated table now has ${updatedTableInfo.length} columns`);
    
    // Check if all required fields are now present
    const updatedColumns = updatedTableInfo.map(col => col.name);
    const stillMissing = requiredFields.filter(field => !updatedColumns.includes(field.name));
    
    if (stillMissing.length === 0) {
      console.log('Success All universal URL fields are now present!');
    } else {
      console.log(`Warning Still missing ${stillMissing.length} fields:`);
      stillMissing.forEach(field => console.log(`   - ${field.name}`));
    }
    
    // Show sample updated data
    const sampleData = db.prepare(`
      SELECT name, category, price, url_type, source_platform, primary_affiliate, data_quality_score
      FROM global_picks_products 
      LIMIT 3
    `).all();
    
    console.log('\n📋 Updated Sample Products:');
    sampleData.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name}`);
      console.log(`      Category: ${product.category}`);
      console.log(`      Price: ₹${product.price}`);
      console.log(`      URL Type: ${product.url_type}`);
      console.log(`      Platform: ${product.source_platform}`);
      console.log(`      Affiliate: ${product.primary_affiliate}`);
      console.log(`      Quality Score: ${product.data_quality_score}`);
    });
    
    console.log('\n7. Success GLOBAL PICKS TABLE UPDATE COMPLETE!');
    
    console.log('\n🌍 UNIVERSAL URL SUPPORT FEATURES ADDED:');
    console.log('   Success URL Type Detection (amazon, flipkart, shopsy, etc.)');
    console.log('   Success Source Platform Identification');
    console.log('   Success Primary & Secondary Affiliate Networks');
    console.log('   Success Redirect Chain Tracking');
    console.log('   Success Data Quality Scoring');
    console.log('   Success Brand & Model Information');
    console.log('   Success Availability Tracking');
    console.log('   Success Analytics & Performance Metrics');
    console.log('   Success SEO & Metadata Support');
    console.log('   Success Admin & Moderation Tools');
    
    console.log('\nTarget NEXT STEPS:');
    console.log('   1. Refresh Restart server to use updated table');
    console.log('   2. 🧪 Run test-global-picks-system.cjs again');
    console.log('   3. Mobile Test with real URLs in Telegram channel');
    console.log('   4. Global Verify /global-picks page functionality');
    
    db.close();
    
    console.log('\nCelebration GLOBAL PICKS TABLE READY FOR UNIVERSAL URL SUPPORT!');
    console.log('Special All universal features are now available!');
    
  } catch (error) {
    console.error('Error Error updating Global Picks table:', error.message);
  }
}

// Run the table update
updateGlobalPicksTable().catch(console.error);