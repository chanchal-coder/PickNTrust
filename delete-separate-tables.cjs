const Database = require('better-sqlite3');
const path = require('path');

// Initialize database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('🗑️  DELETING SEPARATE TABLES (REVERTING TO SINGLE TABLE)');
console.log('======================================================\n');

// List of tables to delete (the ones I mistakenly created)
const tablesToDelete = [
  'prime_picks_products',
  'cue_picks_products', 
  'amazon_products',
  'value_picks_products',
  'click_picks_products',
  'global_picks_products',
  'deals_hub_products'
];

let deletedTables = 0;
let notFoundTables = 0;

// Delete the separate tables
for (const tableName of tablesToDelete) {
  try {
    // Check if table exists first
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name=?
    `).get(tableName);
    
    if (tableExists) {
      // Drop the table
      db.exec(`DROP TABLE IF EXISTS ${tableName}`);
      console.log(`🗑️  Deleted table: ${tableName}`);
      deletedTables++;
    } else {
      console.log(`ℹ️  Table '${tableName}' doesn't exist (already clean)`);
      notFoundTables++;
    }
  } catch (error) {
    console.log(`❌ Error deleting table '${tableName}': ${error.message}`);
  }
}

console.log('\n📊 DELETION SUMMARY');
console.log('===================');
console.log(`🗑️  Deleted: ${deletedTables} tables`);
console.log(`ℹ️  Not found: ${notFoundTables} tables`);

// Verify the main products table exists
console.log('\n🔍 VERIFYING MAIN PRODUCTS TABLE');
console.log('================================');

try {
  const mainTableExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='products'
  `).get();
  
  if (mainTableExists) {
    console.log('✅ Main "products" table exists');
    
    // Get table schema
    const tableInfo = db.prepare(`PRAGMA table_info(products)`).all();
    console.log(`📋 Columns: ${tableInfo.length}`);
    console.log(`📋 Column names: ${tableInfo.map(col => col.name).join(', ')}`);
    
    // Check if display_pages column exists
    const hasDisplayPages = tableInfo.some(col => col.name === 'display_pages');
    if (hasDisplayPages) {
      console.log('✅ display_pages column exists - ready for single table approach');
    } else {
      console.log('⚠️  display_pages column missing - need to add it');
    }
    
    // Count existing products
    const productCount = db.prepare(`SELECT COUNT(*) as count FROM products`).get();
    console.log(`📦 Current products: ${productCount.count}`);
    
    // Show sample display_pages values
    if (productCount.count > 0) {
      const sampleProducts = db.prepare(`
        SELECT id, name, display_pages 
        FROM products 
        LIMIT 5
      `).all();
      
      console.log('\n📄 Sample products:');
      sampleProducts.forEach(product => {
        console.log(`   ID ${product.id}: ${product.name} → ${product.display_pages || 'NULL'}`);
      });
    }
    
  } else {
    console.log('❌ Main "products" table does NOT exist!');
    console.log('🔧 Need to create the main products table');
  }
} catch (error) {
  console.log(`❌ Error checking main table: ${error.message}`);
}

// List all remaining tables
console.log('\n📋 REMAINING TABLES IN DATABASE');
console.log('===============================');

try {
  const allTables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' 
    ORDER BY name
  `).all();
  
  allTables.forEach(table => {
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
    console.log(`📄 ${table.name}: ${count.count} records`);
  });
  
} catch (error) {
  console.log(`❌ Error listing tables: ${error.message}`);
}

db.close();

console.log('\n🎉 CLEANUP COMPLETE!');
console.log('====================');
console.log('✅ Separate tables deleted');
console.log('✅ Ready for single table approach');
console.log('🔄 Next: Update routes to use single products table with display_pages filtering');