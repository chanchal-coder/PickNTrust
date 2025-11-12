const Database = require('better-sqlite3');
const path = require('path');

console.log('🔧 FIXING CHANNEL PROCESSING — NEW CHANNELS INCLUDED');
console.log('='.repeat(60));

// Database path: when placed at project root on server, database.sqlite exists there
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

// CHANNEL_CONFIGS — must mirror server/telegram-bot.ts
const CHANNEL_CONFIGS = {
  '-1002955338551': { pageName: 'Prime Picks', pageSlug: 'prime-picks' },
  '-1002982344997': { pageName: 'Cue Picks', pageSlug: 'cue-picks' },
  '-1003017626269': { pageName: 'Value Picks', pageSlug: 'value-picks' },
  '-1002981205504': { pageName: 'Click Picks', pageSlug: 'click-picks' },
  '-1002902496654': { pageName: 'Global Picks', pageSlug: 'global-picks' },
  '-1003029983162': { pageName: 'Deals Hub', pageSlug: 'deals-hub' },
  '-1002991047787': { pageName: 'Loot Box', pageSlug: 'loot-box' },
  '-1003170300695': { pageName: 'Trending', pageSlug: 'trending' },
  // New channels
  '-1003414218904': { pageName: 'Apps & AI Apps', pageSlug: 'apps-ai-apps' },
  '-1003488288404': { pageName: 'Top Picks', pageSlug: 'top-picks' },
  '-1003487271664': { pageName: 'Services', pageSlug: 'services' }
};

// Default placeholder image for entries missing an image
const DEFAULT_IMAGE_URL = 'https://via.placeholder.com/300x200/4F46E5/FFFFFF?text=Product';

try {
  console.log('🔄 Processing channel_posts into unified_content with updated mappings...');

  const channelPosts = db.prepare(
    'SELECT * FROM channel_posts ORDER BY created_at ASC'
  ).all();

  console.log(`Found ${channelPosts.length} channel posts to inspect...`);

  const insertUnified = db.prepare(`
    INSERT INTO unified_content (
      title, description, price, original_price, image_url, affiliate_url,
      content_type, page_type, category, source_type, source_id,
      display_pages, processing_status, status, visibility,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let processed = 0, skipped = 0, errors = 0;

  for (const post of channelPosts) {
    try {
      // Skip already processed posts
      const existing = db.prepare('SELECT id FROM unified_content WHERE source_id = ?').get(post.id);
      if (existing) { skipped++; continue; }

      const cfg = CHANNEL_CONFIGS[post.channel_id];
      if (!cfg) { errors++; continue; }

      const text = post.original_text || post.processed_text || '';
      const lines = text.split('\n').filter(l => l.trim());
      const title = (lines.find(l => l.length > 10 && !l.startsWith('http')) || lines[0] || 'Channel Post').substring(0, 200);
      const priceMatch = text.match(/₹[\d,]+/g) || [];
      const price = priceMatch[0] || null;
      const originalPrice = priceMatch[1] || null;
      const urlMatch = text.match(/(https?:\/\/[^\s]+)/);
      const affiliateUrl = urlMatch ? urlMatch[1] : null;

      const displayPages = JSON.stringify([cfg.pageSlug]);

      insertUnified.run(
        title,
        text.substring(0, 500),
        price,
        originalPrice,
        DEFAULT_IMAGE_URL,
        affiliateUrl,
        'product',
        cfg.pageSlug,
        'General',
        'telegram',
        post.id,
        displayPages,
        'active',
        'published',
        'public',
        post.created_at,
        Math.floor(Date.now() / 1000)
      );
      processed++;
    } catch (err) {
      errors++;
    }
  }

  console.log(`✅ Processed: ${processed}, ⏭️ Skipped: ${skipped}, ❌ Errors: ${errors}`);

  // Print page counts for verification
  for (const [_, cfg] of Object.entries(CHANNEL_CONFIGS)) {
    const row = db.prepare(
      'SELECT COUNT(*) as count FROM unified_content WHERE display_pages LIKE '%' || ? || '%' AND processing_status = "active"'
    ).get(cfg.pageSlug);
    console.log(`📄 ${cfg.pageSlug}: ${row.count}`);
  }

  console.log('🎉 Backlog processing complete.');
} catch (error) {
  console.error('❌ Error during backlog processing:', error?.message || error);
} finally {
  db.close();
}