const Database = require('better-sqlite3');
const path = require('path');

// Connect to database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('Search Checking specific products in database...');

try {
  // Get products 95 and 98 specifically
  const specificProducts = db.prepare('SELECT id, name, display_pages, source FROM products WHERE id IN (95, 98) ORDER BY id').all();
  
  console.log(`\nStats Found ${specificProducts.length} specific products:`);
  
  specificProducts.forEach((product, index) => {
    console.log(`\n${index + 1}. Product ID: ${product.id}`);
    console.log(`   Name: ${product.name}`);
    console.log(`   Source: ${product.source || 'manual'}`);
    console.log(`   Display Pages: ${JSON.stringify(product.display_pages)}`);
  });
  
  // Also check all products on Prime Picks page
  console.log('\nTarget Checking all products on Prime Picks page...');
  const primePicksProducts = db.prepare('SELECT id, name, display_pages, source FROM products WHERE display_pages LIKE ? ORDER BY created_at DESC').all('%prime-picks%');
  
  console.log(`\n📋 Found ${primePicksProducts.length} products on Prime Picks page:`);
  
  primePicksProducts.forEach((product, index) => {
    console.log(`\n${index + 1}. ID: ${product.id} | Name: ${product.name} | Source: ${product.source || 'manual'}`);
    console.log(`   Display Pages: ${JSON.stringify(product.display_pages)}`);
  });
  
} catch (error) {
  console.error('Error Database error:', error);
} finally {
  db.close();
}

console.log('\nSuccess Database check completed!');