const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'database.sqlite');
console.log('📍 Database path:', dbPath);

try {
  const db = new Database(dbPath);
  
  // Check if categories table exists
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
  console.log('📋 All tables in database:');
  tables.forEach(table => console.log(`  - ${table.name}`));
  
  const categoriesTableExists = tables.some(table => table.name === 'categories');
  console.log(`\n🔍 Categories table exists: ${categoriesTableExists}`);
  
  if (categoriesTableExists) {
    // Get table schema
    const schema = db.prepare("PRAGMA table_info(categories)").all();
    console.log('\n📊 Categories table schema:');
    schema.forEach(col => {
      console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
    });
    
    // Get sample data
    const sampleData = db.prepare("SELECT * FROM categories LIMIT 5").all();
    console.log('\n📝 Sample categories data:');
    console.log(sampleData);
    
    // Count total categories
    const count = db.prepare("SELECT COUNT(*) as count FROM categories").get();
    console.log(`\n📊 Total categories: ${count.count}`);
  } else {
    console.log('\n❌ Categories table does not exist!');
    console.log('This explains the SQLite error in the /api/categories/browse endpoint.');
  }
  
  db.close();
} catch (error) {
  console.error('❌ Error checking categories table:', error);
}