const Database = require('better-sqlite3');

try {
  const db = new Database('./database.sqlite');
  
  console.log('🧹 CLEANING UP DATABASE - KEEPING ONLY UNIFIED_CONTENT TABLE');
  console.log('================================================================');
  
  // List of product tables to delete (keep only unified_content)
  const tablesToDelete = [
    'cue_picks_products',
    'prime_picks_products', 
    'cuelinks_products',
    'amazon_products',
    'click_picks_products',
    'top_picks_products',
    'value_picks_products',
    'global_picks_products',
    'deals_hub_products',
    'loot_box_products',
    'apps_products'
  ];
  
  console.log('\n📋 Tables to delete:');
  tablesToDelete.forEach(table => console.log(`- ${table}`));
  
  // Check which tables actually exist
  const existingTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  const existingTableNames = existingTables.map(t => t.name);
  
  console.log('\n🔍 Checking which tables exist...');
  
  // Delete each table if it exists
  tablesToDelete.forEach(tableName => {
    if (existingTableNames.includes(tableName)) {
      try {
        db.exec(`DROP TABLE IF EXISTS ${tableName}`);
        console.log(`✅ Deleted table: ${tableName}`);
      } catch (error) {
        console.log(`❌ Failed to delete ${tableName}: ${error.message}`);
      }
    } else {
      console.log(`⚠️  Table ${tableName} does not exist`);
    }
  });
  
  // Verify unified_content table exists and show its structure
  console.log('\n📊 Checking unified_content table...');
  try {
    const unifiedSchema = db.prepare("PRAGMA table_info(unified_content)").all();
    if (unifiedSchema.length > 0) {
      console.log('✅ unified_content table exists with columns:');
      unifiedSchema.forEach(col => {
        console.log(`   - ${col.name} (${col.type})`);
      });
      
      // Check current data count
      const count = db.prepare('SELECT COUNT(*) as count FROM unified_content').get();
      console.log(`\n📈 Current records in unified_content: ${count.count}`);
      
    } else {
      console.log('❌ unified_content table does not exist!');
    }
  } catch (error) {
    console.log('❌ Error checking unified_content:', error.message);
  }
  
  // Show remaining tables
  console.log('\n📋 Remaining tables in database:');
  const remainingTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  remainingTables.forEach(table => {
    console.log(`- ${table.name}`);
  });
  
  db.close();
  console.log('\n✅ Database cleanup completed!');
  console.log('🎯 Now only unified_content table will be used for all products');
  
} catch (error) {
  console.error('❌ Error:', error.message);
}