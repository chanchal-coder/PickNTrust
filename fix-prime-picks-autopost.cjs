// Fix Prime Picks Autoposting - Resolve Bot Conflicts and Test
// This script addresses the 409 conflict errors and tests autoposting

const TelegramBot = require('node-telegram-bot-api');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

console.log('🔧 FIXING PRIME PICKS AUTOPOSTING');
console.log('=' .repeat(50));

async function testBotConnection() {
  console.log('\nAI TESTING BOT CONNECTION:');
  
  const botToken = process.env.PRIME_PICKS_BOT_TOKEN;
  const channelId = process.env.PRIME_PICKS_CHANNEL_ID;
  
  if (!botToken || !channelId) {
    console.log('Error Missing bot token or channel ID');
    return false;
  }
  
  console.log(`Success Bot Token: ${botToken.substring(0, 20)}...`);
  console.log(`Success Channel: ${channelId}`);
  
  try {
    // Create bot instance without polling to avoid conflicts
    const bot = new TelegramBot(botToken, { polling: false });
    
    // Test bot identity
    const botInfo = await bot.getMe();
    console.log(`Success Bot Connected: @${botInfo.username} (ID: ${botInfo.id})`);
    
    // Test channel access
    try {
      const chat = await bot.getChat(channelId);
      console.log(`Success Channel Access: ${chat.title || chat.username}`);
      
      // Check if bot can read messages
      const admins = await bot.getChatAdministrators(channelId);
      const botAdmin = admins.find(admin => admin.user.id === botInfo.id);
      
      if (botAdmin) {
        console.log('Success Bot is admin in channel');
        console.log(`   Permissions: ${JSON.stringify(botAdmin.can_read_all_group_messages || 'default')}`);
      } else {
        console.log('Error Bot is NOT admin in channel');
        console.log('🔧 SOLUTION: Add bot as admin to channel with "Read Messages" permission');
        return false;
      }
      
    } catch (error) {
      console.log(`Error Channel Access Error: ${error.message}`);
      if (error.message.includes('not found')) {
        console.log('🔧 SOLUTION: Check channel ID or make channel public');
      }
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.log(`Error Bot Connection Error: ${error.message}`);
    if (error.message.includes('401')) {
      console.log('🔧 SOLUTION: Check bot token validity');
    }
    return false;
  }
}

async function sendTestMessage() {
  console.log('\n📤 SENDING TEST MESSAGE:');
  
  const botToken = process.env.PRIME_PICKS_BOT_TOKEN;
  const channelId = process.env.PRIME_PICKS_CHANNEL_ID;
  
  try {
    const bot = new TelegramBot(botToken, { polling: false });
    
    const testMessage = `🧪 AUTOPOST TEST - ${new Date().toLocaleTimeString()}\n\n` +
      `Deal Test Product: Premium Wireless Headphones\n` +
      `Price Price: ₹2,999 (was ₹4,999)\n` +
      `⭐ Rating: 4.5/5\n\n` +
      `Link https://amazon.in/dp/B08N5WRWNW\n\n` +
      `#electronics #headphones #deal #test`;
    
    const sentMessage = await bot.sendMessage(channelId, testMessage);
    console.log('Success Test message sent successfully!');
    console.log(`Mobile Message ID: ${sentMessage.message_id}`);
    console.log(`Date Sent at: ${new Date(sentMessage.date * 1000).toLocaleString()}`);
    
    return true;
    
  } catch (error) {
    console.log(`Error Failed to send test message: ${error.message}`);
    return false;
  }
}

async function checkForNewProducts() {
  console.log('\nStats CHECKING FOR NEW PRODUCTS:');
  
  return new Promise((resolve) => {
    const db = new sqlite3.Database('database.sqlite');
    
    db.all('SELECT COUNT(*) as count FROM amazon_products', (err, rows) => {
      if (err) {
        console.log('Error Database error:', err.message);
        resolve(0);
      } else {
        const count = rows[0].count;
        console.log(`Products Products in amazon_products table: ${count}`);
        
        if (count > 0) {
          // Show recent products
          db.all('SELECT id, name, price, created_at FROM amazon_products ORDER BY created_at DESC LIMIT 3', (err, products) => {
            if (!err && products.length > 0) {
              console.log('\n📋 Recent Products:');
              products.forEach((p, i) => {
                console.log(`   ${i+1}. ${p.name?.substring(0, 40)}... - ₹${p.price}`);
              });
            }
            db.close();
            resolve(count);
          });
        } else {
          db.close();
          resolve(count);
        }
      }
    });
  });
}

async function runAutopostFix() {
  try {
    console.log('\nTarget ISSUE IDENTIFIED:');
    console.log('- Bot has 409 conflict errors (multiple instances)');
    console.log('- Amazon products table is empty (0 products)');
    console.log('- Bot configuration is correct');
    
    console.log('\n🔧 APPLYING FIXES:');
    console.log('1. Testing bot connection without polling conflicts');
    console.log('2. Checking bot permissions in channel');
    console.log('3. Sending test message to trigger autoposting');
    console.log('4. Monitoring for new products in database');
    
    // Step 1: Test bot connection
    const botConnected = await testBotConnection();
    if (!botConnected) {
      console.log('\nError FAILED: Bot connection issues detected');
      console.log('\n🔧 MANUAL FIXES NEEDED:');
      console.log('1. Go to @pntprimepicks Telegram channel');
      console.log('2. Add your bot as administrator');
      console.log('3. Grant "Read Messages" permission');
      console.log('4. Restart server: npm run dev');
      return;
    }
    
    // Step 2: Check initial product count
    const initialCount = await checkForNewProducts();
    
    // Step 3: Send test message
    console.log('\n⏳ Waiting 3 seconds before sending test...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const messageSent = await sendTestMessage();
    if (!messageSent) {
      console.log('\nError FAILED: Could not send test message');
      return;
    }
    
    // Step 4: Wait and check for processing
    console.log('\n⏳ Waiting 15 seconds for autoposting to process...');
    console.log('   (Check server terminal for processing messages)');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    const finalCount = await checkForNewProducts();
    
    if (finalCount > initialCount) {
      console.log('\nCelebration SUCCESS: AUTOPOSTING IS NOW WORKING!');
      console.log(`📈 Products increased from ${initialCount} to ${finalCount}`);
      console.log('Success Bot successfully processed the test message');
      console.log('Global Check http://localhost:5000/prime-picks to see new products');
    } else {
      console.log('\nWarning NO NEW PRODUCTS DETECTED');
      console.log('\nSearch POSSIBLE CAUSES:');
      console.log('1. Bot conflicts still preventing message processing');
      console.log('2. Bot not receiving messages from channel');
      console.log('3. Message processing errors in server');
      console.log('\n🔧 NEXT STEPS:');
      console.log('1. Check server logs for "Processing Prime Picks message"');
      console.log('2. Restart server completely: npm run dev');
      console.log('3. Verify bot permissions in Telegram channel');
    }
    
  } catch (error) {
    console.error('Error Fix failed:', error);
  }
}

// Run the fix
runAutopostFix().then(() => {
  console.log('\n' + '=' .repeat(50));
  console.log('🏁 Prime Picks autopost fix completed');
}).catch(error => {
  console.error('Error Fatal error:', error);
  process.exit(1);
});