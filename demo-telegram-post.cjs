const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database connection (use root database used by the app)
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Channel configurations (matching your telegram-bot.ts)
const CHANNEL_CONFIGS = {
  '-1002955338551': { page: 'prime-picks', affiliateTag: 'primepicks-21', platform: 'amazon', slug: 'prime-picks' },
  '-1002982344997': { page: 'cue-picks', affiliateTag: 'cuepicks-21', platform: 'cuelinks', slug: 'cue-picks' },
  '-1003017626269': { page: 'value-picks', affiliateTag: 'valuepicks-21', platform: 'amazon', slug: 'value-picks' },
  '-1002981205504': { page: 'click-picks', affiliateTag: 'clickpicks-21', platform: 'inrdeals', slug: 'click-picks' },
  '-1002902496654': { page: 'global-picks', affiliateTag: 'globalpicks-21', platform: 'deodap', slug: 'global-picks' },
  '-1003047967930': { page: 'travel-picks', affiliateTag: 'travelpicks-21', platform: 'earnkaro', slug: 'travel-picks' },
  '-1003029983162': { page: 'deals-hub', affiliateTag: 'dealshub-21', platform: 'amazon', slug: 'deals-hub' },
  '-1002991047787': { page: 'loot-box', affiliateTag: 'lootbox-21', platform: 'amazon', slug: 'loot-box' }
};

// Sample product data for demonstration
const sampleProducts = [
  {
    channelId: '-1002955338551', // Prime Picks
    title: '🔥 FLASH DEAL: Premium Wireless Earbuds Pro Max',
    description: '✅ Active Noise Cancellation\n✅ 40H Battery Life\n✅ IPX8 Waterproof\n✅ Premium Sound Quality\n\n💰 Special Price: ₹1,299 (was ₹4,999)\n🎯 74% OFF - Limited Time!',
    originalUrl: 'https://www.amazon.in/premium-wireless-earbuds-pro/dp/B08FLASH123',
    imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=400&fit=crop'
  },
  {
    channelId: '-1003017626269', // Value Picks
    title: '💎 BEST VALUE: Smart Fitness Watch 2024',
    description: '⌚ Heart Rate Monitor\n📱 Smart Notifications\n🏃‍♂️ 50+ Sports Modes\n🔋 7-Day Battery\n\n💰 Unbeatable Price: ₹899 (was ₹2,999)\n🎯 70% OFF - Today Only!',
    originalUrl: 'https://www.amazon.in/smart-fitness-watch-2024/dp/B08VALUE456',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop'
  },
  {
    channelId: '-1003029983162', // Deals Hub
    title: '🚀 MEGA DEAL: Gaming Mechanical Keyboard',
    description: '⌨️ RGB Backlit Keys\n🎮 Gaming Grade Switches\n💻 USB-C Connection\n🔧 Hot-Swappable Keys\n\n💰 Gaming Price: ₹1,599 (was ₹3,999)\n🎯 60% OFF - Gamers Special!',
    originalUrl: 'https://www.amazon.in/gaming-mechanical-keyboard/dp/B08GAMING789',
    imageUrl: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=400&h=400&fit=crop'
  },
  {
    channelId: '-1003047967930', // Travel Picks
    title: '🧳 Travel Deal: Compact Carry-On Suitcase 40L',
    description: '✅ Lightweight & Durable\n✅ TSA Lock\n✅ 360° Spinner Wheels\n\n💰 Special Price: ₹2,499 (was ₹5,999)\n✈️ Perfect for weekend trips!',
    originalUrl: 'https://www.earnkaro.com/compact-carry-on-suitcase',
    imageUrl: 'https://images.unsplash.com/photo-1549058921-5d7b25ae09c3?w=400&h=400&fit=crop'
  },
  {
    channelId: '-1002981205504', // Click Picks
    title: '📈 Trending: USB-C Fast Charger 65W',
    description: '⚡ Superfast charging for laptops & phones\n🔌 GaN Technology\n💼 Compact travel-friendly\n\n💰 Deal Price: ₹1,099 (was ₹2,499)\n🔥 Hot on Click Picks!',
    originalUrl: 'https://inrdeals.com/usbc-fast-charger-65w',
    imageUrl: 'https://images.unsplash.com/photo-1587854692152-1c1b9b141e1b?w=400&h=400&fit=crop'
  },
  {
    channelId: '-1002902496654', // Global Picks
    title: '🌍 Global: Japanese Matcha Starter Kit',
    description: '🍵 Authentic matcha whisk & bowl\n🇯🇵 Imported quality\n🎁 Perfect gift set\n\n💰 Price: ₹3,499',
    originalUrl: 'https://deodap.com/japanese-matcha-starter-kit',
    imageUrl: 'https://images.unsplash.com/photo-1517959105821-eaf3b92b3cb2?w=400&h=400&fit=crop'
  },
  {
    channelId: '-1002991047787', // Loot Box
    title: '🎁 Loot Box: Mystery Tech Bundle',
    description: '🔮 3–5 surprise gadgets\n💡 Minimum value ₹3,000\n🎉 Fun unboxing experience\n\n💰 Bundle Price: ₹999',
    originalUrl: 'https://amazon.in/mystery-tech-bundle/dp/B0CLOOTBOX',
    imageUrl: 'https://images.unsplash.com/photo-1549394954-0e1d9cd40c83?w=400&h=400&fit=crop'
  }
];

