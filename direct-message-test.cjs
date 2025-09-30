require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = process.env.MASTER_BOT_TOKEN;

const bot = new TelegramBot(BOT_TOKEN);

async function sendDirectMessage() {
    try {
        console.log('📤 Sending direct message to bot...');
        
        // Get bot info first
        const botInfo = await bot.getMe();
        console.log('🤖 Bot info:', botInfo.username, botInfo.id);
        
        // Try to send a message to the channel as if it's a regular message
        // This should trigger the message handler if it's working
        const result = await bot.sendMessage('-1002955338551', '🧪 TEST MESSAGE FOR BOT PROCESSING\n\n📱 Test Product\n💰 Price: ₹1,999\n🔗 https://example.com/test-product');
        
        console.log('✅ Test message sent!');
        console.log('   Message ID:', result.message_id);
        console.log('   Chat ID:', result.chat.id);
        
        console.log('\n⏳ Waiting 5 seconds for bot to process...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        console.log('✅ Test completed - check bot logs for processing');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

sendDirectMessage();