const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

console.log('📋 PRODUCTS TABLE COLUMNS:');
console.log('==========================');

const schema = db.prepare('PRAGMA table_info(products)').all();
schema.forEach(col => {
  console.log(`  ${col.name}: ${col.type}`);
});

db.close();