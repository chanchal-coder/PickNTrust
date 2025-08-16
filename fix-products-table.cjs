const Database = require('better-sqlite3');

console.log('Checking and fixing products table schema...');

const db = new Database('sqlite.db');

try {
  // Check if custom_fields column exists
  const tableInfo = db.prepare("PRAGMA table_info(products)").all();
  console.log('Current products table columns:', tableInfo.map(col => col.name));
  
  const hasCustomFields = tableInfo.some(col => col.name === 'custom_fields');
  
  if (!hasCustomFields) {
    console.log('Adding missing custom_fields column...');
    db.exec('ALTER TABLE products ADD COLUMN custom_fields TEXT');
    console.log('✅ Added custom_fields column');
  } else {
    console.log('✅ custom_fields column already exists');
  }
  
  // Verify the table structure
  const updatedTableInfo = db.prepare("PRAGMA table_info(products)").all();
  console.log('Updated products table columns:', updatedTableInfo.map(col => col.name));
  
  console.log('✅ Products table schema is now correct');
  
} catch (error) {
  console.error('❌ Error fixing products table:', error);
} finally {
  db.close();
}
