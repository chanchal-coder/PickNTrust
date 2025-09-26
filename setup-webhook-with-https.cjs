const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const BOT_TOKEN = process.env.MASTER_BOT_TOKEN;

if (!BOT_TOKEN) {
    console.error('❌ MASTER_BOT_TOKEN not found in environment variables');
    process.exit(1);
}

async function setupWebhookWithHTTPS() {
    console.log('🔧 Setting up webhook with HTTPS...');
    
    try {
        const bot = new TelegramBot(BOT_TOKEN, { polling: false });
        
        // Clear any existing webhook first
        console.log('🧹 Clearing existing webhook...');
        await bot.deleteWebHook();
        
        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // For production, you would use your actual HTTPS domain
        // For development, we need to use a service like ngrok or localtunnel
        const webhookUrl = `https://your-domain.com/webhook/master/${BOT_TOKEN}`;
        
        console.log(`🔗 Setting webhook to: ${webhookUrl}`);
        console.log('⚠️  Note: This requires a valid HTTPS URL');
        console.log('   For local development, use ngrok or deploy to a server with HTTPS');
        
        // Uncomment the following lines when you have a valid HTTPS URL:
        /*
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
        */
        
        console.log('💡 To use webhooks in development:');
        console.log('   1. Install ngrok: npm install -g ngrok');
        console.log('   2. Run: ngrok http 5000');
        console.log('   3. Use the HTTPS URL from ngrok in the webhook setup');
        console.log('   4. Update the webhookUrl variable above with your ngrok URL');
        
    } catch (error) {
        console.error('❌ Error setting up webhook:', error.message);
    }
}

setupWebhookWithHTTPS();