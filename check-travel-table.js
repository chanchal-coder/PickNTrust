const Database = require('better-sqlite3');

try {
  const db = new Database('./database.sqlite');
  
  // Get all tables
  const tables = db.prepare('SELECT name FROM sqlite_master WHERE type="table"').all();
  console.log('All tables:', tables.map(t => t.name));
  
  // Check if travel_products exists
  const travelProductsExists = tables.find(t => t.name === 'travel_products');
  
  if (travelProductsExists) {
    console.log('\n✅ travel_products table exists');
    
    // Get schema
    const schema = db.prepare('PRAGMA table_info(travel_products)').all();
    console.log('\ntravel_products schema:');
    schema.forEach(col => {
      console.log(`  ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
    });
    
    // Get count
    const count = db.prepare('SELECT COUNT(*) as count FROM travel_products').get();
    console.log(`\nRecords: ${count.count}`);
  } else {
    console.log('❌ travel_products table does not exist');
  }
  
  db.close();
} catch (error) {
  console.error('Error:', error.message);
}