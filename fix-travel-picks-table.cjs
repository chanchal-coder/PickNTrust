const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

console.log('🔍 Checking existing travel-related tables...');

// Find all tables with 'travel' in the name
const travelTables = db.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='table' AND name LIKE '%travel%'
`).all();

console.log('Travel tables found:');
travelTables.forEach(t => console.log(`  - ${t.name}`));

// Delete the newly created travel_picks_products table
console.log('\n🗑️  Deleting travel_picks_products table...');
db.exec('DROP TABLE IF EXISTS travel_picks_products');
console.log('✅ Deleted travel_picks_products table');

// Check remaining travel tables
console.log('\n📋 Remaining travel tables:');
const remaining = db.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='table' AND name LIKE '%travel%'
`).all();

remaining.forEach(t => {
  console.log(`  - ${t.name}`);
  // Check how many records each table has
  const count = db.prepare(`SELECT COUNT(*) as count FROM ${t.name}`).get();
  console.log(`    Records: ${count.count}`);
});

// Also check deals_hub_products to confirm it's separate
console.log('\n🏪 Checking deals_hub_products table:');
const dealsCount = db.prepare('SELECT COUNT(*) as count FROM deals_hub_products').get();
console.log(`  - deals_hub_products: ${dealsCount.count} records`);

db.close();
console.log('\n✅ Table cleanup completed!');
console.log('\n💡 Travel Picks bot should use the existing combined travel table.');
console.log('💡 Deals Hub bot should continue using deals_hub_products table.');