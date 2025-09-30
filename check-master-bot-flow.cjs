const Database = require('better-sqlite3');
const path = require('path');

console.log('🤖 Checking Master Bot Processing Flow...\n');

const dbPath = path.join(__dirname, 'database.db');
const db = new Database(dbPath);

async function checkMasterBotFlow() {
  try {
    console.log('📊 MASTER BOT WEBHOOK FLOW ANALYSIS');
    console.log('='.repeat(50));
    
    // 1. Check recent channel posts
    console.log('\n1️⃣ Recent Channel Posts (Last 24 hours):');
    const recentPosts = db.prepare(`
      SELECT 
        id, 
        channel_id, 
        message_id,
        title,
        processed,
        created_at,
        datetime(created_at/1000, 'unixepoch') as readable_time
      FROM channel_posts 
      WHERE created_at > ? 
      ORDER BY created_at DESC 
      LIMIT 10
    `).all(Date.now() - 24 * 60 * 60 * 1000);

    if (recentPosts.length === 0) {
      console.log('   ❌ No recent channel posts found in last 24 hours');
    } else {
      console.log(`   ✅ Found ${recentPosts.length} recent posts:`);
      recentPosts.forEach(post => {
        console.log(`      • ID ${post.id}: ${post.title || 'No title'} (${post.readable_time}) - Processed: ${post.processed ? '✅' : '❌'}`);
      });
    }

    // 2. Check recent unified_content entries
    console.log('\n2️⃣ Recent Unified Content (Last 24 hours):');
    const recentContent = db.prepare(`
      SELECT 
        id, 
        title, 
        source_type,
        source_platform,
        display_pages,
        created_at,
        datetime(created_at, 'unixepoch') as readable_time
      FROM unified_content 
      WHERE created_at > datetime('now', '-24 hours')
      ORDER BY created_at DESC 
      LIMIT 10
    `).all();

    if (recentContent.length === 0) {
      console.log('   ❌ No recent unified_content entries found in last 24 hours');
    } else {
      console.log(`   ✅ Found ${recentContent.length} recent content entries:`);
      recentContent.forEach(content => {
        console.log(`      • ID ${content.id}: ${content.title} (${content.readable_time}) - Pages: ${content.display_pages}`);
      });
    }

    // 3. Check processing pipeline health
    console.log('\n3️⃣ Processing Pipeline Health:');
    const pipelineStats = db.prepare(`
      SELECT 
        COUNT(*) as total_posts,
        SUM(CASE WHEN processed = 1 THEN 1 ELSE 0 END) as processed_posts,
        COUNT(*) - SUM(CASE WHEN processed = 1 THEN 1 ELSE 0 END) as unprocessed_posts
      FROM channel_posts 
      WHERE created_at > ?
    `).get(Date.now() - 24 * 60 * 60 * 1000);

    console.log(`   📈 Pipeline Statistics (Last 24h):`);
    console.log(`      Total Posts: ${pipelineStats.total_posts}`);
    console.log(`      Processed: ${pipelineStats.processed_posts}`);
    console.log(`      Unprocessed: ${pipelineStats.unprocessed_posts}`);
    
    if (pipelineStats.total_posts > 0) {
      const processingRate = (pipelineStats.processed_posts / pipelineStats.total_posts * 100).toFixed(1);
      console.log(`      Processing Rate: ${processingRate}%`);
    }

    // 4. Check content creation correlation
    console.log('\n4️⃣ Content Creation Correlation:');
    const correlationCheck = db.prepare(`
      SELECT 
        cp.id as post_id,
        cp.title as post_title,
        cp.processed,
        cp.created_at as post_time,
        uc.id as content_id,
        uc.title as content_title,
        uc.created_at as content_time
      FROM channel_posts cp
      LEFT JOIN unified_content uc ON (
        uc.source_type = 'telegram' 
        AND uc.created_at >= datetime(cp.created_at/1000, 'unixepoch', '-5 minutes')
        AND uc.created_at <= datetime(cp.created_at/1000, 'unixepoch', '+5 minutes')
      )
      WHERE cp.created_at > ?
      ORDER BY cp.created_at DESC
      LIMIT 10
    `).all(Date.now() - 24 * 60 * 60 * 1000);

    console.log('   📋 Post → Content Mapping:');
    correlationCheck.forEach(row => {
      const status = row.content_id ? '✅ Created' : '❌ Missing';
      console.log(`      Post ${row.post_id} → ${status} ${row.content_id ? `(Content ${row.content_id})` : ''}`);
    });

    // 5. Check webhook endpoint status
    console.log('\n5️⃣ Webhook Status Check:');
    try {
      const response = await fetch('http://localhost:5000/api/health');
      if (response.ok) {
        console.log('   ✅ Server is running and accessible');
      } else {
        console.log('   ⚠️ Server responded with status:', response.status);
      }
    } catch (error) {
      console.log('   ❌ Server is not accessible:', error.message);
    }

    // 6. Check for recent API calls to content endpoints
    console.log('\n6️⃣ Content Display Check:');
    const displayPages = ['prime-picks', 'cue-picks', 'value-picks', 'click-picks', 'global-picks', 'deals-hub', 'loot-box'];
    
    for (const page of displayPages) {
      const pageContent = db.prepare(`
        SELECT COUNT(*) as count 
        FROM unified_content 
        WHERE display_pages LIKE ? 
        AND created_at > datetime('now', '-24 hours')
      `).get(`%${page}%`);
      
      console.log(`   ${page}: ${pageContent.count} recent items`);
    }

    // 7. Diagnosis and recommendations
    console.log('\n🔍 DIAGNOSIS:');
    console.log('='.repeat(30));
    
    if (recentPosts.length === 0) {
      console.log('❌ ISSUE: No recent channel posts - webhook may not be receiving messages');
      console.log('   💡 Check webhook URL configuration');
      console.log('   💡 Verify bot token and permissions');
    } else if (pipelineStats.processed_posts === 0 && pipelineStats.total_posts > 0) {
      console.log('❌ ISSUE: Posts received but not processed');
      console.log('   💡 Check TelegramBotManager.processChannelPost() function');
      console.log('   💡 Verify webhook handler in routes.ts');
    } else if (recentContent.length === 0 && pipelineStats.processed_posts > 0) {
      console.log('❌ ISSUE: Posts processed but no unified_content created');
      console.log('   💡 Check saveProductToDatabase() function');
      console.log('   💡 Verify database schema compatibility');
    } else if (recentPosts.length > 0 && recentContent.length > 0) {
      console.log('✅ HEALTHY: Bot is receiving and processing messages correctly');
      console.log('   📱 Recent posts are being converted to unified_content');
      console.log('   🌐 Content should be visible on webpages');
    }

    console.log('\n🔧 NEXT STEPS:');
    if (recentContent.length === 0) {
      console.log('1. Test the master bot webhook manually');
      console.log('2. Check server logs for processing errors');
      console.log('3. Verify database schema matches saveProductToDatabase function');
    } else {
      console.log('1. Check frontend data fetching');
      console.log('2. Verify API endpoints are serving latest content');
      console.log('3. Clear browser cache and refresh pages');
    }

  } catch (error) {
    console.error('❌ Error checking master bot flow:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    db.close();
  }
}

checkMasterBotFlow();