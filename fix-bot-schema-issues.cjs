const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

console.log('🔍 Checking Bot Table Schemas for NOT NULL Issues...');
console.log('=' .repeat(60));

// Check Click Picks Products table
console.log('\n📋 CLICK PICKS PRODUCTS TABLE:');
const clickSchema = db.prepare('PRAGMA table_info(click_picks_products)').all();
clickSchema.forEach(col => {
  const nullable = col.notnull ? 'NOT NULL' : 'NULL';
  const defaultVal = col.dflt_value ? `DEFAULT ${col.dflt_value}` : '';
  console.log(`  ${col.name}: ${col.type} ${nullable} ${defaultVal}`);
});

// Check for problematic NOT NULL fields
const problematicFields = clickSchema.filter(col => 
  col.notnull && !col.dflt_value && 
  ['rating', 'review_count', 'discount', 'original_price'].includes(col.name)
);

if (problematicFields.length > 0) {
  console.log('\n⚠️  PROBLEMATIC NOT NULL FIELDS:');
  problematicFields.forEach(field => {
    console.log(`  - ${field.name}: ${field.type} NOT NULL (no default)`);
  });
  
  console.log('\n🔧 FIXING SCHEMA ISSUES...');
  
  // Fix rating field - make it nullable with default
  try {
    db.exec(`
      -- Create new table with correct schema
      CREATE TABLE click_picks_products_new AS SELECT * FROM click_picks_products;
      
      -- Drop old table
      DROP TABLE click_picks_products;
      
      -- Create new table with fixed schema
      CREATE TABLE click_picks_products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price TEXT,
        original_price TEXT,
        currency TEXT DEFAULT 'INR',
        image_url TEXT,
        affiliate_url TEXT,
        original_url TEXT,
        category TEXT,
        rating REAL DEFAULT 0,
        review_count INTEGER DEFAULT 0,
        discount INTEGER DEFAULT 0,
        is_new INTEGER DEFAULT 1,
        affiliate_network TEXT,
        telegram_message_id INTEGER,
        processing_status TEXT DEFAULT 'active',
        source_metadata TEXT,
        message_group_id TEXT,
        product_sequence INTEGER,
        total_in_group INTEGER,
        has_limited_offer INTEGER DEFAULT 0,
        limited_offer_text TEXT,
        offer_expires_at INTEGER,
        content_type TEXT DEFAULT 'product',
        affiliate_tag_applied INTEGER DEFAULT 1,
        affiliate_config TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now')),
        is_featured INTEGER DEFAULT 0
      );
      
      -- Copy data back
      INSERT INTO click_picks_products SELECT * FROM click_picks_products_new;
      
      -- Drop temporary table
      DROP TABLE click_picks_products_new;
    `);
    
    console.log('✅ Fixed Click Picks table schema');
  } catch (error) {
    console.log('❌ Error fixing Click Picks schema:', error.message);
  }
} else {
  console.log('✅ Click Picks schema looks good');
}

// Check Travel Products table
console.log('\n📋 TRAVEL PRODUCTS TABLE:');
try {
  const travelSchema = db.prepare('PRAGMA table_info(travel_products)').all();
  travelSchema.forEach(col => {
    const nullable = col.notnull ? 'NOT NULL' : 'NULL';
    const defaultVal = col.dflt_value ? `DEFAULT ${col.dflt_value}` : '';
    console.log(`  ${col.name}: ${col.type} ${nullable} ${defaultVal}`);
  });
  
  const travelCount = db.prepare('SELECT COUNT(*) as count FROM travel_products').get();
  console.log(`  Records: ${travelCount.count}`);
} catch (error) {
  console.log('❌ Travel products table issue:', error.message);
}

// Check other bot tables for similar issues
const botTables = [
  'cuelinks_products',
  'value_picks_products', 
  'global_picks_products',
  'deals_hub_products',
  'lootbox_products'
];

console.log('\n🔍 Checking other bot tables...');
botTables.forEach(tableName => {
  try {
    const schema = db.prepare(`PRAGMA table_info(${tableName})`).all();
    const problematic = schema.filter(col => 
      col.notnull && !col.dflt_value && 
      ['rating', 'review_count', 'discount'].includes(col.name)
    );
    
    if (problematic.length > 0) {
      console.log(`⚠️  ${tableName}: ${problematic.map(p => p.name).join(', ')} have NOT NULL issues`);
    } else {
      console.log(`✅ ${tableName}: Schema OK`);
    }
  } catch (error) {
    console.log(`❌ ${tableName}: ${error.message}`);
  }
});

db.close();
console.log('\n✅ Schema check completed!');
console.log('\n💡 If bots are still not posting, the issue is likely:');
console.log('   1. Bot permissions in Telegram channels');
console.log('   2. Bot message listeners not active');
console.log('   3. Network connectivity issues');
console.log('   4. Bot tokens or channel IDs incorrect');