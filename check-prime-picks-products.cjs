// Check Prime Picks Products for Comparison
const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

console.log('Search ALL PRIME PICKS PRODUCTS (Latest 3):');
console.log('=' .repeat(60));

const products = db.prepare(`
  SELECT id, name, price, original_price, discount, 
         image_url, rating, review_count, created_at
  FROM amazon_products 
  ORDER BY id DESC 
  LIMIT 3
`).all();

products.forEach((p, i) => {
  console.log(`\n${i+1}. PRODUCT ID: ${p.id}`);
  console.log(`   Name: ${p.name}`);
  console.log(`   Price: ${p.price}`);
  console.log(`   Original Price: ${p.original_price}`);
  console.log(`   Discount: ${p.discount}%`);
  console.log(`   Image URL: ${p.image_url ? 'YES' : 'NO'}`);
  console.log(`   Rating: ${p.rating}`);
  console.log(`   Review Count: ${p.review_count}`);
  console.log(`   Created: ${new Date(p.created_at * 1000).toLocaleString()}`);
});

console.log('\nSearch COMPARISON ANALYSIS:');
if (products.length >= 2) {
  const latest = products[0];
  const previous = products[1];
  
  console.log('\nStats LATEST vs PREVIOUS:');
  console.log(`   Price Format: "${latest.price}" vs "${previous.price}"`);
  console.log(`   Original Price: "${latest.original_price}" vs "${previous.original_price}"`);
  console.log(`   Discount: ${latest.discount}% vs ${previous.discount}%`);
  console.log(`   Rating: ${latest.rating} vs ${previous.rating}`);
  console.log(`   Reviews: ${latest.review_count} vs ${previous.review_count}`);
  console.log(`   Image: ${latest.image_url ? 'Has Image' : 'No Image'} vs ${previous.image_url ? 'Has Image' : 'No Image'}`);
  
  console.log('\nError ISSUES FOUND:');
  
  // Check pricing format
  if (!latest.price.includes('₹') && previous.price.includes('₹')) {
    console.log('   - Latest product missing ₹ currency symbol in price');
  }
  
  // Check original price format
  if (!latest.original_price.includes('₹') && previous.original_price.includes('₹')) {
    console.log('   - Latest product missing ₹ currency symbol in original price');
  }
  
  // Check rating
  if (!latest.rating && previous.rating) {
    console.log('   - Latest product missing rating');
  }
  
  // Check review count
  if (!latest.review_count && previous.review_count) {
    console.log('   - Latest product missing review count');
  }
  
  // Check image
  if (!latest.image_url && previous.image_url) {
    console.log('   - Latest product missing image URL');
  }
}

db.close();