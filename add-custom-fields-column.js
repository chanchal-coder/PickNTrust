const Database = require('better-sqlite3');
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'database.sqlite');

console.log('🔄 Adding customFields column to products table...');

try {
  // Open database connection
  const db = new Database(dbPath);
  
  // Check if the column already exists
  const tableInfo = db.prepare("PRAGMA table_info(products)").all();
  const hasCustomFields = tableInfo.some(column => column.name === 'custom_fields');
  
  if (hasCustomFields) {
    console.log('✅ customFields column already exists in products table');
  } else {
    // Add the customFields column
    db.exec(`
      ALTER TABLE products 
      ADD COLUMN custom_fields TEXT;
    `);
    console.log('✅ Successfully added customFields column to products table');
  }
  
  // Verify the column was added
  const updatedTableInfo = db.prepare("PRAGMA table_info(products)").all();
  console.log('\n📋 Current products table structure:');
  updatedTableInfo.forEach(column => {
    console.log(`  - ${column.name}: ${column.type}${column.notnull ? ' NOT NULL' : ''}${column.dflt_value ? ` DEFAULT ${column.dflt_value}` : ''}`);
  });
  
  // Close database connection
  db.close();
  
  console.log('\n🎉 Database migration completed successfully!');
  
} catch (error) {
  console.error('❌ Error during database migration:', error.message);
  process.exit(1);
}
