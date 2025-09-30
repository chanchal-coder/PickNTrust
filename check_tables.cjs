const Database = require('better-sqlite3');
const db = new Database('./server/database.sqlite');

console.log('ad_performance table schema:');
try {
  const schema = db.prepare('PRAGMA table_info(ad_performance)').all();
  schema.forEach(col => console.log(`  ${col.name} (${col.type})${col.notnull ? ' NOT NULL' : ''}`));
} catch(e) {
  console.log('Error getting schema:', e.message);
}

db.close();