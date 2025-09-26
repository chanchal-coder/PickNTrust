const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const BOT_TOKEN = process.env.MASTER_BOT_TOKEN;
const PRIME_PICKS_CHANNEL_ID = '-1002955338551'; // Prime Picks channel

console.log('📤 Sending Test Message to Prime Picks Channel');
console.log('==============================================');

async function sendTestMessage() {
  try {
    const bot = new TelegramBot(BOT_TOKEN);
    
    // Test product message with proper format
    const testMessage = `🔥 TEST PRODUCT ALERT! 🔥

📱 Wireless Gaming Mouse RGB
💰 Price: ₹1,299 (was ₹2,999)
🎯 57% OFF - Limited Time Deal!

✅ High Precision Sensor
✅ RGB Lighting Effects
✅ Ergonomic Design
✅ 6 Programmable Buttons

🛒 Buy Now: https://www.amazon.in/wireless-gaming-mouse-rgb/dp/B08TEST123

⏰ Hurry! Only 15 left in stock!

#PrimePicks #Gaming #Mouse #Deal #TestProduct`;

    console.log('🤖 Bot Token:', BOT_TOKEN ? 'SET ✅' : 'NOT SET ❌');
    console.log('📺 Target Channel:', PRIME_PICKS_CHANNEL_ID);
    console.log('\n📝 Message to send:');
    console.log(testMessage);
    
    console.log('\n📤 Sending message...');
    
    const result = await bot.sendMessage(PRIME_PICKS_CHANNEL_ID, testMessage, {
      parse_mode: 'HTML',
      disable_web_page_preview: false
    });
    
    console.log('✅ Message sent successfully!');
    console.log(`   Message ID: ${result.message_id}`);
    console.log(`   Chat ID: ${result.chat.id}`);
    console.log(`   Chat Title: ${result.chat.title}`);
    console.log(`   Date: ${new Date(result.date * 1000).toLocaleString()}`);
    
    console.log('\n🔍 Now check:');
    console.log('   1. Bot terminal for processing logs');
    console.log('   2. Website Prime Picks page for the new product');
    console.log('   3. Database for the new entry');
    
  } catch (error) {
    console.error('❌ Error sending message:', error.message);
    
    if (error.message.includes('chat not found')) {
      console.log('\n💡 Possible issues:');
      console.log('   - Bot is not added to the channel');
      console.log('   - Channel ID is incorrect');
      console.log('   - Bot lacks permissions');
    } else if (error.message.includes('not enough rights')) {
      console.log('\n💡 Permission issue:');
      console.log('   - Bot needs admin rights in the channel');
      console.log('   - Bot needs "Post Messages" permission');
    } else if (error.message.includes('Forbidden')) {
      console.log('\n💡 Access issue:');
      console.log('   - Bot token may be invalid');
      console.log('   - Bot is blocked or restricted');
    }
  }
}

sendTestMessage();