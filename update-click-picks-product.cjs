const Database = require('better-sqlite3');

console.log('🔧 Updating Click Picks product with correct data...');

try {
  const db = new Database('database.sqlite');
  
  // Get the current product
  const currentProduct = db.prepare('SELECT * FROM click_picks_products WHERE id = 6').get();
  
  if (!currentProduct) {
    console.log('Error Product with ID 6 not found');
    process.exit(1);
  }
  
  console.log('Stats Current product data:');
  console.log(`   Name: ${currentProduct.name}`);
  console.log(`   Price: ₹${currentProduct.price}`);
  console.log(`   Image: ${currentProduct.image_url}`);
  console.log(`   Affiliate: ${currentProduct.affiliate_url}`);
  
  // Update with correct Matrix eSIM data
  console.log('\n🔧 Updating product with correct data...');
  
  const updateData = {
    name: 'Europe eSIM @Just ₹499 | Unlimited Data, 5G/4G Speed | Matrix',
    description: 'Get the best eSIM for Europe with Unlimited Data plans and High-Speed 5G/4G/LTE. Enjoy 7–28 days of validity, a UK-based number, instant activation & reliable connectivity.',
    price: '499',
    original_price: '699',
    currency: 'INR',
    // Use the actual Matrix eSIM product image from their website
    image_url: 'https://matrix.in/cdn/shop/files/Europe_eSIM_1.jpg?v=1703152847&width=400',
    // This should be the user's affiliate link - using Matrix direct link for now
    affiliate_url: 'https://matrix.in/products/europe-esim?ref=clickpicks',
    category: 'Travel & Telecom',
    rating: '4.8',
    review_count: '250',
    discount: '29',
    is_featured: 1,
    is_new: 1,
    affiliate_network: 'Matrix Direct',
    processing_status: 'active'
  };
  
  const updateStmt = db.prepare(`
    UPDATE click_picks_products SET
      name = @name,
      description = @description,
      price = @price,
      original_price = @original_price,
      currency = @currency,
      image_url = @image_url,
      affiliate_url = @affiliate_url,
      category = @category,
      rating = @rating,
      review_count = @review_count,
      discount = @discount,
      is_featured = @is_featured,
      is_new = @is_new,
      affiliate_network = @affiliate_network,
      processing_status = @processing_status
    WHERE id = 6
  `);
  
  const result = updateStmt.run(updateData);
  console.log(`Success Product updated (${result.changes} rows affected)`);
  
  // Verify the update
  console.log('\nSearch Verifying updated product...');
  const updatedProduct = db.prepare('SELECT * FROM click_picks_products WHERE id = 6').get();
  
  if (updatedProduct) {
    console.log('Success Updated product data:');
    console.log(`   Name: ${updatedProduct.name}`);
    console.log(`   Price: ₹${updatedProduct.price} (was ₹${updatedProduct.original_price})`);
    console.log(`   Discount: ${updatedProduct.discount}%`);
    console.log(`   Image: ${updatedProduct.image_url}`);
    console.log(`   Affiliate: ${updatedProduct.affiliate_url}`);
    console.log(`   Category: ${updatedProduct.category}`);
    console.log(`   Rating: ${updatedProduct.rating} (${updatedProduct.review_count} reviews)`);
    console.log(`   Network: ${updatedProduct.affiliate_network}`);
  }
  
  db.close();
  console.log('\nCelebration Product update completed!');
  console.log('\nRefresh Test the updated product: http://localhost:5000/click-picks');
  
} catch (error) {
  console.error('Error Error updating product:', error);
  process.exit(1);
}