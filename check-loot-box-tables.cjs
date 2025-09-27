const Database = require('better-sqlite3');

const db = new Database('./server/database.sqlite');

console.log('Checking loot-box products...');

try {
  const unified = db.prepare('SELECT COUNT(*) as count FROM unified_content WHERE display_pages LIKE ?').get('%loot-box%');
  console.log('unified_content (loot-box):', unified.count);
} catch(e) {
  console.log('unified_content error:', e.message);
}

try {
  const lootbox = db.prepare('SELECT COUNT(*) as count FROM lootbox_products').get();
  console.log('lootbox_products:', lootbox.count);
} catch(e) {
  console.log('lootbox_products error:', e.message);
}

try {
  const loot_box = db.prepare('SELECT COUNT(*) as count FROM loot_box_products').get();
  console.log('loot_box_products:', loot_box.count);
} catch(e) {
  console.log('loot_box_products error:', e.message);
}

// Check sample products to see their IDs
try {
  const samples = db.prepare('SELECT id, title FROM unified_content WHERE display_pages LIKE ? LIMIT 3').all('%loot-box%');
  console.log('Sample loot-box products:', samples);
} catch(e) {
  console.log('Sample query error:', e.message);
}

db.close();