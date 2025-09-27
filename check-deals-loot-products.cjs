const Database = require('better-sqlite3');

const db = new Database('./server/database.sqlite');

console.log('Checking for deals-hub and loot-box products...\n');

// Check all products to see what page types exist
const allProducts = db.prepare('SELECT id, title, display_pages FROM unified_content').all();
console.log('All products in database:');
allProducts.forEach(p => {
  console.log(`ID: ${p.id}, Title: ${p.title}, Display Pages: ${p.display_pages}`);
});

console.log('\n--- Filtering for deals-hub and loot-box ---');

// Check for deals-hub products
const dealsHubProducts = allProducts.filter(p => 
  p.display_pages && p.display_pages.includes('deals-hub')
);
console.log('\nDeals-hub products:', dealsHubProducts);

// Check for loot-box products  
const lootBoxProducts = allProducts.filter(p => 
  p.display_pages && p.display_pages.includes('loot-box')
);
console.log('\nLoot-box products:', lootBoxProducts);

db.close();