const fs = require('fs');
const path = require('path');

console.log('🤖 Checking Telegram Bot Status...\n');

// Check if telegram-bot.ts exists and is configured
const botFilePath = path.join(__dirname, 'server', 'telegram-bot.ts');

if (!fs.existsSync(botFilePath)) {
  console.error('❌ telegram-bot.ts file not found!');
  process.exit(1);
}

console.log('✅ telegram-bot.ts file exists');

// Read the bot file to check configuration
const botFileContent = fs.readFileSync(botFilePath, 'utf8');

// Check for bot token
const hasToken = botFileContent.includes('BOT_TOKEN') || botFileContent.includes('process.env');
console.log(`🔑 Bot token configuration: ${hasToken ? '✅ Found' : '❌ Missing'}`);

// Check for channel configs
const hasChannelConfigs = botFileContent.includes('CHANNEL_CONFIGS');
console.log(`📺 Channel configs: ${hasChannelConfigs ? '✅ Found' : '❌ Missing'}`);

// Check for message processing
const hasMessageProcessing = botFileContent.includes('processMessage');
console.log(`📝 Message processing: ${hasMessageProcessing ? '✅ Found' : '❌ Missing'}`);

// Check for database functions
const hasDatabaseFunctions = botFileContent.includes('saveToChannelPosts') && botFileContent.includes('saveProductToDatabase');
console.log(`💾 Database functions: ${hasDatabaseFunctions ? '✅ Found' : '❌ Missing'}`);

// Check if bot is being started
const hasStartCommand = botFileContent.includes('bot.startPolling') || botFileContent.includes('bot.launch');
console.log(`🚀 Bot start command: ${hasStartCommand ? '✅ Found' : '❌ Missing'}`);

// Check package.json for bot script
const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const scripts = packageJson.scripts || {};
  
  console.log('\n📦 Available scripts:');
  Object.keys(scripts).forEach(script => {
    if (script.includes('bot') || script.includes('telegram')) {
      console.log(`  - ${script}: ${scripts[script]}`);
    }
  });
  
  // Check if there's a general bot start script
  const hasBotScript = Object.keys(scripts).some(script => 
    script.includes('bot') || scripts[script].includes('telegram-bot')
  );
  console.log(`🎯 Bot script available: ${hasBotScript ? '✅ Yes' : '❌ No'}`);
}

// Check .env file for bot configuration
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasBotToken = envContent.includes('BOT_TOKEN') || envContent.includes('TELEGRAM');
  console.log(`🔐 Environment variables: ${hasBotToken ? '✅ Bot token configured' : '❌ No bot token found'}`);
} else {
  console.log('🔐 Environment variables: ❌ .env file not found');
}

console.log('\n🔍 Recommendations:');
if (!hasToken) {
  console.log('  - Add BOT_TOKEN to your environment variables');
}
if (!hasChannelConfigs) {
  console.log('  - Configure CHANNEL_CONFIGS in telegram-bot.ts');
}
if (!hasDatabaseFunctions) {
  console.log('  - Ensure database functions are properly implemented');
}

console.log('\n💡 To start the bot manually, try:');
console.log('  - node server/telegram-bot.ts');
console.log('  - npm run bot (if script exists)');
console.log('  - ts-node server/telegram-bot.ts');