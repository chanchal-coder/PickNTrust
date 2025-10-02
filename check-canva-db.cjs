const Database = require('better-sqlite3');

try {
  const db = new Database('database.sqlite');
  
  console.log('All tables:');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log(tables);
  
  console.log('\nChecking canva_settings table:');
  try {
    const schema = db.prepare('PRAGMA table_info(canva_settings)').all();
    console.log('canva_settings schema:', schema);
  } catch(e) {
    console.log('canva_settings table does not exist');
  }
  
  db.close();
} catch (error) {
  console.error('Database error:', error);
}