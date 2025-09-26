const Database = require('better-sqlite3');

console.log('🔍 Checking database tables...');

try {
  const db = new Database('./database.sqlite');
  
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('📋 Available tables:');
  tables.forEach(table => {
    console.log(`   - ${table.name}`);
  });
  
  // Check if categories table exists
  const categoriesExists = tables.some(table => table.name === 'categories');
  console.log(`\n📊 Categories table exists: ${categoriesExists}`);
  
  if (!categoriesExists) {
    console.log('⚠️  Categories table is missing - this is causing the SQLITE_ERROR');
    console.log('💡 We need to create it or update the routes to use products table for categories');
  }
  
  db.close();
} catch (error) {
  console.error('❌ Error checking database:', error);
}