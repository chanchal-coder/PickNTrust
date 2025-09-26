/**
 * Check Content Flow
 * Investigate why bot messages aren't appearing on webpages
 */

const Database = require('better-sqlite3');

console.log('🔍 CHECKING CONTENT FLOW FROM BOT TO WEBPAGES');
console.log('='.repeat(60));

try {
  const db = new Database('database.sqlite');
  
  console.log('\n1️⃣ Recent Bot Activity (channel_posts)...');
  
  const recentChannelPosts = db.prepare(`
    SELECT 
      id, channel_id, channel_name, website_page, message_id,
      is_processed, is_posted, processing_error,
      datetime(created_at, 'unixepoch') as readable_time,
      substr(original_text, 1, 100) as text_preview
    FROM channel_posts 
    ORDER BY created_at DESC 
    LIMIT 10
  `).all();
  
  console.log(`   📊 Recent channel posts: ${recentChannelPosts.length}`);
  
  if (recentChannelPosts.length > 0) {
    console.log('   📋 Latest bot messages:');
    recentChannelPosts.forEach((post, index) => {
      console.log(`      ${index + 1}. Channel: ${post.channel_name} (${post.channel_id})`);
      console.log(`         Page: ${post.website_page} | Message: ${post.message_id}`);
      console.log(`         Processed: ${post.is_processed} | Posted: ${post.is_posted}`);
      console.log(`         Time: ${post.readable_time}`);
      console.log(`         Text: "${post.text_preview}..."`);
      if (post.processing_error) {
        console.log(`         ❌ Error: ${post.processing_error}`);
      }
      console.log('');
    });
  } else {
    console.log('   ⚠️ No recent channel posts found!');
  }
  
  console.log('\n2️⃣ Processing Status Analysis...');
  
  const processingStats = db.prepare(`
    SELECT 
      is_processed,
      is_posted,
      COUNT(*) as count
    FROM channel_posts 
    GROUP BY is_processed, is_posted
    ORDER BY count DESC
  `).all();
  
  console.log('   📊 Processing status distribution:');
  processingStats.forEach(stat => {
    const status = `Processed: ${stat.is_processed}, Posted: ${stat.is_posted}`;
    console.log(`      ${status}: ${stat.count} messages`);
  });
  
  console.log('\n3️⃣ Unified Content Check...');
  
  const unifiedContent = db.prepare(`
    SELECT 
      id, title, display_pages, processing_status,
      datetime(created_at/1000, 'unixepoch') as readable_time
    FROM unified_content 
    ORDER BY created_at DESC 
    LIMIT 10
  `).all();
  
  console.log(`   📊 Recent unified content: ${unifiedContent.length}`);
  
  if (unifiedContent.length > 0) {
    console.log('   📋 Latest unified content:');
    unifiedContent.forEach((content, index) => {
      console.log(`      ${index + 1}. "${content.title}"`);
      console.log(`         Pages: ${content.display_pages} | Status: ${content.processing_status}`);
      console.log(`         Time: ${content.readable_time}`);
    });
  } else {
    console.log('   ⚠️ No unified content found!');
  }
  
  console.log('\n4️⃣ Content Flow Analysis...');
  
  // Check if channel_posts are being converted to unified_content
  const flowAnalysis = db.prepare(`
    SELECT 
      cp.website_page,
      COUNT(cp.id) as channel_posts,
      COUNT(CASE WHEN cp.is_processed = 1 THEN 1 END) as processed_posts,
      COUNT(CASE WHEN cp.is_posted = 1 THEN 1 END) as posted_posts
    FROM channel_posts cp
    WHERE cp.created_at > ?
    GROUP BY cp.website_page
    ORDER BY channel_posts DESC
  `).all(Date.now() - (7 * 24 * 60 * 60)); // Last 7 days
  
  console.log('   📊 Content flow by page (last 7 days):');
  if (flowAnalysis.length > 0) {
    flowAnalysis.forEach(flow => {
      console.log(`      ${flow.website_page}:`);
      console.log(`         Channel Posts: ${flow.channel_posts}`);
      console.log(`         Processed: ${flow.processed_posts}`);
      console.log(`         Posted: ${flow.posted_posts}`);
      
      if (flow.channel_posts > 0 && flow.processed_posts === 0) {
        console.log(`         ❌ ISSUE: Posts not being processed!`);
      }
      if (flow.processed_posts > 0 && flow.posted_posts === 0) {
        console.log(`         ❌ ISSUE: Processed posts not being posted!`);
      }
    });
  } else {
    console.log('   ⚠️ No channel activity in the last 7 days!');
  }
  
  console.log('\n5️⃣ Processing Errors Check...');
  
  const processingErrors = db.prepare(`
    SELECT 
      processing_error,
      COUNT(*) as count
    FROM channel_posts 
    WHERE processing_error IS NOT NULL
    GROUP BY processing_error
    ORDER BY count DESC
  `).all();
  
  if (processingErrors.length > 0) {
    console.log('   ❌ Processing errors found:');
    processingErrors.forEach(error => {
      console.log(`      "${error.processing_error}": ${error.count} occurrences`);
    });
  } else {
    console.log('   ✅ No processing errors found');
  }
  
  console.log('\n6️⃣ Recent Unprocessed Messages...');
  
  const unprocessedMessages = db.prepare(`
    SELECT 
      id, channel_name, website_page, message_id,
      datetime(created_at, 'unixepoch') as readable_time,
      substr(original_text, 1, 100) as text_preview
    FROM channel_posts 
    WHERE is_processed = 0
    ORDER BY created_at DESC
    LIMIT 5
  `).all();
  
  if (unprocessedMessages.length > 0) {
    console.log(`   ⚠️ Found ${unprocessedMessages.length} unprocessed messages:`);
    unprocessedMessages.forEach((msg, index) => {
      console.log(`      ${index + 1}. ${msg.channel_name} → ${msg.website_page}`);
      console.log(`         Message: ${msg.message_id} | Time: ${msg.readable_time}`);
      console.log(`         Text: "${msg.text_preview}..."`);
    });
  } else {
    console.log('   ✅ All messages have been processed');
  }
  
  console.log('\n7️⃣ Page Content Distribution...');
  
  const pageContent = db.prepare(`
    SELECT 
      display_pages,
      COUNT(*) as count,
      COUNT(CASE WHEN processing_status = 'active' THEN 1 END) as active_count
    FROM unified_content 
    GROUP BY display_pages
    ORDER BY count DESC
  `).all();
  
  console.log('   📊 Content distribution by page:');
  if (pageContent.length > 0) {
    pageContent.forEach(page => {
      console.log(`      ${page.display_pages}: ${page.active_count}/${page.count} active`);
    });
  } else {
    console.log('   ⚠️ No content distribution found!');
  }
  
  db.close();
  
  console.log('\n📋 DIAGNOSIS SUMMARY:');
  console.log('='.repeat(30));
  
  if (recentChannelPosts.length === 0) {
    console.log('❌ CRITICAL: No bot messages found');
  } else if (unifiedContent.length === 0) {
    console.log('❌ CRITICAL: Bot messages not converting to webpage content');
    console.log('   💡 Check message processing pipeline');
  } else {
    console.log('✅ Bot and content system appear to be working');
    console.log('   💡 Check if content is being filtered or hidden');
  }
  
} catch (error) {
  console.error('❌ Error checking content flow:', error.message);
  console.error('Stack trace:', error.stack);
}