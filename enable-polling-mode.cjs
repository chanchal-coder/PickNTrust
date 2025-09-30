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

// Channel IDs mapping
const CHANNEL_IDS = {
    'Prime Picks': '-1002955338551',
    'Cue Links': '-1002982344997', 
    'Value Picks': '-1003017626269',
    'Click Picks': '-1002981205504',
    'Global Picks': '-1002902496654',
    'Travel Picks': '-1003047967930',
    'Deals Hub': '-1003029983162',
    'Loot Box': '-1002991047787'
};

console.log('🚀 Starting Telegram Bot in Polling Mode for Local Development...');
console.log('📱 Monitoring channels:', Object.keys(CHANNEL_IDS).join(', '));

// Create bot with polling enabled
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// URL detection regex
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

// Product extraction function
function extractProductInfo(text) {
    const urls = text.match(URL_REGEX) || [];
    
    // Simple product detection
    const hasProductKeywords = /\b(price|₹|rs|rupees|buy|deal|offer|discount|sale)\b/i.test(text);
    
    if (urls.length > 0 && hasProductKeywords) {
        return {
            title: text.split('\n')[0].substring(0, 100),
            url: urls[0],
            price: text.match(/₹[\d,]+/)?.[0] || 'Price not specified',
            description: text.substring(0, 500)
        };
    }
    
    return null;
}

// Store channel post in database
function storeChannelPost(channelPost) {
    try {
        const stmt = db.prepare(`
            INSERT INTO channel_posts (
                message_id, channel_id, channel_name, original_text, 
                urls_found, created_at, processed
            ) VALUES (?, ?, ?, ?, ?, datetime('now'), 0)
        `);
        
        const urls = channelPost.text?.match(URL_REGEX) || [];
        const channelName = Object.keys(CHANNEL_IDS).find(
            name => CHANNEL_IDS[name] === channelPost.chat.id.toString()
        ) || 'Unknown';
        
        const result = stmt.run(
            channelPost.message_id,
            channelPost.chat.id,
            channelName,
            channelPost.text || '',
            JSON.stringify(urls)
        );
        
        console.log(`📝 Stored channel post ID: ${result.lastInsertRowid}`);
        return result.lastInsertRowid;
        
    } catch (error) {
        console.error('❌ Error storing channel post:', error.message);
        return null;
    }
}

// Store product in unified_content
function storeProduct(product, channelName, postId) {
    try {
        // Determine display page based on channel
        const displayPages = {
            'Prime Picks': 'prime-picks',
            'Cue Links': 'cue-picks',
            'Value Picks': 'value-picks',
            'Click Picks': 'click-picks',
            'Global Picks': 'global-picks',
            'Travel Picks': 'travel-picks',
            'Deals Hub': 'deals-hub',
            'Loot Box': 'loot-box'
        };
        
        const stmt = db.prepare(`
            INSERT INTO unified_content (
                title, description, url, price, image_url, category,
                display_pages, source_channel, channel_post_id, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `);
        
        const result = stmt.run(
            product.title,
            product.description,
            product.url,
            product.price,
            '', // No image extraction for now
            'General',
            displayPages[channelName] || 'general',
            channelName,
            postId
        );
        
        console.log(`🛍️ Stored product ID: ${result.lastInsertRowid}`);
        return result.lastInsertRowid;
        
    } catch (error) {
        console.error('❌ Error storing product:', error.message);
        return null;
    }
}

// Handle channel posts
bot.on('channel_post', (channelPost) => {
    try {
        console.log('\n📢 Channel post received:');
        console.log(`   Channel: ${channelPost.chat.title} (${channelPost.chat.id})`);
        console.log(`   Message ID: ${channelPost.message_id}`);
        console.log(`   Text: ${channelPost.text?.substring(0, 100)}...`);
        
        // Store the channel post
        const postId = storeChannelPost(channelPost);
        
        if (channelPost.text) {
            // Extract product information
            const product = extractProductInfo(channelPost.text);
            
            if (product) {
                console.log('🛍️ Product detected!');
                console.log(`   Title: ${product.title}`);
                console.log(`   URL: ${product.url}`);
                console.log(`   Price: ${product.price}`);
                
                // Store product
                const channelName = Object.keys(CHANNEL_IDS).find(
                    name => CHANNEL_IDS[name] === channelPost.chat.id.toString()
                );
                
                if (channelName && postId) {
                    storeProduct(product, channelName, postId);
                    console.log('✅ Product stored successfully');
                } else {
                    console.log('⚠️ Could not determine channel name or post ID');
                }
            } else {
                console.log('ℹ️ No product detected in this message');
            }
        }
        
    } catch (error) {
        console.error('❌ Error processing channel post:', error);
    }
});

// Handle regular messages (for testing)
bot.on('message', (msg) => {
    if (msg.chat.type === 'private') {
        console.log('\n💬 Private message received (for testing):');
        console.log(`   From: ${msg.from.first_name} (${msg.from.id})`);
        console.log(`   Text: ${msg.text}`);
        
        // Echo back for testing
        bot.sendMessage(msg.chat.id, `✅ Bot is working! Received: ${msg.text}`);
    }
});

// Handle polling errors
bot.on('polling_error', (error) => {
    console.error('❌ Polling error:', error.message);
    
    if (error.message.includes('409')) {
        console.log('💡 Conflict detected - another bot instance may be running');
        console.log('   Try stopping other bot processes or clearing webhooks');
    }
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down bot...');
    bot.stopPolling();
    db.close();
    process.exit(0);
});

console.log('✅ Bot started in polling mode');
console.log('📱 Monitoring channels for new posts...');
console.log('💡 Send a message to @pntmaster_bot to test private messaging');
console.log('⚠️ Press Ctrl+C to stop the bot');

// Keep alive and show status
setInterval(() => {
    console.log(`💓 Bot polling active... (${new Date().toLocaleTimeString()})`);
}, 60000); // Every minute