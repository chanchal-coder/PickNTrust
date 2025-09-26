const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'database.sqlite');
const db = new Database(dbPath);

console.log('🔧 Fixing Channel Posts Processing Pipeline...\n');

// Channel configurations from telegram-bot.ts
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
  // 1. Check current unprocessed posts
  console.log('📊 Current Processing Status:');
  const unprocessedPosts = db.prepare(`
    SELECT 
      channel_id, 
      channel_name, 
      website_page,
      COUNT(*) as count 
    FROM channel_posts 
    WHERE is_processed = 0 
    GROUP BY channel_id, channel_name, website_page
  `).all();
  
  console.log(`Found ${unprocessedPosts.length} groups of unprocessed posts:`);
  unprocessedPosts.forEach(group => {
    console.log(`  Channel ${group.channel_id} (${group.channel_name}) → ${group.website_page}: ${group.count} posts`);
  });
  
  // 2. Process each unprocessed post
  console.log('\n🔄 Processing unprocessed channel posts...');
  
  const allUnprocessedPosts = db.prepare(`
    SELECT * FROM channel_posts 
    WHERE is_processed = 0 
    ORDER BY created_at DESC
  `).all();
  
  console.log(`Processing ${allUnprocessedPosts.length} unprocessed posts...`);
  
  let processed = 0;
  let errors = 0;
  
  for (const post of allUnprocessedPosts) {
    try {
      // Get channel config
      const channelConfig = CHANNEL_CONFIGS[post.channel_id];
      
      if (!channelConfig) {
        console.log(`  ⚠️ No config found for channel ${post.channel_id}, skipping...`);
        continue;
      }
      
      // Create display_pages JSON array
      const displayPages = JSON.stringify([channelConfig.pageSlug]);
      
      // Create unified content entry
      const unifiedContent = {
        title: `${channelConfig.pageName} Product`,
        content: post.processed_text || post.original_text || '',
        source_platform: 'telegram',
        content_type: 'product',
        page_type: channelConfig.pageSlug,
        category: 'general',
        source_type: 'channel',
        status: 'active',
        visibility: 'public',
        display_pages: displayPages,
        processing_status: 'active',
        source_id: post.id.toString(),
        source_message_id: post.message_id.toString(),
        created_at: Date.now()
      };
      
      // Insert into unified_content
      const insertUnified = db.prepare(`
        INSERT INTO unified_content (
          title, content, source_platform, content_type, 
          page_type, category, source_type, status, visibility,
          display_pages, processing_status, source_id, source_message_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = insertUnified.run(
        unifiedContent.title,
        unifiedContent.content,
        unifiedContent.source_platform,
        unifiedContent.content_type,
        unifiedContent.page_type,
        unifiedContent.category,
        unifiedContent.source_type,
        unifiedContent.status,
        unifiedContent.visibility,
        unifiedContent.display_pages,
        unifiedContent.processing_status,
        unifiedContent.source_id,
        unifiedContent.source_message_id,
        unifiedContent.created_at
      );
      
      // Mark channel post as processed
      const updateProcessed = db.prepare(`
        UPDATE channel_posts 
        SET is_processed = 1, is_posted = 1 
        WHERE id = ?
      `);
      updateProcessed.run(post.id);
      
      console.log(`  ✅ Processed post ${post.id} → unified_content ${result.lastInsertRowid} (${channelConfig.pageSlug})`);
      processed++;
      
    } catch (error) {
      console.log(`  ❌ Error processing post ${post.id}: ${error.message}`);
      errors++;
    }
  }
  
  console.log(`\n📊 Processing Results:`);
  console.log(`  ✅ Successfully processed: ${processed}`);
  console.log(`  ❌ Errors: ${errors}`);
  
  // 3. Verify results
  console.log('\n🧪 Verification:');
  
  const verificationQueries = [
    'prime-picks',
    'cue-picks', 
    'value-picks',
    'click-picks',
    'global-picks',
    'deals-hub',
    'loot-box'
  ];
  
  for (const page of verificationQueries) {
    const jsonQuery = `["${page}"]`;
    const count = db.prepare(`
      SELECT COUNT(*) as count 
      FROM unified_content 
      WHERE display_pages = ?
    `).get(jsonQuery);
    
    console.log(`  ${page}: ${count.count} entries`);
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  db.close();
}