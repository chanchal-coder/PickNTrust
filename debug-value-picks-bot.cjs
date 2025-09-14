// Debug Value Picks Bot Initialization
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

console.log('Search DEBUGGING VALUE PICKS BOT INITIALIZATION');
console.log('=' .repeat(60));

// 1. Check environment file
console.log('\n1. Upload Checking .env.value-picks file...');
const envPath = path.join(__dirname, '.env.value-picks');
if (fs.existsSync(envPath)) {
  console.log('Success .env.value-picks file exists');
  dotenv.config({ path: envPath });
  
  console.log('\n📋 Environment variables:');
  console.log('   BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN_VALUE_PICKS ? process.env.TELEGRAM_BOT_TOKEN_VALUE_PICKS.substring(0, 10) + '...' : 'MISSING');
  console.log('   CHANNEL_ID:', process.env.TELEGRAM_CHANNEL_ID_VALUE_PICKS || 'MISSING');
  console.log('   BOT_USERNAME:', process.env.VALUE_PICKS_BOT_USERNAME || 'MISSING');
  console.log('   CHANNEL_NAME:', process.env.VALUE_PICKS_CHANNEL_NAME || 'MISSING');
} else {
  console.log('Error .env.value-picks file not found');
}

// 2. Test bot import
console.log('\n2. AI Testing bot import...');
try {
  console.log('   Importing Value Picks bot module...');
  
  // Import using require (CommonJS)
  const botModule = require('./server/value-picks-bot.ts');
  console.log('Success Bot module imported successfully');
  
  if (botModule.valuePicksBot) {
    console.log('Success valuePicksBot instance found');
    
    // Check bot status
    try {
      const status = botModule.valuePicksBot.getStatus();
      console.log('\nStats Bot Status:');
      console.log('   Initialized:', status.initialized);
      console.log('   Channel ID:', status.channelId);
      console.log('   Target Page:', status.targetPage);
      console.log('   Features:', status.features);
    } catch (statusError) {
      console.log('Error Error getting bot status:', statusError.message);
    }
    
    // Try manual initialization
    console.log('\n3. Launch Testing manual initialization...');
    botModule.valuePicksBot.initialize()
      .then(() => {
        console.log('Success Manual initialization successful!');
        
        // Check status after initialization
        const newStatus = botModule.valuePicksBot.getStatus();
        console.log('\nStats Updated Bot Status:');
        console.log('   Initialized:', newStatus.initialized);
        console.log('   Channel ID:', newStatus.channelId);
        console.log('   Target Page:', newStatus.targetPage);
        
        console.log('\nCelebration Value Picks bot is working!');
        console.log('\n🔧 SOLUTION: The bot needs to be manually initialized or there\'s an issue with auto-initialization.');
        
        process.exit(0);
      })
      .catch((initError) => {
        console.log('Error Manual initialization failed:', initError.message);
        console.log('\n🔧 ISSUE FOUND: Bot initialization is failing');
        console.log('   Error details:', initError);
        
        if (initError.message.includes('401')) {
          console.log('\nTip LIKELY CAUSE: Invalid bot token');
          console.log('   - Check TELEGRAM_BOT_TOKEN_VALUE_PICKS in .env.value-picks');
          console.log('   - Verify the token is correct and active');
        } else if (initError.message.includes('network') || initError.message.includes('ENOTFOUND')) {
          console.log('\nTip LIKELY CAUSE: Network connectivity issue');
          console.log('   - Check internet connection');
          console.log('   - Telegram API might be blocked');
        } else {
          console.log('\nTip LIKELY CAUSE: Configuration or code issue');
          console.log('   - Check bot configuration');
          console.log('   - Verify channel permissions');
        }
        
        process.exit(1);
      });
      
  } else {
    console.log('Error valuePicksBot instance not found in module');
    console.log('   Available exports:', Object.keys(botModule));
  }
  
} catch (importError) {
  console.log('Error Bot import failed:', importError.message);
  console.log('\n🔧 ISSUE: Cannot import Value Picks bot module');
  console.log('   Error details:', importError);
  
  if (importError.message.includes('Cannot find module')) {
    console.log('\nTip LIKELY CAUSE: File path issue');
    console.log('   - Check if server/value-picks-bot.ts exists');
    console.log('   - Verify file permissions');
  } else if (importError.message.includes('SyntaxError')) {
    console.log('\nTip LIKELY CAUSE: Syntax error in bot file');
    console.log('   - Check TypeScript compilation');
    console.log('   - Look for syntax errors in value-picks-bot.ts');
  }
  
  process.exit(1);
}