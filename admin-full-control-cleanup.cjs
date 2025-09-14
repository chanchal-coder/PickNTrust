const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

console.log('🔐 ADMIN FULL CONTROL CLEANUP');
console.log('=' .repeat(50));
console.log('⚠️  WARNING: This script gives admin COMPLETE control over ALL data!');
console.log('🗑️  Admin can delete EVERYTHING if needed!');

let totalDeleted = 0;
const cleanupResults = [];

// Function to completely clear a table (admin override)
function adminClearTable(tableName, reason = 'Admin requested full clear') {
  try {
    console.log(`\n🔐 ADMIN CLEARING ${tableName.toUpperCase()}:`);
    
    // Check current count
    const beforeCount = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
    console.log(`  📦 Records before: ${beforeCount.count}`);
    
    if (beforeCount.count === 0) {
      console.log(`  ℹ️  Already empty`);
      return 0;
    }
    
    // Admin override - delete ALL records
    const result = db.prepare(`DELETE FROM ${tableName}`).run();
    console.log(`  🗑️  ADMIN DELETED: ${result.changes} records`);
    console.log(`  📝 Reason: ${reason}`);
    
    // Verify deletion
    const afterCount = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
    console.log(`  ✅ Records after: ${afterCount.count}`);
    
    cleanupResults.push({
      table: tableName,
      before: beforeCount.count,
      deleted: result.changes,
      after: afterCount.count,
      reason: reason
    });
    
    return result.changes;
    
  } catch (error) {
    console.log(`  ❌ Error clearing ${tableName}: ${error.message}`);
    return 0;
  }
}

// Function for selective cleanup (admin can choose what to remove)
function adminSelectiveCleanup(tableName, conditions, reason) {
  try {
    console.log(`\n🎯 ADMIN SELECTIVE CLEANUP ${tableName.toUpperCase()}:`);
    
    const beforeCount = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
    console.log(`  📦 Records before: ${beforeCount.count}`);
    
    if (beforeCount.count === 0) {
      console.log(`  ℹ️  Already empty`);
      return 0;
    }
    
    let deleted = 0;
    conditions.forEach(condition => {
      const result = db.prepare(`DELETE FROM ${tableName} WHERE ${condition}`).run();
      if (result.changes > 0) {
        console.log(`  🗑️  Deleted ${result.changes} records: ${condition}`);
        deleted += result.changes;
      }
    });
    
    const afterCount = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
    console.log(`  ✅ Records after: ${afterCount.count}`);
    console.log(`  📝 Reason: ${reason}`);
    
    if (deleted > 0) {
      cleanupResults.push({
        table: tableName,
        before: beforeCount.count,
        deleted: deleted,
        after: afterCount.count,
        reason: reason
      });
    }
    
    return deleted;
    
  } catch (error) {
    console.log(`  ❌ Error with selective cleanup ${tableName}: ${error.message}`);
    return 0;
  }
}

// ADMIN CONTROL SECTIONS
console.log('\n🔐 ADMIN HAS FULL CONTROL OVER THESE TABLES:');

// 1. MAIN PRODUCT TABLES - Admin has complete control
const mainProductTables = [
  'products',           // Main products - admin can delete all
  'featured_products',  // Featured products - admin curated
  'top_picks_products', // Top picks - admin managed
  'category_products',  // Category products - admin organized
  'admincategory_products' // Admin category products
];

console.log('\n📋 MAIN PRODUCT TABLES (Admin Full Control):');
mainProductTables.forEach(tableName => {
  // For now, just clean test data, but admin CAN delete everything
  const testConditions = [
    "name LIKE '%TEST%'",
    "name LIKE '%ERROR%'",
    "name LIKE '%SAMPLE%'",
    "name LIKE '%FIX%'",
    "description LIKE '%test%'",
    "source = 'test_data'"
  ];
  
  totalDeleted += adminSelectiveCleanup(tableName, testConditions, 'Removing test data (Admin can delete ALL if needed)');
});

// 2. BOT TABLES - Admin can reset these anytime
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

console.log('\n🤖 BOT TABLES (Admin Can Reset Anytime):');
botTables.forEach(tableName => {
  totalDeleted += adminClearTable(tableName, 'Admin reset - bots will repopulate');
});

// 3. CONTENT TABLES - Admin manages all content
const contentTables = [
  { name: 'blog_posts', reason: 'Admin manages all blog content' },
  { name: 'video_content', reason: 'Admin controls video library' },
  { name: 'announcements', reason: 'Admin manages site announcements' }
];

console.log('\n📄 CONTENT TABLES (Admin Content Management):');
contentTables.forEach(({name, reason}) => {
  const testConditions = ["title LIKE '%test%'", "title LIKE '%sample%'", "message LIKE '%test%'"];
  totalDeleted += adminSelectiveCleanup(name, testConditions, reason);
});

// 4. ADMIN OVERRIDE FUNCTIONS (Commented out for safety)
console.log('\n⚠️  ADMIN OVERRIDE CAPABILITIES:');
console.log('   🔐 Admin can delete ALL products if needed');
console.log('   🔐 Admin can reset ANY table completely');
console.log('   🔐 Admin has FULL database control');
console.log('   📝 Uncomment functions below for complete deletion:');
console.log('');
console.log('   // DANGER: Uncomment to delete ALL products');
console.log('   // totalDeleted += adminClearTable(\'products\', \'Admin requested complete reset\');');
console.log('');
console.log('   // DANGER: Uncomment to delete ALL featured products');
console.log('   // totalDeleted += adminClearTable(\'featured_products\', \'Admin complete reset\');');
console.log('');
console.log('   // DANGER: Uncomment to reset EVERYTHING');
console.log('   // [...mainProductTables, ...botTables].forEach(table => {');
console.log('   //   totalDeleted += adminClearTable(table, \'Admin nuclear option\');');
console.log('   // });');

db.close();

// COMPREHENSIVE ADMIN SUMMARY
console.log('\n📊 ADMIN CONTROL SUMMARY:');
console.log('=' .repeat(50));
console.log(`🔐 Admin Authority: COMPLETE DATABASE CONTROL`);
console.log(`🗑️  Records processed: ${totalDeleted}`);
console.log(`📋 Tables under admin control: ${mainProductTables.length + botTables.length + contentTables.length}`);

if (cleanupResults.length > 0) {
  console.log('\n📋 Admin Actions Performed:');
  cleanupResults.forEach(result => {
    if (result.deleted > 0) {
      console.log(`  🔐 ${result.table}: ${result.before} → ${result.after} (deleted ${result.deleted})`);
      console.log(`     📝 ${result.reason}`);
    }
  });
}

console.log('\n🎯 ADMIN CAPABILITIES:');
console.log('✅ Delete individual products from any table');
console.log('✅ Clear entire product categories');
console.log('✅ Reset all bot tables');
console.log('✅ Manage all content (blogs, videos, announcements)');
console.log('✅ Complete database reset if needed');
console.log('✅ Override any system restrictions');

console.log('\n⚠️  ADMIN RESPONSIBILITY:');
console.log('🔐 With great power comes great responsibility');
console.log('💾 Always backup before major deletions');
console.log('🤖 Bot tables will auto-repopulate from Telegram');
console.log('👥 Main product tables need manual management');

console.log('\n🚀 ADMIN IS IN COMPLETE CONTROL!');
console.log('🔓 No restrictions - admin can delete EVERYTHING!');
console.log('🛡️  Use wisely - you have unlimited power!');