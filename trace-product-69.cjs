const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

console.log('=== Checking for product ID 69 ===');
const product69 = db.prepare('SELECT * FROM unified_content WHERE id = ?').get(69);
console.log('Product 69:', product69);

console.log('\n=== Checking all products with prime-picks in display_pages ===');
const primePicksProducts = db.prepare('SELECT * FROM unified_content WHERE display_pages LIKE ?').all('%prime-picks%');
console.log('Prime picks products count:', primePicksProducts.length);
primePicksProducts.forEach(p => console.log('Product:', p.id, p.title));

console.log('\n=== Checking for any products with Jam or Honey ===');
const jamHoneyProducts = db.prepare('SELECT * FROM unified_content WHERE title LIKE ? OR title LIKE ?').all('%Jam%', '%Honey%');
console.log('Jam/Honey products count:', jamHoneyProducts.length);
jamHoneyProducts.forEach(p => console.log('Product:', p.id, p.title));

console.log('\n=== Checking total records in unified_content ===');
const totalCount = db.prepare('SELECT COUNT(*) as count FROM unified_content').get();
console.log('Total records:', totalCount.count);

db.close();
