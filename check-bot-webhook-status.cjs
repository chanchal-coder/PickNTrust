const { Telegraf } = require('telegraf');
require('dotenv').config();

const BOT_TOKEN = process.env.MASTER_BOT_TOKEN;

if (!BOT_TOKEN) {
    console.error('❌ MASTER_BOT_TOKEN not found');
    process.exit(1);
}

async function checkWebhookStatus() {
    console.log('🔍 Checking bot webhook status...');
    
    const bot = new Telegraf(BOT_TOKEN);
    
    try {
        // Get webhook info
        const webhookInfo = await bot.telegram.getWebhookInfo();
        
        console.log('\n📋 Webhook Information:');
        console.log(`   URL: ${webhookInfo.url || 'Not set (polling mode)'}`);
        console.log(`   Has Custom Certificate: ${webhookInfo.has_custom_certificate}`);
        console.log(`   Pending Update Count: ${webhookInfo.pending_update_count}`);
        console.log(`   Last Error Date: ${webhookInfo.last_error_date ? new Date(webhookInfo.last_error_date * 1000) : 'None'}`);
        console.log(`   Last Error Message: ${webhookInfo.last_error_message || 'None'}`);
        console.log(`   Max Connections: ${webhookInfo.max_connections || 'Default'}`);
        console.log(`   Allowed Updates: ${webhookInfo.allowed_updates?.join(', ') || 'All'}`);
        
        if (webhookInfo.url) {
            console.log('\n⚠️  WEBHOOK IS SET! This prevents polling from working.');
            console.log('🔧 To use polling, you need to delete the webhook first.');
            
            // Offer to delete webhook
            console.log('\n🗑️  Deleting webhook to enable polling...');
            await bot.telegram.deleteWebhook();
            console.log('✅ Webhook deleted successfully!');
            console.log('🔄 Bot can now use polling mode.');
        } else {
            console.log('\n✅ No webhook set - polling mode should work.');
        }
        
        // Get bot info
        const botInfo = await bot.telegram.getMe();
        console.log('\n🤖 Bot Information:');
        console.log(`   Username: @${botInfo.username}`);
        console.log(`   ID: ${botInfo.id}`);
        console.log(`   Can Join Groups: ${botInfo.can_join_groups}`);
        console.log(`   Can Read All Group Messages: ${botInfo.can_read_all_group_messages}`);
        
    } catch (error) {
        console.error('❌ Error checking webhook status:', error.message);
    }
}

checkWebhookStatus()
    .then(() => {
        console.log('\n✅ Webhook check completed');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });