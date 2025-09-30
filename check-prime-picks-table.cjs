const Database = require('better-sqlite3');

try {
  const db = new Database('database.sqlite');
  
  console.log('Search Checking Prime Picks table structure...');
  
  // List all tables
  const tables = db.prepare('SELECT name FROM sqlite_master WHERE type=\'table\'').all();
  console.log('\n📋 Available tables:');
  tables.forEach(t => console.log(`- ${t.name}`));
  
  // Check if amazon_products table exists and has original_price
  try {
    const amazonSchema = db.prepare('PRAGMA table_info(amazon_products)').all();
    console.log('\n🛒 amazon_products table columns:');
    amazonSchema.forEach(col => {
      console.log(`- ${col.name} (${col.type})`);
    });
    
    const amazonData = db.prepare('SELECT COUNT(*) as count FROM amazon_products').get();
    console.log(`\nStats amazon_products has ${amazonData.count} records`);
    
    if (amazonData.count > 0) {
      const sampleAmazon = db.prepare('SELECT id, name, price, original_price FROM amazon_products LIMIT 2').all();
      console.log('\nProducts Sample amazon_products data:');
      sampleAmazon.forEach(p => {
        console.log(`- ID: ${p.id}, Price: ${p.price}, Original: ${p.original_price}`);
      });
    }
  } catch (e) {
    console.log('Error amazon_products table does not exist');
  }
  
  // Check products table for prime-picks
  try {
    const productsWithPrimePicks = db.prepare('SELECT COUNT(*) as count FROM products WHERE display_pages LIKE ?').get('%prime-picks%');
    console.log(`\nStats products table has ${productsWithPrimePicks.count} prime-picks records`);
    
    if (productsWithPrimePicks.count > 0) {
      const sampleProducts = db.prepare('SELECT id, name, price, original_price FROM products WHERE display_pages LIKE ? LIMIT 2').all('%prime-picks%');
      console.log('\nProducts Sample products (prime-picks) data:');
      sampleProducts.forEach(p => {
        console.log(`- ID: ${p.id}, Price: ${p.price}, Original: ${p.original_price}`);
      });
    }
  } catch (error) {
    console.log('Error Error checking products table:', e.message);
  }
  
  // Check specific product IDs that API returns
  console.log('\nSearch Checking specific product IDs from API response:');
  const specificIds = [110, 113, 114, 154, 155, 157, 158];
  specificIds.forEach(id => {
    try {
      const product = db.prepare('SELECT id, name, price, original_price FROM products WHERE id = ?').get(id);
      if (product) {
        console.log(`ID ${product.id}: Price=${product.price}, Original=${product.original_price} (type: ${typeof product.original_price})`);
      } else {
        console.log(`ID ${id}: Not found`);
      }
    } catch (e) {
      console.log(`ID ${id}: Error - ${e.message}`);
    }
  });
  
  db.close();
  
} catch (error) {
  console.error('Error Error:', error.message);
}