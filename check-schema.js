const Database = require('better-sqlite3');

try {
  const db = new Database('database.sqlite');
  
  console.log('Products table schema:');
  const schema = db.prepare('PRAGMA table_info(products)').all();
  schema.forEach(col => {
    console.log(`  ${col.name}: ${col.type}`);
  });
  
  console.log('\nSample product with pricing fields:');
  const sample = db.prepare('SELECT * FROM products LIMIT 1').get();
  if (sample) {
    console.log('Available fields:', Object.keys(sample));
  }
  
  db.close();
} catch (error) {
  console.error('Error:', error.message);
}