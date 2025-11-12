// Minimal, production-safe Telegram bot that writes directly to unified_content
// - Avoids channel_posts to prevent schema mismatches
// - Conforms to current unified_content schema (requires content_type)
// - Derives display_pages from channel title

const TelegramBot = require('node-telegram-bot-api');
const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const BOT_TOKEN = process.env.MASTER_BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error('❌ MASTER_BOT_TOKEN not found in environment variables');
  process.exit(1);
}

// DB path (production: /var/www/pickntrust/database.sqlite)
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

// Map known channel names to page slugs; fallback to slugified title
const channelSlugMap = {
  'Prime Picks': 'prime-picks',
  'Value Picks': 'value-picks',
  'Click Picks': 'click-picks',
  'Global Picks': 'global-picks',
  'Travel Picks': 'travel-picks',
  'Deals Hub': 'deals-hub',
  'Loot Box': 'loot-box',
  'Trending': 'trending',
  'Cue Links': 'cue-picks',
  // Aliases seen in Telegram channels to ensure correct page tagging
  'Amazon PNT': 'prime-picks',
  'Cuelinks PNT': 'cue-picks',
  'Dealshub PNT': 'deals-hub',
  'Deodap pnt': 'loot-box',
  'Deodap PNT': 'loot-box'
};

const slugify = (s) => (s || '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 40) || 'value-picks';

// Prepare insert aligned with production unified_content schema
// Required fields: title (NOT NULL), content_type (NOT NULL)
// Useful defaults: status=active, visibility=public, processing_status=completed
const insertContent = db.prepare(`
  INSERT INTO unified_content (
    title, description, price, image_url, affiliate_url,
    category, content_type, status, visibility, processing_status, created_at,
    display_pages
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

function firstUrl(text) {
  const m = (text || '').match(/(https?:\/\/[^\s]+)/);
  return m ? m[1] : null;
}

function firstImageUrl(text) {
  const m = (text || '').match(/(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp))/i);
  return m ? m[1] : null;
}

function extractPrice(text) {
  const m = (text || '').match(/\$[\d,]+(?:\.\d{2})?|₹[\d,]+(?:\.\d{2})?|£[\d,]+(?:\.\d{2})?/);
  return m ? m[0] : null;
}

// Create bot instance with polling
const bot = new TelegramBot(BOT_TOKEN, { polling: true });
console.log('🤖 Bot created; polling enabled (unified_content writer)');

bot.on('channel_post', (msg) => {
  const chatId = msg.chat?.id?.toString();
  const channelTitle = msg.chat?.title || '';
  const messageId = msg.message_id;
  const text = msg.text || msg.caption || '';

  console.log(`\n📺 Channel post from ${channelTitle} (${chatId}), message ${messageId}`);

  // Derive display page
  const pageSlug = channelSlugMap[channelTitle] || slugify(channelTitle);
  const displayPagesJson = JSON.stringify([pageSlug]);

  // Basic field extraction
  const title = (text.split('\n')[0] || '').substring(0, 80) || 'New Deal';
  const description = text.substring(0, 280) || null;
  const price = extractPrice(text);
  // Prefer image URL in text; fallback to DEFAULT_IMAGE_URL or generic placeholder
  const imageUrl = firstImageUrl(text) || process.env.DEFAULT_IMAGE_URL || 'https://via.placeholder.com/600x400?text=PickNTrust';
  const affiliateUrl = firstUrl(text);

  const createdAt = new Date().toISOString();

  try {
    const result = insertContent.run(
      title,
      description,
      price,
      imageUrl,
      affiliateUrl,
      'deals',           // category
      'product',         // content_type (NOT NULL)
      'active',          // status
      'public',          // visibility
      'completed',       // processing_status
      createdAt,         // created_at (TEXT)
      displayPagesJson   // display_pages (TEXT JSON array)
    );
    console.log(`✅ Saved unified_content id=${result.lastInsertRowid} pages=${displayPagesJson}`);
  } catch (e) {
    console.error('❌ Failed to save unified_content:', e.message);
  }
});

bot.on('error', (err) => {
  console.error('❌ Telegram bot error:', err?.message || err);
});

console.log('✅ Bot is running; send a message in your channel to test.');