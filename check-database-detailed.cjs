const Database = require('better-sqlite3');

try {
  const db = new Database('./server/database.sqlite');

  console.log('=== CHECKING FOR PRODUCT WITH ID 69 ===');
  const product69 = db.prepare('SELECT * FROM unified_content WHERE id = 69').get();
  console.log('Product 69:', product69);

  console.log('\n=== CHECKING FOR PRODUCTS WITH PRIME-PICKS IN DISPLAY_PAGES ===');
  const primePicksProducts = db.prepare('SELECT * FROM unified_content WHERE display_pages LIKE ?').all('%prime-picks%');
  console.log('Prime Picks products count:', primePicksProducts.length);
  console.log('Prime Picks products:', primePicksProducts);

  console.log('\n=== CHECKING ALL TABLES IN DATABASE ===');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('All tables:', tables.map(t => t.name));

  console.log('\n=== CHECKING FOR ANY PRODUCTS WITH SPECIFIC TITLE ===');
  const jamHoneyProducts = db.prepare('SELECT * FROM unified_content WHERE title LIKE ?').all('%Jam%Honey%');
  console.log('Jam & Honey products:', jamHoneyProducts);

  console.log('\n=== CHECKING TOTAL RECORDS IN ALL TABLES ===');
  for (const table of tables) {
    try {
      const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
      console.log(`${table.name}: ${count.count} records`);
    } catch (e) {
      console.log(`${table.name}: Error counting - ${e.message}`);
    }
  }

  db.close();
} catch (error) {
  console.error('Database error:', error);
}