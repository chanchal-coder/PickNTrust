const Database = require('better-sqlite3');

const db = new Database('./database.sqlite');

console.log('🧹 Clearing Travel Picks Sample Data...');
console.log('=' .repeat(50));

// Check current count
const beforeCount = db.prepare('SELECT COUNT(*) as count FROM travel_products').get();
console.log(`📊 Products before: ${beforeCount.count}`);

if (beforeCount.count > 0) {
  // Show sample of what will be deleted
  const sampleProducts = db.prepare('SELECT name, category FROM travel_products LIMIT 3').all();
  console.log('\n📋 Sample products to be deleted:');
  sampleProducts.forEach((product, i) => {
    console.log(`   ${i + 1}. ${product.name} (${product.category})`);
  });
  
  // Delete all travel products
  const result = db.prepare('DELETE FROM travel_products').run();
  console.log(`\n🗑️  Deleted: ${result.changes} products`);
  
  // Verify deletion
  const afterCount = db.prepare('SELECT COUNT(*) as count FROM travel_products').get();
  console.log(`📊 Products after: ${afterCount.count}`);
  
  if (afterCount.count === 0) {
    console.log('\n✅ SUCCESS: All travel sample data cleared!');
    console.log('   🌐 Travel Picks page will now show "No products found"');
    console.log('   🔄 Refresh the page to see the changes');
  } else {
    console.log(`\n⚠️  WARNING: ${afterCount.count} products still remain`);
  }
} else {
  console.log('\nℹ️  Travel products table is already empty');
}

db.close();
console.log('\n🎯 Travel Picks data cleanup completed!');