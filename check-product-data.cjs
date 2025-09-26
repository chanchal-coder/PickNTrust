const Database = require('better-sqlite3');

try {
  const db = new Database('./server/database.db');
  
  // Check available tables
  console.log('Available tables:');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  if (tables.length === 0) {
    console.log('No tables found in database');
  } else {
    tables.forEach(table => console.log(`- ${table.name}`));
  }
  
  // Check if unified_content table exists
  const unifiedContentExists = tables.some(table => table.name === 'unified_content');
  
  if (unifiedContentExists) {
    // Get schema for unified_content table
    console.log('\nUnified content table schema:');
    const schema = db.prepare('PRAGMA table_info(unified_content)').all();
    schema.forEach(col => console.log(`- ${col.name}: ${col.type} (nullable: ${col.notnull === 0})`));
    
    // Get our test product
    console.log('\nTest product data:');
    const product = db.prepare('SELECT * FROM unified_content WHERE title LIKE ?').get('%Test Product%');
    if (product) {
      console.log(JSON.stringify(product, null, 2));
    } else {
      console.log('No test product found');
    }
  } else {
    console.log('\nUnified_content table does not exist');
  }
  
  db.close();
} catch (error) {
  console.error('Error:', error.message);
}