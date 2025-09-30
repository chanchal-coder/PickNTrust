// Clear sample products from loot_box_products table

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('🗑️ Clearing sample products from loot_box_products table...');

try {
  // Delete all products from loot_box_products table
  const result = db.prepare('DELETE FROM loot_box_products').run();
  
  console.log(`Success Deleted ${result.changes} products from loot_box_products table`);
  
  // Verify the table is empty
  const count = db.prepare('SELECT COUNT(*) as count FROM loot_box_products').get();
  console.log(`Stats Remaining products in loot_box_products: ${count.count}`);
  
  if (count.count === 0) {
    console.log('Celebration loot_box_products table is now empty and ready for real messages!');
  } else {
    console.log('Warning Some products still remain in the table');
  }
  
} catch (error) {
  console.error('Error Error clearing products:', error.message);
} finally {
  db.close();
}

console.log('\nRefresh Now send a real message to @deodappnt channel to test autopost!');
console.log('Mobile The message should contain a product URL to be processed');
console.log('Search Watch server logs for processing confirmation');