console.log('🔍 CHECKING ALL BOT ENVIRONMENT CONFIGURATIONS\n');

const fs = require('fs');
const path = require('path');

const bots = [
  { name: 'prime-picks', envFile: '.env.prime-picks' },
  { name: 'cue-picks', envFile: '.env.cue-picks' },
  { name: 'value-picks', envFile: '.env.value-picks' },
  { name: 'click-picks', envFile: '.env.click-picks' },
  { name: 'global-picks', envFile: '.env.global-picks' },
  { name: 'travel-picks', envFile: '.env.travel-picks' },
  { name: 'lootbox', envFile: '.env.loot-box' },
  { name: 'dealshub', envFile: '.env.deals-hub' }
];

bots.forEach(bot => {
  const envPath = path.join(process.cwd(), bot.envFile);
  
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const token = content.match(/TELEGRAM_BOT_TOKEN=(.+)/);
    const channelId = content.match(/CHANNEL_ID=(.+)/);
    const channelName = content.match(/CHANNEL_NAME=(.+)/);
    const botUsername = content.match(/BOT_USERNAME=(.+)/);
    const affiliateNetwork = content.match(/AFFILIATE_NETWORK=(.+)/);
    
    console.log(`✅ ${bot.name.toUpperCase()}:`);
    console.log(`   File: ${bot.envFile}`);
    console.log(`   Token: ${token ? token[1].substring(0, 20) + '...' : '❌ MISSING'}`);
    console.log(`   Channel ID: ${channelId ? channelId[1] : '❌ MISSING'}`);
    console.log(`   Channel Name: ${channelName ? channelName[1] : '❌ MISSING'}`);
    console.log(`   Bot Username: ${botUsername ? botUsername[1] : '❌ MISSING'}`);
    console.log(`   Affiliate Network: ${affiliateNetwork ? affiliateNetwork[1] : '❌ MISSING'}`);
    console.log('');
  } else {
    console.log(`❌ ${bot.name.toUpperCase()}: ${bot.envFile} NOT FOUND\n`);
  }
});

console.log('\n🔧 SUMMARY:');
console.log('All bots should have their individual .env files with correct credentials.');
console.log('Each bot file should load its own .env file and use standard variable names:');
console.log('- TELEGRAM_BOT_TOKEN (not TELEGRAM_BOT_TOKEN_BOTNAME)');
console.log('- CHANNEL_ID (not TELEGRAM_CHANNEL_ID_BOTNAME)');
console.log('- CHANNEL_NAME, BOT_USERNAME, etc.');