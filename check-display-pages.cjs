const Database = require('better-sqlite3');

try {
  const db = new Database('database.sqlite');
  
  console.log('📊 Current display_pages values:');
  const products = db.prepare('SELECT id, title, display_pages, processing_status, status FROM unified_content').all();
  
  products.forEach(p => {
    console.log(`ID ${p.id}: "${p.display_pages}" (${p.processing_status}/${p.status})`);
  });
  
  console.log('\n🔍 Testing prime-picks query:');
  const primePicksQuery = `
    SELECT id, title, display_pages 
    FROM unified_content 
    WHERE display_pages LIKE '%prime-picks%'
    AND processing_status = 'active'
    AND status = 'active'
  `;
  
  const primePicksResults = db.prepare(primePicksQuery).all();
  console.log(`Prime-picks results: ${primePicksResults.length} products`);
  primePicksResults.forEach(p => {
    console.log(`  ID ${p.id}: ${p.title} - Pages: ${p.display_pages}`);
  });
  
  db.close();
  
} catch (error) {
  console.error('❌ Error:', error.message);
}