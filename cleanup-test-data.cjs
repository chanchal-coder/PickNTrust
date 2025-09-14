const Database = require('better-sqlite3');

console.log('🧹 CLEANING UP TEST DATA');
console.log('='.repeat(40));

try {
  const db = new Database('./database.sqlite');
  
  console.log('📊 Checking test data...');
  
  // Find all test items
  const testItems = db.prepare(`
    SELECT id, name, category FROM travel_products 
    WHERE name LIKE '%Test%' OR name LIKE '%Quick Test%'
    ORDER BY created_at DESC
  `).all();
  
  console.log(`Found ${testItems.length} test items to clean up:`);
  
  if (testItems.length > 0) {
    testItems.forEach(item => {
      console.log(`  - ID ${item.id}: ${item.name} (${item.category})`);
    });
    
    console.log('\n🗑️  Removing test data...');
    
    const deleteResult = db.prepare(`
      DELETE FROM travel_products 
      WHERE name LIKE '%Test%' OR name LIKE '%Quick Test%'
    `).run();
    
    console.log(`✅ Removed ${deleteResult.changes} test items`);
    
    // Verify cleanup
    const remainingTest = db.prepare(`
      SELECT COUNT(*) as count FROM travel_products 
      WHERE name LIKE '%Test%' OR name LIKE '%Quick Test%'
    `).get();
    
    if (remainingTest.count === 0) {
      console.log('✅ All test data successfully removed');
    } else {
      console.log(`⚠️  ${remainingTest.count} test items still remain`);
    }
  } else {
    console.log('✅ No test data found - database is clean');
  }
  
  // Show current data summary
  console.log('\n📊 Current database summary:');
  const categories = db.prepare(`
    SELECT category, COUNT(*) as count 
    FROM travel_products 
    WHERE processing_status = 'active'
    GROUP BY category
    ORDER BY category
  `).all();
  
  if (categories.length > 0) {
    categories.forEach(cat => {
      console.log(`  ${cat.category}: ${cat.count} items`);
    });
  } else {
    console.log('  No active travel products in database');
  }
  
  db.close();
  console.log('\n🎉 Cleanup completed successfully!');
  
} catch (error) {
  console.error('❌ Cleanup failed:', error.message);
  process.exit(1);
}