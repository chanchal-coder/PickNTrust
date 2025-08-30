const Database = require('better-sqlite3');
const path = require('path');

// Connect to database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('🔍 Checking products table schema...');

try {
  // Get table schema
  const schema = db.prepare("PRAGMA table_info(products)").all();
  
  console.log('\n📋 Products table columns:');
  schema.forEach(column => {
    console.log(`   ${column.name} (${column.type}) - ${column.notnull ? 'NOT NULL' : 'NULL'} - ${column.dflt_value || 'No default'}`);
  });
  
  // Get sample product to see actual data structure
  const sampleProduct = db.prepare('SELECT * FROM products LIMIT 1').get();
  
  if (sampleProduct) {
    console.log('\n📦 Sample product structure:');
    Object.keys(sampleProduct).forEach(key => {
      console.log(`   ${key}: ${typeof sampleProduct[key]} = ${sampleProduct[key]}`);
    });
  }
  
  // Count products
  const count = db.prepare('SELECT COUNT(*) as count FROM products').get();
  console.log(`\n📊 Total products in database: ${count.count}`);
  
} catch (error) {
  console.error('❌ Error checking schema:', error);
} finally {
  db.close();
}