console.log('🔍 COMPREHENSIVE BOT ENVIRONMENT VERIFICATION\n');

const fs = require('fs');
const path = require('path');

// Define all bots with their expected configurations
const botConfigs = [
  {
    name: 'prime-picks',
    botFile: 'server/prime-picks-bot.ts',
    envFile: '.env.prime-picks',
    expectedEnvPath: '.env.prime-picks'
  },
  {
    name: 'cue-picks',
    botFile: 'server/cue-picks-bot.ts',
    envFile: '.env.cue-picks',
    expectedEnvPath: '.env.cue-picks'
  },
  {
    name: 'value-picks',
    botFile: 'server/value-picks-bot.ts',
    envFile: '.env.value-picks',
    expectedEnvPath: '.env.value-picks'
  },
  {
    name: 'click-picks',
    botFile: 'server/click-picks-bot.ts',
    envFile: '.env.click-picks',
    expectedEnvPath: '.env.click-picks'
  },
  {
    name: 'global-picks',
    botFile: 'server/global-picks-bot.ts',
    envFile: '.env.global-picks',
    expectedEnvPath: '.env.global-picks'
  },
  {
    name: 'travel-picks',
    botFile: 'server/travel-picks-bot.ts',
    envFile: '.env.travel-picks',
    expectedEnvPath: '.env.travel-picks'
  },
  {
    name: 'lootbox',
    botFile: 'server/loot-box-bot.ts',
    envFile: '.env.loot-box',
    expectedEnvPath: '.env.loot-box'
  },
  {
    name: 'dealshub',
    botFile: 'server/dealshub-bot.ts',
    envFile: '.env.deals-hub',
    expectedEnvPath: '.env.deals-hub'
  }
];

let allCorrect = true;

botConfigs.forEach(config => {
  console.log(`\n🤖 CHECKING ${config.name.toUpperCase()}:`);
  console.log('=' .repeat(50));
  
  // Check if .env file exists
  const envPath = path.join(process.cwd(), config.envFile);
  if (!fs.existsSync(envPath)) {
    console.log(`❌ ENV FILE: ${config.envFile} NOT FOUND`);
    allCorrect = false;
    return;
  }
  
  // Read .env file
  const envContent = fs.readFileSync(envPath, 'utf8');
  const token = envContent.match(/TELEGRAM_BOT_TOKEN=(.+)/);
  const channelId = envContent.match(/CHANNEL_ID=(.+)/);
  const channelName = envContent.match(/CHANNEL_NAME=(.+)/);
  
  console.log(`✅ ENV FILE: ${config.envFile} exists`);
  console.log(`   Token: ${token ? token[1].substring(0, 20) + '...' : '❌ MISSING'}`);
  console.log(`   Channel ID: ${channelId ? channelId[1] : '❌ MISSING'}`);
  console.log(`   Channel Name: ${channelName ? channelName[1] : '❌ MISSING'}`);
  
  // Check if bot file exists
  const botPath = path.join(process.cwd(), config.botFile);
  if (!fs.existsSync(botPath)) {
    console.log(`❌ BOT FILE: ${config.botFile} NOT FOUND`);
    allCorrect = false;
    return;
  }
  
  // Read bot file and check configuration
  const botContent = fs.readFileSync(botPath, 'utf8');
  
  // Check if bot loads correct .env file
  const envPathPattern = new RegExp(`\\.env\\.${config.name === 'lootbox' ? 'loot-box' : config.name === 'dealshub' ? 'deals-hub' : config.name}`);
  const loadsCorrectEnv = envPathPattern.test(botContent);
  
  // Check if bot uses standard environment variable names
  const usesStandardToken = /process\.env\.TELEGRAM_BOT_TOKEN[^_]/.test(botContent);
  const usesStandardChannelId = /process\.env\.CHANNEL_ID[^_]/.test(botContent);
  
  console.log(`\n📁 BOT FILE ANALYSIS:`);
  console.log(`   File: ${config.botFile}`);
  console.log(`   Loads correct .env: ${loadsCorrectEnv ? '✅ YES' : '❌ NO'}`);
  console.log(`   Uses TELEGRAM_BOT_TOKEN: ${usesStandardToken ? '✅ YES' : '❌ NO'}`);
  console.log(`   Uses CHANNEL_ID: ${usesStandardChannelId ? '✅ YES' : '❌ NO'}`);
  
  // Check for problematic patterns
  const hasOldTokenPattern = /TELEGRAM_BOT_TOKEN_[A-Z_]+/.test(botContent);
  const hasOldChannelPattern = /TELEGRAM_CHANNEL_ID_[A-Z_]+/.test(botContent);
  
  if (hasOldTokenPattern) {
    console.log(`   ⚠️  WARNING: Found old token pattern TELEGRAM_BOT_TOKEN_*`);
    allCorrect = false;
  }
  
  if (hasOldChannelPattern) {
    console.log(`   ⚠️  WARNING: Found old channel pattern TELEGRAM_CHANNEL_ID_*`);
    allCorrect = false;
  }
  
  // Overall status for this bot
  const botStatus = loadsCorrectEnv && usesStandardToken && usesStandardChannelId && !hasOldTokenPattern && !hasOldChannelPattern;
  console.log(`\n🎯 STATUS: ${botStatus ? '✅ CORRECT' : '❌ NEEDS FIX'}`);
  
  if (!botStatus) {
    allCorrect = false;
  }
});

console.log('\n' + '=' .repeat(80));
console.log('📋 FINAL SUMMARY:');
console.log('=' .repeat(80));

if (allCorrect) {
  console.log('🎉 ALL BOTS CONFIGURED CORRECTLY!');
  console.log('✅ Each bot loads its own .env file');
  console.log('✅ Each bot uses standard environment variable names');
  console.log('✅ No conflicting or old patterns found');
} else {
  console.log('⚠️  ISSUES FOUND - SOME BOTS NEED FIXING');
  console.log('\n🔧 REQUIRED FIXES:');
  console.log('1. Each bot should load its own .env file:');
  console.log('   - dotenv.config({ path: path.join(process.cwd(), \'.env.bot-name\') });');
  console.log('2. Each bot should use standard variable names:');
  console.log('   - process.env.TELEGRAM_BOT_TOKEN (not TELEGRAM_BOT_TOKEN_BOTNAME)');
  console.log('   - process.env.CHANNEL_ID (not TELEGRAM_CHANNEL_ID_BOTNAME)');
  console.log('   - process.env.CHANNEL_NAME, process.env.BOT_USERNAME, etc.');
}

console.log('\n🎯 NEXT STEPS:');
console.log('1. Fix any bots marked as "NEEDS FIX"');
console.log('2. Restart the server after fixes');
console.log('3. Test webhook functionality with real Telegram messages');