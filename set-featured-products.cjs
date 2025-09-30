const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

console.log('=== SETTING REAL PRODUCTS AS FEATURED ===');

// First, let's see what products we have available (excluding test products)
const availableProducts = db.prepare(`
  SELECT id, title, price, category, created_at 
  FROM unified_content 
  WHERE (title NOT LIKE '%TEST%' AND title NOT LIKE '%test%')
  AND (status = 'active' OR status = 'published' OR status IS NULL)
  AND (processing_status = 'completed' OR processing_status = 'active' OR processing_status IS NULL)
  ORDER BY created_at DESC 
  LIMIT 20
`).all();

console.log('Available products (excluding test products):', availableProducts.length);
availableProducts.forEach((p, index) => {
  console.log(`${index + 1}. ID: ${p.id}, Title: ${p.title}, Price: ${p.price}, Category: ${p.category}`);
});

if (availableProducts.length > 0) {
  // Mark the first 6-8 products as featured for the homepage
  const productsToFeature = availableProducts.slice(0, 8);
  
  console.log('\n=== MARKING PRODUCTS AS FEATURED ===');
  const updateStmt = db.prepare(`
    UPDATE unified_content 
    SET is_featured = 1 
    WHERE id = ?
  `);
  
  let updatedCount = 0;
  productsToFeature.forEach(product => {
    const result = updateStmt.run(product.id);
    if (result.changes > 0) {
      updatedCount++;
      console.log(`✓ Featured: ${product.title} (ID: ${product.id})`);
    }
  });
  
  console.log(`\nSuccessfully marked ${updatedCount} products as featured`);
}

// Verify the featured products
console.log('\n=== CURRENT FEATURED PRODUCTS ===');
const featuredProducts = db.prepare(`
  SELECT id, title, price, category, is_featured 
  FROM unified_content 
  WHERE is_featured = 1 
  ORDER BY created_at DESC
`).all();

console.log('Featured products count:', featuredProducts.length);
featuredProducts.forEach(p => {
  console.log(`ID: ${p.id}, Title: ${p.title}, Price: ${p.price}, Category: ${p.category}`);
});

db.close();
console.log('Done!');