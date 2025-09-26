const Database = require('better-sqlite3');

try {
  const db = new Database('./server/database.sqlite');
  
  console.log('Tables in database:');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  tables.forEach(table => console.log(' -', table.name));
  
  console.log('\nChecking categories table:');
  try {
    const categories = db.prepare('SELECT * FROM categories LIMIT 10').all();
    console.log('Categories table data:', categories);
  } catch (e) {
    console.log('No categories table found or error:', e.message);
  }
  
  console.log('\nChecking unified_content categories:');
  const unifiedCategories = db.prepare("SELECT DISTINCT category FROM unified_content WHERE category IS NOT NULL AND category != '' LIMIT 20").all();
  console.log('Unified content categories:', unifiedCategories);
  
  db.close();
} catch (error) {
  console.error('Database error:', error.message);
}