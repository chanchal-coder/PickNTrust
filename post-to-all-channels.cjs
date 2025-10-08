const TelegramBot = require('node-telegram-bot-api');
const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

console.log('🚀 POSTING TO ALL TELEGRAM CHANNELS');
console.log('===================================');

// Bot configuration
const BOT_TOKEN = process.env.MASTER_BOT_TOKEN;

if (!BOT_TOKEN) {
    console.error('❌ MASTER_BOT_TOKEN not found in environment variables');
    process.exit(1);
}

// All channel configurations
const CHANNEL_CONFIGS = {
    '-1002955338551': { name: 'Prime Picks', pageName: 'Prime Picks', pageSlug: 'prime-picks' },
    '-1002982344997': { name: 'Cue Picks', pageName: 'Cue Picks', pageSlug: 'cue-picks' },
    '-1003017626269': { name: 'Value Picks', pageName: 'Value Picks', pageSlug: 'value-picks' },
    '-1002981205504': { name: 'Click Picks', pageName: 'Click Picks', pageSlug: 'click-picks' },
    '-1002902496654': { name: 'Global Picks', pageName: 'Global Picks', pageSlug: 'global-picks' },
    '-1003047967930': { name: 'Travel Picks', pageName: 'Travel Picks', pageSlug: 'travel-picks' },
    '-1003029983162': { name: 'Deals Hub', pageName: 'Deals Hub', pageSlug: 'deals-hub' },
    '-1002991047787': { name: 'Loot Box', pageName: 'Loot Box', pageSlug: 'loot-box' }
};

// Sample products for each channel
const CHANNEL_PRODUCTS = {
    '-1002955338551': {
        title: 'Premium Noise Cancelling Headphones',
        price: '₹2,499',
        originalPrice: '₹4,999',
        discount: '50% OFF',
        url: 'https://www.amazon.in/premium-headphones/dp/B08REAL123',
        features: ['Active Noise Cancellation', '30H Battery', 'Quick Charge', 'Premium Sound'],
        hashtags: '#PrimePicks #Headphones #Deal'
    },
    '-1002982344997': {
        title: 'Smart Fitness Watch Pro',
        price: '₹3,999',
        originalPrice: '₹7,999',
        discount: '50% OFF',
        url: 'https://www.amazon.in/smart-fitness-watch/dp/B08REAL124',
        features: ['Heart Rate Monitor', 'GPS Tracking', '7-Day Battery', 'Water Resistant'],
        hashtags: '#CuePicks #Fitness #SmartWatch'
    },
    '-1003017626269': {
        title: 'Portable Power Bank 20000mAh',
        price: '₹1,299',
        originalPrice: '₹2,599',
        discount: '50% OFF',
        url: 'https://www.amazon.in/portable-power-bank/dp/B08REAL125',
        features: ['Fast Charging', 'Dual USB Ports', 'LED Display', 'Compact Design'],
        hashtags: '#ValuePicks #PowerBank #Portable'
    },
    '-1002981205504': {
        title: 'Wireless Bluetooth Speaker',
        price: '₹1,999',
        originalPrice: '₹3,999',
        discount: '50% OFF',
        url: 'https://www.amazon.in/bluetooth-speaker/dp/B08REAL126',
        features: ['360° Sound', 'Waterproof', '12H Playtime', 'Bass Boost'],
        hashtags: '#ClickPicks #Speaker #Wireless'
    },
    '-1002902496654': {
        title: 'Gaming Mechanical Keyboard',
        price: '₹2,799',
        originalPrice: '₹5,599',
        discount: '50% OFF',
        url: 'https://www.amazon.in/gaming-keyboard/dp/B08REAL127',
        features: ['RGB Backlight', 'Mechanical Switches', 'Anti-Ghosting', 'Durable Build'],
        hashtags: '#GlobalPicks #Gaming #Keyboard'
    },
    '-1003047967930': {
        title: 'Travel Backpack 40L',
        price: '₹2,199',
        originalPrice: '₹4,399',
        discount: '50% OFF',
        url: 'https://www.amazon.in/travel-backpack/dp/B08REAL128',
        features: ['Water Resistant', 'Multiple Compartments', 'Laptop Sleeve', 'Comfortable Straps'],
        hashtags: '#TravelPicks #Backpack #Travel'
    },
    '-1003029983162': {
        title: 'Smartphone Gimbal Stabilizer',
        price: '₹3,499',
        originalPrice: '₹6,999',
        discount: '50% OFF',
        url: 'https://www.amazon.in/smartphone-gimbal/dp/B08REAL129',
        features: ['3-Axis Stabilization', 'Face Tracking', '12H Battery', 'Foldable Design'],
        hashtags: '#DealsHub #Gimbal #Photography'
    },
    '-1002991047787': {
        title: 'Wireless Earbuds Pro',
        price: '₹1,799',
        originalPrice: '₹3,599',
        discount: '50% OFF',
        url: 'https://www.amazon.in/wireless-earbuds/dp/B08REAL130',
        features: ['Noise Cancellation', 'Touch Controls', '24H Battery', 'IPX7 Waterproof'],
        hashtags: '#LootBox #Earbuds #Wireless'
    }
};

// Create bot instance
const bot = new TelegramBot(BOT_TOKEN, { polling: false });

// Database connection (use the main database.sqlite)
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

