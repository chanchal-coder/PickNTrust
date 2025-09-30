const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

console.log('🔍 CHECKING PRIME PICKS CONNECTION TO UNIFIED_CONTENT');
console.log('==================================================\n');

try {
  // Check unified_content table structure
  console.log('📊 UNIFIED_CONTENT TABLE STRUCTURE:');
  const tableInfo = db.prepare('PRAGMA table_info(unified_content)').all();
  tableInfo.forEach(col => {
    console.log(`   ${col.name}: ${col.type}`);
  });

  // Check Prime Picks products in unified_content
  console.log('\n🎯 PRIME PICKS PRODUCTS IN UNIFIED_CONTENT:');
  const primePicksProducts = db.prepare(`
    SELECT id, title, price, category, display_pages, processing_status, created_at
    FROM unified_content 
    WHERE display_pages LIKE '%prime-picks%' 
    ORDER BY created_at DESC
  `).all();

  if (primePicksProducts.length > 0) {
    primePicksProducts.forEach(product => {
      const createdDate = new Date(product.created_at).toLocaleString();
      console.log(`   ID: ${product.id} | ${product.title} | Price: ${product.price} | Status: ${product.processing_status} | Created: ${createdDate}`);
    });
  } else {
    console.log('   ❌ No Prime Picks products found');
  }

  console.log(`\n📈 TOTAL PRIME PICKS PRODUCTS: ${primePicksProducts.length}`);

  // Test API query simulation
  console.log('\n🌐 API QUERY SIMULATION:');
  const apiQuery = db.prepare(`
    SELECT * FROM unified_content 
    WHERE display_pages LIKE '%prime-picks%' 
    AND processing_status = 'active'
    ORDER BY created_at DESC 
    LIMIT 10
  `).all();

  console.log(`   API would return ${apiQuery.length} products for Prime Picks page`);

  // Check if Telegram bot is saving to unified_content
  console.log('\n🤖 TELEGRAM BOT INTEGRATION:');
  const telegramProducts = db.prepare(`
    SELECT COUNT(*) as count 
    FROM unified_content 
    WHERE source_type = 'telegram'
  `).get();

  console.log(`   Products from Telegram bot: ${telegramProducts.count}`);

  db.close();
  console.log('\n✅ Database check completed successfully');

} catch (error) {
  console.error('❌ Database error:', error.message);
  db.close();
}