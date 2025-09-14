// Check Current Value Picks Products
const Database = require('better-sqlite3');

console.log('Search Checking Current Value Picks Products...');

try {
  const db = new Database('database.sqlite');
  
  // Get all Value Picks products
  const products = db.prepare(`
    SELECT * FROM value_picks_products 
    WHERE processing_status = 'active' 
    ORDER BY created_at DESC 
    LIMIT 10
  `).all();
  
  console.log(`\nStats Found ${products.length} active Value Picks products:\n`);
  
  products.forEach((product, index) => {
    console.log(`${index + 1}. Product ID: ${product.id}`);
    console.log(`   Name: ${product.name}`);
    console.log(`   Price: ₹${product.price} (Original: ₹${product.original_price})`);
    console.log(`   Discount: ${product.discount}%`);
    console.log(`   Image: ${product.image_url?.substring(0, 80)}...`);
    console.log(`   Category: ${product.category}`);
    console.log(`   Original URL: ${product.original_url?.substring(0, 60)}...`);
    console.log(`   Affiliate URL: ${product.affiliate_url?.substring(0, 60)}...`);
    console.log(`   Telegram Message ID: ${product.telegram_message_id}`);
    console.log(`   Created: ${product.created_at}`);
    console.log(`   ---`);
  });
  
  // Check if there are any recent products
  const recentProducts = db.prepare(`
    SELECT COUNT(*) as count FROM value_picks_products 
    WHERE created_at > datetime('now', '-1 hour')
  `).get();
  
  console.log(`\n⏰ Products added in last hour: ${recentProducts.count}`);
  
  // Check bot processing
  const botProducts = db.prepare(`
    SELECT COUNT(*) as count FROM value_picks_products 
    WHERE telegram_message_id IS NOT NULL
  `).get();
  
  console.log(`Mobile Products from Telegram bot: ${botProducts.count}`);
  
  // Check manual products
  const manualProducts = db.prepare(`
    SELECT COUNT(*) as count FROM value_picks_products 
    WHERE telegram_message_id IS NULL
  `).get();
  
  console.log(`✋ Manual products: ${manualProducts.count}`);
  
  db.close();
  
  console.log('\nSearch DIAGNOSIS:');
  
  if (products.length === 0) {
    console.log('Error No active Value Picks products found!');
    console.log('   - Bot may not be processing Telegram messages');
    console.log('   - Database may be empty');
  } else {
    console.log('Success Products found in database');
    
    // Check for common issues
    const hasWrongNames = products.some(p => 
      p.name === 'Value Picks Product' || 
      p.name?.includes('Grand Shopsy') ||
      p.name?.length < 10
    );
    
    const hasWrongPrices = products.some(p => 
      p.price === '999' || 
      p.original_price === '1999' ||
      p.price === p.original_price
    );
    
    const hasWrongImages = products.some(p => 
      p.image_url?.includes('unsplash.com') ||
      !p.image_url?.includes('http')
    );
    
    if (hasWrongNames) {
      console.log('Error ISSUE: Generic/wrong product names detected');
    }
    
    if (hasWrongPrices) {
      console.log('Error ISSUE: Default/wrong prices detected (₹999/₹1999)');
    }
    
    if (hasWrongImages) {
      console.log('Error ISSUE: Placeholder/wrong images detected');
    }
    
    if (!hasWrongNames && !hasWrongPrices && !hasWrongImages) {
      console.log('Success Product data looks correct');
    }
  }
  
  if (recentProducts.count === 0) {
    console.log('Warning No recent products - bot may not be processing new messages');
  }
  
} catch (error) {
  console.error('Error Error checking products:', error.message);
}