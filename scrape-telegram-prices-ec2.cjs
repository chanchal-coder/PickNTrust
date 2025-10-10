#!/usr/bin/env node
// Scrape accurate prices for Telegram rows in unified_content on EC2
// Supports Amazon, Flipkart, with a generic fallback; updates price, original_price, currency, discount

const Database = require('better-sqlite3');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const DB_PATH = '/home/ec2-user/pickntrust/database.sqlite';
const db = new Database(DB_PATH);

function log(msg) {
  process.stdout.write(`${msg}\n`);
}

function normalizePriceText(text) {
  if (!text) return null;
  // Remove currency symbols, commas, and non-digits except dot
  const cleaned = text
    .replace(/\u20B9|₹|Rs\.?|INR/gi, '')
    .replace(/,/g, '')
    .replace(/[^0-9.]/g, '')
    .trim();
  if (!cleaned) return null;
  const value = parseFloat(cleaned);
  if (!isFinite(value)) return null;
  return Math.round(value); // store as integer rupees
}

function computeDiscount(price, original) {
  if (!price || !original || original <= 0 || price <= 0) return null;
  if (original <= price) return 0;
  return Math.round(((original - price) / original) * 100);
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function fetchHtml(url) {
  const resp = await axios.get(url, {
    headers: { 'User-Agent': UA, 'Accept-Language': 'en-IN,en;q=0.9' },
    timeout: 15000,
    maxRedirects: 5,
    validateStatus: s => s >= 200 && s < 400,
  });
  return resp.data;
}

function parseAmazon($) {
  // Try multiple selectors for price and original price
  const priceSel = [
    '#priceblock_ourprice',
    '#priceblock_dealprice',
    '#corePrice_desktop .a-price .a-offscreen',
    '.a-price .a-offscreen',
  ];
  const originalSel = [
    '#priceblock_ourprice ~ .a-text-strike',
    '#priceblock_dealprice ~ .a-text-strike',
    '.priceBlockStrikePriceString, .a-text-strike .a-offscreen',
    '#corePrice_desktop .a-price.a-text-price .a-offscreen',
  ];
  let priceText, originalText;
  for (const sel of priceSel) {
    const t = $(sel).first().text().trim();
    if (t) { priceText = t; break; }
  }
  for (const sel of originalSel) {
    const t = $(sel).first().text().trim();
    if (t) { originalText = t; break; }
  }
  return { price: normalizePriceText(priceText), original: normalizePriceText(originalText) };
}

function parseFlipkart($) {
  const priceText = $('._30jeq3._16Jk6d').first().text().trim() || $('.Nx9bqj.CxhGGd').first().text().trim();
  const originalText = $('._3I9_wc._2p6lqe').first().text().trim() || $('.yRaY8j').first().text().trim();
  return { price: normalizePriceText(priceText), original: normalizePriceText(originalText) };
}

function parseGeneric($) {
  // Find the first element with currency symbol
  const candidates = ['[class*=price]', '[id*=price]', 'body'];
  for (const sel of candidates) {
    const t = $(sel).first().text().trim();
    const p = normalizePriceText(t);
    if (p) return { price: p, original: null };
  }
  return { price: null, original: null };
}

async function scrapePrice(url) {
  try {
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    let result = { price: null, original: null };
    if (/amazon\./i.test(url)) {
      result = parseAmazon($);
    } else if (/flipkart\./i.test(url)) {
      result = parseFlipkart($);
    } else {
      result = parseGeneric($);
    }
    const price = result.price;
    const original = result.original;
    const discount = computeDiscount(price, original);
    return { price, original, currency: price ? 'INR' : null, discount };
  } catch (err) {
    return { error: err.message || String(err) };
  }
}

function getBatch() {
  const rows = db.prepare(`
    SELECT id, affiliate_url
    FROM unified_content
    WHERE source_type = 'telegram'
      AND (price IS NULL OR price = 0)
      AND affiliate_url IS NOT NULL AND TRIM(affiliate_url) <> ''
    ORDER BY id DESC
    LIMIT 40;
  `).all();
  return rows;
}

function applyUpdate(id, update) {
  const { price, original, currency, discount } = update;
  const stmt = db.prepare(`
    UPDATE unified_content
    SET
      price = COALESCE(?, price),
      original_price = COALESCE(?, original_price),
      currency = COALESCE(?, currency),
      discount = COALESCE(?, discount),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?;
  `);
  stmt.run(price ?? null, original ?? null, currency ?? null, (typeof discount === 'number' ? discount : null), id);
}

async function run() {
  log('🔎 Scraping accurate prices for Telegram unified_content rows');
  log('==============================================================');
  // Quick sanity: check table exists
  try {
    const tableName = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='unified_content';").get();
    if (!tableName) {
      log('Fatal: unified_content table not found in DB at ' + DB_PATH);
      process.exit(1);
    }
  } catch (e) {
    log('Fatal: cannot query sqlite_master: ' + e.message);
    process.exit(1);
  }

  const batch = getBatch();
  if (!batch.length) {
    log('No Telegram rows needing price enrichment.');
    return;
  }
  log(`Found ${batch.length} rows to enrich.`);

  for (const row of batch) {
    const id = row.id;
    const url = (row.affiliate_url || '').trim();
    if (!url) continue;
    log(`→ [${id}] ${url}`);
    const res = await scrapePrice(url);
    if (res.error) {
      log(`   x Error: ${res.error}`);
      continue;
    }
    log(`   ✓ price=${res.price ?? 'null'} original=${res.original ?? 'null'} currency=${res.currency ?? 'null'} discount=${(typeof res.discount==='number')?res.discount:'null'}`);
    applyUpdate(id, res);
  }
  log('Done.');
}

run().catch(err => {
  log('Fatal: ' + (err.stack || err.message || String(err)));
  process.exit(1);
});