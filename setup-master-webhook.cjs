const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const BOT_TOKEN = process.env.MASTER_BOT_TOKEN;

if (!BOT_TOKEN) {
    console.error('❌ MASTER_BOT_TOKEN not found in environment variables');
    process.exit(1);
}

async function setupMasterWebhook() {
    console.log('🔧 Setting up master bot webhook...');
    
    try {
        const bot = new TelegramBot(BOT_TOKEN, { polling: false });
        
        // Clear any existing webhook first
        console.log('🧹 Clearing existing webhook...');
        await bot.deleteWebHook();
        
        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Set new webhook URL
        const webhookUrl = `http://localhost:5000/webhook/master/${BOT_TOKEN}`;
        console.log(`🔗 Setting webhook to: ${webhookUrl}`);
        
        await bot.setWebHook(webhookUrl, {
            allowed_updates: ['message', 'channel_post', 'edited_channel_post']
        });
        
        console.log('✅ Webhook set successfully');
        
        // Verify webhook
        await new Promise(resolve => setTimeout(resolve, 2000));
        const webhookInfo = await bot.getWebHookInfo();
        
        console.log('📊 Webhook verification:');
        console.log('   URL:', webhookInfo.url);
        console.log('   Pending updates:', webhookInfo.pending_update_count);
        console.log('   Max connections:', webhookInfo.max_connections);
        console.log('   Allowed updates:', webhookInfo.allowed_updates);
        
        if (webhookInfo.last_error_date) {
            console.log('   Last error:', new Date(webhookInfo.last_error_date * 1000));
            console.log('   Error message:', webhookInfo.last_error_message);
        }
        
        if (webhookInfo.url === webhookUrl) {
            console.log('✅ Webhook verified successfully!');
            console.log('🚀 Master bot is now ready to receive channel messages');
            console.log('📱 Monitored channels:');
            console.log('   • Prime Picks: -1002955338551');
            console.log('   • Cue Links: -1002982344997');
            console.log('   • Value Picks: -1003017626269');
            console.log('   • Click Picks: -1002981205504');
            console.log('   • Global Picks: -1002902496654');
            console.log('   • Deals Hub: -1003029983162');
            console.log('   • Loot Box: -1002991047787');
        } else {
            console.log('⚠️ Webhook verification failed');
            console.log(`   Expected: ${webhookUrl}`);
            console.log(`   Got: ${webhookInfo.url}`);
        }
        
    } catch (error) {
        console.error('❌ Error setting up webhook:', error.message);
        
        if (error.message.includes('WEBHOOK_REQUIRE_HTTPS')) {
            console.log('💡 Webhook requires HTTPS. For local development:');
            console.log('   1. Use ngrok: ngrok http 5000');
            console.log('   2. Use the HTTPS URL from ngrok');
            console.log('   3. Or use LocalTunnel for testing');
        }
    }
}

setupMasterWebhook();