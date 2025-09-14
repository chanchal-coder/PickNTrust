const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');

try {
  const db = new Database(dbPath);
  
  console.log('Checking products table structure...');
  const tableInfo = db.prepare("PRAGMA table_info(products)").all();
  
  console.log('Products table columns:');
  tableInfo.forEach(col => {
    console.log(`- ${col.name}: ${col.type} (default: ${col.dflt_value})`);
  });
  
  const serviceField = tableInfo.find(col => col.name === 'is_service');
  
  if (serviceField) {
    console.log('\nSuccess is_service field exists in products table');
  } else {
    console.log('\nError is_service field NOT found in products table');
  }
  
  db.close();
} catch (error) {
  console.error('Error Error checking database:', error.message);
}
