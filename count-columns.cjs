const Database = require('better-sqlite3');

const db = new Database('database.sqlite');

try {
  const info = db.prepare('PRAGMA table_info(unified_content)').all();
  console.log('Total columns:', info.length);
  console.log('\nColumn details:');
  info.forEach((col, i) => {
    console.log(`${i+1}. ${col.name} (${col.type})`);
  });
} catch (error) {
  console.error('Error:', error);
} finally {
  db.close();
}