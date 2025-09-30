const fetch = require('node-fetch');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

console.log('🧪 MANUAL MESSAGE PROCESSING TEST');
console.log('=' .repeat(60));
console.log('Target Purpose: Test if server can process messages manually');
console.log('Stats This bypasses Telegram and tests server logic directly');
console.log('=' .repeat(60));

async function testManualMessageProcessing() {
  console.log('\nSearch Testing manual message processing...');
  
  // Simulate messages for each service
  const testMessages = [
    {
      service: 'Prime Picks',
      message: {
        id: Date.now() + 1,
        text: 'Great Amazon deal! https://amazon.in/dp/B08N5WRWNW Only ₹2,999',
        channelId: '@pntprimepicks',
        channelTitle: 'Prime Picks Test',
        timestamp: Math.floor(Date.now() / 1000)
      }
    },
    {
      service: 'Click Picks',
      message: {
        id: Date.now() + 2,
        text: 'Amazing product deal! https://flipkart.com/product/example Price: ₹1,999',
        channelId: '@pntclickpicks',
        channelTitle: 'Click Picks Test',
        timestamp: Math.floor(Date.now() / 1000)
      }
    },
    {
      service: 'Value Picks',
      message: {
        id: Date.now() + 3,
        text: 'Value deal alert! https://myntra.com/item/test Special price: ₹899',
        channelId: '@pntearnkaro',
        channelTitle: 'Value Picks Test',
        timestamp: Math.floor(Date.now() / 1000)
      }
    }
  ];
  
  console.log('\nLaunch Testing each service manually...');
  
  for (const test of testMessages) {
    console.log(`\nMobile Testing ${test.service}:`);
    console.log(`   Message: ${test.message.text.substring(0, 50)}...`);
    console.log(`   Channel: ${test.message.channelId}`);
    
    try {
      // Test URL detection
      const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
      const urls = test.message.text.match(urlRegex) || [];
      
      console.log(`   Search URLs detected: ${urls.length}`);
      urls.forEach((url, i) => console.log(`      ${i + 1}. ${url}`));
      
      if (urls.length === 0) {
        console.log('   Error No URLs found - message would be ignored');
        continue;
      }
      
      // Test service processing (simulate what the bot manager would do)
      console.log(`   Refresh Simulating ${test.service} processing...`);
      
      // Import and test the specific service
      let serviceResult = null;
      
      if (test.service === 'Click Picks') {
        // Test Click Picks service
        try {
          const { ClickPicksService } = require('./server/click-picks-service.ts');
          const clickPicksService = new ClickPicksService();
          serviceResult = await clickPicksService.processMessage(test.message);
          console.log(`   Success Click Picks processed: ${serviceResult.length} products`);
        } catch (error) {
          console.log(`   Error Click Picks error: ${error.message}`);
        }
      } else if (test.service === 'Value Picks') {
        // Test Value Picks service
        try {
          const { ValuePicksService } = require('./server/value-picks-service.ts');
          const valuePicksService = new ValuePicksService();
          serviceResult = await valuePicksService.processMessage(test.message);
          console.log(`   Success Value Picks processed: ${serviceResult.length} products`);
        } catch (error) {
          console.log(`   Error Value Picks error: ${error.message}`);
        }
      } else {
        console.log(`   Warning ${test.service} service test not implemented`);
      }
      
      if (serviceResult && serviceResult.length > 0) {
        console.log(`   Products Products created:`);
        serviceResult.forEach((product, i) => {
          console.log(`      ${i + 1}. ${product.name} - ${product.price}`);
        });
      }
      
    } catch (error) {
      console.log(`   Error Test failed: ${error.message}`);
    }
  }
  
  console.log('\nSearch Testing server API endpoints...');
  
  // Test if server is responding
  try {
    const response = await fetch('http://localhost:5000/api/nav-tabs');
    if (response.ok) {
      console.log('Success Server API responding correctly');
    } else {
      console.log(`Error Server API error: ${response.status}`);
    }
  } catch (error) {
    console.log(`Error Server connection failed: ${error.message}`);
  }
  
  // Test database connection
  console.log('\nSearch Testing database connection...');
  try {
    const Database = require('better-sqlite3');
    const db = new Database('./database.sqlite');
    
    const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
    console.log(`Success Database connected: ${productCount.count} products`);
    
    const clickPicksCount = db.prepare('SELECT COUNT(*) as count FROM click_picks_products').get();
    console.log(`Success Click Picks table: ${clickPicksCount.count} products`);
    
    const valuePicksCount = db.prepare('SELECT COUNT(*) as count FROM value_picks_products').get();
    console.log(`Success Value Picks table: ${valuePicksCount.count} products`);
    
    db.close();
  } catch (error) {
    console.log(`Error Database error: ${error.message}`);
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('Stats MANUAL TEST RESULTS');
  console.log('=' .repeat(60));
  
  console.log('\nTarget WHAT THIS TEST SHOWS:');
  console.log('Success If services process messages: Server logic works');
  console.log('Success If database updates: Storage system works');
  console.log('Success If API responds: Server is running correctly');
  console.log('Error If nothing processes: Issue is with Telegram bot connections');
  
  console.log('\n🔧 NEXT STEPS:');
  console.log('1. If manual processing works: Issue is Telegram bot permissions');
  console.log('2. If manual processing fails: Issue is server-side code');
  console.log('3. If database updates: Check website pages for new products');
  console.log('4. If nothing works: Restart server and check logs');
  
  console.log('\nTip DEBUGGING TIPS:');
  console.log('• Manual processing success + no Telegram messages = Permission issue');
  console.log('• Manual processing failure = Code/service issue');
  console.log('• Database updates but no website display = Frontend issue');
  console.log('• No database updates = Backend processing issue');
  
  console.log('\n🏁 Manual test completed at:', new Date().toLocaleString());
}

// Run the manual test
testManualMessageProcessing().catch(error => {
  console.error('💥 Manual test crashed:', error);
  process.exit(1);
});