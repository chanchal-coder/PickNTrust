// Diagnose Telegram Bot Webhook Status
// This script checks and clears webhook if polling is being used

require('dotenv').config({ path: '.env.telegram' });
const TelegramBot = require('node-telegram-bot-api');

async function diagnoseWebhook() {
  console.log('Search Diagnosing Telegram Bot Webhook Status...');
  console.log('==============================================');
  
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN_DEODAP;
    
    if (!botToken) {
      console.error('Error Bot token not found in .env.telegram');
      return;
    }
    
    console.log('Success Bot Token:', botToken.substring(0, 20) + '...');
    
    // Create bot instance WITHOUT polling to check webhook
    const bot = new TelegramBot(botToken, { polling: false });
    
    // Check current webhook info
    console.log('\nSearch Checking current webhook status...');
    const webhookInfo = await bot.getWebHookInfo();
    
    console.log('Stats Webhook Info:');
    console.log('   URL:', webhookInfo.url || 'None');
    console.log('   Has Custom Certificate:', webhookInfo.has_custom_certificate);
    console.log('   Pending Update Count:', webhookInfo.pending_update_count);
    console.log('   Last Error Date:', webhookInfo.last_error_date || 'None');
    console.log('   Last Error Message:', webhookInfo.last_error_message || 'None');
    console.log('   Max Connections:', webhookInfo.max_connections || 'Default');
    console.log('   Allowed Updates:', webhookInfo.allowed_updates || 'All');
    
    // Check if webhook is set
    if (webhookInfo.url) {
      console.log('\nWarning WEBHOOK IS SET!');
      console.log('Alert This prevents polling from working!');
      console.log('\n🔧 Clearing webhook to enable polling...');
      
      // Delete webhook
      const result = await bot.deleteWebHook();
      
      if (result) {
        console.log('Success Webhook cleared successfully!');
        console.log('Success Polling can now work properly');
        
        // Verify webhook is cleared
        const newWebhookInfo = await bot.getWebHookInfo();
        console.log('\nSuccess Verification - New webhook URL:', newWebhookInfo.url || 'None');
        
      } else {
        console.log('Error Failed to clear webhook');
      }
      
    } else {
      console.log('\nSuccess NO WEBHOOK SET');
      console.log('Success Polling should work correctly');
    }
    
    // Test bot info
    console.log('\nAI Testing bot connection...');
    const botInfo = await bot.getMe();
    console.log('Success Bot Info:');
    console.log('   Username:', botInfo.username);
    console.log('   ID:', botInfo.id);
    console.log('   First Name:', botInfo.first_name);
    console.log('   Can Join Groups:', botInfo.can_join_groups);
    console.log('   Can Read All Group Messages:', botInfo.can_read_all_group_messages);
    console.log('   Supports Inline Queries:', botInfo.supports_inline_queries);
    
    console.log('\nTarget DIAGNOSIS COMPLETE!');
    console.log('\n📋 CHECKLIST STATUS:');
    console.log('Success Bot token is valid');
    console.log('Success Bot connection working');
    console.log(webhookInfo.url ? 'Success Webhook cleared (was blocking polling)' : 'Success No webhook interference');
    console.log('Success Ready for polling mode');
    
    console.log('\nRefresh Next steps:');
    console.log('1. Restart your server to reinitialize polling');
    console.log('2. Ensure bot is ADMIN in @deodappnt channel');
    console.log('3. Send a new message to test autopost');
    
  } catch (error) {
    console.error('Error Diagnosis failed:', error.message);
    
    if (error.code === 'ETELEGRAM') {
      console.error('\n🔧 Telegram API Error Details:');
      console.error('Response:', error.response?.body);
    }
  }
}

// Run diagnosis
diagnoseWebhook();