const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

try {
  console.log('Adding isService field to products table...');
  
  // Add the new isService column
  db.exec(`
    ALTER TABLE products ADD COLUMN is_service INTEGER DEFAULT 0;
  `);
  
  console.log('✅ Successfully added isService field to products table');
  
  // Verify the change
  const tableInfo = db.prepare("PRAGMA table_info(products)").all();
  const serviceField = tableInfo.find(col => col.name === 'is_service');
  
  if (serviceField) {
    console.log('✅ Verified: is_service field exists in products table');
    console.log('Field details:', serviceField);
  } else {
    console.log('❌ Error: is_service field not found after adding');
  }
  
} catch (error) {
  console.error('❌ Error adding isService field:', error.message);
} finally {
  db.close();
}
