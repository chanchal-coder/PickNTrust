const Database = require('better-sqlite3');
const db = new Database('./database.db');

console.log('📋 Available tables:');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
tables.forEach(t => console.log('  -', t.name));

console.log('\n🔍 Checking if travel_deals table exists...');
const travelDealsExists = tables.find(t => t.name === 'travel_deals');
if (travelDealsExists) {
  console.log('✅ travel_deals table found');
  
  // Check schema
  const schema = db.prepare('PRAGMA table_info(travel_deals)').all();
  console.log('\n📋 travel_deals schema:');
  schema.forEach(col => {
    console.log(`  ${col.name} (${col.type})`);
  });
  
  // Check data count
  const count = db.prepare('SELECT COUNT(*) as count FROM travel_deals').get();
  console.log(`\n📊 Records in travel_deals: ${count.count}`);
} else {
  console.log('❌ travel_deals table NOT found');
}

db.close();