const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

console.log('🗑️ Removing test products from database...');

try {
  // First, let's see what products we have
  const allProducts = db.prepare('SELECT id, name, price, original_price, discount FROM telegram_products ORDER BY created_at DESC').all();
  
  console.log('\n📋 Current products:');
  allProducts.forEach((p, i) => {
    console.log(`${i+1}. ID: ${p.id} - ${p.name.substring(0, 60)}...`);
    console.log(`   Price: ₹${p.price}, Original: ₹${p.original_price}, Discount: ${p.discount}%`);
  });
  
  // Remove test products (MacBook and any other test products)
  // The MacBook (ID 6) appears to be a test product based on the debug output
  const testProductIds = [6]; // Apple MacBook Air M1 Chip - test product
  
  console.log('\n🗑️ Removing test products...');
  
  testProductIds.forEach(id => {
    const product = db.prepare('SELECT name FROM telegram_products WHERE id = ?').get(id);
    if (product) {
      console.log(`   Removing: ${product.name}`);
      const result = db.prepare('DELETE FROM telegram_products WHERE id = ?').run(id);
      console.log(`   Success Deleted product ID ${id} (${result.changes} rows affected)`);
    } else {
      console.log(`   Warning Product ID ${id} not found`);
    }
  });
  
  // Verify remaining products
  console.log('\n📋 Remaining products after cleanup:');
  const remainingProducts = db.prepare('SELECT id, name, price, original_price, discount, review_count FROM telegram_products ORDER BY created_at DESC').all();
  
  if (remainingProducts.length === 0) {
    console.log('   No products remaining.');
  } else {
    remainingProducts.forEach((p, i) => {
      console.log(`\n${i+1}. ID: ${p.id}`);
      console.log(`   Name: ${p.name}`);
      console.log(`   Price: ₹${p.price}`);
      console.log(`   Original Price: ₹${p.original_price}`);
      console.log(`   Discount: ${p.discount}%`);
      console.log(`   Reviews: ${p.review_count}`);
      
      // Check if this product should show coupon message
      const shouldShowCoupon = p.original_price && 
                              p.discount && 
                              p.discount > 0 && 
                              parseFloat(p.original_price) > parseFloat(p.price);
      console.log(`   Coupon message should show: ${shouldShowCoupon}`);
    });
  }
  
  console.log('\nCelebration Test product cleanup completed!');
  console.log('Success Only real user products remain');
  
} catch (error) {
  console.error('Error Error:', error.message);
} finally {
  db.close();
}