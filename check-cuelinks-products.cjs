// Check CueLinks products in database
const Database = require('better-sqlite3');

try {
  const db = new Database('database.sqlite');
  
  console.log('Search Checking CueLinks products in database...\n');
  
  // Get recent CueLinks products
  const products = db.prepare(`
    SELECT 
      id, name, price, image_url, affiliate_url, original_url, 
      category, rating, processing_status, created_at
    FROM cuelinks_products 
    ORDER BY created_at DESC 
    LIMIT 5
  `).all();
  
  if (products.length === 0) {
    console.log('Error No CueLinks products found in database');
    console.log('\nTip This means:');
    console.log('   1. CueLinks bot is not processing messages');
    console.log('   2. Messages are not being saved to database');
    console.log('   3. Check server logs for CueLinks processing errors');
  } else {
    console.log(`Success Found ${products.length} CueLinks products:\n`);
    
    products.forEach((product, index) => {
      console.log(`Products Product ${index + 1}:`);
      console.log(`   ID: ${product.id}`);
      console.log(`   Name: ${product.name}`);
      console.log(`   Price: ₹${product.price}`);
      console.log(`   Image: ${product.image_url?.substring(0, 60)}...`);
      console.log(`   Affiliate URL: ${product.affiliate_url?.substring(0, 60)}...`);
      console.log(`   Original URL: ${product.original_url?.substring(0, 60)}...`);
      console.log(`   Category: ${product.category}`);
      console.log(`   Rating: ${product.rating}`);
      console.log(`   Status: ${product.processing_status}`);
      console.log(`   Created: ${new Date(product.created_at).toLocaleString()}`);
      console.log('');
    });
    
    // Check if names are URLs (the issue you mentioned)
    const urlNames = products.filter(p => p.name && (p.name.startsWith('http') || p.name.includes('.com')));
    if (urlNames.length > 0) {
      console.log('Alert ISSUE FOUND: Products showing URLs as names!');
      console.log(`   ${urlNames.length} out of ${products.length} products have URL names`);
      console.log('   This means web scraping is not working properly');
    } else {
      console.log('Success Product names look good (not showing URLs)');
    }
  }
  
  db.close();
  
} catch (error) {
  console.error('Error Database error:', error.message);
}

console.log('\nTarget Next steps:');
console.log('1. If no products found: Check CueLinks bot processing');
console.log('2. If products show URLs as names: Fix web scraping');
console.log('3. Check server logs for detailed error messages');