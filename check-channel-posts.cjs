const Database = require('better-sqlite3');
const path = require('path');

console.log('🔍 CHANNEL POSTS DETAILED ANALYSIS');
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

  console.log('\n📊 2. CHANNEL_POSTS CONTENT ANALYSIS:');
  console.log('-'.repeat(60));

  const totalPosts = db.prepare('SELECT COUNT(*) as count FROM channel_posts').get();
  console.log(`Total posts in channel_posts: ${totalPosts.count}`);

  // Group by channel_id
  const postsByChannel = db.prepare(`
    SELECT channel_id, website_page, COUNT(*) as count
    FROM channel_posts 
    GROUP BY channel_id, website_page
    ORDER BY count DESC
  `).all();

  console.log('\nPosts by channel:');
  postsByChannel.forEach(row => {
    const config = CHANNEL_CONFIGS[row.channel_id];
    const channelName = config ? config.pageName : 'Unknown Channel';
    console.log(`   ${row.channel_id} (${channelName}) → ${row.website_page} → ${row.count} posts`);
  });

  console.log('\n📄 3. SAMPLE CHANNEL POSTS:');
  console.log('-'.repeat(60));

  const samplePosts = db.prepare(`
    SELECT * FROM channel_posts 
    ORDER BY id DESC 
    LIMIT 5
  `).all();

  samplePosts.forEach((post, index) => {
    console.log(`\n📄 Post ${index + 1}:`);
    console.log(`   ID: ${post.id}`);
    console.log(`   Channel ID: ${post.channel_id}`);
    console.log(`   Website Page: ${post.website_page}`);
    console.log(`   Message ID: ${post.message_id}`);
    console.log(`   Original Text: ${post.original_text?.substring(0, 100)}...`);
    console.log(`   Processed Text: ${post.processed_text?.substring(0, 100)}...`);
    console.log(`   Created At: ${post.created_at}`);
    console.log(`   Processing Status: ${post.processing_status}`);
  });

  console.log('\n🔍 4. PROCESSING STATUS ANALYSIS:');
  console.log('-'.repeat(60));

  const statusAnalysis = db.prepare(`
    SELECT processing_status, COUNT(*) as count
    FROM channel_posts 
    GROUP BY processing_status
    ORDER BY count DESC
  `).all();

  console.log('Processing status distribution:');
  statusAnalysis.forEach(row => {
    console.log(`   ${row.processing_status || 'NULL'} → ${row.count} posts`);
  });

  console.log('\n🔍 5. UNPROCESSED POSTS:');
  console.log('-'.repeat(60));

  const unprocessedPosts = db.prepare(`
    SELECT * FROM channel_posts 
    WHERE processing_status IS NULL OR processing_status != 'processed'
    ORDER BY created_at DESC
    LIMIT 10
  `).all();

  if (unprocessedPosts.length === 0) {
    console.log('   ✅ All posts have been processed');
  } else {
    console.log(`   🚨 Found ${unprocessedPosts.length} unprocessed posts (showing first 10):`);
    unprocessedPosts.forEach((post, index) => {
      const config = CHANNEL_CONFIGS[post.channel_id];
      const channelName = config ? config.pageName : 'Unknown';
      console.log(`\n   📄 Unprocessed Post ${index + 1}:`);
      console.log(`      Channel: ${channelName} (${post.channel_id})`);
      console.log(`      Website Page: ${post.website_page}`);
      console.log(`      Expected Page Slug: ${config ? config.pageSlug : 'UNKNOWN'}`);
      console.log(`      Message ID: ${post.message_id}`);
      console.log(`      Text: ${post.original_text?.substring(0, 150)}...`);
      console.log(`      Status: ${post.processing_status || 'NULL'}`);
      console.log(`      Created: ${post.created_at}`);
    });
  }

  console.log('\n🔍 6. MAPPING ISSUES:');
  console.log('-'.repeat(60));

  const mappingIssues = db.prepare(`
    SELECT DISTINCT channel_id, website_page
    FROM channel_posts
  `).all();

  console.log('Channel ID to website_page mappings in database:');
  mappingIssues.forEach(row => {
    const config = CHANNEL_CONFIGS[row.channel_id];
    if (config) {
      const isCorrect = row.website_page === config.pageSlug;
      console.log(`   ${row.channel_id} → ${row.website_page} ${isCorrect ? '✅' : '❌ (should be ' + config.pageSlug + ')'}`);
    } else {
      console.log(`   ${row.channel_id} → ${row.website_page} ❌ (channel not configured)`);
    }
  });

  console.log('\n💡 7. RECOMMENDATIONS:');
  console.log('-'.repeat(60));

  if (unprocessedPosts.length > 0) {
    console.log('   🔧 ACTIONS NEEDED:');
    console.log('   1. Process unprocessed channel_posts into unified_content');
    console.log('   2. Fix website_page mapping to use correct pageSlug values');
    console.log('   3. Ensure processMessage function is working correctly');
    console.log('   4. Set up automatic processing for new posts');
  } else {
    console.log('   ✅ All posts are processed - check unified_content mapping');
  }

  console.log('\n✅ ANALYSIS COMPLETE');

} catch (error) {
  console.error('❌ Error during analysis:', error.message);
  console.error(error.stack);
} finally {
  db.close();
}