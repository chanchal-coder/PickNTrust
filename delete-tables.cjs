const Database = require('better-sqlite3');

console.log('🗑️ PERMANENTLY DELETING ALL PAGE-SPECIFIC TABLES');
console.log('================================================\n');

try {
  const db = new Database('database.sqlite');
  
  // List of all page-specific tables to delete
  const tablesToDelete = [
    'amazon_products',
    'prime_picks_products', 
    'cue_picks_products',
    'click_picks_products',
    'value_picks_products',
    'global_picks_products',
    'deals_hub_products',
    'loot_box_products',
    'travel_products',
    'cuelinks_products'
  ];
  
  console.log('Deleting the following tables:');
  tablesToDelete.forEach(table => console.log(`  - ${table}`));
  console.log('');
  
  // Delete each table
  let deletedCount = 0;
  tablesToDelete.forEach(tableName => {
    try {
      db.prepare(`DROP TABLE IF EXISTS ${tableName}`).run();
      console.log(`✅ Deleted: ${tableName}`);
      deletedCount++;
    } catch (error) {
      console.log(`⚠️  ${tableName}: ${error.message}`);
    }
  });
  
  console.log(`\n📊 Summary: ${deletedCount} tables deleted`);
  
  // Verify what product tables remain
  console.log('\n🔍 Remaining product-related tables:');
  const remainingTables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name LIKE '%product%'
    ORDER BY name
  `).all();
  
  if (remainingTables.length === 0) {
    console.log('   ✅ No page-specific product tables remain');
  } else {
    remainingTables.forEach(table => {
      console.log(`   - ${table.name}`);
    });
  }
  
  // Verify unified_content table still exists
  console.log('\n📋 Verifying unified_content table:');
  try {
    const unifiedCount = db.prepare('SELECT COUNT(*) as count FROM unified_content').get();
    console.log(`   ✅ unified_content table exists with ${unifiedCount.count} records`);
  } catch (error) {
    console.log(`   ❌ unified_content table issue: ${error.message}`);
  }
  
  console.log('\n🎉 CLEANUP COMPLETE!');
  console.log('✅ All page-specific tables permanently deleted');
  console.log('✅ Only unified_content table remains for all products');
  console.log('✅ No more confusion between multiple tables');
  
  db.close();
  
} catch (error) {
  console.error('❌ Error during table deletion:', error);
}