/**
 * Safe Telegram publisher (standalone) — keeps current website unaffected.
 *
 * What it does
 * - Accepts Telegram message text and/or URL
 * - Extracts minimal fields (title, image_url, affiliate_url optional)
 * - Price is OPTIONAL (left NULL if unknown)
 * - Validates required fields: title, display_pages (JSON string), image_url (or placeholder)
 * - Dedupe by (source_type, source_id) or URL; performs UPSERT-like update
 * - Inserts/updates only unified_content in database.sqlite
 * - Gated by env flag TELEGRAM_PUBLISH (if set and equals '1')
 *
 * Usage (programmatic):
 *   const { publishTelegramItem } = require('./server/telegram/publish.cjs');
 *   await publishTelegramItem({ message: '...', url: 'https://...', channelId: '...', messageId: 123, displayPages: ['prime-picks'] });
 *
 * This file is CommonJS to run standalone without build. No new deps.
 */

const { sqliteDb } = require('../db.js');

const DEFAULT_PLACEHOLDER_IMAGE = 'https://via.placeholder.com/300x300';

function normalizePages(pages) {
  try {
    if (!pages) return JSON.stringify(['home']);
    if (typeof pages === 'string') {
      // Accept a single slug or a JSON string
      const trimmed = pages.trim();
      if (trimmed.startsWith('[')) return trimmed; // assume JSON
      return JSON.stringify([trimmed]);
    }
    if (Array.isArray(pages)) return JSON.stringify(pages);
    return JSON.stringify(['home']);
  } catch (_) {
    return JSON.stringify(['home']);
  }
}

function extractPriceFromText(text) {
  if (!text) return null;
  // Very light extraction: look for ₹ or numbers; returns numeric string or null
  const rupeeMatch = text.match(/₹\s?(\d+[\d,]*)/);
  if (rupeeMatch) return rupeeMatch[1].replace(/,/g, '');
  const numMatch = text.match(/\b(\d{3,6})(?:\.(\d{2}))?\b/);
  if (numMatch) return numMatch[0];
  return null;
}

function pickTitle({ message, ogTitle, url }) {
  const clean = (s) => (s || '').trim();
  const t = clean(ogTitle) || clean(message);
  if (t) return t.slice(0, 180);
  // Fallback: derive from URL
  if (url) {
    try {
      const u = new URL(url);
      return (u.pathname.split('/').filter(Boolean).pop() || u.hostname).replace(/[-_]/g, ' ');
    } catch (_) {}
  }
  return 'Product';
}

async function fetchOpenGraph(url) {
  if (!url) return {};
  try {
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) return {};
    const html = await res.text();
    const meta = {};
    const m = (prop) => {
      const re = new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i');
      const match = html.match(re);
      return match ? match[1] : undefined;
    };
    meta.title = m('og:title') || m('twitter:title');
    meta.image = m('og:image') || m('twitter:image');
    meta.description = m('og:description') || m('twitter:description');
    return meta;
  } catch (_) {
    return {};
  }
}

function normalizeLink({ url, ogUrl, message }) {
  // Prefer URL param; fallback to OG URL; else detect first link in message
  if (url) return url;
  if (ogUrl) return ogUrl;
  if (message) {
    const match = message.match(/https?:\/\/[^\s]+/);
    if (match) return match[0];
  }
  return null;
}

function ensureMinimalRecord(input, og) {
  const pagesJson = normalizePages(input.displayPages);
  const link = normalizeLink({ url: input.url, ogUrl: og.url, message: input.message });
  const image = og.image || input.image_url || DEFAULT_PLACEHOLDER_IMAGE;
  const title = pickTitle({ message: input.message, ogTitle: og.title, url: input.url });
  const price = input.price || extractPriceFromText(input.message) || null; // optional

  const record = {
    title,
    image_url: image,
    affiliate_url: input.affiliate_url || link || null,
    page_type: input.page_type || null,
    category: input.category || null,
    content_type: input.content_type || 'product',
    status: 'active',
    visibility: 'visible',
    processing_status: 'active',
    display_pages: pagesJson,
    description: og.description || input.description || null,
    price,
    original_price: input.original_price || null,
    source_type: 'telegram',
    source_platform: 'telegram',
    source_id: input.messageId != null ? String(input.messageId) : null,
    created_at: undefined, // let DB default handle, if present
  };

  // Validation: title + display_pages + image_url are mandatory
  if (!record.title || !record.display_pages || !record.image_url) {
    throw new Error('Validation failed: missing title/display_pages/image_url');
  }
  return record;
}

