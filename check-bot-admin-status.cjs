// Check Bot Admin Status in Channel
// This script verifies if the bot is an admin in the target channel

require('dotenv').config({ path: '.env.telegram' });
const TelegramBot = require('node-telegram-bot-api');

async function checkBotAdminStatus() {
  console.log('Search Checking Bot Admin Status in Channel...');
  console.log('==========================================');
  
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN_DEODAP;
    const channelId = process.env.TELEGRAM_CHANNEL_ID_DEODAP;
    
    if (!botToken || !channelId) {
      console.error('Error Missing bot token or channel ID in .env.telegram');
      return;
    }
    
    console.log('Success Bot Token:', botToken.substring(0, 20) + '...');
    console.log('Success Channel ID:', channelId);
    
    const bot = new TelegramBot(botToken, { polling: false });
    
    // Get bot info
    const botInfo = await bot.getMe();
    console.log('\nAI Bot Info:');
    console.log('   Username: @' + botInfo.username);
    console.log('   ID:', botInfo.id);
    
    // Try to get chat info
    console.log('\nSearch Checking channel access...');
    try {
      const chatInfo = await bot.getChat(channelId);
      console.log('Success Channel Info:');
      console.log('   Title:', chatInfo.title);
      console.log('   Type:', chatInfo.type);
      console.log('   Username:', chatInfo.username ? '@' + chatInfo.username : 'None');
      console.log('   Description:', chatInfo.description || 'None');
      
    } catch (chatError) {
      console.error('Error Cannot access channel info:', chatError.message);
      console.log('Alert This usually means the bot is NOT in the channel or lacks permissions');
    }
    
    // Try to get chat administrators
    console.log('\nSearch Checking admin status...');
    try {
      const admins = await bot.getChatAdministrators(channelId);
      console.log('Success Found', admins.length, 'administrators in the channel');
      
      // Check if our bot is in the admin list
      const botAdmin = admins.find(admin => admin.user.id === botInfo.id);
      
      if (botAdmin) {
        console.log('\nCelebration BOT IS AN ADMIN!');
        console.log('Success Admin Status:', botAdmin.status);
        console.log('Success Can Post Messages:', botAdmin.can_post_messages || false);
        console.log('Success Can Edit Messages:', botAdmin.can_edit_messages || false);
        console.log('Success Can Delete Messages:', botAdmin.can_delete_messages || false);
        console.log('Success Can Restrict Members:', botAdmin.can_restrict_members || false);
        console.log('Success Can Promote Members:', botAdmin.can_promote_members || false);
        
        if (botAdmin.can_post_messages === false) {
          console.log('\nWarning WARNING: Bot cannot post messages!');
          console.log('🔧 Grant "Post Messages" permission to the bot');
        }
        
      } else {
        console.log('\nError BOT IS NOT AN ADMIN!');
        console.log('Alert This is why channel_post events are not received!');
        console.log('\n🔧 TO FIX THIS:');
        console.log('1. Go to @deodappnt channel');
        console.log('2. Click channel name → Info → Administrators');
        console.log('3. Click "Add Administrator"');
        console.log('4. Search for @' + botInfo.username);
        console.log('5. Add the bot and grant these permissions:');
        console.log('   Success Post Messages');
        console.log('   Success Edit Messages (optional)');
        console.log('   Success Delete Messages (optional)');
        console.log('6. Save changes');
        
        console.log('\n📋 Current Admins:');
        admins.forEach((admin, index) => {
          console.log(`   ${index + 1}. @${admin.user.username || admin.user.first_name} (${admin.status})`);
        });
      }
      
    } catch (adminError) {
      console.error('Error Cannot get administrators list:', adminError.message);
      console.log('Alert This confirms the bot lacks proper permissions!');
      
      console.log('\n🔧 SOLUTION:');
      console.log('1. Make sure the bot is added to the channel');
      console.log('2. Promote the bot to ADMIN with these permissions:');
      console.log('   Success Post Messages');
      console.log('   Success Read Messages (automatic for admins)');
      console.log('3. Only ADMINS receive channel_post updates!');
    }
    
    // Test sending a message to verify permissions
    console.log('\n🧪 Testing message sending permissions...');
    try {
      const testMessage = await bot.sendMessage(channelId, 'AI Bot admin status test - please ignore');
      console.log('Success Bot can send messages! Message ID:', testMessage.message_id);
      
      // Delete the test message
      setTimeout(async () => {
        try {
          await bot.deleteMessage(channelId, testMessage.message_id);
          console.log('Success Test message deleted');
        } catch (deleteError) {
          console.log('Warning Could not delete test message (normal if no delete permission)');
        }
      }, 2000);
      
    } catch (sendError) {
      console.error('Error Bot cannot send messages:', sendError.message);
      console.log('Alert Bot needs "Post Messages" permission!');
    }
    
  } catch (error) {
    console.error('Error Check failed:', error.message);
    
    if (error.code === 'ETELEGRAM') {
      console.error('\n🔧 Telegram API Error Details:');
      console.error('Response:', error.response?.body);
    }
  }
}

// Run check
checkBotAdminStatus();