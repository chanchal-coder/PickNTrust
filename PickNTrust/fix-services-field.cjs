const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'sqlite.db');

try {
  const db = new Database(dbPath);
  
  console.log('Current products table structure:');
  const tableInfo = db.prepare("PRAGMA table_info(products)").all();
  tableInfo.forEach(col => {
    console.log(`- ${col.name}: ${col.type} (${col.notnull ? 'NOT NULL' : 'NULL'}) DEFAULT ${col.dflt_value || 'NULL'}`);
  });
  
  // Check if is_service already exists
  const serviceField = tableInfo.find(col => col.name === 'is_service');
  
  if (!serviceField) {
    console.log('\nAdding is_service field...');
    db.exec('ALTER TABLE products ADD COLUMN is_service INTEGER DEFAULT 0;');
    console.log('✅ Successfully added is_service field');
    
    // Verify
    const updatedTableInfo = db.prepare("PRAGMA table_info(products)").all();
    const newServiceField = updatedTableInfo.find(col => col.name === 'is_service');
    
    if (newServiceField) {
      console.log('✅ Verified: is_service field added successfully');
      console.log(`Field details: ${newServiceField.name} ${newServiceField.type} DEFAULT ${newServiceField.dflt_value}`);
    } else {
      console.log('❌ Error: is_service field not found after adding');
    }
  } else {
    console.log('✅ is_service field already exists');
  }
  
  db.close();
} catch (error) {
  console.error('❌ Error:', error.message);
}
