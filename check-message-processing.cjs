/**
 * Check Message Processing Pipeline
 * Investigate why recent bot messages aren't appearing as unified_content
 */

const Database = require('better-sqlite3');

console.log('🔍 CHECKING MESSAGE PROCESSING PIPELINE');
console.log('='.repeat(60));

try {
  const db = new Database('database.sqlite');
  
  console.log('\n1️⃣ Recent Bot Messages vs Unified Content...');
  
  // Get recent bot messages
  const recentBotMessages = db.prepare(`
    SELECT 
      id, channel_name, website_page, message_id,
      is_processed, is_posted,
      datetime(created_at, 'unixepoch') as readable_time,
      substr(original_text, 1, 150) as text_preview
    FROM channel_posts 
    WHERE created_at > ?
    ORDER BY created_at DESC
  `).all((Date.now() - 24 * 60 * 60 * 1000) / 1000); // Last 24 hours
  
  console.log(`   📊 Recent bot messages (24h): ${recentBotMessages.length}`);
  
  if (recentBotMessages.length > 0) {
    console.log('   📋 Recent bot messages:');
    recentBotMessages.forEach((msg, index) => {
      console.log(`      ${index + 1}. ${msg.channel_name} → ${msg.website_page}`);
      console.log(`         Message ID: ${msg.message_id} | Time: ${msg.readable_time}`);
      console.log(`         Processed: ${msg.is_processed} | Posted: ${msg.is_posted}`);
      console.log(`         Text: "${msg.text_preview}..."`);
      console.log('');
    });
  }
  
  // Check if these messages exist in unified_content
  console.log('\n2️⃣ Checking Unified Content Correlation...');
  
  if (recentBotMessages.length > 0) {
    recentBotMessages.forEach((msg, index) => {
      // Try to find corresponding unified_content
      const unifiedMatch = db.prepare(`
        SELECT id, title, display_pages, processing_status
        FROM unified_content 
        WHERE title LIKE ? OR content LIKE ?
      `).all(`%${msg.text_preview.substring(0, 50)}%`, `%${msg.text_preview.substring(0, 50)}%`);
      
      console.log(`   ${index + 1}. Message ${msg.message_id}:`);
      if (unifiedMatch.length > 0) {
        console.log(`      ✅ Found ${unifiedMatch.length} unified_content matches`);
        unifiedMatch.forEach(match => {
          console.log(`         - "${match.title}" (${match.processing_status})`);
        });
      } else {
        console.log(`      ❌ No unified_content found for this message`);
        console.log(`      💡 This message may not have been processed yet`);
      }
    });
  }
  
  console.log('\n3️⃣ Processing Status Deep Dive...');
  
  const processingDetails = db.prepare(`
    SELECT 
      channel_name,
      website_page,
      COUNT(*) as total_messages,
      COUNT(CASE WHEN is_processed = 1 THEN 1 END) as processed_count,
      COUNT(CASE WHEN is_posted = 1 THEN 1 END) as posted_count,
      MAX(datetime(created_at, 'unixepoch')) as latest_message
    FROM channel_posts 
    GROUP BY channel_name, website_page
    ORDER BY MAX(created_at) DESC
  `).all();
  
  console.log('   📊 Processing status by channel:');
  processingDetails.forEach(detail => {
    console.log(`      ${detail.channel_name} → ${detail.website_page}:`);
    console.log(`         Total: ${detail.total_messages} | Processed: ${detail.processed_count} | Posted: ${detail.posted_count}`);
    console.log(`         Latest: ${detail.latest_message}`);
    
    if (detail.total_messages > 0 && detail.processed_count === 0) {
      console.log(`         ❌ ISSUE: Messages not being processed!`);
    }
  });
  
  console.log('\n4️⃣ Unified Content Recent Activity...');
  
  const recentUnified = db.prepare(`
    SELECT 
      id, title, display_pages, processing_status,
      datetime(created_at/1000, 'unixepoch') as readable_time,
      created_at
    FROM unified_content 
    WHERE created_at > ?
    ORDER BY created_at DESC
    LIMIT 10
  `).all(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
  
  console.log(`   📊 Recent unified_content (24h): ${recentUnified.length}`);
  
  if (recentUnified.length > 0) {
    console.log('   📋 Recent unified content:');
    recentUnified.forEach((content, index) => {
      console.log(`      ${index + 1}. "${content.title}"`);
      console.log(`         Pages: ${content.display_pages} | Status: ${content.processing_status}`);
      console.log(`         Time: ${content.readable_time}`);
    });
  } else {
    console.log('   ❌ No recent unified_content created!');
    console.log('   💡 This suggests the processing pipeline is broken');
  }
  
  console.log('\n5️⃣ Processing Pipeline Check...');
  
  // Check if there's a processing service running
  console.log('   🔧 Checking for processing indicators...');
  
  // Look for any processing errors or status indicators
  const errorMessages = db.prepare(`
    SELECT processing_error, COUNT(*) as count
    FROM channel_posts 
    WHERE processing_error IS NOT NULL
    GROUP BY processing_error
  `).all();
  
  if (errorMessages.length > 0) {
    console.log('   ❌ Processing errors found:');
    errorMessages.forEach(error => {
      console.log(`      "${error.processing_error}": ${error.count} times`);
    });
  } else {
    console.log('   ✅ No processing errors in database');
  }
  
  console.log('\n6️⃣ Time Comparison Analysis...');
  
  // Compare timestamps between channel_posts and unified_content
  const latestChannelPost = db.prepare(`
    SELECT MAX(created_at) as latest FROM channel_posts
  `).get();
  
  const latestUnifiedContent = db.prepare(`
    SELECT MAX(created_at) as latest FROM unified_content
  `).get();
  
  console.log(`   📊 Latest channel post: ${new Date(latestChannelPost.latest * 1000).toLocaleString()}`);
  console.log(`   📊 Latest unified content: ${new Date(latestUnifiedContent.latest).toLocaleString()}`);
  
  const timeDiff = (latestChannelPost.latest * 1000) - latestUnifiedContent.latest;
  const hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60));
  
  console.log(`   📊 Time gap: ${hoursDiff} hours`);
  
  if (hoursDiff > 1) {
    console.log('   ❌ ISSUE: Large time gap suggests processing is not working');
  }
  
  db.close();
  
  console.log('\n📋 PROCESSING DIAGNOSIS:');
  console.log('='.repeat(40));
  
  if (recentBotMessages.length > 0 && recentUnified.length === 0) {
    console.log('❌ CRITICAL ISSUE: Bot receiving messages but not creating unified_content');
    console.log('   💡 The message processing pipeline is broken');
    console.log('   💡 Check if the processing service is running');
    console.log('   💡 Verify message parsing and content creation logic');
  } else if (recentBotMessages.length === 0) {
    console.log('⚠️ No recent bot messages to process');
  } else {
    console.log('✅ Processing pipeline appears to be working');
  }
  
} catch (error) {
  console.error('❌ Error checking message processing:', error.message);
  console.error('Stack trace:', error.stack);
}