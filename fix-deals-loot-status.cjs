const Database = require('better-sqlite3');

const db = new Database('./server/database.sqlite');

console.log('Fixing processing_status for deals-hub and loot-box products...\n');

// Update deals-hub products
const updateDealsHub = db.prepare(`
  UPDATE unified_content 
  SET processing_status = 'completed' 
  WHERE display_pages LIKE '%deals-hub%' AND processing_status = 'processed'
`);

const dealsHubResult = updateDealsHub.run();
console.log(`Updated ${dealsHubResult.changes} deals-hub products to 'completed' status`);

// Update loot-box products  
const updateLootBox = db.prepare(`
  UPDATE unified_content 
  SET processing_status = 'completed' 
  WHERE display_pages LIKE '%loot-box%' AND processing_status = 'processed'
`);

const lootBoxResult = updateLootBox.run();
console.log(`Updated ${lootBoxResult.changes} loot-box products to 'completed' status`);

// Verify the changes
console.log('\nVerifying updates:');

const dealsHubProducts = db.prepare(`
  SELECT id, title, display_pages, processing_status 
  FROM unified_content 
  WHERE display_pages LIKE '%deals-hub%'
`).all();

console.log('\nDeals-hub products:');
dealsHubProducts.forEach(p => {
  console.log(`  ID: ${p.id}, Title: ${p.title}, Status: ${p.processing_status}`);
});

const lootBoxProducts = db.prepare(`
  SELECT id, title, display_pages, processing_status 
  FROM unified_content 
  WHERE display_pages LIKE '%loot-box%'
`).all();

console.log('\nLoot-box products:');
lootBoxProducts.forEach(p => {
  console.log(`  ID: ${p.id}, Title: ${p.title}, Status: ${p.processing_status}`);
});

db.close();
console.log('\nProcessing status update completed!');