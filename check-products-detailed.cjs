const Database = require('better-sqlite3');

async function checkProductsDetailed() {
  console.log('🔍 DETAILED PRODUCTS CHECK');
  console.log('============================');
  
  try {
    const db = new Database('database.sqlite');
    
    // Get all products with detailed info
    const products = db.prepare(`
      SELECT id, name, price, original_price, currency, image_url, affiliate_url, 
             source, telegram_message_id, discount, created_at, updated_at
      FROM products 
      ORDER BY id DESC 
      LIMIT 10
    `).all();
    
    console.log(`📊 Total products found: ${products.length}`);
    console.log('\n📋 PRODUCT DETAILS:');
    console.log('==================');
    
    products.forEach((product, index) => {
      console.log(`\n${index + 1}. PRODUCT ID: ${product.id}`);
      console.log(`   Name: ${product.name}`);
      console.log(`   Price: ₹${product.price}`);
      console.log(`   Original Price: ${product.original_price ? '₹' + product.original_price : 'N/A'}`);
      console.log(`   Currency: ${product.currency || 'N/A'}`);
      console.log(`   Discount: ${product.discount ? product.discount + '%' : 'N/A'}`);
      console.log(`   Image URL: ${product.image_url || 'N/A'}`);
      console.log(`   Affiliate URL: ${product.affiliate_url ? product.affiliate_url.substring(0, 50) + '...' : 'N/A'}`);
      console.log(`   Source: ${product.source || 'N/A'}`);
      console.log(`   Telegram Message ID: ${product.telegram_message_id || 'N/A'}`);
      console.log(`   Created: ${product.created_at ? new Date(product.created_at * 1000).toLocaleString() : 'N/A'}`);
      console.log(`   Updated: ${product.updated_at ? new Date(product.updated_at * 1000).toLocaleString() : 'N/A'}`);
    });
    
    // Check for products with missing images
    const noImageProducts = db.prepare(`
      SELECT COUNT(*) as count 
      FROM products 
      WHERE image_url IS NULL OR image_url = '' OR image_url = '/api/placeholder/300/300'
    `).get();
    
    console.log(`\n🖼️ Products with missing/placeholder images: ${noImageProducts.count}`);
    
    // Check for products with missing original prices
    const noOriginalPrice = db.prepare(`
      SELECT COUNT(*) as count 
      FROM products 
      WHERE original_price IS NULL OR original_price = '' OR original_price = '0'
    `).get();
    
    console.log(`💰 Products with missing original prices: ${noOriginalPrice.count}`);
    
    // Check Telegram products specifically
    const telegramProducts = db.prepare(`
      SELECT COUNT(*) as count 
      FROM products 
      WHERE source LIKE ?
    `).get('telegram-%');
    
    console.log(`📱 Telegram-sourced products: ${telegramProducts.count}`);
    
    // Get recent Telegram products
    const recentTelegram = db.prepare(`
      SELECT id, name, price, original_price, image_url, telegram_message_id, source
      FROM products 
      WHERE source LIKE ?
      ORDER BY id DESC 
      LIMIT 5
    `).all('telegram-%');
    
    if (recentTelegram.length > 0) {
      console.log('\n📱 RECENT TELEGRAM PRODUCTS:');
      console.log('============================');
      recentTelegram.forEach((product, index) => {
        console.log(`\n${index + 1}. ${product.name}`);
        console.log(`   ID: ${product.id}`);
        console.log(`   Price: ₹${product.price}`);
        console.log(`   Original Price: ${product.original_price ? '₹' + product.original_price : 'N/A'}`);
        console.log(`   Image: ${product.image_url || 'N/A'}`);
        console.log(`   Message ID: ${product.telegram_message_id || 'N/A'}`);
        console.log(`   Source: ${product.source}`);
      });
    }
    
    db.close();
    console.log('\n✅ Detailed check completed!');
    
  } catch (error) {
    console.error('❌ Error during detailed check:', error);
  }
}

checkProductsDetailed();