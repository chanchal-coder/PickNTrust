const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

console.log('🔍 CHANNEL MAPPING VERIFICATION');
console.log('='.repeat(50));

// CHANNEL_CONFIGS from telegram-bot.ts
const CHANNEL_CONFIGS = {
  '-1002955338551': {
    pageName: 'Prime Picks',
    pageSlug: 'prime-picks'
  },
  '-1002982344997': {
    pageName: 'Cue Picks',
    pageSlug: 'cue-picks'
  },
  '-1003017626269': {
    pageName: 'Value Picks',
    pageSlug: 'value-picks'
  },
  '-1002981205504': {
    pageName: 'Click Picks',
    pageSlug: 'click-picks'
  },
  '-1002902496654': {
    pageName: 'Global Picks',
    pageSlug: 'global-picks'
  },
  '-1003047967930': {
    pageName: 'Travel Picks',
    pageSlug: 'travel-picks'
  },
  '-1003029983162': {
    pageName: 'Deals Hub',
    pageSlug: 'deals-hub'
  },
  '-1002991047787': {
    pageName: 'Loot Box',
    pageSlug: 'loot-box'
  }
};

try {
  console.log('📋 CHANNEL CONFIGURATION MAPPING:');
  console.log('Channel ID → Page Name → Page Slug');
  console.log('-'.repeat(50));
  
  Object.entries(CHANNEL_CONFIGS).forEach(([channelId, config]) => {
    console.log(`${channelId} → ${config.pageName} → ${config.pageSlug}`);
  });

  // Check what display_pages values exist in database
  console.log('\n📊 DATABASE DISPLAY_PAGES VALUES:');
  const displayPagesData = db.prepare(`
    SELECT display_pages, COUNT(*) as count 
    FROM unified_content 
    GROUP BY display_pages 
    ORDER BY count DESC
  `).all();

  displayPagesData.forEach(row => {
    console.log(`  ${row.display_pages}: ${row.count} entries`);
  });

  // Cross-reference mapping
  console.log('\n🔍 MAPPING VERIFICATION:');
  console.log('Checking if each channel maps to correct display_pages...');
  console.log('-'.repeat(50));

  const pageSlugToChannelId = {};
  Object.entries(CHANNEL_CONFIGS).forEach(([channelId, config]) => {
    pageSlugToChannelId[config.pageSlug] = channelId;
  });

  // Check each display_pages value
  displayPagesData.forEach(row => {
    const displayPages = JSON.parse(row.display_pages);
    const pageSlug = displayPages[0]; // Assuming single page for now
    
    const mappedChannelId = pageSlugToChannelId[pageSlug];
    const channelConfig = CHANNEL_CONFIGS[mappedChannelId];
    
    if (channelConfig) {
      console.log(`✅ ${pageSlug}: Mapped to channel ${mappedChannelId} (${channelConfig.pageName})`);
    } else {
      console.log(`❌ ${pageSlug}: NO CHANNEL MAPPING FOUND`);
    }
  });

  // Check for missing channels
  console.log('\n🔍 MISSING CHANNEL MAPPINGS:');
  const configuredPages = Object.values(CHANNEL_CONFIGS).map(c => c.pageSlug);
  const databasePages = displayPagesData.map(row => JSON.parse(row.display_pages)[0]);
  
  const missingInDatabase = configuredPages.filter(page => !databasePages.includes(page));
  const missingInConfig = databasePages.filter(page => !configuredPages.includes(page));

  if (missingInDatabase.length > 0) {
    console.log('❌ Pages configured but no content in database:');
    missingInDatabase.forEach(page => console.log(`  - ${page}`));
  }

  if (missingInConfig.length > 0) {
    console.log('❌ Pages with content but no channel configuration:');
    missingInConfig.forEach(page => console.log(`  - ${page}`));
  }

  if (missingInDatabase.length === 0 && missingInConfig.length === 0) {
    console.log('✅ All pages have proper channel mappings!');
  }

  // Check channel_posts table for posting activity
  console.log('\n📨 CHANNEL POSTING ACTIVITY:');
  try {
    const channelPosts = db.prepare(`
      SELECT channel_id, channel_name, COUNT(*) as post_count
      FROM channel_posts 
      GROUP BY channel_id, channel_name
      ORDER BY post_count DESC
    `).all();

    if (channelPosts.length > 0) {
      console.log('Recent channel posting activity:');
      channelPosts.forEach(post => {
        const config = CHANNEL_CONFIGS[post.channel_id];
        const pageName = config ? config.pageName : 'Unknown';
        console.log(`  ${post.channel_id} (${pageName}): ${post.post_count} posts`);
      });
    } else {
      console.log('❌ No channel posting activity found in channel_posts table');
    }
  } catch (error) {
    console.log('❌ Error checking channel_posts:', error.message);
  }

} catch (error) {
  console.error('Error:', error.message);
} finally {
  db.close();
}