const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');

console.log('🔍 Checking unified_content table schema...\n');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    return;
  }
  console.log('✅ Connected to SQLite database');
});

// Get table schema
db.all("PRAGMA table_info(unified_content)", (err, columns) => {
  if (err) {
    console.error('❌ Error getting table info:', err.message);
    return;
  }
  
  console.log('📋 Current unified_content table schema:');
  console.log('=====================================');
  
  const pricingFields = [];
  columns.forEach((column, index) => {
    console.log(`${index + 1}. ${column.name} (${column.type}) ${column.notnull ? 'NOT NULL' : 'NULL'} ${column.dflt_value ? `DEFAULT ${column.dflt_value}` : ''}`);
    
    // Identify pricing-related fields
    if (column.name.toLowerCase().includes('price') || 
        column.name.toLowerCase().includes('currency') || 
        column.name.toLowerCase().includes('discount') ||
        column.name.toLowerCase().includes('free')) {
      pricingFields.push(column.name);
    }
  });
  
  console.log('\n💰 Current pricing-related fields:');
  console.log('==================================');
  pricingFields.forEach(field => console.log(`- ${field}`));
  
  // Get a sample record to see current data structure
  db.get("SELECT * FROM unified_content WHERE id = (SELECT MIN(id) FROM unified_content)", (err, row) => {
    if (err) {
      console.error('❌ Error getting sample record:', err.message);
    } else if (row) {
      console.log('\n📄 Sample record structure:');
      console.log('===========================');
      Object.keys(row).forEach(key => {
        if (pricingFields.includes(key) || key === 'id' || key === 'title') {
          console.log(`${key}: ${row[key]}`);
        }
      });
    }
    
    db.close();
  });
});