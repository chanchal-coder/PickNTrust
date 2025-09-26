const Database = require('better-sqlite3');

try {
  const db = new Database('database.sqlite');
  
  console.log('🔍 Checking products in unified_content table...');
  
  // Check total products
  const totalProducts = db.prepare('SELECT COUNT(*) as count FROM unified_content').get();
  console.log(`Total products: ${totalProducts.count}`);
  
  // Check products for prime-picks
  const primePicksProducts = db.prepare(`
    SELECT COUNT(*) as count FROM unified_content 
    WHERE display_pages LIKE '%prime-picks%'
  `).get();
  console.log(`Prime-picks products: ${primePicksProducts.count}`);
  
  // Check sample products
  console.log('\nSample products:');
  const sampleProducts = db.prepare(`
    SELECT id, title, display_pages, processing_status, status 
    FROM unified_content 
    LIMIT 5
  `).all();
  
  sampleProducts.forEach(product => {
    console.log(`ID: ${product.id}, Title: ${product.title}, Pages: ${product.display_pages}, Status: ${product.processing_status}/${product.status}`);
  });
  
  // Check if there are any products with prime-picks in display_pages
  const primePicksSample = db.prepare(`
    SELECT id, title, display_pages, processing_status, status 
    FROM unified_content 
    WHERE display_pages LIKE '%prime-picks%'
    LIMIT 3
  `).all();
  
  if (primePicksSample.length > 0) {
    console.log('\nPrime-picks sample products:');
    primePicksSample.forEach(product => {
      console.log(`ID: ${product.id}, Title: ${product.title}, Pages: ${product.display_pages}`);
    });
  } else {
    console.log('\n❌ No products found with prime-picks in display_pages');
  }
  
  db.close();
  console.log('\n✅ Database check completed');
  
} catch (error) {
  console.error('❌ Database error:', error.message);
}