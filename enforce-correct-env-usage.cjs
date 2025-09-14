console.log('🔒 ENFORCING CORRECT ENVIRONMENT FILE USAGE FOR ALL BOTS\n');

const fs = require('fs');
const path = require('path');

// Define strict bot-to-env mapping that should NEVER change
const STRICT_BOT_ENV_MAPPING = {
  'prime-picks-bot.ts': {
    requiredEnvFile: '.env.prime-picks',
    botName: 'Prime Picks',
    expectedToken: '8260140807:AAEy6I9xxtYbvddJKDNfRwmcIWDX1Y9pck4'
  },
  'cue-picks-bot.ts': {
    requiredEnvFile: '.env.cue-picks',
    botName: 'Cue Picks',
    expectedToken: '8352384812:AAE-bwA_3zIB8ZnPG4ZmyEbREBlfijjE32I'
  },
  'value-picks-bot.ts': {
    requiredEnvFile: '.env.value-picks',
    botName: 'Value Picks',
    expectedToken: '8293858742:AAGDnH8aN5e-JOvhLQNCR_rWEOicOPji41A'
  },
  'click-picks-bot.ts': {
    requiredEnvFile: '.env.click-picks',
    botName: 'Click Picks',
    expectedToken: '8077836519:AAGoSql-Fz9lF_90AKxobprROub89VVKePg'
  },
  'global-picks-bot.ts': {
    requiredEnvFile: '.env.global-picks',
    botName: 'Global Picks',
    expectedToken: '8341930611:AAHq7sS4Sk6HKoyfUGYwYWHwXZrGOgeWx-E'
  },
  'travel-picks-bot.ts': {
    requiredEnvFile: '.env.travel-picks',
    botName: 'Travel Picks',
    expectedToken: '7998139680:AAGVKECApmHNi4LMp2wR3UdVFfYgkT1HwZo'
  },
  'loot-box-bot.ts': {
    requiredEnvFile: '.env.loot-box',
    botName: 'Loot Box',
    expectedToken: '8141266952:AAEosdwI8BkIpSk0f1AVzn8l4iwRnS8HXFQ'
  },
  'dealshub-bot.ts': {
    requiredEnvFile: '.env.deals-hub',
    botName: 'DealsHub',
    expectedToken: '8292764619:AAEkfPXIsgNh1JC3n2p6VYo27V-EHepzmBo'
  }
};

// Generate enforcement code for each bot
function generateEnforcementCode(botFile, config) {
  return `
// 🔒 ENVIRONMENT ENFORCEMENT - DO NOT MODIFY
// This bot MUST ONLY use ${config.requiredEnvFile}
const REQUIRED_ENV_FILE = '${config.requiredEnvFile}';
const BOT_NAME = '${config.botName}';
const EXPECTED_TOKEN_PREFIX = '${config.expectedToken.substring(0, 10)}';

// Validate environment file before loading
function validateAndLoadEnvironment() {
  const requiredEnvPath = path.join(process.cwd(), REQUIRED_ENV_FILE);
  
  // Check if required .env file exists
  if (!fs.existsSync(requiredEnvPath)) {
    console.error(\`❌ CRITICAL ERROR: \${BOT_NAME} bot requires \${REQUIRED_ENV_FILE} but file not found!\`);
    console.error(\`🔒 Bot will NOT start without correct environment file.\`);
    process.exit(1);
  }
  
  // Load the CORRECT environment file
  dotenv.config({ path: requiredEnvPath });
  
  // Validate that we loaded the correct token
  const loadedToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!loadedToken || !loadedToken.startsWith(EXPECTED_TOKEN_PREFIX)) {
    console.error(\`❌ CRITICAL ERROR: \${BOT_NAME} bot loaded wrong credentials!\`);
    console.error(\`🔒 Expected token starting with: \${EXPECTED_TOKEN_PREFIX}\`);
    console.error(\`🔒 Loaded token starting with: \${loadedToken ? loadedToken.substring(0, 10) : 'NONE'}\`);
    console.error(\`🔒 Bot will NOT start with incorrect credentials.\`);
    process.exit(1);
  }
  
  console.log(\`✅ \${BOT_NAME} bot: Correct environment file loaded (\${REQUIRED_ENV_FILE})\`);
  console.log(\`🔒 Token validation: PASSED (\${EXPECTED_TOKEN_PREFIX}...)\`);
}

// ENFORCE: Call validation before any other code
validateAndLoadEnvironment();
`;
}

