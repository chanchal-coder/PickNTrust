const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

console.log('🔧 Fixing discount calculation for products with original prices...');

try {
  // Get products that have original prices but discount is 0
  const products = db.prepare(`
    SELECT id, name, price, original_price, discount 
    FROM telegram_products 
    WHERE original_price IS NOT NULL 
    AND original_price != '0' 
    AND original_price != price
    AND (discount IS NULL OR discount = 0)
  `).all();
  
  console.log(`\n📋 Found ${products.length} products needing discount calculation:`);
  
  products.forEach((product, i) => {
    const currentPrice = parseFloat(product.price);
    const originalPrice = parseFloat(product.original_price);
    
    if (originalPrice > currentPrice) {
      const calculatedDiscount = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
      
      console.log(`\n${i+1}. ${product.name.substring(0, 50)}...`);
      console.log(`   Current Price: ₹${currentPrice}`);
      console.log(`   Original Price: ₹${originalPrice}`);
      console.log(`   Calculated Discount: ${calculatedDiscount}%`);
      
      // Update the discount in database
      const updateStmt = db.prepare('UPDATE telegram_products SET discount = ? WHERE id = ?');
      updateStmt.run(calculatedDiscount, product.id);
      
      console.log(`   Success Updated discount to ${calculatedDiscount}%`);
    }
  });
  
  // Verify the updates
  console.log('\nSearch Verification after updates:');
  const updatedProducts = db.prepare('SELECT id, name, price, original_price, discount, review_count FROM telegram_products ORDER BY created_at DESC').all();
  
  updatedProducts.forEach((product, i) => {
    console.log(`\n${i+1}. Product ID: ${product.id}`);
    console.log(`   Name: ${product.name.substring(0, 50)}...`);
    console.log(`   Review Count: ${product.review_count} (${product.review_count > 0 ? 'WILL SHOW' : 'WILL HIDE'})`);
    console.log(`   Discount: ${product.discount}% (${product.discount && product.discount > 0 ? 'WILL SHOW' : 'WILL HIDE'})`);
  });
  
  console.log('\nCelebration Discount calculation completed!');
  console.log('Success Products with proper original prices now have calculated discounts');
  console.log('Success Conditional rendering should now work correctly');
  console.log('\nTip If you still see "00" and "0", try:');
  console.log('   1. Hard refresh the browser (Ctrl+F5)');
  console.log('   2. Clear browser cache');
  console.log('   3. Open in incognito/private mode');
  
} catch (error) {
  console.error('Error Error:', error.message);
} finally {
  db.close();
}