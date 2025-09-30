const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

console.log('🔧 Fixing Telegram product data issues...');

try {
  // Get the user's real product (ID: 3 - the vase)
  const userProduct = db.prepare('SELECT * FROM telegram_products WHERE id = 3').get();
  
  if (userProduct) {
    console.log('\n📋 Current user product data:');
    console.log('   Name:', userProduct.name);
    console.log('   Price:', userProduct.price);
    console.log('   Description:', userProduct.description.substring(0, 100) + '...');
    
    // Extract price from description
    function extractPriceFromDescription(text) {
      const pricePatterns = [
        /₹([\d,]+(?:\.\d{2})?)/g,
        /Price:?\s*₹([\d,]+(?:\.\d{2})?)/gi,
        /Was\s*₹([\d,]+(?:\.\d{2})?)/gi
      ];
      
      const prices = [];
      for (const pattern of pricePatterns) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          const priceStr = match[1].replace(/,/g, '');
          const price = parseFloat(priceStr);
          if (!isNaN(price)) {
            prices.push(price);
          }
        }
      }
      return prices;
    }
    
    // Try to extract Amazon product image
    function generateAmazonImageUrl(amazonUrl) {
      // Extract ASIN from Amazon URL
      const asinMatch = amazonUrl.match(/\/dp\/([A-Z0-9]{10})/);
      if (asinMatch) {
        const asin = asinMatch[1];
        // Generate Amazon image URL
        return `https://m.media-amazon.com/images/I/${asin}._AC_UX679_.jpg`;
      }
      return null;
    }
    
    const extractedPrices = extractPriceFromDescription(userProduct.description);
    console.log('\nSearch Extracted prices:', extractedPrices);
    
    let updatePrice = userProduct.price;
    let originalPrice = null;
    
    if (extractedPrices.length > 0) {
      updatePrice = extractedPrices[0].toString(); // Current price
      if (extractedPrices.length > 1) {
        originalPrice = extractedPrices[1]; // Original/was price
      }
    }
    
    // Try to get better image
    let imageUrl = userProduct.image_url;
    if (userProduct.affiliate_url) {
      const amazonImage = generateAmazonImageUrl(userProduct.affiliate_url);
      if (amazonImage) {
        imageUrl = amazonImage;
      }
    }
    
    console.log('\n🔧 Updating product with:');
    console.log('   New Price:', updatePrice);
    console.log('   Original Price:', originalPrice);
    console.log('   New Image URL:', imageUrl);
    
    // Update the product
    const updateStmt = db.prepare(`
      UPDATE telegram_products 
      SET price = ?, original_price = ?, image_url = ?
      WHERE id = 3
    `);
    
    updateStmt.run(updatePrice, originalPrice, imageUrl);
    
    console.log('\nSuccess Product updated successfully!');
    
    // Verify the update
    const updatedProduct = db.prepare('SELECT id, name, price, original_price, image_url FROM telegram_products WHERE id = 3').get();
    console.log('\n📋 Updated product:');
    console.log('   ID:', updatedProduct.id);
    console.log('   Name:', updatedProduct.name.substring(0, 50) + '...');
    console.log('   Price:', updatedProduct.price);
    console.log('   Original Price:', updatedProduct.original_price);
    console.log('   Image URL:', updatedProduct.image_url);
    
  } else {
    console.log('Error User product (ID: 3) not found');
  }
  
  // Also remove the test product (ID: 4) that was created by automation
  console.log('\nCleanup Removing test automation product...');
  const deleteStmt = db.prepare('DELETE FROM telegram_products WHERE id = 4');
  const result = deleteStmt.run();
  
  if (result.changes > 0) {
    console.log('Success Test product removed successfully');
  } else {
    console.log('ℹ️ Test product was already removed or not found');
  }
  
  console.log('\nCelebration Telegram product data fixed!');
  console.log('Success Real user product now has proper price and image');
  console.log('Success Test automation product removed');
  
} catch (error) {
  console.error('Error Error:', error.message);
} finally {
  db.close();
}