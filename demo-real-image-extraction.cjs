const Database = require('better-sqlite3');
const fetch = require('node-fetch');
const cheerio = require('cheerio');

console.log('Target DEMO: Real Product Image Extraction');
console.log('=' .repeat(50));
console.log('💼 Purpose: Show how to get authentic product images');
console.log('Search Method: Extract real images from affiliate URLs');
console.log('Launch Result: Build customer trust with genuine photos');
console.log('');

class ImageExtractorDemo {
  constructor() {
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  }

  // Extract image from meta tags (fastest method)
  async extractFromMetaTags(url, productName) {
    console.log(`🏷️ Extracting meta tags from: ${productName}`);
    console.log(`Link URL: ${url}`);
    
    try {
      const response = await fetch(url, {
        headers: { 
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        },
        timeout: 15000
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Extract Open Graph and Twitter meta images
      const ogImage = $('meta[property="og:image"]').attr('content');
      const twitterImage = $('meta[name="twitter:image"]').attr('content');
      const ogImageSecure = $('meta[property="og:image:secure_url"]').attr('content');
      
      console.log('   📋 Meta tag analysis:');
      console.log(`   🖼️  og:image: ${ogImage || 'Not found'}`);
      console.log(`   🐦 twitter:image: ${twitterImage || 'Not found'}`);
      console.log(`   🔒 og:image:secure_url: ${ogImageSecure || 'Not found'}`);
      
      // Choose the best image URL
      const imageUrl = ogImageSecure || ogImage || twitterImage;
      
      if (imageUrl && this.isValidImageUrl(imageUrl)) {
        const cleanUrl = this.cleanImageUrl(imageUrl);
        console.log(`   Success SUCCESS: Found valid image`);
        console.log(`   Link Image URL: ${cleanUrl}`);
        console.log(`   Global Proxy URL: http://localhost:5000/api/image-proxy?url=${encodeURIComponent(cleanUrl)}&width=400&quality=80`);
        
        return {
          success: true,
          imageUrl: cleanUrl,
          proxyUrl: `http://localhost:5000/api/image-proxy?url=${encodeURIComponent(cleanUrl)}&width=400&quality=80`,
          method: 'meta-tags'
        };
      } else {
        console.log(`   Error No valid image found in meta tags`);
        return { success: false, error: 'No valid meta image found' };
      }
      
    } catch (error) {
      console.log(`   Error Error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // Validate image URL
  isValidImageUrl(url) {
    if (!url || url.length < 10) return false;
    
    const imagePatterns = [
      /\.(jpg|jpeg|png|webp|gif|bmp)$/i,
      /\/images\//,
      /\/media\//,
      /image/i,
      /photo/i
    ];
    
    const isValidPattern = imagePatterns.some(pattern => pattern.test(url));
    const isNotPlaceholder = !url.includes('placeholder') && 
                            !url.includes('loading') &&
                            !url.includes('spinner') &&
                            !url.includes('default') &&
                            !url.includes('blank');
    
    return isValidPattern && isNotPlaceholder;
  }

  // Clean image URL
  cleanImageUrl(url) {
    if (url.startsWith('//')) {
      return 'https:' + url;
    }
    
    // Remove some query parameters but keep important ones
    const urlObj = new URL(url);
    const paramsToKeep = ['w', 'width', 'h', 'height', 'q', 'quality', 'format'];
    const newParams = new URLSearchParams();
    
    paramsToKeep.forEach(param => {
      if (urlObj.searchParams.has(param)) {
        newParams.set(param, urlObj.searchParams.get(param));
      }
    });
    
    return urlObj.origin + urlObj.pathname + (newParams.toString() ? '?' + newParams.toString() : '');
  }
}

// Demo execution
async function runDemo() {
  const extractor = new ImageExtractorDemo();
  
  try {
    const db = new Database('./database.sqlite');
    
    // Get Click Picks products
    const products = db.prepare(`
      SELECT id, name, affiliate_url 
      FROM click_picks_products 
      ORDER BY id 
      LIMIT 3
    `).all();
    
    if (products.length === 0) {
      console.log('Error No products found in click_picks_products table');
      console.log('Tip Run the fix-click-picks-images.cjs script first to add products');
      return;
    }
    
    console.log(`Stats Demo: Processing ${products.length} products`);
    console.log('');
    
    const results = [];
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      console.log(`\n[${i + 1}/${products.length}] ${product.name}`);
      console.log('-' .repeat(60));
      
      const result = await extractor.extractFromMetaTags(product.affiliate_url, product.name);
      results.push({ product, result });
      
      if (i < products.length - 1) {
        console.log('\n   ⏳ Waiting 2 seconds before next product...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Summary
    console.log('\n' + '=' .repeat(60));
    console.log('Stats DEMO RESULTS SUMMARY');
    console.log('=' .repeat(60));
    
    const successful = results.filter(r => r.result.success);
    const failed = results.filter(r => !r.result.success);
    
    console.log(`Success Successful extractions: ${successful.length}`);
    console.log(`Error Failed extractions: ${failed.length}`);
    console.log(`📈 Success rate: ${Math.round((successful.length / results.length) * 100)}%`);
    console.log('');
    
    if (successful.length > 0) {
      console.log('Celebration SUCCESSFULLY EXTRACTED IMAGES:');
      console.log('-' .repeat(40));
      successful.forEach((item, index) => {
        console.log(`${index + 1}. ${item.product.name}`);
        console.log(`   🖼️  Original: ${item.result.imageUrl}`);
        console.log(`   Global Proxy: ${item.result.proxyUrl}`);
        console.log('');
      });
    }
    
    if (failed.length > 0) {
      console.log('Warning  FAILED EXTRACTIONS:');
      console.log('-' .repeat(40));
      failed.forEach((item, index) => {
        console.log(`${index + 1}. ${item.product.name}`);
        console.log(`   Error Error: ${item.result.error}`);
        console.log('');
      });
    }
    
    console.log('Tip NEXT STEPS TO GET REAL IMAGES:');
    console.log('1. Run: node extract-real-product-images.cjs');
    console.log('2. This will use advanced scraping (Puppeteer + Cheerio)');
    console.log('3. Real images will be served through proxy (no CORS issues)');
    console.log('4. Your customers will see authentic product photos');
    console.log('');
    console.log('Target BUSINESS BENEFITS:');
    console.log('Success Authentic images build customer trust');
    console.log('Success Higher conversion rates with real product photos');
    console.log('Success Professional appearance vs random placeholders');
    console.log('Success CORS-free serving ensures images always load');
    
    db.close();
    
  } catch (error) {
    console.error('Error Demo error:', error.message);
  }
}

// Run the demo
runDemo().catch(console.error);