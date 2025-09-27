const Database = require('better-sqlite3');

const db = new Database('./server/database.sqlite');

console.log('Checking unified_content table schema...\n');

const schema = db.prepare('PRAGMA table_info(unified_content)').all();
console.log('Unified content table columns:');
schema.forEach(col => {
  console.log(`  ${col.name} (${col.type})`);
});

console.log('\nChecking for deals-hub and loot-box products with current schema...');

// Check what products exist
const allProducts = db.prepare('SELECT id, title, display_pages FROM unified_content').all();
console.log(`\nTotal products in database: ${allProducts.length}`);

// Filter for deals-hub and loot-box
const dealsHubProducts = allProducts.filter(p => 
  p.display_pages && p.display_pages.includes('deals-hub')
);
const lootBoxProducts = allProducts.filter(p => 
  p.display_pages && p.display_pages.includes('loot-box')
);

console.log(`\nDeals-hub products: ${dealsHubProducts.length}`);
dealsHubProducts.forEach(p => {
  console.log(`  ID: ${p.id}, Title: ${p.title}`);
});

console.log(`\nLoot-box products: ${lootBoxProducts.length}`);
lootBoxProducts.forEach(p => {
  console.log(`  ID: ${p.id}, Title: ${p.title}`);
});

db.close();