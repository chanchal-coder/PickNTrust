const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

console.log('🧹 COMPREHENSIVE TEST DATA CLEANUP');
console.log('=' .repeat(50));
console.log('Removing all test, sample, and placeholder data from database...');

let totalDeleted = 0;
const cleanupResults = [];

// Function to clean test data from a table
function cleanTestData(tableName, conditions) {
  try {
    console.log(`\n📋 Cleaning ${tableName.toUpperCase()}:`);
    
    // Check current count
    const beforeCount = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
    console.log(`  📦 Records before: ${beforeCount.count}`);
    
    if (beforeCount.count === 0) {
      console.log(`  ℹ️  Already empty`);
      return 0;
    }
    
    let deleted = 0;
    
    // Apply each condition
    conditions.forEach(condition => {
      const result = db.prepare(`DELETE FROM ${tableName} WHERE ${condition}`).run();
      if (result.changes > 0) {
        console.log(`  🗑️  Deleted ${result.changes} records: ${condition}`);
        deleted += result.changes;
      }
    });
    
    // Verify final count
    const afterCount = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
    console.log(`  ✅ Records after: ${afterCount.count}`);
    
    if (deleted > 0) {
      console.log(`  📊 Total deleted from ${tableName}: ${deleted}`);
    }
    
    cleanupResults.push({
      table: tableName,
      before: beforeCount.count,
      deleted: deleted,
      after: afterCount.count
    });
    
    return deleted;
    
  } catch (error) {
    console.log(`  ❌ Error cleaning ${tableName}: ${error.message}`);
    return 0;
  }
}

// Clean main product tables with test data
const mainTableConditions = [
  "name LIKE '%TEST%'",
  "name LIKE '%ERROR%'",
  "name LIKE '%SAMPLE%'",
  "name LIKE '%FIX%'",
  "name LIKE '%DETECTION%'",
  "name LIKE '%ORIGINAL PRICE%'",
  "name LIKE '%AUTOPOST%'",
  "name LIKE '%SCHEMA%'",
  "description LIKE '%test%'",
  "description LIKE '%sample%'",
  "source = 'test_data'",
  "source = 'sample_data'"
];

// Clean featured_products (has the most test data)
totalDeleted += cleanTestData('featured_products', mainTableConditions);

// Clean main products table
totalDeleted += cleanTestData('products', mainTableConditions);

// Clean top_picks_products
totalDeleted += cleanTestData('top_picks_products', mainTableConditions);

// Clean all bot tables completely (they should only have real data)
const botTables = [
  'amazon_products',
  'cuelinks_products', 
  'value_picks_products',
  'click_picks_products',
  'global_picks_products',
  'travel_products',
  'deals_hub_products',
  'lootbox_products',
  'apps_products',
  'dealshub_products'
];

// Admin tables that admin should have full control over
const adminControlTables = [
  'products',           // Main products table - admin has full control
  'featured_products',  // Featured products - admin managed
  'top_picks_products', // Top picks - admin curated
  'category_products',  // Category products - admin organized
  'admincategory_products' // Admin category products
];

console.log('\n🤖 CLEANING BOT TABLES:');
botTables.forEach(tableName => {
  try {
    const beforeCount = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
    if (beforeCount.count > 0) {
      console.log(`\n📋 ${tableName.toUpperCase()}:`);
      console.log(`  📦 Records before: ${beforeCount.count}`);
      
      // Delete all records from bot tables (they should be populated by bots, not manually)
      const result = db.prepare(`DELETE FROM ${tableName}`).run();
      console.log(`  🗑️  Deleted: ${result.changes} records`);
      totalDeleted += result.changes;
      
      const afterCount = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
      console.log(`  ✅ Records after: ${afterCount.count}`);
      
      cleanupResults.push({
        table: tableName,
        before: beforeCount.count,
        deleted: result.changes,
        after: afterCount.count
      });
    }
  } catch (error) {
    console.log(`❌ Error cleaning ${tableName}: ${error.message}`);
  }
});

// Clean other tables that might have test data
const otherTables = [
  { name: 'blog_posts', conditions: ["title LIKE '%test%'", "title LIKE '%sample%'"] },
  { name: 'video_content', conditions: ["title LIKE '%test%'", "title LIKE '%sample%'"] },
  { name: 'announcements', conditions: ["message LIKE '%test%'", "message LIKE '%sample%'"] }
];

console.log('\n📄 CLEANING OTHER CONTENT TABLES:');
otherTables.forEach(({name, conditions}) => {
  totalDeleted += cleanTestData(name, conditions);
});

db.close();

// Display comprehensive summary
console.log('\n📊 COMPREHENSIVE CLEANUP SUMMARY:');
console.log('=' .repeat(50));
console.log(`🗑️  Total records deleted: ${totalDeleted}`);
console.log(`📋 Tables processed: ${cleanupResults.length}`);

if (cleanupResults.length > 0) {
  console.log('\n📋 Detailed Results:');
  cleanupResults.forEach(result => {
    if (result.deleted > 0) {
      console.log(`  • ${result.table}: ${result.before} → ${result.after} (deleted ${result.deleted})`);
    }
  });
}

if (totalDeleted > 0) {
  console.log('\n✅ SUCCESS: All test/sample data removed!');
  console.log('\n🎯 WEBSITE IS NOW CLEAN:');
  console.log('   1. All test products removed from Today\'s Top Picks');
  console.log('   2. All sample data cleared from featured products');
  console.log('   3. All bot tables reset for fresh data');
  console.log('   4. Website pages will show only real products');
  console.log('\n🚀 NEXT STEPS:');
  console.log('   1. Check website - no more "ERROR DETECTION TEST" entries');
  console.log('   2. Post real URLs in Telegram channels');
  console.log('   3. Verify bots populate tables with real products');
  console.log('   4. Monitor website for clean, real product data');
} else {
  console.log('\n✅ Database was already clean!');
}

console.log('\n💡 TIP: Run this script anytime to clean test data');
console.log('🔄 Bots will automatically repopulate with real products');