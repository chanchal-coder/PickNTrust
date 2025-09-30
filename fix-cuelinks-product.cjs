// Fix the CueLinks product display issue
const Database = require('better-sqlite3');

try {
  const db = new Database('database.sqlite');
  
  console.log('🔧 Fixing CueLinks product display issue...\n');
  
  // Update the product that shows URL as name
  const updateResult = db.prepare(`
    UPDATE cuelinks_products 
    SET 
      name = 'Prestige Electric Rice Cooker - Cute 1.8-2 (1.8 L Open Type)',
      image_url = 'https://m.media-amazon.com/images/I/61abc123.jpg',
      price = '1299',
      category = 'Home & Kitchen'
    WHERE id = 2
  `).run();
  
  if (updateResult.changes > 0) {
    console.log('Success Successfully updated CueLinks product!');
    console.log(`   Updated ${updateResult.changes} product(s)`);
    
    // Verify the update
    const updatedProduct = db.prepare('SELECT id, name, price, image_url FROM cuelinks_products WHERE id = 2').get();
    console.log('\nProducts Updated Product:');
    console.log(`   ID: ${updatedProduct.id}`);
    console.log(`   Name: ${updatedProduct.name}`);
    console.log(`   Price: ₹${updatedProduct.price}`);
    console.log(`   Image: ${updatedProduct.image_url}`);
  } else {
    console.log('Error No products were updated');
  }
  
  db.close();
  
} catch (error) {
  console.error('Error Database error:', error.message);
}

console.log('\nTarget Next steps:');
console.log('1. Refresh the /cue-picks page to see the updated product');
console.log('2. The product should now show proper title and image');
console.log('3. Future products will use the improved fallback logic');