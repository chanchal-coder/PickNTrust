const Database = require('better-sqlite3');
const fs = require('fs');

console.log('🔍 PRIME PICKS WEBHOOK MONITORING TEST');
console.log('=' .repeat(50));

const db = new Database('./database.sqlite');

// Get initial count
const initialCount = db.prepare('SELECT COUNT(*) as count FROM amazon_products WHERE content_type = ?').get('prime-picks');
console.log(`📊 Initial Prime Picks products: ${initialCount.count}`);

// Get current timestamp
const startTime = Math.floor(Date.now() / 1000);
console.log(`⏰ Monitoring started at: ${new Date().toLocaleString()}`);

console.log('\n📱 INSTRUCTIONS FOR REAL TEST:');
console.log('1. Go to Telegram @pntamazon channel');
console.log('2. Post any Amazon product URL (e.g., https://amazon.in/dp/B08N5WRWNW)');
console.log('3. Wait 10-30 seconds for processing');
console.log('4. Run this script again to check results');

console.log('\n🔄 CHECKING FOR NEW PRODUCTS...');

// Check for products added after start time
const newProducts = db.prepare(`
  SELECT id, name, price, created_at, telegram_message_id 
  FROM amazon_products 
  WHERE content_type = 'prime-picks' 
  AND created_at >= ?
  ORDER BY created_at DESC
`).all(startTime - 60); // Check last minute

if (newProducts.length > 0) {
  console.log(`\n✅ FOUND ${newProducts.length} NEW PRODUCTS:`);
  newProducts.forEach((product, index) => {
    const createdDate = new Date(product.created_at * 1000).toLocaleString();
    console.log(`\n${index + 1}. Product ID: ${product.id}`);
    console.log(`   Name: ${product.name}`);
    console.log(`   Price: ₹${product.price}`);
    console.log(`   Created: ${createdDate}`);
    console.log(`   Telegram Message ID: ${product.telegram_message_id || 'N/A'}`);
  });
  
  console.log('\n🎉 WEBHOOK TEST RESULT: SUCCESS!');
  console.log('✅ Telegram → Bot → Database pipeline is working!');
  
} else {
  console.log('\n⏳ NO NEW PRODUCTS FOUND');
  console.log('\nPossible reasons:');
  console.log('• No product posted in Telegram channel yet');
  console.log('• Bot is not processing messages (check server logs)');
  console.log('• Webhook not receiving Telegram updates');
  console.log('• Product URL was invalid or failed to process');
  
  console.log('\n🔧 TROUBLESHOOTING STEPS:');
  console.log('1. Check server logs for bot activity');
  console.log('2. Verify bot has admin permissions in @pntamazon channel');
  console.log('3. Try posting a simple Amazon URL like: https://amazon.in/dp/B08N5WRWNW');
  console.log('4. Wait 30 seconds and run this script again');
}

// Show recent products for reference
const recentProducts = db.prepare(`
  SELECT id, name, created_at 
  FROM amazon_products 
  WHERE content_type = 'prime-picks' 
  ORDER BY created_at DESC 
  LIMIT 5
`).all();

if (recentProducts.length > 0) {
  console.log('\n📋 RECENT PRIME PICKS PRODUCTS:');
  recentProducts.forEach((product, index) => {
    const createdDate = new Date(product.created_at * 1000).toLocaleString();
    console.log(`  ${index + 1}. ${product.name} (${createdDate})`);
  });
} else {
  console.log('\n📋 NO PRIME PICKS PRODUCTS IN DATABASE');
}

db.close();

console.log('\n' + '=' .repeat(50));
console.log('🏁 Monitoring complete. Post a product and run again!');