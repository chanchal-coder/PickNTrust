// URL processing service used by bots
// Fetches HTML with proper headers, follows redirects, and extracts product meta

import { URL } from 'node:url';
import { fetch } from 'undici';

async function fetchWithRedirects(inputUrl, maxRedirects = 5) {
  const visited = [];
  let current = inputUrl.startsWith('http') ? inputUrl : `https://${inputUrl}`;
  let lastResponse = null;

  for (let i = 0; i <= maxRedirects; i++) {
    try {
      const res = await fetch(current, {
        method: 'GET',
        redirect: 'manual',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-IN,en;q=0.9',
          'Cache-Control': 'no-cache'
        }
      });

      lastResponse = res;

      // Handle manual redirects
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get('location');
        if (!location) break;
        const nextUrl = location.startsWith('http') ? location : new URL(location, current).toString();
        visited.push(nextUrl);
        current = nextUrl;
        continue;
      }

      // Non-redirect response, read body (decompression handled by undici)
      const text = await res.text();
      return { finalUrl: current, status: res.status, body: text, visited };
    } catch (e) {
      // As a last resort, break with empty body
      return { finalUrl: current, status: 0, body: '', visited };
    }
  }

  // If loop exits due to max redirects
  const body = lastResponse ? await lastResponse.text() : '';
  return { finalUrl: current, status: lastResponse?.status ?? 0, body, visited };
}

