const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

console.log('🧪 SENDING TEST PRODUCT TO CUE PICKS');
console.log('====================================');

const BOT_TOKEN = process.env.MASTER_BOT_TOKEN;
const CUE_PICKS_CHANNEL = '-1002982344997';

if (!BOT_TOKEN) {
    console.error('❌ MASTER_BOT_TOKEN not found');
    process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN);

async function sendTestProduct() {
    try {
        console.log('\n📤 Sending test product message to Cue Picks channel...');
        
        const testProductMessage = `🔥 FLASH DEAL ALERT! 🔥

🎧 Premium Wireless Headphones
💰 Deal @ ₹1,999 Reg @ ₹4,999
🏷️ 60% OFF - Limited Time!

✨ Features:
• Active Noise Cancellation
• 30-hour battery life
• Premium sound quality
• Comfortable fit

🛒 Grab yours now: https://amzn.to/3testproduct
⏰ Hurry! Only few left in stock

#CuePicksDeals #Headphones #TechDeals`;

        const message = await bot.sendMessage(CUE_PICKS_CHANNEL, testProductMessage);
        
        console.log('✅ Test product message sent successfully!');
        console.log(`   Message ID: ${message.message_id}`);
        console.log(`   Chat ID: ${message.chat.id}`);
        console.log(`   Date: ${new Date(message.date * 1000).toLocaleString()}`);
        
        console.log('\n⏳ Wait a few seconds for the bot to process this message...');
        console.log('   Then check the database to see if it was saved with cue-picks page type');
        
    } catch (error) {
        console.error('❌ Failed to send test message:', error.message);
    }
    
    process.exit(0);
}

sendTestProduct();