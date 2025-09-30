/**
 * Diagnose Posting Issues - Fixed Version
 * Comprehensive investigation of why content might not be posting to webpages
 * Using correct database schema
 */

const Database = require('better-sqlite3');
const fetch = require('node-fetch');

console.log('🔍 DIAGNOSING POSTING ISSUES');
console.log('='.repeat(50));

async function diagnosePostingIssues() {
  try {
    console.log('\n1️⃣ Database Activity Check...');
    
    const db = new Database('database.sqlite');
    
    // Check recent posts in channel_posts table (using correct schema)
    const recentChannelPosts = db.prepare(`
      SELECT 
        id, channel_id, message_id, created_at,
        datetime(created_at/1000, 'unixepoch') as readable_time
      FROM channel_posts 
      ORDER BY created_at DESC 
      LIMIT 10
    `).all();
    
    console.log(`   📊 Recent channel posts: ${recentChannelPosts.length}`);
    
    if (recentChannelPosts.length > 0) {
      console.log('   📋 Latest channel posts:');
      recentChannelPosts.forEach((post, index) => {
        console.log(`      ${index + 1}. Channel: ${post.channel_id} | Message: ${post.message_id}`);
        console.log(`         Time: ${post.readable_time}`);
      });
    } else {
      console.log('   ⚠️ No recent channel posts found!');
    }
    
    // Check recent unified_content entries
    const recentUnifiedContent = db.prepare(`
      SELECT 
        id, title, display_pages, processing_status, created_at,
        datetime(created_at/1000, 'unixepoch') as readable_time
      FROM unified_content 
      ORDER BY created_at DESC 
      LIMIT 10
    `).all();
    
    console.log(`\n   📊 Recent unified content: ${recentUnifiedContent.length}`);
    
    if (recentUnifiedContent.length > 0) {
      console.log('   📋 Latest unified content:');
      recentUnifiedContent.forEach((content, index) => {
        console.log(`      ${index + 1}. "${content.title}" | Status: ${content.processing_status}`);
        console.log(`         Pages: ${content.display_pages} | Time: ${content.readable_time}`);
      });
    } else {
      console.log('   ⚠️ No recent unified content found!');
    }
    
    console.log('\n2️⃣ Bot Status Check...');
    
    // Check if bot is running by looking at recent activity
    const botActivity = db.prepare(`
      SELECT COUNT(*) as count
      FROM channel_posts 
      WHERE created_at > ?
    `).get(Date.now() - (24 * 60 * 60 * 1000)); // Last 24 hours
    
    console.log(`   📊 Bot activity (last 24h): ${botActivity.count} posts`);
    
    if (botActivity.count === 0) {
      console.log('   ⚠️ No bot activity in the last 24 hours!');
      console.log('   💡 This might indicate the bot is not receiving messages');
    }
    
    console.log('\n3️⃣ Processing Status Analysis...');
    
    // Check processing status distribution
    const statusDistribution = db.prepare(`
      SELECT processing_status, COUNT(*) as count
      FROM unified_content 
      GROUP BY processing_status
      ORDER BY count DESC
    `).all();
    
    console.log('   📊 Content processing status:');
    statusDistribution.forEach(status => {
      console.log(`      ${status.processing_status}: ${status.count} items`);
    });
    
    // Check for failed processing
    const failedProcessing = db.prepare(`
      SELECT id, title, processing_status, created_at
      FROM unified_content 
      WHERE processing_status != 'active'
      ORDER BY created_at DESC 
      LIMIT 5
    `).all();
    
    if (failedProcessing.length > 0) {
      console.log('\n   ⚠️ Non-active content found:');
      failedProcessing.forEach(item => {
        console.log(`      "${item.title}" - Status: ${item.processing_status}`);
      });
    }
    
    console.log('\n4️⃣ Channel Mapping Check...');
    
    // Check if channel posts are being mapped to unified_content
    const channelToContentMapping = db.prepare(`
      SELECT 
        cp.channel_id,
        COUNT(cp.id) as channel_posts,
        COUNT(uc.id) as unified_content
      FROM channel_posts cp
      LEFT JOIN unified_content uc ON cp.message_id = uc.source_message_id
      WHERE cp.created_at > ?
      GROUP BY cp.channel_id
    `).all(Date.now() - (7 * 24 * 60 * 60 * 1000)); // Last 7 days
    
    console.log('   📊 Channel to content mapping (last 7 days):');
    if (channelToContentMapping.length > 0) {
      channelToContentMapping.forEach(mapping => {
        console.log(`      Channel ${mapping.channel_id}: ${mapping.channel_posts} posts → ${mapping.unified_content} content items`);
        
        if (mapping.channel_posts > 0 && mapping.unified_content === 0) {
          console.log(`      ⚠️ Channel ${mapping.channel_id} has posts but no unified content!`);
        }
      });
    } else {
      console.log('   ⚠️ No channel activity in the last 7 days!');
    }
    
    console.log('\n5️⃣ API Endpoint Test...');
    
    // Test API endpoints
    const testPages = ['prime-picks', 'cue-picks', 'value-picks', 'click-picks'];
    
    for (const page of testPages) {
      try {
        const response = await fetch(`http://localhost:5000/api/products/page/${page}`);
        if (response.ok) {
          const data = await response.json();
          console.log(`   ✅ ${page}: ${data.length} products`);
          
          if (data.length === 0) {
            console.log(`   ⚠️ ${page} has no products - check content distribution`);
          }
        } else {
          console.log(`   ❌ ${page}: API error ${response.status}`);
        }
      } catch (error) {
        console.log(`   ❌ ${page}: ${error.message}`);
      }
    }
    
    console.log('\n6️⃣ Recent Message Processing Check...');
    
    // Check if recent messages have been processed
    const unprocessedMessages = db.prepare(`
      SELECT cp.id, cp.channel_id, cp.message_id, cp.created_at,
             datetime(cp.created_at/1000, 'unixepoch') as readable_time
      FROM channel_posts cp
      LEFT JOIN unified_content uc ON cp.message_id = uc.source_message_id
      WHERE uc.id IS NULL
      AND cp.created_at > ?
      ORDER BY cp.created_at DESC
      LIMIT 10
    `).all(Date.now() - (24 * 60 * 60 * 1000)); // Last 24 hours
    
    if (unprocessedMessages.length > 0) {
      console.log(`   ⚠️ Found ${unprocessedMessages.length} unprocessed messages:`);
      unprocessedMessages.forEach(msg => {
        console.log(`      Channel: ${msg.channel_id}, Message: ${msg.message_id}, Time: ${msg.readable_time}`);
      });
    } else {
      console.log('   ✅ All recent messages have been processed');
    }
    
    console.log('\n7️⃣ Webhook Status Check...');
    
    // Check if webhook is receiving data by looking at very recent posts
    const veryRecentPosts = db.prepare(`
      SELECT COUNT(*) as count
      FROM channel_posts 
      WHERE created_at > ?
    `).get(Date.now() - (60 * 60 * 1000)); // Last hour
    
    console.log(`   📊 Posts in last hour: ${veryRecentPosts.count}`);
    
    if (veryRecentPosts.count === 0) {
      console.log('   ⚠️ No posts in the last hour - webhook might not be working');
    }
    
    console.log('\n8️⃣ Content Distribution Check...');
    
    // Check how content is distributed across pages
    const pageDistribution = db.prepare(`
      SELECT display_pages, COUNT(*) as count
      FROM unified_content 
      WHERE processing_status = 'active'
      GROUP BY display_pages
      ORDER BY count DESC
    `).all();
    
    console.log('   📊 Active content distribution by page:');
    if (pageDistribution.length > 0) {
      pageDistribution.forEach(dist => {
        console.log(`      ${dist.display_pages}: ${dist.count} items`);
      });
    } else {
      console.log('   ⚠️ No active content found!');
    }
    
    db.close();
    
    console.log('\n📋 DIAGNOSIS SUMMARY:');
    console.log('='.repeat(30));
    
    // Provide recommendations based on findings
    if (recentChannelPosts.length === 0) {
      console.log('❌ CRITICAL ISSUE: No channel posts found');
      console.log('   💡 Check if Telegram bot webhook is properly configured');
      console.log('   💡 Verify bot token and webhook URL');
      console.log('   💡 Check if bot is running and accessible');
    }
    
    if (recentUnifiedContent.length === 0) {
      console.log('❌ CRITICAL ISSUE: No unified content found');
      console.log('   💡 Check if message processing is working');
      console.log('   💡 Verify content parsing and storage logic');
    }
    
    if (botActivity.count === 0) {
      console.log('❌ CRITICAL ISSUE: No bot activity in 24 hours');
      console.log('   💡 Bot might be offline or not receiving messages');
      console.log('   💡 Check webhook configuration and bot status');
    }
    
    if (unprocessedMessages.length > 0) {
      console.log('⚠️ WARNING: Unprocessed messages found');
      console.log('   💡 Message processing pipeline might be broken');
      console.log('   💡 Check processing logic and error handling');
    }
    
    console.log('\n🔧 NEXT STEPS:');
    console.log('1. Check bot webhook configuration and status');
    console.log('2. Verify Telegram bot is receiving messages');
    console.log('3. Test message processing pipeline');
    console.log('4. Check server logs for any errors');
    console.log('5. Verify channel IDs and message routing');
    
  } catch (error) {
    console.error('❌ Error diagnosing posting issues:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the diagnosis
diagnosePostingIssues();