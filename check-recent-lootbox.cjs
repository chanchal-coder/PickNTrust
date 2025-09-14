// Check Recent Loot Box Products
// See if new products were added from Telegram

const Database = require('better-sqlite3');

console.log('Search CHECKING RECENT LOOT BOX PRODUCTS');
console.log('=' .repeat(50));

try {
  const db = new Database('database.sqlite');
  
  console.log('\nStats Recent Loot Box Products (Last 10):');
  const recent = db.prepare(`
    SELECT id, name, created_at, telegram_message_id, processing_status
    FROM loot_box_products 
    ORDER BY id DESC 
    LIMIT 10
  `).all();
  
  if (recent.length === 0) {
    console.log('Error No loot box products found in database');
  } else {
    recent.forEach((product, index) => {
      const createdDate = product.created_at ? new Date(product.created_at * 1000).toLocaleString() : 'Unknown';
      console.log(`${index + 1}. ID: ${product.id}`);
      console.log(`   Name: ${product.name}`);
      console.log(`   Created: ${createdDate}`);
      console.log(`   Telegram Message ID: ${product.telegram_message_id || 'N/A'}`);
      console.log(`   Status: ${product.processing_status || 'active'}`);
      console.log('');
    });
  }
  
  console.log('\n📈 Total Products Count:');
  const totalCount = db.prepare('SELECT COUNT(*) as count FROM loot_box_products').get();
  const activeCount = db.prepare('SELECT COUNT(*) as count FROM loot_box_products WHERE is_active = 1').get();
  
  console.log(`   Total: ${totalCount.count}`);
  console.log(`   Active: ${activeCount.count}`);
  
  console.log('\n🕐 Products Added Today:');
  const todayStart = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
  const todayProducts = db.prepare(`
    SELECT COUNT(*) as count 
    FROM loot_box_products 
    WHERE created_at >= ?
  `).get(todayStart);
  
  console.log(`   Today: ${todayProducts.count}`);
  
  if (todayProducts.count > 0) {
    console.log('\nProducts Today\'s Products:');
    const todayList = db.prepare(`
      SELECT id, name, created_at 
      FROM loot_box_products 
      WHERE created_at >= ?
      ORDER BY created_at DESC
    `).all(todayStart);
    
    todayList.forEach(product => {
      const time = new Date(product.created_at * 1000).toLocaleTimeString();
      console.log(`   - ${product.name} (ID: ${product.id}, Time: ${time})`);
    });
  }
  
  db.close();
  
} catch (error) {
  console.error('Error Error checking loot box products:', error.message);
}