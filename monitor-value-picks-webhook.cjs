const Database = require('better-sqlite3');

console.log('🔍 VALUE PICKS WEBHOOK MONITORING TEST');
console.log('=' .repeat(50));

const db = new Database('./database.sqlite');

// Get initial count
const initialCount = db.prepare('SELECT COUNT(*) as count FROM value_picks_products WHERE processing_status = ?').get('active');
console.log(`📊 Initial Value Picks products: ${initialCount.count}`);

// Get current timestamp
const startTime = Math.floor(Date.now() / 1000);
console.log(`⏰ Monitoring started at: ${new Date().toLocaleString()}`);

console.log('\n📱 INSTRUCTIONS FOR REAL VALUE PICKS TEST:');
console.log('1. Go to Telegram @valuepicksek channel');
console.log('2. Post any product URL (Amazon, Flipkart, etc.)');
console.log('3. Example: https://amazon.in/dp/B08N5WRWNW');
console.log('4. Wait 10-30 seconds for processing');
console.log('5. Run this script again to check results');

console.log('\n🔄 CHECKING FOR NEW PRODUCTS...');

// Check for products added after start time
const newProducts = db.prepare(`
  SELECT id, name, price, created_at, telegram_message_id, processing_status, affiliate_network 
  FROM value_picks_products 
  WHERE processing_status = 'active' 
  AND created_at >= ?
  ORDER BY created_at DESC
`).all(startTime - 60); // Check last minute

if (newProducts.length > 0) {
  console.log(`\n✅ FOUND ${newProducts.length} NEW VALUE PICKS PRODUCTS:`);
  newProducts.forEach((product, index) => {
    const createdDate = new Date(product.created_at * 1000).toLocaleString();
    console.log(`\n${index + 1}. Product ID: ${product.id}`);
    console.log(`   Name: ${product.name}`);
    console.log(`   Price: ₹${product.price}`);
    console.log(`   Created: ${createdDate}`);
    console.log(`   Telegram Message ID: ${product.telegram_message_id || 'N/A'}`);
    console.log(`   Affiliate Network: ${product.affiliate_network || 'N/A'}`);
    console.log(`   Processing Status: ${product.processing_status}`);
  });
  
  console.log('\n🎉 VALUE PICKS WEBHOOK TEST RESULT: SUCCESS!');
  console.log('✅ Telegram → Value Picks Bot → Database pipeline is working!');
  
  // Test API endpoint
  console.log('\n🔗 Testing Value Picks API endpoint...');
  try {
    const { execSync } = require('child_process');
    const apiResult = execSync('powershell -Command "Invoke-WebRequest -Uri \'http://localhost:5000/api/products/page/value-picks\' -Method GET | Select-Object -ExpandProperty Content"', { encoding: 'utf8' });
    const products = JSON.parse(apiResult.trim());
    console.log(`✅ API returned ${products.length} products`);
    if (products.length > 0) {
      console.log('✅ Products are appearing on Value Picks page!');
    }
  } catch (apiError) {
    console.log('⚠️ API test failed:', apiError.message);
  }
  
} else {
  console.log('\n⏳ NO NEW VALUE PICKS PRODUCTS FOUND');
  console.log('\nPossible reasons:');
  console.log('• No product posted in @valuepicksek Telegram channel yet');
  console.log('• Value Picks bot is not processing messages (check server logs)');
  console.log('• Webhook not receiving Telegram updates for Value Picks');
  console.log('• Product URL was invalid or failed to process');
  console.log('• Bot lacks admin permissions in @valuepicksek channel');
  
  console.log('\n🔧 VALUE PICKS TROUBLESHOOTING STEPS:');
  console.log('1. Check server logs for Value Picks bot activity');
  console.log('2. Verify bot has admin permissions in @valuepicksek channel');
  console.log('3. Try posting a product URL like: https://amazon.in/dp/B08N5WRWNW');
  console.log('4. Check Enhanced Telegram Manager is routing messages to Value Picks bot');
  console.log('5. Wait 30 seconds and run this script again');
}

// Show recent products for reference
const recentProducts = db.prepare(`
  SELECT id, name, created_at, processing_status 
  FROM value_picks_products 
  ORDER BY created_at DESC 
  LIMIT 5
`).all();

if (recentProducts.length > 0) {
  console.log('\n📋 RECENT VALUE PICKS PRODUCTS:');
  recentProducts.forEach((product, index) => {
    const createdDate = new Date(product.created_at * 1000).toLocaleString();
    console.log(`  ${index + 1}. ${product.name} (${createdDate}) - Status: ${product.processing_status}`);
  });
} else {
  console.log('\n📋 NO VALUE PICKS PRODUCTS IN DATABASE');
}

// Check bot configuration
console.log('\n🤖 VALUE PICKS BOT CONFIGURATION:');
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '.env.value-picks');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const botToken = envContent.match(/TELEGRAM_BOT_TOKEN=(.+)/);
  const channelId = envContent.match(/CHANNEL_ID=(.+)/);
  const channelName = envContent.match(/CHANNEL_NAME=(.+)/);
  const affiliateNetwork = envContent.match(/AFFILIATE_NETWORK=(.+)/);
  
  console.log(`✅ Bot Token: ${botToken ? botToken[1].substring(0, 20) + '...' : 'Not found'}`);
  console.log(`✅ Channel ID: ${channelId ? channelId[1] : 'Not found'}`);
  console.log(`✅ Channel Name: ${channelName ? channelName[1] : 'Not found'}`);
  console.log(`✅ Affiliate Network: ${affiliateNetwork ? affiliateNetwork[1] : 'Not found'}`);
} else {
  console.log('❌ .env.value-picks file not found');
}

db.close();

console.log('\n' + '=' .repeat(50));
console.log('🏁 Value Picks monitoring complete. Post a product and run again!');