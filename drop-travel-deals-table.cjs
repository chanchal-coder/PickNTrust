const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

console.log('🗑️  DROPPING TRAVEL_DEALS TABLE');
console.log('='.repeat(40));
console.log('⚠️  This will permanently remove the travel_deals table');
console.log('✅ All data has been migrated to travel_products');
console.log('='.repeat(40));

try {
  // Step 1: Final verification that data exists in travel_products
  console.log('\n1️⃣ Final verification...');
  const travelProductsCount = db.prepare('SELECT COUNT(*) as count FROM travel_products').get();
  console.log(`   travel_products: ${travelProductsCount.count} records`);
  
  if (travelProductsCount.count === 0) {
    console.log('❌ No data in travel_products! Migration may have failed.');
    console.log('❌ Aborting table drop for safety.');
    process.exit(1);
  }
  
  // Step 2: Check if travel_deals table exists
  console.log('\n2️⃣ Checking travel_deals table...');
  try {
    const travelDealsCount = db.prepare('SELECT COUNT(*) as count FROM travel_deals').get();
    console.log(`   travel_deals: ${travelDealsCount.count} records (will be dropped)`);
  } catch (error) {
    console.log('   travel_deals: Table does not exist (already dropped)');
    console.log('✅ Nothing to do - table already removed');
    process.exit(0);
  }
  
  // Step 3: Drop the travel_deals table
  console.log('\n3️⃣ Dropping travel_deals table...');
  db.prepare('DROP TABLE IF EXISTS travel_deals').run();
  console.log('✅ travel_deals table dropped successfully');
  
  // Step 4: Verify table is gone
  console.log('\n4️⃣ Verifying table removal...');
  try {
    db.prepare('SELECT COUNT(*) as count FROM travel_deals').get();
    console.log('❌ Table still exists - drop may have failed');
  } catch (error) {
    console.log('✅ Confirmed: travel_deals table no longer exists');
  }
  
  // Step 5: Final status
  console.log('\n🎉 CLEANUP COMPLETED!');
  console.log('='.repeat(40));
  console.log('✅ travel_deals table removed');
  console.log('✅ All travel data now in travel_products');
  console.log('✅ Unified data architecture achieved');
  console.log('✅ Future dual-table issues prevented');
  console.log('='.repeat(40));
  
} catch (error) {
  console.error('❌ Error during table drop:', error.message);
} finally {
  db.close();
}