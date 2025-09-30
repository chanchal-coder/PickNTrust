const Database = require('better-sqlite3');
const path = require('path');

console.log('🔍 CHANNEL POSTS SIMPLE ANALYSIS');
console.log('='.repeat(60));

// Database setup
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

// CHANNEL_CONFIGS from telegram-bot.ts
const CHANNEL_CONFIGS = {
  '-1002955338551': { pageName: 'Prime Picks', pageSlug: 'prime-picks' },
  '-1002982344997': { pageName: 'Cue Picks', pageSlug: 'cue-picks' },
  '-1003017626269': { pageName: 'Value Picks', pageSlug: 'value-picks' },
  '-1002981205504': { pageName: 'Click Picks', pageSlug: 'click-picks' },
  '-1002902496654': { pageName: 'Global Picks', pageSlug: 'global-picks' },
  '-1003047967930': { pageName: 'Travel Picks', pageSlug: 'travel-picks' },
  '-1003029983162': { pageName: 'Deals Hub', pageSlug: 'deals-hub' },
  '-1002991047787': { pageName: 'Loot Box', pageSlug: 'loot-box' }
};

try {
  console.log('📋 1. CHANNEL_POSTS TABLE STRUCTURE:');
  console.log('-'.repeat(60));
  
  const tableInfo = db.prepare("PRAGMA table_info(channel_posts)").all();
  console.log('Columns in channel_posts table:');
  tableInfo.forEach(col => {
    console.log(`   ${col.name} (${col.type})`);
  });

  console.log('\n📊 2. TOTAL POSTS COUNT:');
  console.log('-'.repeat(60));

  const totalPosts = db.prepare('SELECT COUNT(*) as count FROM channel_posts').get();
  console.log(`Total posts in channel_posts: ${totalPosts.count}`);

  console.log('\n📊 3. POSTS BY CHANNEL:');
  console.log('-'.repeat(60));

  const postsByChannel = db.prepare(`
    SELECT channel_id, website_page, COUNT(*) as count
    FROM channel_posts 
    GROUP BY channel_id, website_page
    ORDER BY count DESC
  `).all();

  console.log('Posts by channel:');
  postsByChannel.forEach(row => {
    const config = CHANNEL_CONFIGS[row.channel_id];
    const channelName = config ? config.pageName : 'Unknown Channel';
    const isCorrectMapping = config && row.website_page === config.pageSlug;
    const status = isCorrectMapping ? '✅' : '❌';
    console.log(`   ${row.channel_id} (${channelName}) → ${row.website_page} → ${row.count} posts ${status}`);
    
    if (!isCorrectMapping && config) {
      console.log(`      💡 Should be: ${config.pageSlug}`);
    }
  });

  console.log('\n📄 4. RECENT POSTS SAMPLE:');
  console.log('-'.repeat(60));

  const recentPosts = db.prepare(`
    SELECT * FROM channel_posts 
    ORDER BY id DESC 
    LIMIT 5
  `).all();

  recentPosts.forEach((post, index) => {
    const config = CHANNEL_CONFIGS[post.channel_id];
    const channelName = config ? config.pageName : 'Unknown';
    console.log(`\n📄 Post ${index + 1}:`);
    console.log(`   Channel: ${channelName} (${post.channel_id})`);
    console.log(`   Website Page: ${post.website_page}`);
    console.log(`   Expected: ${config ? config.pageSlug : 'UNKNOWN'}`);
    console.log(`   Message ID: ${post.message_id}`);
    console.log(`   Text: ${post.original_text?.substring(0, 100)}...`);
    console.log(`   Created: ${new Date(post.created_at * 1000).toLocaleString()}`);
  });

  console.log('\n🔍 5. MAPPING ISSUES IDENTIFIED:');
  console.log('-'.repeat(60));

  const mappingIssues = [];
  postsByChannel.forEach(row => {
    const config = CHANNEL_CONFIGS[row.channel_id];
    if (config && row.website_page !== config.pageSlug) {
      mappingIssues.push({
        channelId: row.channel_id,
        channelName: config.pageName,
        currentMapping: row.website_page,
        correctMapping: config.pageSlug,
        postCount: row.count
      });
    }
  });

  if (mappingIssues.length === 0) {
    console.log('   ✅ All channel mappings are correct');
  } else {
    console.log('   🚨 MAPPING ISSUES FOUND:');
    mappingIssues.forEach(issue => {
      console.log(`   ❌ ${issue.channelName}: ${issue.currentMapping} → should be ${issue.correctMapping} (${issue.postCount} posts affected)`);
    });
  }

  console.log('\n🔍 6. CROSS-REFERENCE WITH UNIFIED_CONTENT:');
  console.log('-'.repeat(60));

  // Check how many channel_posts have corresponding unified_content entries
  const channelPostIds = db.prepare('SELECT id, channel_id, message_id FROM channel_posts').all();
  
  console.log(`Checking ${channelPostIds.length} channel posts for unified_content entries...`);
  
  let foundInUnified = 0;
  let notFoundInUnified = 0;
  
  channelPostIds.forEach(post => {
    // Check if this post exists in unified_content (by source_id or other identifier)
    const unifiedEntry = db.prepare(`
      SELECT id FROM unified_content 
      WHERE source_id = ? OR source_id = ?
    `).get(post.id, post.message_id);
    
    if (unifiedEntry) {
      foundInUnified++;
    } else {
      notFoundInUnified++;
    }
  });

  console.log(`   ✅ Found in unified_content: ${foundInUnified}`);
  console.log(`   ❌ NOT found in unified_content: ${notFoundInUnified}`);

  if (notFoundInUnified > 0) {
    console.log('\n   🚨 CRITICAL ISSUE:');
    console.log(`   ${notFoundInUnified} channel posts are NOT in unified_content table`);
    console.log('   This explains why channel content is not appearing on webpages');
  }

  console.log('\n💡 7. NEXT STEPS:');
  console.log('-'.repeat(60));

  if (mappingIssues.length > 0) {
    console.log('   🔧 Fix website_page mappings in channel_posts');
  }
  
  if (notFoundInUnified > 0) {
    console.log('   🔧 Process channel_posts into unified_content table');
    console.log('   🔧 Check processMessage function in Telegram bot');
  }

  console.log('\n✅ ANALYSIS COMPLETE');

} catch (error) {
  console.error('❌ Error during analysis:', error.message);
  console.error(error.stack);
} finally {
  db.close();
}