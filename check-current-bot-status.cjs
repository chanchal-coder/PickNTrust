const Database = require('better-sqlite3');

console.log('=== CHECKING CURRENT DATABASE STATE ===');

try {
  const db = new Database('./server/database.sqlite');

  // Check unified_content table for recent products
  const recentProducts = db.prepare(`
    SELECT id, title, source_platform, source_type, page_type, created_at 
    FROM unified_content 
    WHERE source_platform = 'telegram' 
    ORDER BY created_at DESC 
    LIMIT 5
  `).all();

  console.log('Recent Telegram products:', recentProducts.length);
  recentProducts.forEach(p => {
    console.log(`- ID ${p.id}: ${p.title} (${p.page_type}) - ${p.created_at}`);
  });

  // Check Prime Picks specifically
  const primePicksProducts = db.prepare(`
    SELECT COUNT(*) as count 
    FROM unified_content 
    WHERE page_type = 'prime-picks'
  `).get();

  console.log('\nPrime Picks products total:', primePicksProducts.count);

  // Check Cue Picks specifically  
  const cuePicksProducts = db.prepare(`
    SELECT COUNT(*) as count 
    FROM unified_content 
    WHERE page_type = 'cue-picks'
  `).get();

  console.log('Cue Picks products total:', cuePicksProducts.count);

  // Check all products in unified_content
  const allProducts = db.prepare(`
    SELECT COUNT(*) as count 
    FROM unified_content
  `).get();

  console.log('Total products in unified_content:', allProducts.count);

  // Check most recent products
  const mostRecent = db.prepare(`
    SELECT id, title, page_type, source_platform, created_at 
    FROM unified_content 
    ORDER BY created_at DESC 
    LIMIT 3
  `).all();

  console.log('\nMost recent products:');
  mostRecent.forEach(p => {
    console.log(`- ID ${p.id}: ${p.title} (${p.page_type}) from ${p.source_platform} - ${p.created_at}`);
  });

  db.close();
  console.log('\n=== DATABASE CHECK COMPLETE ===');

} catch (error) {
  console.error('Error checking database:', error.message);
}