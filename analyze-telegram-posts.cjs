const Database = require('better-sqlite3');
const path = require('path');

console.log('🔍 TELEGRAM POSTS ANALYSIS');
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
  console.log('📊 1. TELEGRAM POSTS IN DATABASE:');
  console.log('-'.repeat(60));

  const telegramPosts = db.prepare(`
    SELECT * FROM unified_content 
    WHERE source_type = 'telegram' OR source_platform = 'telegram'
    ORDER BY created_at DESC
  `).all();

  if (telegramPosts.length === 0) {
    console.log('   ❌ NO TELEGRAM POSTS FOUND IN DATABASE!');
    console.log('   This explains why channel content is not appearing on webpages.');
  } else {
    console.log(`   📱 Found ${telegramPosts.length} Telegram posts:`);
    telegramPosts.forEach((post, index) => {
      console.log(`\n   📄 Post ${index + 1}:`);
      console.log(`      ID: ${post.id}`);
      console.log(`      Title: ${post.title}`);
      console.log(`      Source ID: ${post.source_id}`);
      console.log(`      Display Pages: ${post.display_pages}`);
      console.log(`      Processing Status: ${post.processing_status}`);
      console.log(`      Created: ${post.created_at}`);
      console.log(`      Source Type: ${post.source_type}`);
      console.log(`      Source Platform: ${post.source_platform}`);
    });
  }

  console.log('\n📊 2. ALL POSTS BY SOURCE TYPE:');
  console.log('-'.repeat(60));

  const postsBySource = db.prepare(`
    SELECT source_type, source_platform, COUNT(*) as count, processing_status
    FROM unified_content 
    GROUP BY source_type, source_platform, processing_status
    ORDER BY count DESC
  `).all();

  postsBySource.forEach(row => {
    console.log(`   ${row.source_type || 'NULL'} / ${row.source_platform || 'NULL'} → ${row.count} posts (${row.processing_status})`);
  });

  console.log('\n📊 3. CHECKING CHANNEL_POSTS TABLE:');
  console.log('-'.repeat(60));

  // Check if channel_posts table exists
  const tables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name LIKE '%channel%'
  `).all();

  if (tables.length === 0) {
    console.log('   ❌ No channel-related tables found');
  } else {
    console.log('   📋 Found channel-related tables:');
    tables.forEach(table => {
      console.log(`      ${table.name}`);
      
      try {
        const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
        console.log(`         → ${count.count} records`);
        
        if (count.count > 0) {
          const sample = db.prepare(`SELECT * FROM ${table.name} LIMIT 3`).all();
          console.log('         Sample records:');
          sample.forEach((record, idx) => {
            console.log(`           ${idx + 1}. ${JSON.stringify(record, null, 2).substring(0, 200)}...`);
          });
        }
      } catch (error) {
        console.log(`         ❌ Error reading table: ${error.message}`);
      }
    });
  }

  console.log('\n📊 4. RECENT ACTIVITY ANALYSIS:');
  console.log('-'.repeat(60));

  const recentActivity = db.prepare(`
    SELECT 
      DATE(created_at) as date,
      source_type,
      COUNT(*) as count
    FROM unified_content 
    WHERE created_at > datetime('now', '-30 days')
    GROUP BY DATE(created_at), source_type
    ORDER BY date DESC
  `).all();

  if (recentActivity.length === 0) {
    console.log('   ❌ No activity in the last 30 days');
  } else {
    console.log('   📅 Recent activity (last 30 days):');
    recentActivity.forEach(row => {
      console.log(`      ${row.date}: ${row.count} ${row.source_type} posts`);
    });
  }

  console.log('\n🔍 5. DIAGNOSIS:');
  console.log('-'.repeat(60));

  const totalPosts = db.prepare('SELECT COUNT(*) as count FROM unified_content').get();
  const telegramCount = db.prepare(`SELECT COUNT(*) as count FROM unified_content WHERE source_type = 'telegram'`).get();
  const manualCount = db.prepare(`SELECT COUNT(*) as count FROM unified_content WHERE source_type = 'manual'`).get();

  console.log(`   📊 Total posts: ${totalPosts.count}`);
  console.log(`   📱 Telegram posts: ${telegramCount.count}`);
  console.log(`   ✋ Manual posts: ${manualCount.count}`);

  if (telegramCount.count === 0) {
    console.log('\n   🚨 CRITICAL ISSUE IDENTIFIED:');
    console.log('   ❌ No Telegram posts are being saved to unified_content table');
    console.log('   ❌ This means the Telegram bot is not properly processing messages');
    console.log('   ❌ Or the processMessage function is not working correctly');
    console.log('\n   💡 NEXT STEPS:');
    console.log('   1. Check if Telegram bot is running and receiving messages');
    console.log('   2. Verify processMessage function in start-bot-webhook.cjs');
    console.log('   3. Test posting a message to a Telegram channel');
    console.log('   4. Check bot logs for errors');
  } else {
    console.log('\n   ✅ Telegram posts are being processed');
    console.log('   💡 Check if display_pages mapping is correct');
  }

  console.log('\n✅ ANALYSIS COMPLETE');

} catch (error) {
  console.error('❌ Error during analysis:', error.message);
  console.error(error.stack);
} finally {
  db.close();
}