function createMessage(channelId, product) {
    return `🔥 AMAZING DEAL ALERT! 🔥

📱 ${product.title}
💰 Price: ${product.price} (was ${product.originalPrice})
🎯 ${product.discount} - Limited Time!

${product.features.map(feature => `✅ ${feature}`).join('\n')}

🛒 Shop Now: ${product.url}

⏰ Hurry! Limited Stock Available!

${product.hashtags}`;
}

async function postToAllChannels() {
    console.log('📤 Starting to post messages to all channels...\n');
    
    const results = [];
    
    for (const [channelId, config] of Object.entries(CHANNEL_CONFIGS)) {
        try {
            console.log(`📺 Posting to ${config.name} (${channelId})...`);
            
            const product = CHANNEL_PRODUCTS[channelId];
            const message = createMessage(channelId, product);
            
            const result = await bot.sendMessage(channelId, message);
            
            console.log(`✅ ${config.name}: Message sent successfully!`);
            console.log(`   Message ID: ${result.message_id}`);
            console.log(`   Date: ${new Date(result.date * 1000).toLocaleString()}`);
            
            results.push({
                channel: config.name,
                channelId,
                messageId: result.message_id,
                success: true,
                timestamp: result.date
            });
            
            // Wait 2 seconds between posts to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 2000));
            
        } catch (error) {
            console.error(`❌ Error posting to ${config.name}:`, error.message);
            results.push({
                channel: config.name,
                channelId,
                success: false,
                error: error.message
            });
        }
    }
    
    console.log('\n📊 POSTING SUMMARY');
    console.log('==================');
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ Successful posts: ${successful.length}`);
    console.log(`❌ Failed posts: ${failed.length}`);
    
    if (successful.length > 0) {
        console.log('\n✅ SUCCESSFUL POSTS:');
        successful.forEach(result => {
            console.log(`   ${result.channel}: Message ID ${result.messageId}`);
        });
    }
    
    if (failed.length > 0) {
        console.log('\n❌ FAILED POSTS:');
        failed.forEach(result => {
            console.log(`   ${result.channel}: ${result.error}`);
        });
    }
    
    console.log('\n⏳ Waiting 10 seconds for bot processing...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Check database for new entries
    await checkDatabaseUpdates();
    
    console.log('\n🎉 TESTING COMPLETE!');
    console.log('Now check the website pages to verify products appear:');
    console.log('• http://localhost:5000/prime-picks');
    console.log('• http://localhost:5000/cue-picks');
    console.log('• http://localhost:5000/value-picks');
    console.log('• http://localhost:5000/click-picks');
    console.log('• http://localhost:5000/global-picks');
    console.log('• http://localhost:5000/travel-picks');
    console.log('• http://localhost:5000/deals-hub');
    console.log('• http://localhost:5000/loot-box');
}

async function checkDatabaseUpdates() {
    try {
        console.log('\n📊 CHECKING DATABASE UPDATES');
        console.log('=============================');
        
        // Check recent channel_posts (created_at stored as epoch seconds)
        const recentPosts = db.prepare(`
            SELECT channel_name, COUNT(*) as count 
            FROM channel_posts 
            WHERE created_at > (strftime('%s','now') - 120)
            GROUP BY channel_name
            ORDER BY count DESC
        `).all();
        
        console.log('📨 Recent channel posts (last 2 minutes):');
        if (recentPosts.length === 0) {
            console.log('   No new posts found');
        } else {
            recentPosts.forEach(post => {
                console.log(`   ${post.channel_name}: ${post.count} posts`);
            });
        }
        
        // Check recent unified_content (created_at stored as epoch seconds)
        const recentProducts = db.prepare(`
            SELECT page_type, COUNT(*) as count 
            FROM unified_content 
            WHERE created_at > (strftime('%s','now') - 120)
            GROUP BY page_type
            ORDER BY count DESC
        `).all();

        // Verify per-page display mapping using display_pages JSON
        const pageChecks = [
            'prime-picks','cue-picks','value-picks','click-picks',
            'global-picks','travel-picks','deals-hub','loot-box'
        ];
        console.log('\n🗂️ Products by page (last 2 minutes):');
        for (const slug of pageChecks) {
            const row = db.prepare(`
                SELECT COUNT(*) as count FROM unified_content 
                WHERE created_at > (strftime('%s','now') - 120)
                  AND display_pages LIKE '%' || ? || '%'
            `).get(slug);
            console.log(`   ${slug}: ${row.count} products`);
        }
        
        console.log('\n📦 Recent products (last 2 minutes):');
        if (recentProducts.length === 0) {
            console.log('   No new products found');
        } else {
            recentProducts.forEach(product => {
                console.log(`   ${product.page_type}: ${product.count} products`);
            });
        }
        
        // Check processing status
        const processingStats = db.prepare(`
            SELECT 
                SUM(CASE WHEN is_processed = 1 THEN 1 ELSE 0 END) as processed,
                SUM(CASE WHEN is_processed = 0 THEN 1 ELSE 0 END) as pending,
                COUNT(*) as total
            FROM channel_posts 
            WHERE created_at > datetime('now', '-2 minutes')
        `).get();
        
        if (processingStats && processingStats.total > 0) {
            console.log('\n🔄 Processing status:');
            console.log(`   Processed: ${processingStats.processed}`);
            console.log(`   Pending: ${processingStats.pending}`);
            console.log(`   Total: ${processingStats.total}`);
        }
        
    } catch (error) {
        console.error('❌ Error checking database:', error.message);
    }
}

// Run the posting
postToAllChannels().catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
});