function extractMetaFromHtml(html, hostname) {
  // Helper: normalize a numeric string like "4,999.00" to the same string form (keep commas as-is)
  const normalizeStr = (num) => {
    try {
      if (num == null) return null;
      const s = String(num).trim();
      // Strip currency symbol but preserve commas/decimal
      const m = s.match(/[\d,]+(?:\.\d+)?/);
      if (!m) return null;
      // Remove any trailing separators like "," or "." that may appear in theme markup
      let v = m[0].replace(/[.,]$/, '');
      return v;
    } catch { return null; }
  };

  // Helper: safely parse numeric value
  const toNum = (s) => {
    try { return s == null ? NaN : parseFloat(String(s).replace(/,/g, '')); } catch { return NaN; }
  };

  // Extract Shopify-like prices from common classes/JSON
  const extractShopifyPrices = (html) => {
    let sale = null;
    let regular = null;

    // Heuristic: only treat as product page if common product/price signals exist
    const isProductContext = /price-item--|price__sale|price__regular|compare-at|add-to-cart|cart|product/i.test(html);

    // Class-based selectors
    const saleMatch = html.match(/class=["'][^"']*(price-item--sale|price__sale)[^"']*["'][^>]*>[^₹]*₹?[\s\u00A0]*([\d,]+(?:\.\d+)?)/i);
    const regularMatch = html.match(/class=["'][^"']*(price-item--regular|price__regular|price__compare|compare-at)[^"']*["'][^>]*>[^₹]*₹?[\s\u00A0]*([\d,]+(?:\.\d+)?)/i);
    if (saleMatch) sale = normalizeStr(saleMatch[2] || saleMatch[1]);
    if (regularMatch) regular = normalizeStr(regularMatch[2] || regularMatch[1]);

    // Strikethrough elements
    if (!regular) {
      const delMatch = html.match(/<del[^>]*>\s*₹?[\s\u00A0]*([\d,]+(?:\.\d+)?)/i);
      if (delMatch) regular = normalizeStr(delMatch[1]);
    }

    // JSON hints (variant compare_at_price)
    const jsonCompare = html.match(/"compare_at_price"\s*:\s*"?([\d,.]+)"?/i);
    const jsonPrice = html.match(/"price"\s*:\s*"?([\d,.]+)"?/i);
    const jsonCurrency = html.match(/"currency"\s*:\s*"([A-Z]{3})"/i);
    // Only accept JSON prices if page has product context to avoid admin/theme config noise
    if (isProductContext) {
      // Many Shopify themes store prices in minor units (cents/paise). Adjust heuristically.
      if (!sale && jsonPrice) {
        const jp = toNum(jsonPrice[1]);
        let jpAdj = jp;
        // If price appears very large for INR and ends with 00, assume paise and divide by 100
        if (!isNaN(jpAdj) && jpAdj >= 10000) {
          jpAdj = Math.round(jpAdj / 100);
        }
        sale = normalizeStr(String(jpAdj));
      }
      if (!regular && jsonCompare) {
        const jc = toNum(jsonCompare[1]);
        let jcAdj = jc;
        if (!isNaN(jcAdj) && jcAdj >= 10000) {
          jcAdj = Math.round(jcAdj / 100);
        }
        regular = normalizeStr(String(jcAdj));
      }
    }

    // Meta tags sometimes present
    const ogPrice = html.match(/property=["']og:price:amount["'][^>]+content=["']([^"']+)["']/i);
    if (!sale && ogPrice) sale = normalizeStr(ogPrice[1]);

    // Ensure logical ordering (regular >= sale)
    const saleNum = toNum(sale);
    const regNum = toNum(regular);
    if (!isNaN(saleNum) && !isNaN(regNum) && saleNum > regNum) {
      // Swap if detected reversed
      const tmp = sale; sale = regular; regular = tmp;
    }

    // Guard against unrealistic original price (e.g., captured from unrelated content)
    if (!isNaN(saleNum) && !isNaN(regNum) && regNum > saleNum * 6) {
      regular = null;
    }

    return { price: sale || null, originalPrice: regular || null, currency: (jsonCurrency?.[1] || null) };
  };

  // Generic extractor: choose smallest valid as current price and largest valid as original
  const extractGenericPrices = (html) => {
    // Support ₹ symbol, prefix Rs/Rs., suffix INR/Rs, and numbers near explicit labels
    const mSymbol = [...html.matchAll(/(?:₹|Rs\.?)[\s\u00A0]*([\d,]+(?:\.\d+)?)/gi)];
    const mSuffix = [...html.matchAll(/([\d,]+(?:\.\d+)?)[\s\u00A0]*(?:INR|Rs\.?)/gi)];
    const mLabel = [...html.matchAll(/(?:price|mrp|list\s*price)[^\d]{0,60}([\d,]+(?:\.\d+)?)/gi)];
    const mClassId = [...html.matchAll(/(?:class|id)=["'][^"']*price[^"']*["'][^>]*>[^₹\d]{0,80}(?:₹|Rs\.?\s*)?([\d,]+(?:\.\d+)?)/gi)];
    const rawMatches = [...mSymbol, ...mSuffix, ...mLabel, ...mClassId];
    const matches = rawMatches.map(m => ({ value: normalizeStr(m[1]), index: m.index || 0, raw: m[0] }));
    if (matches.length === 0) return { price: null, originalPrice: null };

    // Filter out coupon/discount contexts
    const badCtx = /(\boff\b|\bsave\b|coupon|discount|cashback|extra|flat|code|promo|voucher|EMI|tax|delivery|shipping|rating|review|catalog|wholesale)/i;
    const goodCtx = /(price|mrp|deal|sale|offer|compare|regular|was|list\s*price|retail)/i;
    const withContext = matches.map(m => {
      const start = Math.max(0, m.index - 120);
      const end = Math.min(html.length, m.index + 120);
      const ctx = html.substring(start, end).toLowerCase();
      return { ...m, ctx };
    });
    const candidates = withContext.filter(m => !badCtx.test(m.ctx));
    let nums = candidates.map(c => toNum(c.value)).filter(n => !isNaN(n));
    const bigNums = nums.filter(n => n >= 50);
    if (bigNums.length > 0) nums = bigNums;
    if (nums.length === 0) return { price: null, originalPrice: null };

    const min = Math.min(...nums);
    const max = Math.max(...nums);
    // Determine the most frequent candidate value (mode) as a strong signal for displayed price
    const freqMap = new Map();
    for (const c of candidates) {
      const key = c.value;
      freqMap.set(key, (freqMap.get(key) || 0) + 1);
    }
    let modeValue = null, modeCount = 0;
    for (const [val, count] of freqMap.entries()) {
      if (count > modeCount) { modeValue = val; modeCount = count; }
    }
    const modeNum = toNum(modeValue);
    // Guard: ignore trivial small numbers that are not product prices
    const logicalMin = min >= 10 ? min : (nums.length > 1 ? Math.min(...nums.filter(n => n >= 10)) : NaN);
    // Prefer mode if reasonable; otherwise fall back to logical minimum
    let priceNum = (!isNaN(modeNum) && modeNum >= 10) ? modeNum : logicalMin;
    const origNum = max;

    const priceStr = isNaN(priceNum) ? null : normalizeStr(String(priceNum));
    const origStr = isNaN(origNum) ? null : normalizeStr(String(origNum));

    // If only one value, treat it as price
    if (nums.length === 1) {
      return { price: normalizeStr(String(nums[0])), originalPrice: null };
    }

    // Ensure sensible relation
    // If ratio between max and min is absurd, drop original unless context indicates MRP/compare
    const ratioTooHigh = priceNum && origNum && origNum > priceNum * 6;
    if (priceNum && origNum && origNum > priceNum && !ratioTooHigh) {
      return { price: priceStr, originalPrice: origStr };
    }
    // Fallback: pick next larger as original
    const sorted = nums.slice().sort((a,b)=>a-b);
    const nextLarger = sorted.find(n => n > priceNum);
    // If next larger still looks unrealistic, skip original price
    if (nextLarger && (!priceNum || nextLarger <= priceNum * 6)) {
      return { price: priceStr, originalPrice: normalizeStr(String(nextLarger)) };
    }
    return { price: priceStr, originalPrice: null };
  };

  const get = (regex) => {
    const m = html.match(regex);
    return m ? m[1].trim() : null;
  };

  // Generic tags
  let title = get(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) || get(/<title>([^<]+)<\/title>/i);
  let description = get(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) || get(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
  let image = get(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    || get(/<meta[^>]+property=["']og:image:secure_url["'][^>]+content=["']([^"']+)["']/i)
    || get(/<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i)
    || get(/<meta[^>]+property=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);

  // Filter out clearly non-product images (logos, sprites, placeholders, SVGs)
  const isBadImage = (src) => {
    if (!src) return true;
    const s = String(src).toLowerCase();
    return s.endsWith('.svg') || s.includes('sprite') || s.includes('icon') || s.includes('logo') || s.includes('placeholder') || s.includes('via.placeholder');
  };
  if (isBadImage(image)) {
    image = null;
  }

  // JSON-LD blocks often contain canonical product data (name, image, offers)
  const jsonLdMatches = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
  let jsonLdProduct = null;
  let ldPrice = null;
  let ldOriginal = null;
  let ldCurrency = null;
  for (const block of jsonLdMatches) {
    try {
      const parsed = JSON.parse(block.trim());
      const candidates = Array.isArray(parsed) ? parsed : [parsed];
      for (const c of candidates) {
        const isProduct = (c['@type'] && /product/i.test(String(c['@type']))) || c.offers || c.name || c.image;
        if (isProduct) { jsonLdProduct = c; break; }
      }
      if (jsonLdProduct) break;
    } catch { /* ignore parse errors */ }
  }
  if (jsonLdProduct) {
    try {
      // Title/Description
      if (!title && typeof jsonLdProduct.name === 'string') title = jsonLdProduct.name.trim();
      if (!description && typeof jsonLdProduct.description === 'string') description = jsonLdProduct.description.trim();

      // Image can be string or array
      const imgField = jsonLdProduct.image;
      if (!image && imgField) {
        if (Array.isArray(imgField)) {
          const firstUrl = imgField.find(u => typeof u === 'string' && /^https?:\/\//i.test(u));
          if (firstUrl) image = firstUrl;
        } else if (typeof imgField === 'string') {
          image = imgField;
        }
      }

      // Price from offers
      const offers = jsonLdProduct.offers;
      const offerObj = Array.isArray(offers) ? offers[0] : offers;
      if (offerObj) {
        const offerPrice = offerObj.price || offerObj.priceSpecification?.price || offerObj.lowPrice || offerObj.highPrice;
        const offerCurrency = offerObj.priceCurrency || offerObj.priceSpecification?.priceCurrency || offerObj.currency || jsonLdProduct.currency;
        const refPrice = offerObj.priceSpecification?.referencePrice || offerObj.listPrice || null;
        if (offerPrice != null && !isNaN(parseFloat(String(offerPrice)))) {
          ldPrice = normalizeStr(String(offerPrice));
          ldCurrency = typeof offerCurrency === 'string' ? offerCurrency : null;
        }
        if (refPrice != null && !isNaN(parseFloat(String(refPrice)))) {
          ldOriginal = normalizeStr(String(refPrice));
        }
      }
    } catch { /* ignore JSON-LD mapping issues */ }
  }

  // Amazon-specific fallbacks
  if (!title && hostname.includes('amazon.')) {
    title = get(/<span[^>]+id=["']productTitle["'][^>]*>([^<]+)<\/span>/i) || get(/"name"\s*:\s*"([^"]+)"/i);
  }
  if (!image && hostname.includes('amazon.')) {
    image = get(/"image"\s*:\s*"(https?:[^"']+)"/i)
      || get(/<img[^>]+id=["']landingImage["'][^>]+src=["']([^"']+)["']/i)
      || get(/<img[^>]+id=["']landingImage["'][^>]+data-old-hires=["']([^"']+)["']/i);

    // Parse data-a-dynamic-image JSON map
    if (!image) {
      const dyn = get(/data-a-dynamic-image=["']({[^"']+})["']/i);
      if (dyn) {
        try {
          const map = JSON.parse(dyn.replace(/&quot;/g, '"'));
      const keys = Object.keys(map || {});
      image = keys.find(k => k.startsWith('http')) || null;
    } catch {}
  }
  // Apply bad image filter
  if (isBadImage(image)) image = null;
  }
  }

  // Price handling
  let price = null;
  let originalPrice = null;

  if (hostname.includes('amazon.')) {
    // Prefer prices within corePrice_desktop / a-price blocks
    const priceCore = html.match(/id=["']corePrice_desktop["'][\s\S]*?class=["']a-offscreen["'][^>]*>\s*₹[\s\u00A0]*([\d,]+(?:\.\d+)?)/i);
    const priceOffscreen = html.match(/class=["']a-price[^"']*["'][\s\S]*?class=["']a-offscreen["'][^>]*>\s*₹[\s\u00A0]*([\d,]+(?:\.\d+)?)/i);
    price = normalizeStr((priceCore?.[1] || priceOffscreen?.[1]) || null);

    // Original/MRP price
    const origTextPrice = html.match(/class=["']a-price\s+a-text-price[^"']*["'][\s\S]*?class=["']a-offscreen["'][^>]*>\s*₹[\s\u00A0]*([\d,]+(?:\.\d+)?)/i);
    const origStrike = html.match(/class=["']a-text-strike["'][^>]*>\s*₹?[\s\u00A0]*([\d,]+(?:\.\d+)?)/i);
    originalPrice = normalizeStr((origTextPrice?.[1] || origStrike?.[1]) || null);

    // Avoid capturing coupon/savings amounts like ₹500
    try {
      const pNum = price ? parseFloat(String(price).replace(/,/g, '')) : null;
      if (pNum !== null && isFinite(pNum) && pNum < 1000) {
        price = null;
      }
    } catch {}
  }

  // Flipkart-specific: title, price, original price
  if (hostname.includes('flipkart.')) {
    if (!title) {
      title = get(/<span[^>]+class=["']B_NuCI["'][^>]*>([^<]+)<\/span>/i);
    }
    if (!price) {
      // Current price: <div class="_30jeq3 _16Jk6d">₹43,999</div>
      const fkPrice = html.match(/class=["']_30jeq3[^"']*["'][^>]*>\s*₹[\s\u00A0]*([\d,]+(?:\.\d+)?)/i);
      price = normalizeStr(fkPrice?.[1] || null);
    }
    if (!originalPrice) {
      // Original price: <div class="_3I9_wc">₹49,999</div>
      const fkOrig = html.match(/class=["']_3I9_wc[^"']*["'][^>]*>\s*₹?[\s\u00A0]*([\d,]+(?:\.\d+)?)/i);
      originalPrice = normalizeStr(fkOrig?.[1] || null);
    }
    // Inline JSON fallback
    if (!price) {
      const inlinePrice = get(/"price"\s*:\s*"?([\d,.]+)"?/i) || get(/"sellingPrice"\s*:\s*"?([\d,.]+)"?/i) || get(/"value"\s*:\s*"?([\d,.]+)"?/i);
      if (inlinePrice) price = normalizeStr(inlinePrice);
    }
  }

  // Myntra-specific: title, price, original price
  if (hostname.includes('myntra.')) {
    if (!title) {
      // Title: <h1 class="pdp-title">Product</h1> often with brand in pdp-name
      title = get(/<h1[^>]+class=["']pdp-title["'][^>]*>([^<]+)<\/h1>/i) || get(/<h1[^>]+class=["']pdp-name["'][^>]*>([^<]+)<\/h1>/i);
    }
    if (!price) {
      const myPrice = html.match(/class=["']pdp-price[^"']*["'][^>]*>\s*₹[\s\u00A0]*([\d,]+(?:\.\d+)?)/i) || html.match(/class=["']pdp-discount-price[^"']*["'][^>]*>\s*₹[\s\u00A0]*([\d,]+(?:\.\d+)?)/i);
      price = normalizeStr(myPrice?.[1] || price);
    }
    if (!originalPrice) {
      const myOrig = html.match(/class=["']pdp-mrp[^"']*["'][^>]*>\s*₹?[\s\u00A0]*([\d,]+(?:\.\d+)?)/i);
      originalPrice = normalizeStr(myOrig?.[1] || originalPrice);
    }
  }

  // Improved generic handling for non-Amazon/Flipkart/Myntra websites
  if (!hostname.includes('amazon.') && !hostname.includes('flipkart.') && !hostname.includes('myntra.')) {
    // Blocklist: skip price extraction entirely on admin/login dashboards
    const blockedPriceHosts = ['admin.shopify.com'];
    const isBlocked = blockedPriceHosts.some(h => hostname.includes(h));
    if (!isBlocked) {
      // Try Shopify-like extraction first
      const shopify = extractShopifyPrices(html);
      if (!price && shopify.price) price = shopify.price;
      if (!originalPrice && shopify.originalPrice) originalPrice = shopify.originalPrice;

      // JSON-LD fallback for price if available
      if (!price && ldPrice) price = ldPrice;
      if (!originalPrice && ldOriginal) {
        const pNum = toNum(price);
        const oNum = toNum(ldOriginal);
        if (!isNaN(pNum) && !isNaN(oNum) && oNum > pNum && oNum <= pNum * 6) {
          originalPrice = ldOriginal;
        }
      }

      // Fallback to robust generic extractor
      if (!price || (!originalPrice && price)) {
        const gen = extractGenericPrices(html);
        if (!price && gen.price) price = gen.price;
        if (!originalPrice && gen.originalPrice) originalPrice = gen.originalPrice;
      }
    }
  }

  // Final normalization and heuristic minor-unit correction for non-Amazon/Flipkart/Myntra
  price = normalizeStr(price);
  originalPrice = normalizeStr(originalPrice);
  const isMajorPlatform = hostname.includes('amazon.') || hostname.includes('flipkart.') || hostname.includes('myntra.');
  if (!isMajorPlatform) {
    const pNum = toNum(price);
    const oNum = toNum(originalPrice);
    // If price looks like paise (very large for INR), adjust down by 100
    if (!isNaN(pNum) && pNum >= 10000) {
      price = normalizeStr(String(Math.round(pNum / 100)));
    }
    if (!isNaN(oNum) && oNum >= 10000) {
      originalPrice = normalizeStr(String(Math.round(oNum / 100)));
    }
  }

  return { title, description, image, price, originalPrice };
}

function humanizeFromPath(pathname) {
  try {
    const parts = pathname.split('/').filter(Boolean);
    // Prefer last slug before dp or ref segment
    let candidate = parts.find((p) => /-/.test(p) && !/^dp$/i.test(p)) || parts[parts.length - 1] || '';
    candidate = candidate.replace(/([A-Z0-9]{8,})/g, '').replace(/[-_]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
    if (candidate.length > 5) return candidate;
    return '';
  } catch { return ''; }
}

export const urlProcessingService = {
  /**
   * Process a URL and attempt to extract product meta via HTML scraping.
   * Returns { success, productCard?, error? }
   */
  async processURL(url, pageSlug = '') {
    try {
      let targetUrl = url;
      if (!String(targetUrl).startsWith('http')) {
        targetUrl = 'https://' + String(targetUrl);
      }

      // Resolve redirects (shorteners / affiliate wrappers)
      const { finalUrl, body } = await fetchWithRedirects(targetUrl, 5);
      const hostname = (() => { try { return new URL(finalUrl).hostname.replace('www.', ''); } catch { return 'unknown'; } })();

      // Extract meta
  const meta = body ? extractMetaFromHtml(body, hostname) : { title: null, description: null, image: null, price: null };

      // If still missing title, derive from path
      let derivedTitle = meta.title;
      if (!derivedTitle) {
        try {
          const pathname = new URL(finalUrl).pathname;
          derivedTitle = humanizeFromPath(pathname);
        } catch {}
      }

      // Resolve relative image URLs and prefer https
      let finalImage = meta.image || null;
      try {
        if (finalImage && !/^https?:\/\//i.test(finalImage)) {
          finalImage = new URL(finalImage, finalUrl).toString();
        }
        if (finalImage && finalImage.startsWith('http://')) {
          finalImage = finalImage.replace('http://', 'https://');
        }
      } catch {}

      const productCard = {
        name: derivedTitle || `Product from ${hostname}`,
        description: meta.description || '',
        price: meta.price || null,
        originalPrice: meta.originalPrice || null,
        discount: meta.price && meta.originalPrice ? (() => {
          try {
            const p = parseFloat(String(meta.price).replace(/,/g, ''));
            const o = parseFloat(String(meta.originalPrice).replace(/,/g, ''));
            if (isFinite(p) && isFinite(o) && o > p) {
              return Math.round(((o - p) / o) * 100);
            }
          } catch {}
          return null;
        })() : null,
        currency: 'INR',
        imageUrl: finalImage,
        urls: [finalUrl],
        source: hostname,
        pageSlug
      };

      return { success: true, productCard };
    } catch (error) {
      return { success: false, error: String(error?.message || error) };
    }
  }
};