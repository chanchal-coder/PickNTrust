const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

console.log('Search Debugging Product Display Issues...');

try {
  // Get current products
  const products = db.prepare('SELECT * FROM telegram_products ORDER BY created_at DESC LIMIT 2').all();
  
  console.log('\n📋 Current Products in Database:');
  
  products.forEach((product, i) => {
    console.log(`\n${i+1}. Product ID: ${product.id}`);
    console.log(`   Name: ${product.name}`);
    console.log(`   Price: ${product.price} (type: ${typeof product.price})`);
    console.log(`   Original Price: ${product.original_price} (type: ${typeof product.original_price})`);
    console.log(`   Discount: ${product.discount} (type: ${typeof product.discount})`);
    console.log(`   Review Count: ${product.review_count} (type: ${typeof product.review_count})`);
    
    // Test conditional logic
    console.log('\n🧪 Conditional Logic Tests:');
    
    // Review Count Test
    const showReviews = product.review_count > 0;
    console.log(`   Reviews should show: ${showReviews} (reviewCount: ${product.review_count})`);
    
    // Discount Badge Test
    const showDiscountBadge = product.discount && product.discount > 0;
    console.log(`   Discount badge should show: ${showDiscountBadge} (discount: ${product.discount})`);
    
    // Coupon Message Test
    const showCoupon = product.original_price && 
                      product.discount && 
                      product.discount > 0 && 
                      parseFloat(product.original_price) > parseFloat(product.price);
    console.log(`   Coupon message should show: ${showCoupon}`);
    console.log(`     - Has original price: ${!!product.original_price}`);
    console.log(`     - Has discount: ${!!product.discount}`);
    console.log(`     - Discount > 0: ${product.discount > 0}`);
    if (product.original_price && product.price) {
      console.log(`     - Original (${product.original_price}) > Current (${product.price}): ${parseFloat(product.original_price) > parseFloat(product.price)}`);
    }
    
    console.log('\n' + '='.repeat(50));
  });
  
  console.log('\nTarget Summary:');
  console.log('If you still see unwanted "00" or "0" values:');
  console.log('1. Refresh Hard refresh browser (Ctrl+F5 or Cmd+Shift+R)');
  console.log('2. Cleanup Clear browser cache completely');
  console.log('3. 🕵️ Open in incognito/private mode');
  console.log('4. Search Check browser developer tools for cached responses');
  
  console.log('\nTip Expected Behavior:');
  products.forEach((product, i) => {
    console.log(`\nProduct ${i+1} (${product.name.substring(0, 30)}...):`);
    if (product.review_count > 0) {
      console.log(`   Success Should show: ⭐⭐⭐⭐⭐ (${product.review_count})`);
    } else {
      console.log(`   Error Should hide: Review section (reviewCount = ${product.review_count})`);
    }
    
    if (product.discount && product.discount > 0) {
      console.log(`   Success Should show: "${product.discount}% off" badge`);
    } else {
      console.log(`   Error Should hide: Discount badge (discount = ${product.discount})`);
    }
    
    const shouldShowCoupon = product.original_price && 
                            product.discount && 
                            product.discount > 0 && 
                            parseFloat(product.original_price) > parseFloat(product.price);
    
    if (shouldShowCoupon) {
      const savings = parseFloat(product.original_price) - parseFloat(product.price);
      console.log(`   Success Should show: "Save ₹${savings} with coupon"`);
    } else {
      console.log(`   Error Should hide: Coupon message`);
    }
  });
  
} catch (error) {
  console.error('Error Error:', error.message);
} finally {
  db.close();
}