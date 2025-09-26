const Database = require('better-sqlite3');
const db = new Database('./database.db');

console.log('🔍 Checking test product processing status...');

try {
  const testProducts = db.prepare(`
    SELECT id, title, processing_status, display_pages, category, created_at 
    FROM unified_content 
    WHERE title LIKE '%Test Gaming Headset%' 
    ORDER BY created_at DESC
  `).all();

  console.log('Test products found:', testProducts.length);
  testProducts.forEach(product => {
    console.log(`ID: ${product.id}, Title: ${product.title}, Status: ${product.processing_status}, Display Pages: ${product.display_pages}, Category: ${product.category}`);
  });

  console.log('\n🔍 Checking API query simulation...');
  const apiProducts = db.prepare(`
    SELECT id, title, processing_status, display_pages, category 
    FROM unified_content 
    WHERE display_pages LIKE '%prime-picks%' 
    AND processing_status = 'active'
    ORDER BY created_at DESC
  `).all();

  console.log('API would return:', apiProducts.length, 'products');
  apiProducts.forEach(product => {
    console.log(`API Product - ID: ${product.id}, Title: ${product.title}, Status: ${product.processing_status}`);
  });

  console.log('\n🔍 Checking all products with prime-picks in display_pages...');
  const allPrimeProducts = db.prepare(`
    SELECT id, title, processing_status, display_pages, category 
    FROM unified_content 
    WHERE display_pages LIKE '%prime-picks%' 
    ORDER BY created_at DESC
  `).all();

  console.log('All prime-picks products (regardless of status):', allPrimeProducts.length);
  allPrimeProducts.forEach(product => {
    console.log(`All Prime Product - ID: ${product.id}, Title: ${product.title}, Status: ${product.processing_status}`);
  });

} catch (error) {
  console.error('Error:', error.message);
} finally {
  db.close();
}