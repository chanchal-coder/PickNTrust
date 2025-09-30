const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

console.log('=== CHECKING DATABASE SCHEMA ===');
const schema = db.prepare('PRAGMA table_info(unified_content)').all();
schema.forEach(col => {
  console.log(`${col.name} (${col.type})`);
});

console.log('\n=== REMOVING TEST PRODUCTS FROM FEATURED ===');

// First, let's see what test products are currently featured
const testProducts = db.prepare(`
  SELECT id, title, is_featured 
  FROM unified_content 
  WHERE is_featured = 1 
  AND (title LIKE '%TEST%' OR title LIKE '%test%')
`).all();

console.log('Test products currently featured:', testProducts.length);
testProducts.forEach(p => {
  console.log(`ID: ${p.id}, Title: ${p.title}`);
});

if (testProducts.length > 0) {
  // Remove featured status from test products
  const updateStmt = db.prepare(`
    UPDATE unified_content 
    SET is_featured = 0 
    WHERE is_featured = 1 
    AND (title LIKE '%TEST%' OR title LIKE '%test%')
  `);
  
  const result = updateStmt.run();
  console.log(`Updated ${result.changes} test products to remove featured status`);
}

// Now let's check the remaining featured products
console.log('\n=== REMAINING FEATURED PRODUCTS ===');
const remainingFeatured = db.prepare(`
  SELECT id, title, is_featured, created_at 
  FROM unified_content 
  WHERE is_featured = 1 
  ORDER BY created_at DESC 
  LIMIT 10
`).all();

console.log('Remaining featured products:', remainingFeatured.length);
remainingFeatured.forEach(p => {
  console.log(`ID: ${p.id}, Title: ${p.title}, Created: ${p.created_at}`);
});

db.close();
console.log('Done!');