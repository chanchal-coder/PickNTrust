const Database = require('better-sqlite3');
const path = require('path');

// Connect to the database
const dbFile = path.join(__dirname, 'database.sqlite');
const db = new Database(dbFile);

console.log('🗑️ Removing unnecessary products table...');

try {
  // Check if products table exists
  const tableExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='products'
  `).get();
  
  if (tableExists) {
    console.log('📋 Products table found, removing it...');
    
    // Drop the products table
    db.prepare('DROP TABLE products').run();
    
    console.log('✅ Products table removed successfully');
  } else {
    console.log('⚠️ Products table does not exist');
  }
  
  // List remaining tables
  const tables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `).all();
  
  console.log('\n📊 Remaining tables in database:');
  tables.forEach(table => {
    console.log(`  - ${table.name}`);
  });
  
  console.log(`\n✅ Database cleanup completed. Total tables: ${tables.length}`);
  
} catch (error) {
  console.error('❌ Error removing products table:', error);
} finally {
  db.close();
}