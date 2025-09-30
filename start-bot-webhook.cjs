const TelegramBot = require('node-telegram-bot-api');
const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

// Database setup
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

// Bot configuration
const BOT_TOKEN = process.env.MASTER_BOT_TOKEN;
if (!BOT_TOKEN) {
    console.error('❌ MASTER_BOT_TOKEN not found in environment variables');
    process.exit(1);
}

// Channel IDs from environment
const CHANNEL_IDS = {
    'Prime Picks': process.env.PRIME_PICKS_CHANNEL_ID || '-1002955338551',
    'Cue Links': process.env.CUE_LINKS_CHANNEL_ID || '-1002982344997', 
    'Value Picks': process.env.VALUE_PICKS_CHANNEL_ID || '-1003017626269',
    'Click Picks': process.env.CLICK_PICKS_CHANNEL_ID || '-1002981205504',
    'Global Picks': process.env.GLOBAL_PICKS_CHANNEL_ID || '-1002902496654',
    'Deals Hub': process.env.DEALS_HUB_CHANNEL_ID || '-1003029983162',
    'Loot Box': process.env.LOOT_BOX_CHANNEL_ID || '-1002991047787'
};

console.log('🚀 Starting Telegram Bot with Webhook Mode...');

// Create bot with webhook mode (no polling)
const bot = new TelegramBot(BOT_TOKEN, { polling: false });

// Set webhook URL (using localhost for development)
const WEBHOOK_URL = 'http://localhost:5000/webhook';

async function setupWebhook() {
    try {
        // Delete any existing webhook first
        await bot.deleteWebHook();
        console.log('🧹 Cleared existing webhook');
        
        // Set new webhook
        await bot.setWebHook(WEBHOOK_URL);
        console.log(`🔗 Webhook set to: ${WEBHOOK_URL}`);
        
        // Verify webhook
        const webhookInfo = await bot.getWebHookInfo();
        console.log('✅ Webhook info:', webhookInfo);
        
    } catch (error) {
        console.error('❌ Webhook setup failed:', error.message);
        // Fall back to manual message processing
        console.log('🔄 Falling back to manual message processing...');
        startManualProcessing();
    }
}

// Manual message processing as fallback
function startManualProcessing() {
    console.log('📱 Starting manual message processing...');
    
    // Simulate message processing every 30 seconds
    setInterval(async () => {
        try {
            // Check for new messages in database
        const recentMessages = db.prepare(`
            SELECT * FROM channel_posts 
            WHERE created_at > ?
            AND is_processed = 0
            ORDER BY created_at DESC
        `).all(Date.now() - 60000);
            
            if (recentMessages.length > 0) {
                console.log(`📨 Found ${recentMessages.length} new messages to process`);
                
                for (const message of recentMessages) {
                    await processMessage(message);
                }
            }
        } catch (error) {
            console.error('❌ Manual processing error:', error.message);
        }
    }, 30000);
}

async function processMessage(messageData) {
    try {
        console.log(`🔄 Processing message: ${messageData.original_text?.substring(0, 50)}...`);
        
        // Process URLs for affiliate conversion
        let processedText = messageData.original_text || '';
        let affiliateUrls = [];
        
        // Simple URL detection and processing
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const urls = processedText.match(urlRegex) || [];
        
        for (const url of urls) {
            // Add affiliate processing logic here
            affiliateUrls.push(url);
        }
        
        // Create unified content
        const unifiedContent = {
            title: `Product from Channel`,
            content: processedText,
            source_platform: 'telegram',
            content_type: 'product',
            page_type: 'product',
            category: 'general',
            source_type: 'channel',
            status: 'active',
            visibility: 'public'
        };
        
        // Insert into unified_content
        const insertUnified = db.prepare(`
            INSERT INTO unified_content (
                title, content, source_platform, content_type, 
                page_type, category, source_type, status, visibility
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        const result = insertUnified.run(
            unifiedContent.title,
            unifiedContent.content,
            unifiedContent.source_platform,
            unifiedContent.content_type,
            unifiedContent.page_type,
            unifiedContent.category,
            unifiedContent.source_type,
            unifiedContent.status,
            unifiedContent.visibility
        );
        
        // Mark message as processed
        const updateProcessed = db.prepare(`
            UPDATE channel_posts SET is_processed = 1, updated_at = ? WHERE id = ?
        `);
        updateProcessed.run(Date.now(), messageData.id);
        
        console.log(`✅ Message processed and added to unified_content (ID: ${result.lastInsertRowid})`);
        
    } catch (error) {
        console.error('❌ Error processing message:', error.message);
    }
}

// Handle webhook messages (if webhook works)
bot.on('channel_post', async (msg) => {
    try {
        const channelId = msg.chat.id.toString();
        const channelName = Object.keys(CHANNEL_IDS).find(name => CHANNEL_IDS[name] === channelId);
        
        if (!channelName) {
            console.log(`⚠️ Message from unmonitored channel: ${channelId}`);
            return;
        }
        
        console.log(`📨 New message from ${channelName}: ${msg.text?.substring(0, 50)}...`);
        
        // Save to database
        const insertMessage = db.prepare(`
            INSERT INTO channel_posts (
                message_id, channel_id, original_text, 
                created_at, updated_at, is_processed
            ) VALUES (?, ?, ?, ?, ?, 0)
        `);
        
        const result = insertMessage.run(
            msg.message_id,
            channelId,
            msg.text || msg.caption || '',
            Date.now(),
            Date.now()
        );
        
        console.log(`💾 Message saved to database (ID: ${result.lastInsertRowid})`);
        
        // Process the message
        const messageData = {
            id: result.lastInsertRowid,
            message_id: msg.message_id,
            channel_id: channelId,
            original_text: msg.text || msg.caption || ''
        };
        
        await processMessage(messageData);
        
    } catch (error) {
        console.error('❌ Error handling channel post:', error.message);
    }
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down bot...');
    try {
        await bot.deleteWebHook();
        console.log('🧹 Webhook cleared');
    } catch (error) {
        console.log('⚠️ Error clearing webhook:', error.message);
    }
    db.close();
    console.log('✅ Database closed');
    process.exit(0);
});

// Start the bot
console.log('🤖 Bot created with webhook mode');
console.log('📺 Monitoring channels:', Object.keys(CHANNEL_IDS).join(', '));

// Setup webhook
setupWebhook();

console.log('✅ Bot is now running with webhook/manual processing...');
console.log('💡 Messages will be processed automatically');
console.log('🛑 Press Ctrl+C to stop the bot');

// Keep the process alive
setInterval(() => {
    const count = db.prepare('SELECT COUNT(*) as count FROM channel_posts WHERE createdAt > datetime("now", "-1 minute")').get();
    if (count.count > 0) {
        console.log(`📊 ${count.count} new entries in the last minute`);
    }
}, 60000);