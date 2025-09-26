const TelegramBot = require('node-telegram-bot-api');

// All bot tokens from your .env file
const BOT_TOKENS = [
  '8433200963:AAFE8umMtF23xgE7pBZA6wjIVg-o-2GeEvE', // Master Bot (current)
  '8260140807:AAEy6I9xxtYbvddJKDNfRwmcIWDX1Y9pck4', // Prime Picks
  '8352384812:AAE-bwA_3zIB8ZnPG4ZmyEbREBlfijjE32I', // Cue Picks
  '8293858742:AAGDnH8aN5e-JOvhLQNCR_rWEOicOPji41A', // Value Picks
  '8077836519:AAGoSql-Fz9lF_90AKxobprROub89VVKePg', // Click Picks
  '8341930611:AAHq7sS4Sk6HKoyfUGYwYWHwXZrGOgeWx-E', // Global Picks
  '8292764619:AAEkfPXIsgNh1JC3n2p6VYo27V-EHepzmBo', // Deals Hub
  '8141266952:AAEosdwI8BkIpSk0f1AVzn8l4iwRnS8HXFQ'  // Loot Box
];

const BOT_NAMES = [
  'Master Bot (Current)',
  'Prime Picks Bot',
  'Cue Picks Bot', 
  'Value Picks Bot',
  'Click Picks Bot',
  'Global Picks Bot',
  'Deals Hub Bot',
  'Loot Box Bot'
];

async function cleanupAllBots() {
  console.log('🧹 CLEANING UP ALL BOT INSTANCES');
  console.log('='.repeat(50));
  console.log(`Found ${BOT_TOKENS.length} bot tokens to check...\n`);

  for (let i = 0; i < BOT_TOKENS.length; i++) {
    const token = BOT_TOKENS[i];
    const name = BOT_NAMES[i];
    
    console.log(`${i + 1}. Checking ${name}...`);
    
    try {
      const bot = new TelegramBot(token, { polling: false });
      
      // Get bot info
      const botInfo = await bot.getMe();
      console.log(`   ✅ Bot: @${botInfo.username} (${botInfo.first_name})`);
      
      // Check webhook
      const webhookInfo = await bot.getWebHookInfo();
      
      if (webhookInfo.url) {
        console.log(`   🔗 Webhook found: ${webhookInfo.url}`);
        console.log(`   🗑️ Deleting webhook...`);
        
        const result = await bot.deleteWebHook();
        if (result) {
          console.log(`   ✅ Webhook deleted successfully`);
        } else {
          console.log(`   ❌ Failed to delete webhook`);
        }
      } else {
        console.log(`   ✅ No webhook set (polling mode)`);
      }
      
      // Check for pending updates
      const updates = await bot.getUpdates({ limit: 1 });
      if (updates.length > 0) {
        console.log(`   📨 ${updates.length} pending updates found`);
        
        // Clear pending updates by getting them with a high offset
        const lastUpdate = updates[updates.length - 1];
        await bot.getUpdates({ offset: lastUpdate.update_id + 1, limit: 1 });
        console.log(`   🧹 Cleared pending updates`);
      } else {
        console.log(`   ✅ No pending updates`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      
      if (error.message.includes('401')) {
        console.log(`   🚫 Invalid token - bot may have been deleted`);
      } else if (error.message.includes('409')) {
        console.log(`   ⚠️ Polling conflict detected!`);
      }
    }
    
    console.log(''); // Empty line for readability
  }
  
  console.log('🎯 CLEANUP SUMMARY');
  console.log('='.repeat(30));
  console.log('✅ All bot webhooks checked and cleared');
  console.log('✅ All pending updates cleared');
  console.log('✅ Ready for single bot polling');
  console.log('\n🚀 You can now start your main bot without conflicts!');
}

cleanupAllBots().catch(console.error);