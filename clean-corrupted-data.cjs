const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

console.log('🗑️ Cleaning corrupted travel data...');

// Delete records with corrupted names (URLs, very long names, etc.)
const result = db.prepare(`
  DELETE FROM travel_products 
  WHERE name LIKE '%linksredirect%' 
     OR name LIKE '%https://%' 
     OR name LIKE '%http://%'
     OR LENGTH(name) > 100
     OR name = ''
`).run();

console.log('✅ Deleted', result.changes, 'corrupted records');

// Show remaining clean records
const remaining = db.prepare('SELECT id, name, category FROM travel_products').all();
console.log('📊 Remaining clean records:');
remaining.forEach(r => {
  console.log(`- ${r.id}: ${r.name} (${r.category})`);
});

const totalCount = db.prepare('SELECT COUNT(*) as count FROM travel_products').get();
console.log('\nTotal clean records:', totalCount.count);

db.close();
console.log('✅ Database cleanup completed');