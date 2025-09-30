const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

console.log('Search Checking current Telegram products and their field values...');

try {
  // Get all current telegram products
  const products = db.prepare('SELECT * FROM telegram_products ORDER BY created_at DESC').all();
  
  console.log(`\n📋 Found ${products.length} Telegram products:`);
  
  products.forEach((product, i) => {
    console.log(`\n${i+1}. Product ID: ${product.id}`);
    console.log(`   Name: ${product.name}`);
    console.log(`   Price: ${product.price}`);
    console.log(`   Original Price: ${product.original_price}`);
    console.log(`   Review Count: ${product.review_count}`);
    console.log(`   Discount: ${product.discount}`);
    console.log(`   Rating: ${product.rating}`);
    console.log(`   Category: ${product.category}`);
  });
  
  console.log('\nSearch Analysis of the "00" and "0" values:');
  console.log('\nStats Field Analysis:');
  
  products.forEach((product, i) => {
    console.log(`\nProduct ${i+1} (${product.name.substring(0, 30)}...):`);
    
    // Check what could be showing as "00"
    if (product.review_count === 0 || product.review_count === null) {
      console.log('   Error Review Count is 0 or null - this could be the "00" above product name');
    }
    if (product.discount === 0 || product.discount === null) {
      console.log('   Error Discount is 0 or null - this could be the "0" below price');
    }
    if (!product.original_price || product.original_price === '0') {
      console.log('   Warning Original Price is missing - discount calculation may show 0');
    }
    
    // Calculate what discount should be
    if (product.price && product.original_price && product.original_price !== '0') {
      const currentPrice = parseFloat(product.price);
      const originalPrice = parseFloat(product.original_price);
      const calculatedDiscount = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
      console.log(`   Tip Calculated discount should be: ${calculatedDiscount}%`);
    }
  });
  
  console.log('\nTarget Likely Explanation:');
  console.log('   "00" above product name = Review Count (currently 0)');
  console.log('   "0" below price = Discount Percentage (currently 0% due to missing original price)');
  
} catch (error) {
  console.error('Error Error:', error.message);
} finally {
  db.close();
}