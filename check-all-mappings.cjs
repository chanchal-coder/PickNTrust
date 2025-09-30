const Database = require('better-sqlite3');
const path = require('path');

console.log('🔍 COMPREHENSIVE MAPPING CHECK');
console.log('='.repeat(60));

// Database setup
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

// CHANNEL_CONFIGS from telegram-bot.ts (the authoritative source)
const CHANNEL_CONFIGS = {
  '-1002955338551': {
    pageName: 'Prime Picks',
    affiliateTag: '{{URL}}{{SEP}}tag=pickntrust03-21',
    platform: 'amazon',
    pageSlug: 'prime-picks'
  },
  '-1002982344997': {
    pageName: 'Cue Picks',
    affiliateTag: 'https://linksredirect.com/?cid=243942&source=linkkit&url=%7B%7BURL_ENC%7D%7D',
    platform: 'cuelinks',
    pageSlug: 'cue-picks'
  },
  '-1003017626269': {
    pageName: 'Value Picks',
    affiliateTag: '',
    platform: 'earnkaro',
    pageSlug: 'value-picks'
  },
  '-1002981205504': {
    pageName: 'Click Picks',
    affiliateTag: '',
    platform: 'multiple',
    platforms: ['cuelinks', 'inrdeals', 'earnkaro'],
    pageSlug: 'click-picks'
  },
  '-1002902496654': {
    pageName: 'Global Picks',
    affiliateTag: '',
    platform: 'multiple',
    platforms: ['cuelinks', 'inrdeals', 'earnkaro'],
    pageSlug: 'global-picks'
  },
  '-1003047967930': {
    pageName: 'Travel Picks',
    affiliateTag: '',
    platform: 'multiple',
    platforms: ['cuelinks', 'inrdeals', 'earnkaro'],
    pageSlug: 'travel-picks'
  },
  '-1003029983162': {
    pageName: 'Deals Hub',
    affiliateTag: 'id=sha678089037',
    platform: 'inrdeals',
    pageSlug: 'deals-hub'
  },
  '-1002991047787': {
    pageName: 'Loot Box',
    affiliateTag: '{{URL}}{{SEP}}ref=sicvppak',
    platform: 'deodap',
    pageSlug: 'loot-box'
  }
};

try {
  console.log('📋 1. CHANNEL CONFIGURATION MAPPING:');
  console.log('Channel ID → Page Name → Page Slug → Platform');
  console.log('-'.repeat(60));
  
  Object.entries(CHANNEL_CONFIGS).forEach(([channelId, config]) => {
    const platforms = config.platforms ? config.platforms.join(', ') : config.platform;
    console.log(`${channelId} → ${config.pageName} → ${config.pageSlug} → ${platforms}`);
  });

  console.log('\n📊 2. DATABASE CONTENT ANALYSIS:');
  console.log('-'.repeat(60));

  // Check unified_content table structure
  const tableInfo = db.prepare("PRAGMA table_info(unified_content)").all();
  console.log('📋 unified_content table columns:');
  tableInfo.forEach(col => {
    console.log(`   ${col.name} (${col.type})`);
  });

  // Check what display_pages values exist in database
  console.log('\n📊 DISPLAY_PAGES VALUES IN DATABASE:');
  const displayPagesData = db.prepare(`
    SELECT display_pages, COUNT(*) as count, processing_status
    FROM unified_content 
    GROUP BY display_pages, processing_status
    ORDER BY count DESC
  `).all();

  if (displayPagesData.length === 0) {
    console.log('   ❌ No data found in unified_content table');
  } else {
    displayPagesData.forEach(row => {
      console.log(`   ${row.display_pages} → Count: ${row.count}, Status: ${row.processing_status}`);
    });
  }

  console.log('\n🔍 3. CHANNEL-SPECIFIC CONTENT CHECK:');
  console.log('-'.repeat(60));

  Object.entries(CHANNEL_CONFIGS).forEach(([channelId, config]) => {
    console.log(`\n📺 ${config.pageName} (${channelId}):`);
    
    // Check for content with this channel ID
    const channelContent = db.prepare(`
      SELECT COUNT(*) as count, processing_status
      FROM unified_content 
      WHERE channel_id = ? OR channel_id = ?
      GROUP BY processing_status
    `).all(channelId, parseInt(channelId));

    if (channelContent.length === 0) {
      console.log('   ❌ No content found for this channel ID');
    } else {
      channelContent.forEach(row => {
        console.log(`   📊 ${row.count} posts with status: ${row.processing_status}`);
      });
    }

    // Check for content with matching display_pages
    const pageContent = db.prepare(`
      SELECT COUNT(*) as count, processing_status
      FROM unified_content 
      WHERE display_pages LIKE '%' || ? || '%' OR display_pages = ?
      GROUP BY processing_status
    `).all(config.pageSlug, config.pageSlug);

    if (pageContent.length === 0) {
      console.log('   ❌ No content found for page slug: ' + config.pageSlug);
    } else {
      pageContent.forEach(row => {
        console.log(`   📄 ${row.count} posts for page '${config.pageSlug}' with status: ${row.processing_status}`);
      });
    }
  });

  console.log('\n🔍 4. RECENT ACTIVITY CHECK:');
  console.log('-'.repeat(60));

  const recentPosts = db.prepare(`
    SELECT channel_id, display_pages, processing_status, created_at, title
    FROM unified_content 
    WHERE created_at > datetime('now', '-7 days')
    ORDER BY created_at DESC
    LIMIT 10
  `).all();

  if (recentPosts.length === 0) {
    console.log('   ❌ No posts found in the last 7 days');
  } else {
    console.log('   📅 Recent posts (last 7 days):');
    recentPosts.forEach(post => {
      const channelConfig = CHANNEL_CONFIGS[post.channel_id];
      const channelName = channelConfig ? channelConfig.pageName : 'Unknown Channel';
      console.log(`   ${post.created_at} | ${channelName} | ${post.display_pages} | ${post.processing_status} | ${post.title?.substring(0, 50)}...`);
    });
  }

  console.log('\n🔍 5. MAPPING CONSISTENCY CHECK:');
  console.log('-'.repeat(60));

  // Check for mismatched mappings
  const allChannelIds = db.prepare(`
    SELECT DISTINCT channel_id 
    FROM unified_content 
    WHERE channel_id IS NOT NULL
  `).all();

  console.log('📊 Channel IDs found in database:');
  allChannelIds.forEach(row => {
    const channelId = row.channel_id.toString();
    const config = CHANNEL_CONFIGS[channelId];
    if (config) {
      console.log(`   ✅ ${channelId} → ${config.pageName} (${config.pageSlug})`);
    } else {
      console.log(`   ❌ ${channelId} → NOT CONFIGURED`);
    }
  });

  console.log('\n🔍 6. API ENDPOINT SIMULATION:');
  console.log('-'.repeat(60));

  Object.entries(CHANNEL_CONFIGS).forEach(([channelId, config]) => {
    // Simulate API query for this page
    const apiResults = db.prepare(`
      SELECT COUNT(*) as count
      FROM unified_content 
      WHERE (display_pages LIKE '%' || ? || '%' OR display_pages = ?)
      AND processing_status = 'active'
    `).get(config.pageSlug, config.pageSlug);

    console.log(`   /api/products/page/${config.pageSlug} → ${apiResults.count} products`);
  });

  console.log('\n✅ MAPPING CHECK COMPLETE');
  console.log('='.repeat(60));

} catch (error) {
  console.error('❌ Error during mapping check:', error.message);
  console.error(error.stack);
} finally {
  db.close();
}