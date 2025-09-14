const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

console.log('=== CURRENT TRAVEL DATA ===\n');

try {
  const records = db.prepare(`
    SELECT id, name, category, subcategory, processing_status, created_at 
    FROM travel_products 
    ORDER BY created_at DESC 
    LIMIT 10
  `).all();
  
  console.log(`📊 Found ${records.length} travel records:\n`);
  
  records.forEach(record => {
    const date = new Date(record.created_at * 1000).toLocaleString();
    console.log(`🏷️  ID: ${record.id}`);
    console.log(`   Name: ${record.name}`);
    console.log(`   Category: ${record.category}`);
    console.log(`   Section: ${record.subcategory}`);
    console.log(`   Status: ${record.processing_status}`);
    console.log(`   Created: ${date}`);
    console.log('');
  });
  
  // Check by category
  const categories = ['hotels', 'flights', 'tours', 'cruises', 'bus', 'train'];
  console.log('📈 Records by category:');
  categories.forEach(category => {
    const count = db.prepare(`
      SELECT COUNT(*) as count 
      FROM travel_products 
      WHERE category = ? AND processing_status = 'active'
    `).get(category);
    console.log(`   ${category}: ${count.count} records`);
  });
  
} catch (error) {
  console.error('❌ Error:', error.message);
}

db.close();
console.log('\nDone.');