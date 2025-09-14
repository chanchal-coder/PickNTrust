const Database = require('better-sqlite3');

try {
  const db = new Database('database.sqlite');
  
  console.log('Search Checking Click Picks Products Table Schema...');
  console.log('=' .repeat(60));
  
  // First check the schema
  const schema = db.prepare('PRAGMA table_info(click_picks_products)').all();
  
  if (schema.length === 0) {
    console.log('Error Table click_picks_products does not exist');
  } else {
    console.log('Table Schema:');
    schema.forEach(col => {
      console.log(`  ${col.name} (${col.type})`);
    });
    console.log('');
    
    // Now check the products with correct column names
    const products = db.prepare('SELECT * FROM click_picks_products ORDER BY id DESC LIMIT 5').all();
    
    if (products.length === 0) {
      console.log('Error No products found in click_picks_products table');
    } else {
      console.log(`Found ${products.length} recent products:`);
      console.log('');
      
      products.forEach((product, index) => {
        console.log(`${index + 1}. Product ID: ${product.id}`);
        console.log(`   Name: ${product.name || 'No name'}`);
        
        // Check for image-related columns
        const imageColumns = ['imageUrl', 'image_url', 'image', 'productImage', 'product_image'];
        let imageFound = false;
        
        imageColumns.forEach(col => {
          if (product[col]) {
            console.log(`   Image (${col}): ${product[col]}`);
            imageFound = true;
          }
        });
        
        if (!imageFound) {
          console.log('   Error No image URL found');
        }
        
        console.log(`   URL: ${product.url || product.affiliateUrl || product.affiliate_url || 'No URL'}`);
        console.log('');
      });
    }
  }
  
  db.close();
  
} catch (error) {
  console.error('Error Error:', error.message);
  process.exit(1);
}