const Database = require('better-sqlite3');
const path = require('path');

console.log('🔧 FIXING CHANNEL PROCESSING ISSUES');
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
  console.log('🔍 1. FIXING WEBSITE_PAGE MAPPINGS:');
  console.log('-'.repeat(60));

  // Fix incorrect mappings first
  const mappingFixes = [
    { from: 'migrated-page', to: 'prime-picks', channelId: '-1002955338551' }
  ];

  mappingFixes.forEach(fix => {
    const updateResult = db.prepare(`
      UPDATE channel_posts 
      SET website_page = ? 
      WHERE website_page = ? AND channel_id = ?
    `).run(fix.to, fix.from, fix.channelId);
    
    console.log(`   ✅ Fixed ${updateResult.changes} posts: ${fix.from} → ${fix.to}`);
  });

  console.log('\n🔄 2. PROCESSING CHANNEL_POSTS TO UNIFIED_CONTENT:');
  console.log('-'.repeat(60));

  // Get all channel posts that need processing
  const channelPosts = db.prepare(`
    SELECT * FROM channel_posts 
    ORDER BY created_at ASC
  `).all();

  console.log(`Found ${channelPosts.length} channel posts to process...`);

  let processed = 0;
  let skipped = 0;
  let errors = 0;

  // Prepare insert statement for unified_content
  const insertUnified = db.prepare(`
    INSERT INTO unified_content (
      title, description, price, original_price, image_url, affiliate_url,
      content_type, page_type, category, source_type, source_id,
      display_pages, processing_status, status, visibility,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  channelPosts.forEach((post, index) => {
    try {
      console.log(`\n📄 Processing post ${index + 1}/${channelPosts.length}:`);
      console.log(`   Channel: ${post.channel_id}`);
      console.log(`   Website Page: ${post.website_page}`);
      console.log(`   Text: ${post.original_text?.substring(0, 100)}...`);

      // Check if already processed (by source_id)
      const existing = db.prepare(`
        SELECT id FROM unified_content WHERE source_id = ?
      `).get(post.id);

      if (existing) {
        console.log(`   ⏭️  Already processed (unified_content ID: ${existing.id})`);
        skipped++;
        return;
      }

      // Get channel config
      const config = CHANNEL_CONFIGS[post.channel_id];
      if (!config) {
        console.log(`   ❌ No config found for channel ${post.channel_id}`);
        errors++;
        return;
      }

      // Extract basic info from text
      const text = post.original_text || post.processed_text || '';
      const lines = text.split('\n').filter(line => line.trim());
      
      // Try to extract title (first non-empty line or first line with product info)
      let title = 'Channel Post';
      if (lines.length > 0) {
        // Look for a line that seems like a title (not just URL or emoji)
        const titleLine = lines.find(line => 
          line.length > 10 && 
          !line.startsWith('http') && 
          !line.match(/^[💰🔥✨⚡🎯📱💥⏰🛒]+$/)
        );
        title = titleLine ? titleLine.substring(0, 200) : lines[0].substring(0, 200);
      }

      // Try to extract price
      let price = null;
      let originalPrice = null;
      const priceMatch = text.match(/₹[\d,]+/g);
      if (priceMatch && priceMatch.length >= 1) {
        price = priceMatch[0];
        if (priceMatch.length >= 2) {
          originalPrice = priceMatch[1];
        }
      }

      // Try to extract URL
      let affiliateUrl = null;
      const urlMatch = text.match(/(https?:\/\/[^\s]+)/);
      if (urlMatch) {
        affiliateUrl = urlMatch[1];
      }

      // Create display_pages as JSON array
      const displayPages = JSON.stringify([post.website_page]);

      // Insert into unified_content
      const result = insertUnified.run(
        title,                          // title
        text.substring(0, 500),         // description
        price,                          // price
        originalPrice,                  // original_price
        null,                          // image_url
        affiliateUrl,                  // affiliate_url
        'product',                     // content_type
        post.website_page,             // page_type
        'General',                     // category
        'telegram',                    // source_type
        post.id,                       // source_id
        displayPages,                  // display_pages
        'active',                      // processing_status
        'published',                   // status
        'public',                      // visibility
        post.created_at,               // created_at
        Math.floor(Date.now() / 1000)  // updated_at
      );

      console.log(`   ✅ Processed → unified_content ID: ${result.lastInsertRowid}`);
      processed++;

    } catch (error) {
      console.log(`   ❌ Error processing post: ${error.message}`);
      errors++;
    }
  });

  console.log('\n📊 3. PROCESSING SUMMARY:');
  console.log('-'.repeat(60));
  console.log(`   ✅ Successfully processed: ${processed}`);
  console.log(`   ⏭️  Already processed: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`   📊 Total channel posts: ${channelPosts.length}`);

  console.log('\n🔍 4. VERIFICATION:');
  console.log('-'.repeat(60));

  // Verify the results
  const unifiedCount = db.prepare(`
    SELECT COUNT(*) as count FROM unified_content WHERE source_type = 'telegram'
  `).get();

  console.log(`   📊 Telegram posts in unified_content: ${unifiedCount.count}`);

  // Check by page
  Object.entries(CHANNEL_CONFIGS).forEach(([channelId, config]) => {
    const pageCount = db.prepare(`
      SELECT COUNT(*) as count FROM unified_content 
      WHERE display_pages LIKE '%' || ? || '%' AND processing_status = 'active'
    `).get(config.pageSlug);

    console.log(`   📄 ${config.pageName}: ${pageCount.count} active products`);
  });

  console.log('\n✅ CHANNEL PROCESSING FIX COMPLETE');
  console.log('='.repeat(60));

} catch (error) {
  console.error('❌ Error during processing fix:', error.message);
  console.error(error.stack);
} finally {
  db.close();
}