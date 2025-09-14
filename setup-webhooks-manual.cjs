// Manual Webhook Setup - Configure Webhooks for All Bots
// This script sets up webhooks using a public URL

const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

console.log('🔧 MANUAL WEBHOOK SETUP');
console.log('=' .repeat(50));

// Bot configurations
const botConfigs = {
  'prime-picks': {
    token: '8260140807:AAEy6I9xxtYbvddJKDNfRwmcIWDX1Y9pck4',
    name: 'Prime Picks'
  },
  'cue-picks': {
    token: '8352384812:AAE-bwA_3zIB8ZnPG4ZmyEbREBlfijjE32I',
    name: 'Cue Picks'
  },
  'value-picks': {
    token: '8293858742:AAGDnH8aN5e-JOvhLQNCR_rWEOicOPji41A',
    name: 'Value Picks'
  },
  'click-picks': {
    token: '8077836519:AAGoSql-Fz9lF_90AKxobprROub89VVKePg',
    name: 'Click Picks'
  },
  'loot-box': {
    token: '8141266952:AAEosdwI8BkIpSk0f1AVzn8l4iwRnS8HXFQ',
    name: 'Loot Box'
  },
  'global-picks': {
    token: '8341930611:AAHq7sS4Sk6HKoyfUGYwYWHwXZrGOgeWx-E',
    name: 'Global Picks'
  },
  'dealshub': {
    token: '8292764619:AAEkfPXIsgNh1JC3n2p6VYo27V-EHepzmBo',
    name: 'DealsHub'
  },
  'travel-picks': {
    token: '7998139680:AAGVKECApmHNi4LMp2wR3UdVFfYgkT1HwZo',
    name: 'Travel Picks'
  }
};

async function setupWebhooks() {
  // Get webhook base URL from user input or environment
  const baseUrl = process.env.WEBHOOK_BASE_URL || process.argv[2];
  
  if (!baseUrl) {
    console.log('❌ No webhook base URL provided!');
    console.log('\n📋 Usage:');
    console.log('   node setup-webhooks-manual.cjs https://your-domain.com');
    console.log('   OR');
    console.log('   set WEBHOOK_BASE_URL=https://your-domain.com && node setup-webhooks-manual.cjs');
    console.log('\n💡 For testing with ngrok:');
    console.log('   1. Download ngrok from https://ngrok.com/download');
    console.log('   2. Run: ngrok http 5000');
    console.log('   3. Copy the https URL (e.g., https://abc123.ngrok.io)');
    console.log('   4. Run: node setup-webhooks-manual.cjs https://abc123.ngrok.io');
    return;
  }
  
  console.log(`🔗 Setting up webhooks with base URL: ${baseUrl}`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const [botName, config] of Object.entries(botConfigs)) {
    try {
      console.log(`\n🤖 Setting up ${config.name}...`);
      
      // Create bot instance without polling
      const bot = new TelegramBot(config.token, { polling: false });
      
      // Clear any existing webhook first
      await bot.deleteWebHook();
      console.log(`   ✅ Cleared existing webhook`);
      
      // Set new webhook
      const webhookUrl = `${baseUrl}/webhook/${botName}`;
      await bot.setWebHook(webhookUrl, {
        secret_token: 'pickntrust_webhook_secret_2025'
      });
      
      console.log(`   ✅ Webhook set: ${webhookUrl}`);
      
      // Verify webhook
      const webhookInfo = await bot.getWebHookInfo();
      if (webhookInfo.url === webhookUrl) {
        console.log(`   ✅ Webhook verified successfully`);
        successCount++;
      } else {
        console.log(`   ⚠️  Webhook verification failed`);
        errorCount++;
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      errorCount++;
    }
  }
  
  console.log('\n📊 WEBHOOK SETUP RESULTS:');
  console.log(`   ✅ Success: ${successCount} bots`);
  console.log(`   ❌ Errors: ${errorCount} bots`);
  console.log(`   📊 Total: ${Object.keys(botConfigs).length} bots`);
  
  if (successCount > 0) {
    console.log('\n🎉 WEBHOOKS CONFIGURED!');
    console.log('\n📋 Next steps:');
    console.log('   1. Ensure your server is running on the webhook URL');
    console.log('   2. Post product URLs in Telegram channels');
    console.log('   3. Check website pages for new products');
    console.log('   4. Monitor server logs for webhook processing');
    
    console.log('\n🔗 Webhook endpoints:');
    Object.keys(botConfigs).forEach(botName => {
      console.log(`   ${baseUrl}/webhook/${botName}`);
    });
    
  } else {
    console.log('\n❌ NO WEBHOOKS CONFIGURED');
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check if the base URL is accessible from internet');
    console.log('   2. Verify bot tokens are correct');
    console.log('   3. Ensure no firewall blocking the URL');
    console.log('   4. Try with a different public URL service');
  }
}

// Run the setup
setupWebhooks().catch(error => {
  console.error('\n❌ Setup failed:', error.message);
  console.log('\n🔧 Common issues:');
  console.log('   - Invalid or inaccessible webhook URL');
  console.log('   - Bot tokens incorrect or expired');
  console.log('   - Network connectivity problems');
  console.log('   - Telegram API rate limiting');
});