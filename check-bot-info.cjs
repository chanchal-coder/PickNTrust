const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const BOT_TOKEN = process.env.MASTER_BOT_TOKEN;

async function checkBotInfo() {
  console.log('🤖 Checking Telegram Bot Information');
  console.log('=====================================');
  
  try {
    const bot = new TelegramBot(BOT_TOKEN);
    
    // Get bot info
    console.log('📋 Getting bot information...');
    const botInfo = await bot.getMe();
    console.log('✅ Bot Info:', {
      id: botInfo.id,
      username: botInfo.username,
      first_name: botInfo.first_name,
      can_join_groups: botInfo.can_join_groups,
      can_read_all_group_messages: botInfo.can_read_all_group_messages,
      supports_inline_queries: botInfo.supports_inline_queries
    });
    
    // Check webhook info
    console.log('\n🔗 Checking webhook information...');
    const webhookInfo = await bot.getWebHookInfo();
    console.log('📊 Webhook Info:', {
      url: webhookInfo.url || 'No webhook set',
      has_custom_certificate: webhookInfo.has_custom_certificate,
      pending_update_count: webhookInfo.pending_update_count,
      last_error_date: webhookInfo.last_error_date,
      last_error_message: webhookInfo.last_error_message,
      max_connections: webhookInfo.max_connections
    });
    
    // If webhook is set, delete it to enable polling
    if (webhookInfo.url) {
      console.log('\n🗑️ Webhook detected! Deleting webhook to enable polling...');
      const result = await bot.deleteWebHook();
      console.log('✅ Webhook deletion result:', result);
    } else {
      console.log('\n✅ No webhook set - polling should work');
    }
    
    // Test getting updates
    console.log('\n📨 Testing getUpdates...');
    const updates = await bot.getUpdates({ limit: 1 });
    console.log('📊 Recent updates count:', updates.length);
    
    if (updates.length > 0) {
      console.log('📋 Latest update:', {
        update_id: updates[0].update_id,
        message: updates[0].message ? 'Has message' : 'No message',
        channel_post: updates[0].channel_post ? 'Has channel post' : 'No channel post'
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking bot info:', error.message);
  }
}

checkBotInfo();