// Function to simulate Telegram message processing
function simulateTelegramPost(product) {
  return new Promise((resolve, reject) => {
    const channelConfig = CHANNEL_CONFIGS[product.channelId];
    const timestamp = Date.now();
    
    // Convert to affiliate URL (simplified for demo)
    const affiliateUrl = product.originalUrl.replace('amazon.in', `amazon.in/ref=${channelConfig.affiliateTag}`);
    
    // First, insert into channel_posts table (simulating bot processing)
    const channelPostSql = `
      INSERT INTO channel_posts (
        channel_id, channel_name, website_page, message_id, 
        original_text, processed_text, extracted_urls, 
        is_processed, is_posted, telegram_timestamp, 
        processed_at, posted_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const messageId = Math.floor(Math.random() * 1000000);
    const messageText = `${product.title}\n\n${product.description}\n\n🛒 Shop Now: ${product.originalUrl}`;
    
    db.run(channelPostSql, [
      product.channelId,
      channelConfig.page,
      channelConfig.page,
      messageId,
      messageText,
      messageText,
      JSON.stringify([product.originalUrl]),
      1, // is_processed
      1, // is_posted
      timestamp,
      timestamp,
      timestamp,
      timestamp
    ], function(err) {
      if (err) {
        reject(err);
        return;
      }
      
      const channelPostId = this.lastID;
      
      // Then insert into unified_content table (what appears on website)
      const unifiedContentSql = `
        INSERT INTO unified_content (
          title, description, image_url, affiliate_url,
          content_type, page_type, category, source_type,
          source_id, affiliate_platform, is_active, 
          display_pages, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      db.run(unifiedContentSql, [
        product.title,
        product.description,
        product.imageUrl,
        affiliateUrl,
        'product',
        channelConfig.page,
        'deals',
        'telegram',
        channelPostId.toString(),
        channelConfig.platform,
        1, // is_active
        JSON.stringify([channelConfig.page]),
        timestamp,
        timestamp
      ], function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        resolve({
          channelPostId,
          unifiedContentId: this.lastID,
          channel: channelConfig.page,
          affiliateUrl,
          timestamp
        });
      });
    });
  });
}

// Function to verify the post appears in API
function verifyApiEndpoint(channel) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT id, title, description, affiliate_url, image_url, created_at
      FROM unified_content 
      WHERE page_type = ? 
      ORDER BY created_at DESC 
      LIMIT 5
    `;
    
    db.all(sql, [channel], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
}

// Main demonstration function
async function demonstrateFlow() {
  console.log('🚀 DEMONSTRATING TELEGRAM TO WEBSITE FLOW\n');
  console.log('=' .repeat(60));
  
  try {
    // Step 1: Simulate posting to multiple channels
    console.log('\n📱 STEP 1: Simulating Telegram Channel Posts...\n');
    
    const results = [];
    for (const product of sampleProducts) {
      const channelName = CHANNEL_CONFIGS[product.channelId].page;
      console.log(`📤 Posting to ${channelName} channel...`);
      
      const result = await simulateTelegramPost(product);
      results.push({ ...result, product });
      
      console.log(`   ✅ Posted: "${product.title.substring(0, 50)}..."`);
      console.log(`   📊 Channel Post ID: ${result.channelPostId}`);
      console.log(`   🌐 Unified Content ID: ${result.unifiedContentId}`);
      console.log(`   🔗 Affiliate URL: ${result.affiliateUrl}`);
      console.log('');
    }
    
    // Step 2: Verify database storage
    console.log('\n💾 STEP 2: Verifying Database Storage...\n');
    
    for (const result of results) {
      console.log(`🔍 Checking ${result.channel} page data...`);
      const apiData = await verifyApiEndpoint(result.channel);
      
      if (apiData.length > 0) {
        const latestPost = apiData[0];
        console.log(`   ✅ Found ${apiData.length} products on ${result.channel}`);
        console.log(`   📝 Latest: "${latestPost.title.substring(0, 40)}..."`);
        console.log(`   🕒 Posted: ${new Date(latestPost.created_at).toLocaleString()}`);
      } else {
        console.log(`   ❌ No products found on ${result.channel}`);
      }
      console.log('');
    }
    
    // Step 3: Show API endpoints
    console.log('\n🌐 STEP 3: API Endpoints Ready for Website...\n');
    
    const channels = [...new Set(results.map(r => r.channel))];
    for (const channel of channels) {
      console.log(`📡 http://localhost:5000/api/products/${channel}`);
      console.log(`   🎯 This endpoint serves products for /${channel} page`);
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('✨ DEMONSTRATION COMPLETE!');
    console.log('\n🎉 What just happened:');
    console.log('   1. ✅ Simulated Telegram channel posts');
    console.log('   2. ✅ Processed messages automatically');
    console.log('   3. ✅ Stored in database with affiliate links');
    console.log('   4. ✅ Made available via API endpoints');
    console.log('   5. ✅ Ready to display on website pages');
    
    console.log('\n🌐 Visit your website to see the new products:');
    for (const channel of channels) {
      console.log(`   • http://localhost:5000/${channel}`);
    }
    
    console.log('\n💡 In real usage:');
    console.log('   • Just post to your Telegram channels');
    console.log('   • The bot processes messages automatically');
    console.log('   • Products appear on website instantly');
    console.log('   • No manual intervention needed!');
    
  } catch (error) {
    console.error('❌ Error during demonstration:', error);
  } finally {
    db.close();
  }
}

// Run the demonstration
demonstrateFlow();