function findExisting({ source_id, affiliate_url }) {
  if (source_id) {
    const row = sqliteDb.prepare(
      `SELECT id FROM unified_content WHERE source_type = 'telegram' AND source_id = ? LIMIT 1`
    ).get(source_id);
    if (row && row.id) return row.id;
  }
  if (affiliate_url) {
    const row = sqliteDb.prepare(
      `SELECT id FROM unified_content WHERE affiliate_url = ? AND source_type = 'telegram' LIMIT 1`
    ).get(affiliate_url);
    if (row && row.id) return row.id;
  }
  return null;
}

function upsertUnifiedContent(record) {
  const existingId = findExisting({ source_id: record.source_id, affiliate_url: record.affiliate_url });
  if (existingId) {
    const setCols = [
      'title = @title',
      'image_url = @image_url',
      'affiliate_url = @affiliate_url',
      'page_type = @page_type',
      'category = @category',
      'content_type = @content_type',
      'status = @status',
      'visibility = @visibility',
      'processing_status = @processing_status',
      'display_pages = @display_pages',
      'description = @description',
      'price = @price',
      'original_price = @original_price',
      'source_type = @source_type',
      'source_platform = @source_platform',
      'source_id = @source_id'
    ].join(', ');
    const stmt = sqliteDb.prepare(`UPDATE unified_content SET ${setCols} WHERE id = @id`);
    const info = stmt.run({ ...record, id: existingId });
    return { action: 'update', id: existingId, changes: info.changes };
  } else {
    const stmt = sqliteDb.prepare(`
      INSERT INTO unified_content (
        title, image_url, affiliate_url, page_type, category, content_type,
        status, visibility, processing_status, display_pages, description,
        price, original_price, source_type, source_platform, source_id, created_at
      ) VALUES (
        @title, @image_url, @affiliate_url, @page_type, @category, @content_type,
        @status, @visibility, @processing_status, @display_pages, @description,
        @price, @original_price, @source_type, @source_platform, @source_id, strftime('%s','now')
      )
    `);
    const info = stmt.run(record);
    return { action: 'insert', id: info.lastInsertRowid };
  }
}

function isPublishEnabled() {
  try {
    const row = sqliteDb.prepare('SELECT publish_enabled FROM telegram_settings WHERE id = 1').get();
    if (row && (row.publish_enabled === 1 || row.publish_enabled === true)) return true;
  } catch (_) {
    // Table may not exist; fall back to env
  }
  const envVal = String(process.env.TELEGRAM_PUBLISH || '').trim().toLowerCase();
  return envVal === '1' || envVal === 'true';
}

async function publishTelegramItem(input) {
  if (!isPublishEnabled()) {
    return { skipped: true, reason: 'Telegram publishing disabled by admin toggle/env' };
  }
  const og = input.url ? await fetchOpenGraph(input.url) : {};
  const record = ensureMinimalRecord(input, og);
  const result = upsertUnifiedContent(record);
  return { ok: true, result, record: { title: record.title, display_pages: record.display_pages, source_id: record.source_id } };
}

module.exports = { publishTelegramItem };

// Optional CLI usage for quick testing:
// node server/telegram/publish.cjs "<message>" "<url>" prime-picks 12345
if (require.main === module) {
  (async () => {
    const [message, url, page, messageId] = process.argv.slice(2);
    try {
      const res = await publishTelegramItem({ message, url, displayPages: page ? [page] : ['home'], messageId });
      console.log(JSON.stringify(res, null, 2));
    } catch (err) {
      console.error('Publish failed:', err.message || err);
      process.exitCode = 1;
    }
  })();
}