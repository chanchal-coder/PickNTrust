require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = process.env.MASTER_BOT_TOKEN;
const CHANNEL_ID = '-1002955338551';

const bot = new TelegramBot(BOT_TOKEN);

async function checkBotPermissions() {
    try {
        console.log('🔍 Checking bot permissions in channel...');
        
        // Try to get chat member info for the bot
        const botInfo = await bot.getMe();
        console.log('🤖 Bot info:', botInfo.username, botInfo.id);
        
        try {
            const chatMember = await bot.getChatMember(CHANNEL_ID, botInfo.id);
            console.log('✅ Bot status in channel:', chatMember.status);
            console.log('📋 Bot permissions:', chatMember);
            
            if (chatMember.status === 'administrator') {
                console.log('✅ Bot is an administrator - should receive channel posts');
            } else {
                console.log('❌ Bot is NOT an administrator - this is why it\'s not receiving channel posts!');
                console.log('🔧 Solution: Make the bot an administrator in the channel');
            }
        } catch (memberError) {
            console.log('❌ Cannot get bot member info:', memberError.message);
            console.log('💡 This usually means the bot is not in the channel or not an admin');
        }
        
    } catch (error) {
        console.error('❌ Error checking permissions:', error.message);
    }
}

checkBotPermissions();