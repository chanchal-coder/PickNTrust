/**
 * Debug Webhook Processing Flow
 * Check if webhook messages are properly processed into unified_content
 */

const Database = require('better-sqlite3');

console.log('🔍 DEBUGGING WEBHOOK PROCESSING FLOW');
console.log('='.repeat(60));

async function debugWebhookProcessing() {
  try {
    const db = new Database('./database.sqlite');
    
    console.log('\n1️⃣ Recent Channel Posts Analysis...');
    
    // Get the most recent channel posts
    const recentPosts = db.prepare(`
      SELECT 
        id, channel_name, website_page, message_id,
        is_processed, is_posted, processing_error,
        datetime(created_at, 'unixepoch') as readable_time,
        substr(original_text, 1, 100) as text_preview
      FROM channel_posts 
      ORDER BY created_at DESC
      LIMIT 10
    `).all();
    
    console.log(`   📊 Total recent posts: ${recentPosts.length}`);
    
    if (recentPosts.length > 0) {
      console.log('   📋 Recent posts status:');
      recentPosts.forEach((post, index) => {
        console.log(`      ${index + 1}. ${post.channel_name} → ${post.website_page}`);
        console.log(`         ID: ${post.id} | Message: ${post.message_id} | Time: ${post.readable_time}`);
        console.log(`         Processed: ${post.is_processed} | Posted: ${post.is_posted}`);
        if (post.processing_error) {
          console.log(`         ❌ Error: ${post.processing_error}`);
        }
        console.log(`         Text: "${post.text_preview}..."`);
        console.log('');
      });
    }
    
    console.log('\n2️⃣ Unified Content Creation Check...');
    
    // Check if recent channel_posts have corresponding unified_content
    if (recentPosts.length > 0) {
      recentPosts.forEach((post, index) => {
        // Look for unified_content with matching source_id
        const unifiedMatch = db.prepare(`
          SELECT id, title, display_pages, processing_status, created_at
          FROM unified_content 
          WHERE source_id = ? OR source_id = ?
        `).all(post.id.toString(), post.message_id.toString());
        
        console.log(`   ${index + 1}. Channel Post ID ${post.id}:`);
        if (unifiedMatch.length > 0) {
          console.log(`      ✅ Found ${unifiedMatch.length} unified_content entries`);
          unifiedMatch.forEach(match => {
            console.log(`         - "${match.title}" (${match.processing_status})`);
            console.log(`         - Pages: ${match.display_pages}`);
            console.log(`         - Created: ${new Date(match.created_at * 1000).toLocaleString()}`);
          });
        } else {
          console.log(`      ❌ No unified_content found for this channel post`);
          console.log(`      💡 This indicates the processing pipeline is broken`);
        }
      });
    }
    
    console.log('\n3️⃣ Processing Pipeline Status...');
    
    // Check processing statistics
    const processingStats = db.prepare(`
      SELECT 
        COUNT(*) as total_posts,
        COUNT(CASE WHEN is_processed = 1 THEN 1 END) as processed_posts,
        COUNT(CASE WHEN is_posted = 1 THEN 1 END) as posted_posts,
        COUNT(CASE WHEN processing_error IS NOT NULL THEN 1 END) as error_posts
      FROM channel_posts
    `).get();
    
    console.log('   📊 Processing Statistics:');
    console.log(`      Total Posts: ${processingStats.total_posts}`);
    console.log(`      Processed: ${processingStats.processed_posts}`);
    console.log(`      Posted: ${processingStats.posted_posts}`);
    console.log(`      Errors: ${processingStats.error_posts}`);
    
    const processingRate = processingStats.total_posts > 0 ? 
      (processingStats.processed_posts / processingStats.total_posts * 100).toFixed(1) : 0;
    
    console.log(`      Processing Rate: ${processingRate}%`);
    
    if (processingStats.processed_posts === 0 && processingStats.total_posts > 0) {
      console.log('      ❌ CRITICAL: No posts are being processed!');
    }
    
    db.close();
    
    console.log('\n📋 DIAGNOSIS SUMMARY:');
    console.log('='.repeat(30));
    
    if (processingStats.total_posts > 0 && processingStats.processed_posts === 0) {
      console.log('❌ CRITICAL ISSUE: Messages are being received but not processed');
      console.log('   💡 The webhook is working, but processMessage() is not being called');
      console.log('   💡 Check if the webhook handler is properly routing to telegram-bot.ts');
      console.log('   💡 Verify that TelegramBotManager.processChannelPost() is working');
    }
    
    console.log('\n🔧 RECOMMENDED ACTIONS:');
    console.log('1. Check webhook handler in routes.ts');
    console.log('2. Verify TelegramBotManager.processChannelPost() is being called');
    console.log('3. Test saveProductToDatabase() function manually');
    console.log('4. Check server logs for any processing errors');
    
  } catch (error) {
    console.error('❌ Error debugging webhook processing:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the debug
debugWebhookProcessing();