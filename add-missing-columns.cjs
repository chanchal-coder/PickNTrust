const Database = require('better-sqlite3');

console.log('Adding missing columns to products table...');

const db = new Database('sqlite.db');

try {
  // Check current table structure
  const tableInfo = db.prepare("PRAGMA table_info(products)").all();
  const columnNames = tableInfo.map(col => col.name);
  console.log('Current columns:', columnNames);
  
  // Add missing columns
  if (!columnNames.includes('is_service')) {
    console.log('Adding is_service column...');
    db.exec('ALTER TABLE products ADD COLUMN is_service INTEGER DEFAULT 0');
    console.log('✅ Added is_service column');
  }
  
  // Verify final structure
  const finalTableInfo = db.prepare("PRAGMA table_info(products)").all();
  console.log('Final columns:', finalTableInfo.map(col => col.name));
  
  console.log('✅ All required columns are now present');
  
} catch (error) {
  console.error('❌ Error adding columns:', error);
} finally {
  db.close();
}
