const Database = require('better-sqlite3');

console.log('🔧 Fixing Click Picks products status...');

try {
  const db = new Database('database.sqlite');
  
  // Check current products in click_picks_products table
  console.log('\nStats Current Click Picks products:');
  const allProducts = db.prepare('SELECT id, name, processing_status, created_at FROM click_picks_products ORDER BY created_at DESC').all();
  
  if (allProducts.length === 0) {
    console.log('Error No products found in click_picks_products table');
  } else {
    allProducts.forEach(product => {
      console.log(`   ID: ${product.id}, Name: ${product.name || 'NULL'}, Status: ${product.processing_status || 'NULL'}, Created: ${product.created_at}`);
    });
    
    // Fix products with NULL or incorrect processing_status
    console.log('\n🔧 Fixing processing_status for all products...');
    const updateResult = db.prepare('UPDATE click_picks_products SET processing_status = ? WHERE processing_status IS NULL OR processing_status != ?').run('active', 'active');
    console.log(`Success Updated ${updateResult.changes} products to active status`);
    
    // Verify the fix
    console.log('\nSuccess Verification - Products after fix:');
    const fixedProducts = db.prepare('SELECT id, name, processing_status FROM click_picks_products WHERE processing_status = ?').all('active');
    console.log(`   Found ${fixedProducts.length} active products`);
    
    fixedProducts.forEach(product => {
      console.log(`   Success ID: ${product.id}, Name: ${product.name || 'Empty'}, Status: ${product.processing_status}`);
    });
  }
  
  db.close();
  console.log('\nCelebration Click Picks status fix completed!');
  
} catch (error) {
  console.error('Error Error fixing Click Picks status:', error);
  process.exit(1);
}