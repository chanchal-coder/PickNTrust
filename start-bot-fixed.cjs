const TelegramBot = require('node-telegram-bot-api');
const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

// Bot configuration from environment
const BOT_TOKEN = process.env.MASTER_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('❌ MASTER_BOT_TOKEN not found in environment variables');
  process.exit(1);
}

// Database setup
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

// Channel configurations with actual IDs from .env
const CHANNELS = {
  'Prime Picks': process.env.PRIME_PICKS_CHANNEL_ID || '-1002955338551',
  'Cue Links': process.env.CUELINKS_CHANNEL_ID || '-1002982344997', 
  'Value Picks': process.env.VALUE_PICKS_CHANNEL_ID || '-1003017626269',
  'Click Picks': process.env.CLICK_PICKS_CHANNEL_ID || '-1002981205504',
  'Global Picks': process.env.GLOBAL_PICKS_CHANNEL_ID || '-1002902496654',
  'Deals Hub': process.env.DEALS_HUB_CHANNEL_ID || '-1003029983162',
  'Loot Box': process.env.LOOT_BOX_CHANNEL_ID || '-1002991047787'
};

console.log('🚀 Starting Telegram Bot Manually for Testing...');

// Create bot instance
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log('\n🤖 Bot created with polling enabled');
console.log('📺 Monitoring channels:', Object.keys(CHANNELS).join(', '));

// Message handler
bot.on('message', (msg) => {
  try {
    const chatId = msg.chat.id.toString();
    const messageId = msg.message_id;
    const text = msg.text || msg.caption || '';
    
    // Check if message is from a monitored channel
    const channelName = Object.keys(CHANNELS).find(name => CHANNELS[name] === chatId);
    
    if (!channelName) {
      console.log(`📝 Message from unmonitored chat: ${chatId}`);
      return;
    }
    
    console.log(`\n📨 NEW MESSAGE from ${channelName}:`);
    console.log(`   Chat ID: ${chatId}`);
    console.log(`   Message ID: ${messageId}`);
    console.log(`   Text: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
    
    // Save to database with correct camelCase columns
    const insertMessage = db.prepare(`
      INSERT INTO channel_posts (channelId, messageId, originalText, processedText, isProcessed, isPosted, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const now = new Date().toISOString();
    const result = insertMessage.run(
      chatId,
      messageId,
      text,
      null, // processedText - will be filled during processing
      0,    // isProcessed - false initially
      0,    // isPosted - false initially
      now,  // createdAt
      now   // updatedAt
    );
    
    console.log(`✅ Message saved to database with ID: ${result.lastInsertRowid}`);
    
    // Process the message (simulate affiliate link processing)
    setTimeout(() => {
      try {
        console.log(`🔄 Processing message ${result.lastInsertRowid}...`);
        
        // Simple processing - look for URLs and convert them
        let processedText = text;
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const urls = text.match(urlRegex) || [];
        
        if (urls.length > 0) {
          console.log(`🔗 Found ${urls.length} URLs to process`);
          urls.forEach(url => {
            // Simple affiliate conversion (replace with your actual logic)
            const affiliateUrl = url.includes('amazon') ? 
              url + '?tag=youraffid' : 
              `https://youraffiliatelink.com/redirect?url=${encodeURIComponent(url)}`;
            processedText = processedText.replace(url, affiliateUrl);
          });
        }
        
        // Update as processed
        const updateProcessed = db.prepare(`
          UPDATE channel_posts 
          SET processedText = ?, isProcessed = 1, updatedAt = ?
          WHERE id = ?
        `);
        
        updateProcessed.run(processedText, new Date().toISOString(), result.lastInsertRowid);
        console.log(`✅ Message ${result.lastInsertRowid} marked as processed`);
        
        // Create unified content entry
        const insertContent = db.prepare(`
          INSERT INTO unified_content (
            title, description, price, image_url, affiliate_url, 
            category, status, source_channel, source_message_id, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        // Extract title from message (first line or first 50 chars)
        const title = text.split('\n')[0].substring(0, 50) || 'New Deal Alert';
        const description = text.substring(0, 200);
        
        // Extract price if found
        const priceMatch = text.match(/\$[\d,]+(?:\.\d{2})?|\₹[\d,]+(?:\.\d{2})?|£[\d,]+(?:\.\d{2})?/);
        const price = priceMatch ? priceMatch[0] : 'Check Link';
        
        // Extract image URL if found
        const imageMatch = text.match(/(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp))/i);
        const imageUrl = imageMatch ? imageMatch[0] : null;
        
        // Get affiliate URL (first processed URL or original URL)
        const affiliateUrl = urls.length > 0 ? 
          processedText.match(/(https?:\/\/[^\s]+)/)?.[0] : null;
        
        const contentResult = insertContent.run(
          title,
          description,
          price,
          imageUrl,
          affiliateUrl,
          'deals', // category
          'published', // status
          chatId, // source_channel
          messageId, // source_message_id
          new Date().toISOString()
        );
        
        console.log(`✅ Unified content created with ID: ${contentResult.lastInsertRowid}`);
        
        // Mark as posted
        const markPosted = db.prepare(`
          UPDATE channel_posts 
          SET isPosted = 1, updatedAt = ?
          WHERE id = ?
        `);
        
        markPosted.run(new Date().toISOString(), result.lastInsertRowid);
        console.log(`✅ Message ${result.lastInsertRowid} marked as POSTED`);
        
        console.log(`🎉 COMPLETE FLOW SUCCESS: Message → Database → Website`);
        
      } catch (processError) {
        console.error('❌ Error processing message:', processError.message);
      }
    }, 2000); // Process after 2 seconds
    
  } catch (error) {
    console.error('❌ Error handling message:', error.message);
    console.error('Stack:', error.stack);
  }
});

// Error handling
bot.on('error', (error) => {
  console.error('❌ Bot error:', error.message);
});

bot.on('polling_error', (error) => {
  console.error('❌ Polling error:', error.message);
});

console.log('\n✅ Bot is now running and listening for messages...');
console.log('💡 Send a message to any monitored channel to test');
console.log('🛑 Press Ctrl+C to stop the bot');

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down bot...');
  bot.stopPolling();
  db.close();
  process.exit(0);
});

// Keep the process alive and show activity
setInterval(() => {
  // Check database for recent entries every 30 seconds
  try {
    const recentCount = db.prepare(`
      SELECT COUNT(*) as count 
      FROM channel_posts 
      WHERE createdAt >= datetime('now', '-1 minute')
    `).get();
    
    if (recentCount.count > 0) {
      console.log(`📊 ${recentCount.count} new entries in the last minute`);
    }
  } catch (error) {
    // Ignore errors in monitoring query
  }
}, 30000);