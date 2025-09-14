const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

console.log('🔍 CHECKING LATEST TRAVEL DATA');
console.log('='.repeat(40));

try {
  // Check latest records
  const latest = db.prepare('SELECT * FROM travel_products ORDER BY created_at DESC LIMIT 5').all();
  
  console.log(`\n📊 Latest ${latest.length} records:`);
  latest.forEach((record, index) => {
    console.log(`\n${index + 1}. ID: ${record.id}`);
    console.log(`   Name: ${record.name}`);
    console.log(`   Category: ${record.category}`);
    console.log(`   Subcategory: ${record.subcategory}`);
    console.log(`   Status: ${record.processing_status}`);
    console.log(`   Source: ${record.source}`);
    console.log(`   Created: ${new Date(record.created_at * 1000).toLocaleString()}`);
  });
  
  // Check total count
  const total = db.prepare('SELECT COUNT(*) as count FROM travel_products').get();
  console.log(`\n📈 Total records: ${total.count}`);
  
  // Check by category
  const byCategory = db.prepare('SELECT category, COUNT(*) as count FROM travel_products GROUP BY category').all();
  console.log('\n📋 By category:');
  byCategory.forEach(cat => {
    console.log(`   ${cat.category}: ${cat.count} records`);
  });
  
  // Check if any records match 'Akasa Air'
  const akasa = db.prepare('SELECT * FROM travel_products WHERE name LIKE "%Akasa%"').all();
  console.log(`\n🔍 Akasa Air records: ${akasa.length}`);
  akasa.forEach(record => {
    console.log(`   - ${record.name} (ID: ${record.id}, Status: ${record.processing_status})`);
  });
  
} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  db.close();
}

console.log('\n✅ Data check completed!');