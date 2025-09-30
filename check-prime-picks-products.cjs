// Check Prime Picks Products for Comparison
const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

console.log('🔍 CHECKING PRIME-PICKS PRODUCTS');
console.log('================================');

try {
  // Check products with prime-picks in display_pages
  console.log('📊 Products with prime-picks in display_pages:');
  const primePicksProducts = db.prepare(`
    SELECT id, title, display_pages, source_type, processing_status
    FROM unified_content 
    WHERE display_pages LIKE '%prime-picks%'
    LIMIT 10
  `).all();
  
  if (primePicksProducts.length > 0) {
    primePicksProducts.forEach(product => {
      console.log(`   ID ${product.id}: ${product.title}`);
      console.log(`      Pages: ${product.display_pages}`);
      console.log(`      Source: ${product.source_type}, Status: ${product.processing_status}`);
      console.log('');
    });
  } else {
    console.log('   ❌ No products found with prime-picks in display_pages');
  }
  
  // Check all Telegram products and their display_pages
  console.log('📊 All Telegram products and their display_pages:');
  const telegramProducts = db.prepare(`
    SELECT id, title, display_pages, processing_status
    FROM unified_content 
    WHERE source_type = 'telegram'
    LIMIT 10
  `).all();
  
  if (telegramProducts.length > 0) {
    telegramProducts.forEach(product => {
      console.log(`   ID ${product.id}: ${product.title}`);
      console.log(`      Pages: ${product.display_pages}`);
      console.log(`      Status: ${product.processing_status}`);
      console.log('');
    });
  } else {
    console.log('   ❌ No Telegram products found');
  }
  
  // Check what display_pages values exist
  console.log('📊 All unique display_pages values:');
  const uniquePages = db.prepare(`
    SELECT DISTINCT display_pages, COUNT(*) as count
    FROM unified_content 
    GROUP BY display_pages
    ORDER BY count DESC
  `).all();
  
  uniquePages.forEach(page => {
    console.log(`   "${page.display_pages}": ${page.count} products`);
  });
  
} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  db.close();
}