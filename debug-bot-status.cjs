const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const BOT_TOKEN = process.env.MASTER_BOT_TOKEN;

async function debugBotStatus() {
  console.log('🔍 Debugging Bot Status...\n');
  
  try {
    // Create bot instance without polling
    const bot = new TelegramBot(BOT_TOKEN, { polling: false });
    
    // Get bot info
    console.log('1. Getting bot information...');
    const botInfo = await bot.getMe();
    console.log('✅ Bot Info:', {
      id: botInfo.id,
      username: botInfo.username,
      first_name: botInfo.first_name,
      can_read_all_group_messages: botInfo.can_read_all_group_messages
    });
    
    // Check webhook status
    console.log('\n2. Checking webhook status...');
    const webhookInfo = await bot.getWebHookInfo();
    console.log('✅ Webhook Info:', {
      url: webhookInfo.url || 'None',
      has_custom_certificate: webhookInfo.has_custom_certificate,
      pending_update_count: webhookInfo.pending_update_count,
      last_error_date: webhookInfo.last_error_date,
      last_error_message: webhookInfo.last_error_message
    });
    
    // Get updates manually to see if there are any pending
    console.log('\n3. Getting pending updates...');
    const updates = await bot.getUpdates({ limit: 10 });
    console.log(`✅ Found ${updates.length} pending updates`);
    
    if (updates.length > 0) {
      console.log('Recent updates:');
      updates.forEach((update, index) => {
        console.log(`  Update ${index + 1}:`, {
          update_id: update.update_id,
          type: update.channel_post ? 'channel_post' : update.message ? 'message' : 'other',
          chat_id: update.channel_post?.chat?.id || update.message?.chat?.id,
          chat_title: update.channel_post?.chat?.title || update.message?.chat?.title,
          text: (update.channel_post?.text || update.message?.text || '').substring(0, 50) + '...'
        });
      });
    }
    
    // Test polling briefly
    console.log('\n4. Testing polling for 10 seconds...');
    const testBot = new TelegramBot(BOT_TOKEN, { 
      polling: {
        interval: 1000,
        autoStart: true,
        params: { timeout: 5 }
      }
    });
    
    let messageReceived = false;
    
    testBot.on('channel_post', (msg) => {
      console.log('🎉 RECEIVED CHANNEL POST:', {
        chat_id: msg.chat.id,
        chat_title: msg.chat.title,
        message_id: msg.message_id,
        text: (msg.text || '').substring(0, 100)
      });
      messageReceived = true;
    });
    
    testBot.on('message', (msg) => {
      console.log('🎉 RECEIVED MESSAGE:', {
        chat_id: msg.chat.id,
        chat_title: msg.chat.title || 'Private',
        message_id: msg.message_id,
        text: (msg.text || '').substring(0, 100)
      });
      messageReceived = true;
    });
    
    testBot.on('polling_error', (error) => {
      console.log('❌ Polling error:', error.message);
    });
    
    // Wait for 10 seconds
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    if (!messageReceived) {
      console.log('⚠️  No messages received during 10-second test');
    }
    
    // Stop test bot
    await testBot.stopPolling();
    
    console.log('\n✅ Bot status check complete');
    
  } catch (error) {
    console.error('❌ Error checking bot status:', error);
  }
}

debugBotStatus().catch(console.error);