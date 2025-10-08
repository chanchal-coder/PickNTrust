const axios = require('axios');
const Database = require('better-sqlite3');
const path = require('path');

console.log('🔍 Detailed Webhook Processing Debug...\n');

async function debugWebhookProcessing() {
  try {
    console.log('1️⃣ Testing server health...');
    const healthResponse = await axios.get('http://localhost:5000/api/health');
    console.log('✅ Server is running:', healthResponse.status);

    console.log('\n2️⃣ Checking database before webhook...');
    const dbPath = path.join(__dirname, 'database.sqlite');
    const db = new Database(dbPath);
    
    const beforeChannelPosts = db.prepare("SELECT COUNT(*) as count FROM channel_posts").get();
    const beforeUnifiedContent = db.prepare("SELECT COUNT(*) as count FROM unified_content").get();
    
    console.log(`Before webhook - Channel posts: ${beforeChannelPosts.count}, Unified content: ${beforeUnifiedContent.count}`);

    console.log('\n3️⃣ Sending webhook with detailed logging...');
    
    const simulatedWebhookData = {
      update_id: Date.now(),
      channel_post: {
        message_id: Math.floor(Math.random() * 10000),
        chat: {
          id: -1002955338551, // Prime Picks channel ID
          title: "Prime Picks Test",
          type: "channel"
        },
        date: Math.floor(Date.now() / 1000),
        text: "🔥 Amazing Product Deal! Check out this iPhone 15 Pro Max at 50% off! https://amazon.com/test-product-link-" + Date.now(),
        entities: [
          {
            type: "url",
            offset: 65,
            length: 35
          }
        ]
      }
    };

    const webhookUrl = 'http://localhost:5000/webhook/master/8433200963:AAFE8umMtF23xgE7pBZA6wjIVg-o-2GeEvE';
    
    console.log('📤 Sending webhook to:', webhookUrl);
    console.log('📋 Message ID:', simulatedWebhookData.channel_post.message_id);
    console.log('📋 Chat ID:', simulatedWebhookData.channel_post.chat.id);
    console.log('📋 Text:', simulatedWebhookData.channel_post.text);
    
    const webhookResponse = await axios.post(webhookUrl, simulatedWebhookData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });
    
    console.log('✅ Webhook response:', webhookResponse.status, webhookResponse.data);
    
    console.log('\n4️⃣ Waiting for processing (10 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    console.log('\n5️⃣ Checking database after webhook...');
    
    const afterChannelPosts = db.prepare("SELECT COUNT(*) as count FROM channel_posts").get();
    const afterUnifiedContent = db.prepare("SELECT COUNT(*) as count FROM unified_content").get();
    
    console.log(`After webhook - Channel posts: ${afterChannelPosts.count}, Unified content: ${afterUnifiedContent.count}`);
    
    // Check for the specific message we sent
    const specificChannelPost = db.prepare(`
      SELECT * FROM channel_posts 
      WHERE message_id = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `).get(simulatedWebhookData.channel_post.message_id);
    
    if (specificChannelPost) {
      console.log('\n✅ Found our test message in channel_posts:');
      console.log('   ID:', specificChannelPost.id);
      console.log('   Message ID:', specificChannelPost.message_id);
      console.log('   Processed:', specificChannelPost.is_processed);
      console.log('   Processing Status:', specificChannelPost.processing_status);
      console.log('   Content:', (specificChannelPost.content || '').substring(0, 100) + '...');
      
      // Check if there's corresponding unified_content
      const correspondingContent = db.prepare(`
        SELECT * FROM unified_content 
        WHERE created_at > datetime('now', '-2 minutes')
        ORDER BY created_at DESC 
        LIMIT 5
      `).all();
      
      console.log(`\n📋 Recent unified_content entries (${correspondingContent.length}):`);
      correspondingContent.forEach((content, i) => {
        console.log(`   ${i+1}. ID: ${content.id}, Title: ${content.title}, Pages: ${content.display_pages}`);
      });
      
    } else {
      console.log('\n❌ Test message NOT found in channel_posts');
      
      // Check recent channel posts to see what's there
      const recentPosts = db.prepare(`
        SELECT * FROM channel_posts 
        ORDER BY created_at DESC 
        LIMIT 5
      `).all();
      
      console.log(`\n📋 Recent channel_posts (${recentPosts.length}):`);
      recentPosts.forEach((post, i) => {
        console.log(`   ${i+1}. ID: ${post.id}, Message ID: ${post.message_id}, Created: ${new Date(post.created_at * 1000).toISOString()}`);
      });
    }
    
    console.log('\n6️⃣ Analysis:');
    const channelPostsIncrease = afterChannelPosts.count - beforeChannelPosts.count;
    const unifiedContentIncrease = afterUnifiedContent.count - beforeUnifiedContent.count;
    
    console.log(`Channel posts increased by: ${channelPostsIncrease}`);
    console.log(`Unified content increased by: ${unifiedContentIncrease}`);
    
    if (channelPostsIncrease === 0) {
      console.log('❌ ISSUE: Webhook not creating channel_posts entries');
      console.log('   💡 Check if TelegramBotManager.processChannelPost() is being called');
      console.log('   💡 Check if saveToChannelPosts() function is working');
    } else if (unifiedContentIncrease === 0) {
      console.log('❌ ISSUE: Channel posts created but no unified_content');
      console.log('   💡 Check if saveProductToDatabase() function is working');
      console.log('   💡 Check for errors in product processing');
    } else {
      console.log('✅ SUCCESS: Both channel_posts and unified_content are being created');
    }
    
    db.close();
    
  } catch (error) {
    console.error('❌ Debug test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

debugWebhookProcessing();