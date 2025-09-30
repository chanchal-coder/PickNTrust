const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const BOT_TOKEN = process.env.MASTER_BOT_TOKEN;

const CHANNELS = {
  'Prime Picks': '-1002955338551',
  'Cue Picks': '-1002982344997',
  'Value Picks': '-1003017626269',
  'Click Picks': '-1002981205504',
  'Global Picks': '-1002902496654',
  'Travel Picks': '-1003047967930',
  'Deals Hub': '-1003029983162',
  'Loot Box': '-1002991047787'
};

async function checkChannelPermissions() {
  console.log('🔍 Checking Bot Permissions in Channels');
  console.log('========================================');
  
  const bot = new TelegramBot(BOT_TOKEN);
  
  for (const [channelName, channelId] of Object.entries(CHANNELS)) {
    console.log(`\n📺 Checking ${channelName} (${channelId}):`);
    
    try {
      // Get chat info
      const chat = await bot.getChat(channelId);
      console.log(`   ✅ Chat accessible: ${chat.title}`);
      console.log(`   📊 Type: ${chat.type}`);
      
      // Get bot's member status
      const botMember = await bot.getChatMember(channelId, 8433200963); // Bot's user ID
      console.log(`   👤 Bot status: ${botMember.status}`);
      
      if (botMember.status === 'administrator') {
        console.log(`   🔑 Admin permissions:`, {
          can_post_messages: botMember.can_post_messages,
          can_edit_messages: botMember.can_edit_messages,
          can_delete_messages: botMember.can_delete_messages,
          can_manage_chat: botMember.can_manage_chat
        });
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      
      if (error.message.includes('chat not found')) {
        console.log(`   💡 Bot may not be added to this channel`);
      } else if (error.message.includes('not enough rights')) {
        console.log(`   💡 Bot lacks permissions to access channel info`);
      }
    }
  }
  
  console.log('\n💡 Recommendations:');
  console.log('   1. Add the bot as an administrator to each channel');
  console.log('   2. Grant "Post Messages" permission');
  console.log('   3. For channels, the bot needs admin rights to receive messages');
}

checkChannelPermissions();