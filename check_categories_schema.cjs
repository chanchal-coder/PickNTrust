const Database = require('better-sqlite3');

try {
  const db = new Database('./server/database.sqlite');
  
  console.log('Categories table schema:');
  const schema = db.prepare("PRAGMA table_info(categories)").all();
  console.log(schema);
  
  console.log('\nSample categories data:');
  const categories = db.prepare('SELECT * FROM categories LIMIT 5').all();
  console.log(categories);
  
  db.close();
} catch (error) {
  console.error('Database error:', error.message);
}