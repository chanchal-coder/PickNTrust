const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

console.log('🔧 Fixing missing discount calculations...');

try {
  // Get all telegram products with original_price but discount = 0
  const products = db.prepare(`
    SELECT id, name, price, original_price, discount, expires_at
    FROM telegram_products 
    WHERE original_price IS NOT NULL 
    AND original_price != '' 
    AND price IS NOT NULL 
    AND price != ''
    ORDER BY created_at DESC
  `).all();
  
  console.log(`\n📋 Found ${products.length} products to check:`);
  
  let updatedCount = 0;
  
  products.forEach((product, i) => {
    const originalPrice = parseFloat(product.original_price);
    const currentPrice = parseFloat(product.price);
    const currentDiscount = product.discount || 0;
    
    console.log(`\n${i+1}. ${product.name.substring(0, 50)}...`);
    console.log(`   Original: ₹${originalPrice}, Current: ₹${currentPrice}`);
    console.log(`   Current Discount: ${currentDiscount}%`);
    
    if (originalPrice > currentPrice && originalPrice > 0) {
      // Calculate discount percentage
      const calculatedDiscount = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
      
      if (calculatedDiscount !== currentDiscount) {
        console.log(`   Refresh Updating discount: ${currentDiscount}% → ${calculatedDiscount}%`);
        
        // Update the discount in database
        db.prepare(`
          UPDATE telegram_products 
          SET discount = ? 
          WHERE id = ?
        `).run(calculatedDiscount, product.id);
        
        updatedCount++;
      } else {
        console.log(`   Success Discount already correct: ${calculatedDiscount}%`);
      }
    } else {
      console.log(`   Warning  No discount needed (original ≤ current price)`);
    }
    
    // Check expiration
    const expiresAt = product.expires_at;
    const now = Math.floor(Date.now() / 1000);
    const hoursLeft = Math.round((expiresAt - now) / 3600);
    
    if (expiresAt && expiresAt > now) {
      console.log(`   ⏰ Expires in: ${hoursLeft} hours`);
    } else if (expiresAt) {
      console.log(`   Error EXPIRED: ${Math.abs(hoursLeft)} hours ago`);
    } else {
      console.log(`   ♾️  No expiration set`);
    }
  });
  
  console.log(`\nTarget Summary:`);
  console.log(`   Stats Products checked: ${products.length}`);
  console.log(`   Refresh Discounts updated: ${updatedCount}`);
  console.log(`   Success Products with correct discounts: ${products.length - updatedCount}`);
  
  if (updatedCount > 0) {
    console.log(`\nCelebration Successfully updated ${updatedCount} product discount calculations!`);
    console.log(`Tip Refresh your browser to see the updated discount badges and savings messages.`);
  } else {
    console.log(`\nSuccess All product discounts are already calculated correctly.`);
  }
  
  // Show auto-deletion info
  console.log(`\n⏰ AUTO-DELETION INFORMATION:`);
  console.log(`   Date Telegram products expire after 24 hours by default`);
  console.log(`   Refresh Cleanup runs automatically when products are fetched`);
  console.log(`   🗑️  Expired products are removed from prime-picks automatically`);
  console.log(`   ⚙️  This prevents the database from growing too large`);
  
} catch (error) {
  console.error('Error Error:', error.message);
} finally {
  db.close();
}