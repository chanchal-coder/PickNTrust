const Database = require('better-sqlite3');
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('Search Checking featured_products table...');

try {
  // Check if table exists
  const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='featured_products'").get();
  
  if (!tableExists) {
    console.log('Error featured_products table does not exist');
    db.close();
    process.exit(1);
  }
  
  console.log('Success featured_products table exists');
  
  // Get all products
  const products = db.prepare('SELECT id, name, price, discount, display_order FROM featured_products ORDER BY display_order').all();
  
  console.log(`\nStats Found ${products.length} featured products:`);
  
  if (products.length === 0) {
    console.log('Error No products found in featured_products table');
  } else {
    products.forEach(p => {
      console.log(`  ${p.display_order}. ${p.name} - $${p.price} (${p.discount}% off)`);
    });
  }
  
} catch (error) {
  console.error('Error Error:', error.message);
} finally {
  db.close();
}