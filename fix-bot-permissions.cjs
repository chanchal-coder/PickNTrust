const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

console.log('🔧 Fixing Bot Permissions for Channel Posts');
console.log('==========================================');

const BOT_TOKEN = process.env.MASTER_BOT_TOKEN;
const PRIME_PICKS_CHANNEL = '-1002955338551';

if (!BOT_TOKEN) {
    console.error('❌ MASTER_BOT_TOKEN not found');
    process.exit(1);
}

// Create bot
const bot = new TelegramBot(BOT_TOKEN);

async function fixBotPermissions() {
    try {
        console.log('\n🔍 Checking bot info...');
        const botInfo = await bot.getMe();
        console.log('✅ Bot info:', botInfo.username);
        
        console.log('\n📋 Checking channel info...');
        const chatInfo = await bot.getChat(PRIME_PICKS_CHANNEL);
        console.log('✅ Channel info:', chatInfo.title);
        
        console.log('\n🔧 Setting webhook to receive all updates...');
        // Delete any existing webhook first
        await bot.deleteWebhook();
        console.log('✅ Webhook cleared');
        
        console.log('\n📝 Bot should now receive channel posts');
        console.log('   Make sure the bot is added as an admin to the channel');
        console.log('   with "Post Messages" permission enabled');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        
        if (error.message.includes('chat not found')) {
            console.log('\n💡 Possible solutions:');
            console.log('   1. Make sure the bot is added to the channel');
            console.log('   2. Make sure the channel ID is correct');
            console.log('   3. Make sure the bot has admin permissions');
        }
    }
}

fixBotPermissions().then(() => {
    console.log('\n✅ Permission check completed');
    process.exit(0);
}).catch(error => {
    console.error('❌ Failed:', error.message);
    process.exit(1);
});