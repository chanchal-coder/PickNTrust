const Database = require('better-sqlite3');
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'server', 'database.sqlite');
console.log('Checking categories table structure in database:', dbPath);

try {
  const db = new Database(dbPath);
  
  console.log('\n=== Categories Table Structure ===');
  
  // Check if categories table exists
  const tableExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='categories'
  `).get();
  
  if (!tableExists) {
    console.log('❌ Categories table does not exist!');
    db.close();
    process.exit(1);
  }
  
  console.log('✅ Categories table exists');
  
  // Get table schema
  const schema = db.prepare(`PRAGMA table_info(categories)`).all();
  console.log('\nTable columns:');
  schema.forEach((col, index) => {
    console.log(`${index + 1}. ${col.name} (${col.type}) - ${col.notnull ? 'NOT NULL' : 'NULL'} - ${col.dflt_value ? `DEFAULT: ${col.dflt_value}` : 'NO DEFAULT'}`);
  });
  
  // Check data in categories table
  const categoryCount = db.prepare(`SELECT COUNT(*) as count FROM categories`).get();
  console.log(`\nTotal categories: ${categoryCount.count}`);
  
  if (categoryCount.count > 0) {
    const categories = db.prepare(`SELECT * FROM categories LIMIT 5`).all();
    console.log('\nFirst 5 categories:');
    categories.forEach((cat, index) => {
      console.log(`${index + 1}. ${JSON.stringify(cat, null, 2)}`);
    });
  }
  
  db.close();
  console.log('\n✅ Categories table structure check completed!');
  
} catch (error) {
  console.error('❌ Error checking categories table structure:', error);
  process.exit(1);
}