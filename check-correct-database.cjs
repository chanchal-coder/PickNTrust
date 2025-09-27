const Database = require('better-sqlite3');

try {
  const db = new Database('./database.sqlite');
  
  console.log('=== CHECKING CORRECT DATABASE (database.sqlite) ===');
  
  // Check all tables
  console.log('\n1. All tables in database:');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log(tables);
  
  // Check if categories table exists
  console.log('\n2. Checking categories table:');
  const categoriesExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='categories'").get();
  console.log('Categories table exists:', !!categoriesExists);
  
  if (categoriesExists) {
    console.log('\n3. Categories table schema:');
    const schema = db.prepare('PRAGMA table_info(categories)').all();
    console.log(schema);
    
    console.log('\n4. Sample categories data:');
    const data = db.prepare('SELECT * FROM categories LIMIT 5').all();
    console.log(data);
  }
  
  // Check if unified_content table exists
  console.log('\n5. Checking unified_content table:');
  const ucExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='unified_content'").get();
  console.log('Unified_content table exists:', !!ucExists);
  
  if (ucExists) {
    console.log('\n6. Unified_content table schema:');
    const ucSchema = db.prepare('PRAGMA table_info(unified_content)').all();
    console.log(ucSchema);
    
    console.log('\n7. Sample unified_content data:');
    const ucData = db.prepare('SELECT id, title, category, content_type FROM unified_content LIMIT 5').all();
    console.log(ucData);
    
    console.log('\n8. Count of records in unified_content:');
    const count = db.prepare('SELECT COUNT(*) as count FROM unified_content').get();
    console.log(count);
  }
  
  db.close();
  console.log('\n=== CHECK COMPLETE ===');
} catch (error) {
  console.error('Error:', error.message);
}