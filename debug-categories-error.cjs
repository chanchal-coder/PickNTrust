const Database = require('better-sqlite3');

try {
  const db = new Database('./server/database.db');
  
  console.log('=== DATABASE DEBUG ===');
  
  // Check all tables
  console.log('\n1. All tables in database:');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log(tables);
  
  // Check if categories table exists
  console.log('\n2. Checking categories table specifically:');
  const categoriesExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='categories'").get();
  console.log('Categories table exists:', !!categoriesExists);
  
  if (categoriesExists) {
    console.log('\n3. Categories table schema:');
    const schema = db.prepare('PRAGMA table_info(categories)').all();
    console.log(schema);
    
    console.log('\n4. Sample categories data:');
    const data = db.prepare('SELECT * FROM categories LIMIT 5').all();
    console.log(data);
  } else {
    console.log('\n3. Categories table does not exist - this is the problem!');
    
    // Check unified_content table
    console.log('\n4. Checking unified_content table:');
    const ucExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='unified_content'").get();
    console.log('Unified_content table exists:', !!ucExists);
    
    if (ucExists) {
      console.log('\n5. Sample unified_content data:');
      const ucData = db.prepare('SELECT id, title, category, content_type FROM unified_content LIMIT 5').all();
      console.log(ucData);
      
      console.log('\n6. Unique categories in unified_content:');
      const uniqueCategories = db.prepare('SELECT DISTINCT category FROM unified_content WHERE category IS NOT NULL ORDER BY category').all();
      console.log(uniqueCategories);
    }
  }
  
  db.close();
  console.log('\n=== DEBUG COMPLETE ===');
} catch (error) {
  console.error('Error:', error.message);
}