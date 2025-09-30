const TelegramBot = require('node-telegram-bot-api');
const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

console.log('🚀 Starting Telegram Bot Manually for Testing...\n');

// Get bot token from environment
const BOT_TOKEN = process.env.MASTER_BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('❌ MASTER_BOT_TOKEN not found in environment variables');
  process.exit(1);
}

// Connect to database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

// Channel configurations
const CHANNEL_CONFIGS = {
  '-1002955338551': { pageName: 'prime-picks', displayName: 'Prime Picks' },
  '-1002982344997': { pageName: 'cue-picks', displayName: 'Cue Links' },
  '-1003017626269': { pageName: 'value-picks', displayName: 'Value Picks' },
  '-1002981205504': { pageName: 'click-picks', displayName: 'Click Picks' },
  '-1002902496654': { pageName: 'global-picks', displayName: 'Global Picks' },
  '-1003029983162': { pageName: 'deals-hub', displayName: 'Deals Hub' },
  '-1002991047787': { pageName: 'loot-box', displayName: 'Loot Box' }
};

// Create bot instance with polling
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log('🤖 Bot created with polling enabled');
console.log('📺 Monitoring channels:', Object.values(CHANNEL_CONFIGS).map(c => c.displayName).join(', '));

// Simple message processing function for testing
function processTestMessage(msg) {
  const chatId = msg.chat.id.toString();
  const channelConfig = CHANNEL_CONFIGS[chatId];
  
  if (!channelConfig) {
    console.log(`⚠️  Message from unmonitored chat: ${msg.chat.title || 'Unknown'} (${chatId})`);
    return;
  }
  
  console.log(`📨 Processing message from ${channelConfig.displayName}:`);
  console.log(`   Text: ${msg.text?.substring(0, 100)}...`);
  
  // Save to channel_posts for testing
  try {
    const insertResult = db.prepare(`
      INSERT INTO channel_posts (
        channel_id, channel_name, message_id, original_text, 
        is_processed, telegram_timestamp, created_at
      ) VALUES (?, ?, ?, ?, 0, ?, datetime('now'))
    `).run(
      chatId,
      channelConfig.displayName,
      msg.message_id,
      msg.text || '[No text content]',
      msg.date
    );
    
    console.log(`✅ Saved to channel_posts with ID: ${insertResult.lastInsertRowid}`);
    
    // For testing, also create a simple unified_content entry
    const unifiedResult = db.prepare(`
      INSERT INTO unified_content (
        title, description, content_type, page_type, source_type, source_id,
        status, is_active, created_at, updated_at
      ) VALUES (?, ?, 'product', ?, 'telegram', ?, 'published', 1, datetime('now'), datetime('now'))
    `).run(
      `Test Message from ${channelConfig.displayName}`,
      msg.text?.substring(0, 200) || 'Test message content',
      channelConfig.pageName,
      insertResult.lastInsertRowid
    );
    
    console.log(`✅ Created unified_content entry with ID: ${unifiedResult.lastInsertRowid}`);
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  }
}

// Handle channel posts
bot.on('channel_post', (msg) => {
  console.log('\n📺 Received channel post:', {
    chatId: msg.chat.id,
    chatTitle: msg.chat.title,
    messageId: msg.message_id,
    hasText: !!msg.text,
    hasPhoto: !!msg.photo
  });
  
  processTestMessage(msg);
});

// Handle regular messages (for testing in private chats)
bot.on('message', (msg) => {
  console.log('\n💬 Received message:', {
    chatId: msg.chat.id,
    chatTitle: msg.chat.title || 'Private Chat',
    messageId: msg.message_id,
    hasText: !!msg.text,
    hasPhoto: !!msg.photo
  });
  
  // Only process if it's from a monitored channel or for testing
  if (CHANNEL_CONFIGS[msg.chat.id.toString()] || msg.chat.type === 'private') {
    processTestMessage(msg);
  }
});

// Error handling
bot.on('error', (error) => {
  console.error('❌ Telegram bot error:', error);
});

bot.on('polling_error', (error) => {
  console.error('❌ Polling error:', error);
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

// Keep the process alive
setInterval(() => {
  // Check database for recent entries every 30 seconds
  try {
    const oneMinuteAgo = Math.floor((Date.now() - (60 * 1000)) / 1000);
    const recentCount = db.prepare(`
      SELECT COUNT(*) as count 
      FROM unified_content 
      WHERE created_at >= ?
    `).get(oneMinuteAgo);
    
    if (recentCount && recentCount.count > 0) {
      console.log(`📊 ${recentCount.count} new entries in the last minute`);
    }
  } catch (error) {
    console.log('📊 Database check skipped:', error.message);
  }
}, 30000);