const Database = require('better-sqlite3');
const axios = require('axios');
const cheerio = require('cheerio');

console.log('🔎 Scraping accurate prices for Telegram unified_content rows');
console.log('==============================================================');

class TelegramPriceScraper {
  constructor(dbPath = './server/database.sqlite') {
    this.db = new Database(dbPath);
    this.updated = 0;
    this.errors = 0;
  }

  formatPrice(priceText) {
    if (!priceText) return null;
    const num = parseFloat(priceText.toString().replace(/[^0-9.]/g, ''));
    if (isNaN(num) || num <= 0) return null;
    return `₹${num.toLocaleString('en-IN')}`;
  }

  calculateDiscount(currentPrice, originalPrice) {
    if (!currentPrice || !originalPrice) return null;
    const cur = parseFloat(currentPrice.toString().replace(/[^0-9.]/g, ''));
    const orig = parseFloat(originalPrice.toString().replace(/[^0-9.]/g, ''));
    if (!isFinite(cur) || !isFinite(orig) || cur <= 0 || orig <= 0 || orig <= cur) return null;
    return Math.round(((orig - cur) / orig) * 100);
  }

  async fetchPage(url) {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'en-IN,en;q=0.9'
      },
      timeout: 12000,
      maxRedirects: 5,
      validateStatus: (s) => s >= 200 && s < 400
    });
    return cheerio.load(res.data);
  }

  async extractAmazon(url) {
    try {
      const $ = await this.fetchPage(url);
      const candidates = [
        '.a-price .a-offscreen',
        '#priceblock_dealprice',
        '#priceblock_ourprice',
        '.a-price-whole'
      ];
      let currentPrice = null;
      for (const sel of candidates) {
        const t = $(sel).first().text().trim();
        if (t && /\d/.test(t)) { currentPrice = t; break; }
      }
      const originalCandidates = [
        '#priceblock_strikeprice',
        '.a-text-price .a-offscreen',
        '.corePriceDisplay_desktop .a-text-price .a-offscreen'
      ];
      let originalPrice = null;
      for (const sel of originalCandidates) {
        const t = $(sel).first().text().trim();
        if (t && /\d/.test(t)) { originalPrice = t; break; }
      }
      return { currentPrice, originalPrice };
    } catch (e) {
      console.log(`   ❌ Amazon scrape failed: ${e.message}`);
      return { currentPrice: null, originalPrice: null };
    }
  }

  async extractFlipkart(url) {
    try {
      const $ = await this.fetchPage(url);
      const currentSel = ['._30jeq3._16Jk6d', '._1_WHN1'];
      let currentPrice = null;
      for (const sel of currentSel) {
        const t = $(sel).first().text().trim();
        if (t && /\d/.test(t)) { currentPrice = t; break; }
      }
      const originalSel = ['._3I9_wc._27UcVY', '._3I9_wc._2p6lqe'];
      let originalPrice = null;
      for (const sel of originalSel) {
        const t = $(sel).first().text().trim();
        if (t && /\d/.test(t)) { originalPrice = t; break; }
      }
      return { currentPrice, originalPrice };
    } catch (e) {
      console.log(`   ❌ Flipkart scrape failed: ${e.message}`);
      return { currentPrice: null, originalPrice: null };
    }
  }

  async extractGeneric(url) {
    try {
      const $ = await this.fetchPage(url);
      const priceSelectors = ['.price', '.product-price', '[class*="price"]', '[data-price]'];
      let currentPrice = null;
      for (const sel of priceSelectors) {
        const t = $(sel).first().text().trim();
        if (t && /\d/.test(t)) { currentPrice = t; break; }
      }
      const originalSelectors = ['.old-price', '.strike-price', '.mrp', '[class*="original"]'];
      let originalPrice = null;
      for (const sel of originalSelectors) {
        const t = $(sel).first().text().trim();
        if (t && /\d/.test(t)) { originalPrice = t; break; }
      }
      return { currentPrice, originalPrice };
    } catch (e) {
      console.log(`   ❌ Generic scrape failed: ${e.message}`);
      return { currentPrice: null, originalPrice: null };
    }
  }

  detectPlatform(url) {
    const u = url.toLowerCase();
    if (u.includes('amazon')) return 'amazon';
    if (u.includes('flipkart')) return 'flipkart';
    return 'generic';
  }

  async scrapeOne(url) {
    const platform = this.detectPlatform(url);
    if (platform === 'amazon') return this.extractAmazon(url);
    if (platform === 'flipkart') return this.extractFlipkart(url);
    return this.extractGeneric(url);
  }

  async runBatch(limit = 40) {
    const rows = this.db.prepare(`
      SELECT id, title, price, original_price, discount, currency, affiliate_url
      FROM unified_content
      WHERE source_platform = 'telegram'
        AND affiliate_url IS NOT NULL
        AND (price IS NULL OR price = '' OR price = '0')
      ORDER BY id DESC
      LIMIT ?
    `).all(limit);

    console.log(`Found ${rows.length} Telegram items needing price scraping\n`);

    for (const row of rows) {
      console.log(`🔄 ${row.id} | ${row.title?.substring(0, 70) || ''}`);
      console.log(`   URL: ${row.affiliate_url?.substring(0, 100)}`);
      try {
        const { currentPrice, originalPrice } = await this.scrapeOne(row.affiliate_url);
        const formattedCurrent = this.formatPrice(currentPrice);
        const formattedOriginal = this.formatPrice(originalPrice);
        const discount = this.calculateDiscount(formattedCurrent, formattedOriginal);

        const fields = [];
        const values = [];

        if (formattedCurrent && formattedCurrent !== row.price) {
          fields.push('price = ?');
          values.push(formattedCurrent);
          console.log(`   💰 price: ${formattedCurrent}`);
        }
        if (formattedOriginal && formattedOriginal !== row.original_price) {
          fields.push('original_price = ?');
          values.push(formattedOriginal);
          console.log(`   💰 original_price: ${formattedOriginal}`);
        }
        if (discount && discount !== row.discount) {
          fields.push('discount = ?');
          values.push(discount);
          console.log(`   🎯 discount: ${discount}%`);
        }
        if (!row.currency) {
          fields.push('currency = ?');
          values.push('INR');
        }

        if (fields.length > 0) {
          fields.push('updated_at = ?');
          values.push(Math.floor(Date.now() / 1000));
          values.push(row.id);
          const sql = `UPDATE unified_content SET ${fields.join(', ')} WHERE id = ?`;
          this.db.prepare(sql).run(...values);
          this.updated++;
          console.log('   ✅ updated');
        } else {
          console.log('   ⚪ no changes');
        }

        await new Promise((r) => setTimeout(r, 1000));
      } catch (err) {
        this.errors++;
        console.log(`   ❌ error: ${err.message}`);
      }
    }

    console.log('\nSummary:');
    console.log(`   ✅ updated: ${this.updated}`);
    console.log(`   ❌ errors: ${this.errors}`);
  }
}

async function main() {
  const scraper = new TelegramPriceScraper();
  await scraper.runBatch(40);
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});