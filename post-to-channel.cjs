const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

// Bot configuration
const BOT_TOKEN = process.env.MASTER_BOT_TOKEN;
const PRIME_PICKS_CHANNEL = '-1002955338551';

if (!BOT_TOKEN) {
    console.error('❌ MASTER_BOT_TOKEN not found in environment variables');
    process.exit(1);
}

// Create bot instance
const bot = new TelegramBot(BOT_TOKEN, { polling: false });

async function postToChannel() {
    try {
        console.log('📤 Posting message to Prime Picks Channel...');
        console.log('📺 Channel ID:', PRIME_PICKS_CHANNEL);
        
        const message = `🔥 AMAZING DEAL ALERT! 🔥

📱 Premium Wireless Earbuds Pro
💰 Price: ₹899 (was ₹2,499)
🎯 64% OFF - Flash Sale!

✅ Active Noise Cancellation
✅ 30H Battery Life
✅ IPX7 Waterproof
✅ Touch Controls

🛒 Shop Now: https://www.amazon.in/premium-wireless-earbuds/dp/B08DEAL456

⏰ Limited Stock - Only 8 left!

#PrimePicks #Earbuds #Deal #FlashSale`;

        const result = await bot.sendMessage(PRIME_PICKS_CHANNEL, message);
        
        console.log('✅ Message posted successfully!');
        console.log('   Message ID:', result.message_id);
        console.log('   Chat ID:', result.chat.id);
        console.log('   Date:', new Date(result.date * 1000).toLocaleString());
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error posting message:', error.message);
        if (error.response) {
            console.error('   Response:', error.response.body);
        }
        process.exit(1);
    }
}

// Post the message
postToChannel();