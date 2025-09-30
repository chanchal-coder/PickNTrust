const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

console.log('🗑️  Clearing All Sample Data from Bot Tables...');
console.log('=' .repeat(60));

// List of all bot tables to clear
const botTables = [
  'amazon_products',
  'cuelinks_products', 
  'value_picks_products',
  'click_picks_products',
  'global_picks_products',
  'travel_products',
  'deals_hub_products',
  'lootbox_products'
];

let totalDeleted = 0;

botTables.forEach(tableName => {
  try {
    // Check current count
    const beforeCount = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
    console.log(`\n📋 ${tableName.toUpperCase()}:`);
    console.log(`  📦 Products before: ${beforeCount.count}`);
    
    if (beforeCount.count > 0) {
      // Delete all records
      const result = db.prepare(`DELETE FROM ${tableName}`).run();
      console.log(`  🗑️  Deleted: ${result.changes} products`);
      totalDeleted += result.changes;
      
      // Verify deletion
      const afterCount = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
      console.log(`  ✅ Products after: ${afterCount.count}`);
      
      if (afterCount.count === 0) {
        console.log(`  ✅ ${tableName} cleared successfully`);
      } else {
        console.log(`  ⚠️  ${afterCount.count} products remain in ${tableName}`);
      }
    } else {
      console.log(`  ℹ️  Already empty`);
    }
    
  } catch (error) {
    console.log(`  ❌ Error clearing ${tableName}: ${error.message}`);
  }
});

db.close();

console.log('\n📊 CLEANUP SUMMARY:');
console.log('=' .repeat(30));
console.log(`🗑️  Total products deleted: ${totalDeleted}`);
console.log(`📋 Tables processed: ${botTables.length}`);

if (totalDeleted > 0) {
  console.log('\n✅ SUCCESS: All sample data cleared!');
  console.log('\n🎯 READY FOR REAL DATA TESTING:');
  console.log('   1. All bot tables are now empty');
  console.log('   2. Post URLs in Telegram channels to test');
  console.log('   3. Check website pages for new products');
  console.log('   4. Verify bots save to correct tables');
} else {
  console.log('\n✅ Tables were already empty - ready for testing!');
}

console.log('\n💡 TESTING INSTRUCTIONS:');
console.log('   📱 Prime Picks: Post Amazon URL in Prime Picks channel');
console.log('   📱 Cue Picks: Post any URL in Cue Picks channel');
console.log('   📱 Value Picks: Post any URL in Value Picks channel');
console.log('   📱 Click Picks: Post any URL in Click Picks channel');
console.log('   📱 Global Picks: Post any URL in Global Picks channel');
console.log('   📱 Travel Picks: Post travel URL in Travel Picks channel');
console.log('   📱 Deals Hub: Post deal URL in Deals Hub channel');
console.log('   📱 Loot Box: Post product URL in Loot Box channel');

console.log('\n🔍 VERIFICATION:');
console.log('   - Check respective website pages for new products');
console.log('   - Monitor server logs for bot activity');
console.log('   - Verify products appear with correct data');
console.log('\n🚀 Ready to test real Telegram bot posting!');