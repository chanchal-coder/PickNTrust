const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

console.log('=== CHECKING TRAVEL TABLES ===\n');

try {
  // Check travel_products table
  const travelProductsExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='travel_products'
  `).get();
  
  if (travelProductsExists) {
    console.log('✅ travel_products table exists');
    
    // Get table schema
    const schema = db.prepare(`
      SELECT sql FROM sqlite_master 
      WHERE type='table' AND name='travel_products'
    `).get();
    
    console.log('\n📋 Table Schema:');
    console.log(schema.sql);
    
    // Get column info
    const columns = db.prepare('PRAGMA table_info(travel_products)').all();
    console.log('\n📊 Columns:');
    columns.forEach(col => {
      console.log(`  ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
    });
    
    // Check if table has data
    const count = db.prepare('SELECT COUNT(*) as count FROM travel_products').get();
    console.log(`\n📈 Records: ${count.count}`);
    
  } else {
    console.log('❌ travel_products table does not exist');
  }
  
  // Check what travel-related tables exist
  const travelTables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name LIKE '%travel%'
  `).all();
  
  console.log('\n🔍 Available travel-related tables:');
  travelTables.forEach(table => {
    console.log(`  - ${table.name}`);
  });
  
} catch (error) {
  console.error('❌ Error:', error.message);
}

db.close();
console.log('\nDone.');