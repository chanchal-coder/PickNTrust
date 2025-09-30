const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

console.log('Stats Affiliate Networks Table Structure:');
const columns = db.prepare('PRAGMA table_info(affiliate_networks)').all();
columns.forEach(col => {
  console.log(`  - ${col.name}: ${col.type}${col.notnull ? ' NOT NULL' : ''}${col.pk ? ' PRIMARY KEY' : ''}${col.dflt_value ? ` DEFAULT ${col.dflt_value}` : ''}`);
});

console.log('\n📋 Existing Networks:');
const networks = db.prepare('SELECT * FROM affiliate_networks LIMIT 3').all();
networks.forEach(n => {
  console.log(`  - ID: ${n.id}, Name: ${n.name}, Base URL: ${n.base_url || 'NULL'}`);
});

db.close();