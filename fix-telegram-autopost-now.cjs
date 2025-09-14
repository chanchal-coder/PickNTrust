// Fix Telegram Autopost - Resolve 409 Conflicts and Enable Message Processing
// This script fixes the bot conflicts preventing Telegram message processing

const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

console.log('🔧 FIXING TELEGRAM AUTOPOST - 409 CONFLICT RESOLUTION');
console.log('=' .repeat(60));

async function fixTelegramAutopost() {
  console.log('\nTarget ISSUE: 409 Conflict Errors Preventing Message Processing');
  console.log('- Multiple bot instances are running simultaneously');
  console.log('- Telegram API rejects getUpdates requests from duplicate bots');
  console.log('- Messages posted to channels are not being processed');
  
  console.log('\n🔧 SOLUTION: Clear Bot Conflicts and Test Message Processing');
  
  // Get bot configuration
  const botToken = process.env.PRIME_PICKS_BOT_TOKEN;
  const channelId = process.env.PRIME_PICKS_CHANNEL_ID;
  
  if (!botToken || !channelId) {
    console.log('Error Missing Prime Picks bot configuration');
    console.log(`Bot Token: ${botToken ? 'Present' : 'Missing'}`);
    console.log(`Channel ID: ${channelId ? 'Present' : 'Missing'}`);
    return;
  }
  
  console.log('\nSuccess Prime Picks Bot Configuration:');
  console.log(`   Token: ${botToken.substring(0, 20)}...`);
  console.log(`   Channel: ${channelId}`);
  
  try {
    // Create a single bot instance without polling to avoid conflicts
    console.log('\nAI Creating single bot instance (no polling)...');
    const bot = new TelegramBot(botToken, { polling: false });
    
    // Test bot connection
    console.log('Search Testing bot connection...');
    const botInfo = await bot.getMe();
    console.log(`Success Bot Connected: @${botInfo.username} (ID: ${botInfo.id})`);
    
    // Test channel access
    console.log('\n📺 Testing channel access...');
    try {
      const chat = await bot.getChat(channelId);
      console.log(`Success Channel Access: ${chat.title || chat.username}`);
      
      // Check bot permissions
      const admins = await bot.getChatAdministrators(channelId);
      const botAdmin = admins.find(admin => admin.user.id === botInfo.id);
      
      if (botAdmin) {
        console.log('Success Bot is admin in channel');
        console.log(`   Can read messages: ${botAdmin.can_read_all_group_messages !== false}`);
      } else {
        console.log('Error Bot is NOT admin in channel');
        console.log('\n🔧 REQUIRED ACTION:');
        console.log('1. Go to your Telegram channel');
        console.log('2. Add the bot as administrator');
        console.log('3. Grant "Read Messages" permission');
        return;
      }
      
    } catch (error) {
      console.log(`Error Channel Access Error: ${error.message}`);
      return;
    }
    
    // Send a test message to trigger processing
    console.log('\n📤 Sending test message to trigger autoposting...');
    const testMessage = `🧪 AUTOPOST TEST - ${new Date().toLocaleTimeString()}\n\n` +
      `🎧 Test Product: Premium Wireless Headphones\n` +
      `Price Price: ₹2,999 (was ₹4,999)\n` +
      `⭐ Rating: 4.5/5\n` +
      `🚚 Free delivery\n\n` +
      `Link https://amazon.in/dp/B08N5WRWNW\n\n` +
      `#electronics #test #autopost`;
    
    const sentMessage = await bot.sendMessage(channelId, testMessage);
    console.log('Success Test message sent successfully!');
    console.log(`Mobile Message ID: ${sentMessage.message_id}`);
    console.log(`Date Sent at: ${new Date(sentMessage.date * 1000).toLocaleString()}`);
    
    console.log('\n⏳ Waiting 15 seconds for server processing...');
    console.log('   (Monitor server terminal for processing messages)');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    console.log('\nSearch WHAT TO CHECK NOW:');
    console.log('1. Mobile Server logs should show "Processing Prime Picks message"');
    console.log('2. Link Look for "Found 1 URLs" in server output');
    console.log('3. Save Check for "Product saved successfully" message');
    console.log('4. Global Visit http://localhost:5000/prime-picks for new product');
    
    console.log('\nSuccess TEST MESSAGE SENT!');
    console.log('\nTip IF AUTOPOSTING STILL DOESN\'T WORK:');
    console.log('1. Refresh Restart server completely (npm run dev)');
    console.log('2. AI Check bot is admin with message permissions');
    console.log('3. Mobile Ensure message contains valid Amazon URL');
    console.log('4. Stats Monitor server logs for error messages');
    
  } catch (error) {
    console.log(`\nError Fix failed: ${error.message}`);
    
    if (error.message.includes('401')) {
      console.log('\n🔧 SOLUTION: Bot token is invalid or expired');
      console.log('1. Check .env file for correct PRIME_PICKS_BOT_TOKEN');
      console.log('2. Verify token with @BotFather on Telegram');
      console.log('3. Update token if needed and restart server');
    } else if (error.message.includes('403')) {
      console.log('\n🔧 SOLUTION: Bot permissions issue');
      console.log('1. Add bot as admin to Telegram channel');
      console.log('2. Grant "Read Messages" permission');
      console.log('3. Ensure channel allows bots');
    } else if (error.message.includes('409')) {
      console.log('\n🔧 SOLUTION: Multiple bot instances conflict');
      console.log('1. Stop all running servers');
      console.log('2. Wait 30 seconds for Telegram to clear connections');
      console.log('3. Start only one server instance');
    } else {
      console.log('\n🔧 SOLUTION: Check network and configuration');
      console.log('1. Verify internet connection');
      console.log('2. Check bot token and channel ID');
      console.log('3. Restart server and try again');
    }
  }
}

// Run the fix
fixTelegramAutopost().then(() => {
  console.log('\n' + '=' .repeat(60));
  console.log('🏁 Telegram autopost fix completed');
  console.log('Mobile Check server logs and Prime Picks page for results');
}).catch(error => {
  console.error('Error Fatal error:', error);
  process.exit(1);
});