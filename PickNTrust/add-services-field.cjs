const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'sqlite.db');
const db = new Database(dbPath);

try {
  console.log('Adding isService field to products table...');
  
  // Check if products table exists
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='products'").all();
  
  if (tables.length === 0) {
    console.log('❌ Products table does not exist. Please run the server first to initialize the database.');
    return;
  }
  
  // Check if is_service column already exists
  const tableInfo = db.prepare("PRAGMA table_info(products)").all();
  const serviceField = tableInfo.find(col => col.name === 'is_service');
  
  if (serviceField) {
    console.log('✅ is_service field already exists in products table');
    console.log('Field details:', serviceField);
    return;
  }
  
  // Add the new isService column
  db.exec(`
    ALTER TABLE products ADD COLUMN is_service INTEGER DEFAULT 0;
  `);
  
  console.log('✅ Successfully added isService field to products table');
  
  // Verify the change
  const updatedTableInfo = db.prepare("PRAGMA table_info(products)").all();
  const newServiceField = updatedTableInfo.find(col => col.name === 'is_service');
  
  if (newServiceField) {
    console.log('✅ Verified: is_service field exists in products table');
    console.log('Field details:', newServiceField);
  } else {
    console.log('❌ Error: is_service field not found after adding');
  }
  
} catch (error) {
  console.error('❌ Error adding isService field:', error.message);
} finally {
  db.close();
}
