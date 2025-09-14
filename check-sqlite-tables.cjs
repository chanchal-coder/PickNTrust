const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

console.log('📋 Available tables in database.sqlite:');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
tables.forEach(t => console.log('  -', t.name));

console.log('\n🔍 Checking if travel_products table exists...');
const travelProductsExists = tables.find(t => t.name === 'travel_products');
if (travelProductsExists) {
  console.log('✅ travel_products table found');
  
  // Check schema
  const schema = db.prepare('PRAGMA table_info(travel_products)').all();
  console.log('\n📋 travel_products schema:');
  schema.forEach(col => {
    console.log(`  ${col.name} (${col.type})`);
  });
  
  // Check data count
  const count = db.prepare('SELECT COUNT(*) as count FROM travel_products').get();
  console.log(`\n📊 Records in travel_products: ${count.count}`);
} else {
  console.log('❌ travel_products table NOT found');
}

db.close();