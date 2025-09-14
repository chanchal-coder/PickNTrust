const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

try {
  // Check all product tables
  const productTables = [
    'products',
    'amazon_products', 
    'prime_picks_products',
    'cue_picks_products',
    'value_picks_products',
    'click_picks_products',
    'global_picks_products',
    'deals_hub_products',
    'loot_box_products',
    'cuelinks_products',
    'dealshub_products'
  ];
  
  console.log('=== CHECKING ALL PRODUCT TABLES ===\n');
  
  for (const table of productTables) {
    try {
      const count = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
      const recent = db.prepare(`SELECT * FROM ${table} ORDER BY created_at DESC LIMIT 3`).all();
      
      console.log(`📊 ${table.toUpperCase()}:`);
      console.log(`   Total products: ${count.count}`);
      
      if (recent.length > 0) {
        console.log(`   Recent products:`);
        recent.forEach((product, i) => {
          console.log(`   ${i+1}. ${product.name || product.title || 'No name'} - ${product.price || 'No price'}`);
        });
      } else {
        console.log(`   ❌ No products found`);
      }
      console.log('');
      
    } catch (error) {
      console.log(`❌ ${table}: Table doesn't exist or error - ${error.message}\n`);
    }
  }
  
} catch (error) {
  console.error('Error:', error.message);
} finally {
  db.close();
}