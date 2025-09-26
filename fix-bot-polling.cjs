const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

console.log('🔧 FIXING BOT POLLING ISSUES');
console.log('=============================');

const BOT_TOKEN = process.env.MASTER_BOT_TOKEN;

if (!BOT_TOKEN) {
    console.error('❌ MASTER_BOT_TOKEN not found');
    process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN);

async function fixPollingIssues() {
    try {
        console.log('\n🔍 Step 1: Checking current webhook status...');
        
        try {
            const webhookInfo = await bot.getWebHookInfo();
            console.log('✅ Webhook Info:');
            console.log(`   URL: ${webhookInfo.url || 'None'}`);
            console.log(`   Has custom certificate: ${webhookInfo.has_custom_certificate}`);
            console.log(`   Pending update count: ${webhookInfo.pending_update_count}`);
            console.log(`   Last error date: ${webhookInfo.last_error_date || 'None'}`);
            console.log(`   Last error message: ${webhookInfo.last_error_message || 'None'}`);
            console.log(`   Max connections: ${webhookInfo.max_connections || 'Default'}`);
            
            if (webhookInfo.url) {
                console.log('\n🚨 WEBHOOK IS SET! This prevents polling from working.');
                console.log('   Clearing webhook...');
                
                const result = await bot.deleteWebHook();
                if (result) {
                    console.log('✅ Webhook cleared successfully!');
                } else {
                    console.log('❌ Failed to clear webhook');
                }
            } else {
                console.log('✅ No webhook set - polling should work');
            }
        } catch (error) {
            console.log('❌ Failed to get webhook info:', error.message);
        }
        
        console.log('\n🔍 Step 2: Getting pending updates...');
        try {
            // Get updates with a high offset to clear any pending ones
            const updates = await bot.getUpdates({ limit: 100, timeout: 1 });
            console.log(`✅ Retrieved ${updates.length} pending updates`);
            
            if (updates.length > 0) {
                console.log('📋 Sample of pending updates:');
                updates.slice(0, 3).forEach((update, index) => {
                    console.log(`\n   Update ${index + 1}:`);
                    console.log(`   Update ID: ${update.update_id}`);
                    
                    if (update.message) {
                        console.log(`   Type: message from ${update.message.chat.id}`);
                    } else if (update.channel_post) {
                        console.log(`   Type: channel_post from ${update.channel_post.chat.id}`);
                        console.log(`   Text: ${(update.channel_post.text || update.channel_post.caption || 'No text').substring(0, 50)}...`);
                    }
                });
                
                // Clear pending updates by getting them with the highest offset
                const lastUpdateId = Math.max(...updates.map(u => u.update_id));
                console.log(`\n🧹 Clearing pending updates (offset: ${lastUpdateId + 1})...`);
                await bot.getUpdates({ offset: lastUpdateId + 1, limit: 1 });
                console.log('✅ Pending updates cleared');
            }
        } catch (error) {
            console.log('❌ Failed to get updates:', error.message);
        }
        
        console.log('\n🔍 Step 3: Testing fresh polling...');
        try {
            // Test if we can now get updates
            const freshUpdates = await bot.getUpdates({ limit: 1, timeout: 1 });
            console.log(`✅ Fresh polling test: ${freshUpdates.length} updates`);
        } catch (error) {
            console.log('❌ Fresh polling test failed:', error.message);
        }
        
        console.log('\n✅ POLLING FIX COMPLETED');
        console.log('========================');
        console.log('Now restart your bot with polling enabled.');
        console.log('The bot should now receive channel messages properly.');
        
    } catch (error) {
        console.error('❌ Fix failed:', error.message);
    }
    
    process.exit(0);
}

fixPollingIssues();