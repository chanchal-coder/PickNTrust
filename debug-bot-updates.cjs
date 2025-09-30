const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const BOT_TOKEN = process.env.MASTER_BOT_TOKEN;
const PRIME_PICKS_CHANNEL = process.env.PRIME_PICKS_CHANNEL_ID;

console.log('🔍 Debug Bot Updates');
console.log('====================');
console.log('🤖 Bot Token:', BOT_TOKEN ? 'SET ✅' : 'NOT SET ❌');
console.log('📺 Channel ID:', PRIME_PICKS_CHANNEL);

const bot = new TelegramBot(BOT_TOKEN, { 
    polling: {
        interval: 1000,
        autoStart: true,
        params: {
            allowed_updates: ['message', 'channel_post', 'edited_channel_post'],
            timeout: 10
        }
    }
});

// Log ALL incoming updates
bot.on('polling_error', (error) => {
    console.log('⚠️ Polling error:', error.message);
});

bot.on('error', (error) => {
    console.error('❌ Bot error:', error.message);
});

// Listen for ALL types of updates
bot.on('message', (msg) => {
    console.log('\n📨 MESSAGE received:');
    console.log('   Type:', msg.chat.type);
    console.log('   Chat ID:', msg.chat.id);
    console.log('   Message ID:', msg.message_id);
    console.log('   From:', msg.from ? msg.from.first_name : 'Unknown');
    console.log('   Text:', msg.text ? msg.text.substring(0, 50) + '...' : 'No text');
});

bot.on('channel_post', (msg) => {
    console.log('\n📺 CHANNEL_POST received:');
    console.log('   Chat ID:', msg.chat.id);
    console.log('   Chat Title:', msg.chat.title);
    console.log('   Message ID:', msg.message_id);
    console.log('   Text:', msg.text ? msg.text.substring(0, 50) + '...' : 'No text');
    console.log('   Has photo:', !!msg.photo);
    
    if (msg.chat.id.toString() === PRIME_PICKS_CHANNEL) {
        console.log('✅ This is from our target channel!');
    } else {
        console.log('ℹ️ This is from a different channel');
    }
});

bot.on('edited_channel_post', (msg) => {
    console.log('\n📝 EDITED_CHANNEL_POST received:');
    console.log('   Chat ID:', msg.chat.id);
    console.log('   Message ID:', msg.message_id);
});

console.log('\n👂 Bot is now listening for ALL updates...');
console.log('📝 Send a message to the channel to test');
console.log('🛑 Press Ctrl+C to stop');

// Keep the process alive
process.on('SIGINT', () => {
    console.log('\n🛑 Stopping bot...');
    bot.stopPolling();
    process.exit(0);
});