// Debug Webhook Processing
// This script tests webhook processing and checks database results

const axios = require('axios');
const Database = require('better-sqlite3');

console.log('🔍 DEBUGGING WEBHOOK PROCESSING');
console.log('=' .repeat(50));

async function debugWebhookProcessing() {
  try {
    const db = new Database('./database.sqlite');
    
    // Get initial product count
    const initialCount = db.prepare('SELECT COUNT(*) as count FROM prime_picks_products').get();
    console.log(`📊 Initial products in prime_picks_products: ${initialCount.count}`);
    
    // Send webhook message
    console.log('\n📱 Sending webhook message...');
    
    const webhookPayload = {
      message: {
        text: 'Debug test: https://amazon.in/dp/B08N5WRWNW Amazing product!',
        chat: {
          id: -1002955338551,
          type: 'channel'
        },
        message_id: 1005,
        from: {
          id: 123456,
          first_name: 'Debug'
        },
        date: Math.floor(Date.now() / 1000)
      }
    };
    
    const response = await axios.post('https://wild-cooks-read.loca.lt/webhook/prime-picks', webhookPayload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Bot-Api-Secret-Token': 'pickntrust_webhook_secret_2025'
      }
    });
    
    console.log(`✅ Webhook response: ${response.status} ${response.statusText}`);
    console.log(`📄 Response body:`, response.data);
    
    // Wait a moment for processing
    console.log('\n⏳ Waiting 5 seconds for processing...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check database again
    const finalCount = db.prepare('SELECT COUNT(*) as count FROM prime_picks_products').get();
    console.log(`\n📊 Final products in prime_picks_products: ${finalCount.count}`);
    
    const newProducts = finalCount.count - initialCount.count;
    console.log(`📈 New products created: ${newProducts}`);
    
    if (newProducts > 0) {
      console.log('\n✅ SUCCESS: Products were created!');
      
      // Show recent products
      const recentProducts = db.prepare(`
        SELECT name, price, affiliate_url, created_at 
        FROM prime_picks_products 
        ORDER BY created_at DESC 
        LIMIT 3
      `).all();
      
      recentProducts.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.name}`);
        console.log(`     Price: ${product.price}`);
        console.log(`     URL: ${product.affiliate_url}`);
        console.log(`     Created: ${new Date(product.created_at * 1000).toLocaleString()}`);
      });
      
    } else {
      console.log('\n❌ ISSUE: No new products were created');
      
      // Debug: Check table structure
      console.log('\n🔍 Debugging table structure...');
      const tableInfo = db.pragma('table_info(prime_picks_products)');
      console.log('📋 Table columns:');
      tableInfo.forEach(col => {
        console.log(`  - ${col.name} (${col.type})`);
      });
      
      // Check if there are any products at all
      const allProducts = db.prepare('SELECT COUNT(*) as count FROM prime_picks_products').get();
      console.log(`\n📊 Total products in table: ${allProducts.count}`);
      
      if (allProducts.count > 0) {
        const sampleProducts = db.prepare('SELECT name, created_at FROM prime_picks_products ORDER BY created_at DESC LIMIT 3').all();
        console.log('📋 Sample existing products:');
        sampleProducts.forEach((product, index) => {
          console.log(`  ${index + 1}. ${product.name} (${new Date(product.created_at * 1000).toLocaleString()})`);
        });
      }
    }
    
    db.close();
    
  } catch (error) {
    console.error('❌ Debug test failed:', error.message);
    if (error.response) {
      console.error('📄 Response status:', error.response.status);
      console.error('📄 Response data:', error.response.data);
    }
  }
}

// Run the debug test
debugWebhookProcessing().then(() => {
  console.log('\n🏁 Webhook processing debug completed');
}).catch(error => {
  console.error('❌ Debug error:', error);
});