let allBotsProcessed = true;
let updatedBots = [];

Object.keys(STRICT_BOT_ENV_MAPPING).forEach(botFile => {
  const config = STRICT_BOT_ENV_MAPPING[botFile];
  const botPath = path.join(process.cwd(), 'server', botFile);
  
  console.log(`\n🤖 PROCESSING ${config.botName.toUpperCase()}:`);
  console.log('=' .repeat(50));
  
  if (!fs.existsSync(botPath)) {
    console.log(`❌ Bot file not found: ${botFile}`);
    allBotsProcessed = false;
    return;
  }
  
  let botContent = fs.readFileSync(botPath, 'utf8');
  
  // Check if enforcement code already exists
  if (botContent.includes('ENVIRONMENT ENFORCEMENT')) {
    console.log(`✅ Environment enforcement already exists`);
    
    // Verify it's using the correct env file
    const envFilePattern = new RegExp(`\\.env\\.(${config.requiredEnvFile.replace('.env.', '')})`);
    if (envFilePattern.test(botContent)) {
      console.log(`✅ Using correct environment file: ${config.requiredEnvFile}`);
    } else {
      console.log(`⚠️  May be using wrong environment file - needs verification`);
    }
    return;
  }
  
  // Find the imports section to add enforcement code
  const importEndIndex = botContent.lastIndexOf('import');
  if (importEndIndex === -1) {
    console.log(`❌ Could not find import section in ${botFile}`);
    allBotsProcessed = false;
    return;
  }
  
  // Find the end of the last import line
  const nextLineIndex = botContent.indexOf('\n', importEndIndex);
  if (nextLineIndex === -1) {
    console.log(`❌ Could not find insertion point in ${botFile}`);
    allBotsProcessed = false;
    return;
  }
  
  // Generate and insert enforcement code
  const enforcementCode = generateEnforcementCode(botFile, config);
  const updatedContent = botContent.slice(0, nextLineIndex + 1) + enforcementCode + botContent.slice(nextLineIndex + 1);
  
  // Write the updated content
  fs.writeFileSync(botPath, updatedContent, 'utf8');
  
  console.log(`✅ Environment enforcement added to ${config.botName}`);
  console.log(`🔒 Bot locked to: ${config.requiredEnvFile}`);
  console.log(`🔒 Token validation: ${config.expectedToken.substring(0, 10)}...`);
  
  updatedBots.push(config.botName);
});

console.log('\n' + '=' .repeat(80));
console.log('📋 ENVIRONMENT ENFORCEMENT SUMMARY:');
console.log('=' .repeat(80));

if (allBotsProcessed) {
  console.log('🎉 ALL BOTS PROCESSED SUCCESSFULLY!');
  
  if (updatedBots.length > 0) {
    console.log(`\n🔒 UPDATED BOTS (${updatedBots.length}):`);
    updatedBots.forEach(botName => {
      console.log(`   ✅ ${botName} - Environment enforcement added`);
    });
  }
  
  console.log('\n🛡️  SECURITY FEATURES IMPLEMENTED:');
  console.log('   ✅ Each bot validates its required .env file exists');
  console.log('   ✅ Each bot validates it loaded the correct token');
  console.log('   ✅ Bots will NOT start with wrong environment files');
  console.log('   ✅ Bots will NOT start with wrong credentials');
  console.log('   ✅ Clear error messages for debugging');
  console.log('   ✅ Process exits prevent wrong configurations');
  
  console.log('\n🔒 STRICT ENVIRONMENT MAPPING ENFORCED:');
  Object.keys(STRICT_BOT_ENV_MAPPING).forEach(botFile => {
    const config = STRICT_BOT_ENV_MAPPING[botFile];
    console.log(`   ${config.botName}: ${config.requiredEnvFile} (${config.expectedToken.substring(0, 10)}...)`);
  });
  
} else {
  console.log('⚠️  SOME BOTS COULD NOT BE PROCESSED');
  console.log('Please check the errors above and fix any issues.');
}

console.log('\n🎯 NEXT STEPS:');
console.log('1. Restart the server to apply environment enforcement');
console.log('2. Each bot will validate its environment on startup');
console.log('3. Any bot with wrong environment will fail to start');
console.log('4. Check server logs for validation messages');