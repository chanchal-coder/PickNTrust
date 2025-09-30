const TelegramBot = require('node-telegram-bot-api');
const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

console.log('🔍 DEBUG BOT - MESSAGE MONITORING');
console.log('==================================');

// Get bot token
const BOT_TOKEN = process.env.MASTER_BOT_TOKEN;
if (!BOT_TOKEN) {
    console.error('❌ MASTER_BOT_TOKEN not found');
    process.exit(1);
}

// Channel configuration
const PRIME_PICKS_CHANNEL = '-1002955338551';
const CUE_PICKS_CHANNEL = '-1002982344997';

console.log('📺 Monitoring channels:');
console.log('   Prime Picks:', PRIME_PICKS_CHANNEL);
console.log('   Cue Picks:', CUE_PICKS_CHANNEL);

// Create bot with polling - configured to receive all updates
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

console.log('🤖 Debug bot created with polling enabled');

// Test bot connection
async function testConnection() {
    try {
        const botInfo = await bot.getMe();
        console.log('✅ Bot connected successfully!');
        console.log(`   ID: ${botInfo.id}`);
        console.log(`   Username: ${botInfo.username}`);
        console.log(`   Name: ${botInfo.first_name}`);
        console.log('\n👂 Now listening for ALL messages...\n');
    } catch (error) {
        console.error('❌ Bot connection failed:', error.message);
        process.exit(1);
    }
}

// Debug: Log ALL incoming updates
bot.on('polling_error', (error) => {
    console.log('⚠️ Polling error:', error.message);
});

// Regular message handler
bot.on('message', async (msg) => {
    console.log('\n💬 REGULAR MESSAGE RECEIVED!');
    console.log('================================');
    console.log('   Chat type:', msg.chat.type);
    console.log('   Chat ID:', msg.chat.id);
    console.log('   Chat title:', msg.chat.title || 'N/A');
    console.log('   Message ID:', msg.message_id);
    console.log('   From:', msg.from ? `${msg.from.first_name} (${msg.from.username})` : 'N/A');
    console.log('   Date:', new Date(msg.date * 1000).toLocaleString());
    console.log('   Text preview:', (msg.text || msg.caption || 'No text').substring(0, 100));
    console.log('   Has photo:', !!msg.photo);
    
    // Check if it's from our target channels
    const chatId = msg.chat.id.toString();
    if (chatId === PRIME_PICKS_CHANNEL) {
        console.log('🎯 THIS IS FROM PRIME PICKS CHANNEL!');
    } else if (chatId === CUE_PICKS_CHANNEL) {
        console.log('🎯 THIS IS FROM CUE PICKS CHANNEL!');
    } else {
        console.log('ℹ️ This is from a different chat');
    }
});

// Channel post handler
bot.on('channel_post', async (msg) => {
    console.log('\n📺 CHANNEL POST RECEIVED!');
    console.log('==========================');
    console.log('   Chat type:', msg.chat.type);
    console.log('   Chat ID:', msg.chat.id);
    console.log('   Chat title:', msg.chat.title || 'N/A');
    console.log('   Message ID:', msg.message_id);
    console.log('   Date:', new Date(msg.date * 1000).toLocaleString());
    console.log('   Text preview:', (msg.text || msg.caption || 'No text').substring(0, 100));
    console.log('   Has photo:', !!msg.photo);
    
    // Check if it's from our target channels
    const chatId = msg.chat.id.toString();
    if (chatId === PRIME_PICKS_CHANNEL) {
        console.log('🎯 THIS IS FROM PRIME PICKS CHANNEL!');
    } else if (chatId === CUE_PICKS_CHANNEL) {
        console.log('🎯 THIS IS FROM CUE PICKS CHANNEL!');
    } else {
        console.log('ℹ️ This is from a different channel');
    }
});

// Edited channel post handler
bot.on('edited_channel_post', async (msg) => {
    console.log('\n📝 EDITED CHANNEL POST RECEIVED!');
    console.log('=================================');
    console.log('   Chat type:', msg.chat.type);
    console.log('   Chat ID:', msg.chat.id);
    console.log('   Chat title:', msg.chat.title || 'N/A');
    console.log('   Message ID:', msg.message_id);
    console.log('   Date:', new Date(msg.date * 1000).toLocaleString());
    console.log('   Text preview:', (msg.text || msg.caption || 'No text').substring(0, 100));
    
    // Check if it's from our target channels
    const chatId = msg.chat.id.toString();
    if (chatId === PRIME_PICKS_CHANNEL) {
        console.log('🎯 THIS IS FROM PRIME PICKS CHANNEL!');
    } else if (chatId === CUE_PICKS_CHANNEL) {
        console.log('🎯 THIS IS FROM CUE PICKS CHANNEL!');
    } else {
        console.log('ℹ️ This is from a different channel');
    }
});

// Start the debug bot
testConnection();

// Keep the process running
process.on('SIGINT', () => {
    console.log('\n🛑 Debug bot stopped');
    process.exit(0);
});