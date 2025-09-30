const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

console.log('Updating products with correct pricing...');

// Update both products with correct pricing from test results
db.prepare('UPDATE amazon_products SET original_price = ?, discount = ? WHERE id = ?').run('₹1080', 45, 37);
db.prepare('UPDATE amazon_products SET original_price = ?, discount = ? WHERE id = ?').run('₹1080', 45, 34);

console.log('✅ Updated both products with correct pricing');

// Verify the updates
const products = db.prepare('SELECT id, name, price, original_price, discount FROM amazon_products ORDER BY id DESC LIMIT 2').all();

console.log('\nUpdated products:');
products.forEach(p => {
  console.log(`ID ${p.id}: ${p.price} -> ${p.original_price} (${p.discount}% off)`);
  console.log(`   ${p.name.substring(0, 60)}...`);
});

db.close();
console.log('\n✅ Database updated successfully!');