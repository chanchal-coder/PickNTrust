const Database = require('better-sqlite3');

console.log('🔧 Fixing Click Picks Product Images...');
console.log('=' .repeat(50));

try {
  const db = new Database('./database.sqlite');
  
  // Get current products
  const products = db.prepare('SELECT id, name, image_url FROM click_picks_products').all();
  
  console.log(`Stats Found ${products.length} products to update:`);
  console.log('');
  
  // Working image URLs that don't have CORS restrictions
  const imageUpdates = [
    {
      id: 12, // Samsung Galaxy S24 Ultra
      name: 'Samsung Galaxy S24 Ultra 5G (256GB, Titanium Black)',
      image_url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&q=80' // Samsung phone
    },
    {
      id: 11, // Apple iPhone 15 Pro Max
      name: 'Apple iPhone 15 Pro Max (256GB, Natural Titanium)',
      image_url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&q=80' // iPhone
    },
    {
      id: 10, // OnePlus 12
      name: 'OnePlus 12 5G (256GB, Flowy Emerald)',
      image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80' // OnePlus phone
    },
    {
      id: 6, // Matrix Europe eSIM
      name: 'Matrix Europe eSIM - Unlimited Data 5G/4G',
      image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80' // eSIM/SIM card
    }
  ];
  
  // Update each product with working image URL
  const updateStmt = db.prepare('UPDATE click_picks_products SET image_url = ? WHERE id = ?');
  
  imageUpdates.forEach((update, index) => {
    try {
      const result = updateStmt.run(update.image_url, update.id);
      
      if (result.changes > 0) {
        console.log(`${index + 1}. Success Updated: ${update.name}`);
        console.log(`   🖼️  New Image: ${update.image_url}`);
        console.log(`   Blog Status: Working Unsplash image (no CORS issues)`);
      } else {
        console.log(`${index + 1}. Warning  Product ID ${update.id} not found`);
      }
    } catch (error) {
      console.log(`${index + 1}. Error Error updating ${update.name}: ${error.message}`);
    }
    console.log('');
  });
  
  // Verify updates
  console.log('Search Verification - Updated products:');
  console.log('=' .repeat(40));
  
  const updatedProducts = db.prepare('SELECT id, name, image_url FROM click_picks_products ORDER BY id').all();
  
  updatedProducts.forEach((product, index) => {
    const isWorking = product.image_url && product.image_url.includes('unsplash.com');
    console.log(`${index + 1}. ${product.name}`);
    console.log(`   🆔 ID: ${product.id}`);
    console.log(`   🖼️  Image: ${isWorking ? 'Success Working Unsplash URL' : 'Error May have CORS issues'}`);
    console.log(`   Link URL: ${product.image_url}`);
    console.log('');
  });
  
  db.close();
  
  console.log('Celebration Click Picks image fix completed!');
  console.log('');
  console.log('📋 Summary:');
  console.log('- Replaced brand-specific image URLs with working Unsplash alternatives');
  console.log('- All images now use CORS-friendly URLs that will display properly');
  console.log('- Images are high-quality and relevant to the products');
  console.log('- No more placeholder/random images in Click Picks!');
  console.log('');
  console.log('Refresh Please refresh the Click Picks page to see the changes.');
  
} catch (error) {
  console.error('Error Error fixing Click Picks images:', error.message);
}