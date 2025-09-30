const Database = require('better-sqlite3');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fetch = require('node-fetch');
const { createHash } = require('crypto');

console.log('Search REAL PRODUCT IMAGE EXTRACTOR');
console.log('=' .repeat(60));
console.log('Target Goal: Extract authentic product images from affiliate URLs');
console.log('💼 Business Impact: Build customer trust with real product photos');
console.log('Launch Method: Advanced web scraping + CORS-friendly proxying');
console.log('');

class RealImageExtractor {
  constructor() {
    this.browser = null;
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    this.successCount = 0;
    this.failCount = 0;
  }

  async initBrowser() {
    if (!this.browser) {
      console.log('AI Initializing Puppeteer browser...');
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
      console.log('Success Browser initialized successfully');
    }
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log('🔒 Browser closed');
    }
  }

  // Extract real product image from affiliate URL
  async extractRealImage(affiliateUrl, productName) {
    console.log(`\nSearch Extracting real image for: ${productName}`);
    console.log(`Link Source URL: ${affiliateUrl}`);

    // Try multiple extraction methods
    const methods = [
      () => this.extractWithPuppeteer(affiliateUrl, productName),
      () => this.extractWithCheerio(affiliateUrl, productName),
      () => this.extractFromMetaTags(affiliateUrl, productName)
    ];

    for (let i = 0; i < methods.length; i++) {
      try {
        console.log(`   📋 Trying method ${i + 1}/${methods.length}...`);
        const result = await methods[i]();
        if (result.success) {
          console.log(`   Success Success with method ${i + 1}: ${result.method}`);
          console.log(`   🖼️  Image URL: ${result.imageUrl}`);
          return result;
        }
      } catch (error) {
        console.log(`   Warning  Method ${i + 1} failed: ${error.message}`);
        continue;
      }
    }

    console.log(`   Error All methods failed for ${productName}`);
    return {
      success: false,
      error: 'Could not extract real product image',
      fallbackUsed: true
    };
  }

  // Method 1: Advanced Puppeteer scraping
  async extractWithPuppeteer(url, productName) {
    await this.initBrowser();
    const page = await this.browser.newPage();
    
    try {
      await page.setUserAgent(this.userAgent);
      await page.setViewport({ width: 1920, height: 1080 });
      
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.waitForTimeout(3000); // Wait for images to load
      
      // Smart selectors for different e-commerce platforms
      const selectors = [
        // Amazon
        '#landingImage',
        '[data-testid="product-image"]',
        '.a-dynamic-image',
        '#imgTagWrapperId img',
        
        // Flipkart
        '._396cs4._2amPTt._3qGmMb img',
        '._1AtVbE img',
        
        // Samsung
        '.pd-gallery-image-container img',
        '.product-hero-image img',
        
        // Apple
        '.hero-image img',
        '.product-hero img',
        
        // OnePlus
        '.product-image img',
        '.hero-banner img',
        
        // Generic patterns
        '[data-testid="main-image"]',
        '.product-image img',
        '.product-photo img',
        '.main-image img',
        '.hero-image img',
        '.product-gallery img:first-child',
        'img[alt*="product"]',
        'img[alt*="Product"]',
        'main img:first-of-type'
      ];
      
      for (const selector of selectors) {
        try {
          const imageUrl = await page.$eval(selector, (img) => {
            // Get highest resolution image
            if (img.srcset) {
              const sources = img.srcset.split(',').map(s => s.trim());
              const highRes = sources[sources.length - 1];
              return highRes.split(' ')[0];
            }
            return img.src;
          });
          
          if (imageUrl && this.isValidImageUrl(imageUrl)) {
            return {
              success: true,
              imageUrl: this.cleanImageUrl(imageUrl),
              method: 'puppeteer-scraping',
              selector: selector
            };
          }
        } catch (error) {
          continue;
        }
      }
      
      throw new Error('No valid image found with Puppeteer');
      
    } finally {
      await page.close();
    }
  }

  // Method 2: Fast Cheerio scraping
  async extractWithCheerio(url, productName) {
    const response = await fetch(url, {
      headers: {
        'User-Agent': this.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      },
      timeout: 20000
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const selectors = [
      '.product-image img',
      '.main-image img',
      '[data-testid="product-image"]',
      'img[alt*="product"]',
      'img[alt*="Product"]',
      'main img:first-of-type'
    ];
    
    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length) {
        const imageUrl = element.attr('src') || element.attr('data-src') || '';
        
        if (imageUrl && this.isValidImageUrl(imageUrl)) {
          return {
            success: true,
            imageUrl: this.cleanImageUrl(imageUrl),
            method: 'cheerio-scraping',
            selector: selector
          };
        }
      }
    }
    
    throw new Error('No valid image found with Cheerio');
  }

  // Method 3: Meta tags extraction
  async extractFromMetaTags(url, productName) {
    const response = await fetch(url, {
      headers: { 'User-Agent': this.userAgent },
      timeout: 10000
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const ogImage = $('meta[property="og:image"]').attr('content');
    const twitterImage = $('meta[name="twitter:image"]').attr('content');
    
    const imageUrl = ogImage || twitterImage;
    
    if (imageUrl && this.isValidImageUrl(imageUrl)) {
      return {
        success: true,
        imageUrl: this.cleanImageUrl(imageUrl),
        method: 'meta-tags'
      };
    }
    
    throw new Error('No valid image in meta tags');
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
    
    return imagePatterns.some(pattern => pattern.test(url)) && 
           !url.includes('placeholder') && 
           !url.includes('loading') &&
           !url.includes('spinner') &&
           !url.includes('default');
  }

  // Clean image URL
  cleanImageUrl(url) {
    if (url.startsWith('//')) {
      return 'https:' + url;
    }
    return url.split('?')[0]; // Remove query params
  }

  // Generate proxy URL for CORS-free access
  generateProxyUrl(originalUrl) {
    const encodedUrl = encodeURIComponent(originalUrl);
    return `http://localhost:5000/api/image-proxy?url=${encodedUrl}&width=400&quality=80&format=webp`;
  }
}

// Main execution
async function main() {
  const extractor = new RealImageExtractor();
  
  try {
    const db = new Database('./database.sqlite');
    
    // Get all Click Picks products
    const products = db.prepare(`
      SELECT id, name, affiliate_url, image_url 
      FROM click_picks_products 
      ORDER BY id
    `).all();
    
    console.log(`Stats Found ${products.length} products to process`);
    console.log('');
    
    const results = [];
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      console.log(`\n[${i + 1}/${products.length}] Processing: ${product.name}`);
      
      try {
        const result = await extractor.extractRealImage(product.affiliate_url, product.name);
        
        if (result.success) {
          // Generate proxy URL for CORS-free access
          const proxyUrl = extractor.generateProxyUrl(result.imageUrl);
          
          // Update database with real image URL
          const updateStmt = db.prepare('UPDATE click_picks_products SET image_url = ? WHERE id = ?');
          updateStmt.run(proxyUrl, product.id);
          
          console.log(`   Success Updated database with proxy URL`);
          console.log(`   Link Proxy URL: ${proxyUrl}`);
          
          extractor.successCount++;
          results.push({
            id: product.id,
            name: product.name,
            success: true,
            originalImageUrl: result.imageUrl,
            proxyUrl: proxyUrl,
            method: result.method
          });
        } else {
          console.log(`   Error Failed to extract real image`);
          extractor.failCount++;
          results.push({
            id: product.id,
            name: product.name,
            success: false,
            error: result.error
          });
        }
        
        // Add delay to avoid being blocked
        if (i < products.length - 1) {
          console.log(`   ⏳ Waiting 3 seconds before next product...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
      } catch (error) {
        console.log(`   Error Error processing ${product.name}: ${error.message}`);
        extractor.failCount++;
        results.push({
          id: product.id,
          name: product.name,
          success: false,
          error: error.message
        });
      }
    }
    
    // Final summary
    console.log('\n' + '=' .repeat(60));
    console.log('Stats EXTRACTION SUMMARY');
    console.log('=' .repeat(60));
    console.log(`Success Successful extractions: ${extractor.successCount}`);
    console.log(`Error Failed extractions: ${extractor.failCount}`);
    console.log(`📈 Success rate: ${Math.round((extractor.successCount / products.length) * 100)}%`);
    console.log('');
    
    // Show successful results
    const successful = results.filter(r => r.success);
    if (successful.length > 0) {
      console.log('Celebration SUCCESSFULLY EXTRACTED REAL IMAGES:');
      console.log('-' .repeat(50));
      successful.forEach((result, index) => {
        console.log(`${index + 1}. ${result.name}`);
        console.log(`   Link Original: ${result.originalImageUrl}`);
        console.log(`   Global Proxy: ${result.proxyUrl}`);
        console.log(`   📋 Method: ${result.method}`);
        console.log('');
      });
    }
    
    // Show failed results
    const failed = results.filter(r => !r.success);
    if (failed.length > 0) {
      console.log('Warning  FAILED EXTRACTIONS (will use fallback):');
      console.log('-' .repeat(50));
      failed.forEach((result, index) => {
        console.log(`${index + 1}. ${result.name}`);
        console.log(`   Error Error: ${result.error}`);
        console.log('');
      });
    }
    
    console.log('Tip NEXT STEPS:');
    console.log('1. Start the server: npm run dev');
    console.log('2. Visit Click Picks page to see real product images');
    console.log('3. Images are now served through our proxy (no CORS issues)');
    console.log('4. Failed products will use high-quality fallback images');
    console.log('');
    console.log('Target BUSINESS IMPACT:');
    console.log('Success Authentic product images build customer trust');
    console.log('Success No more random placeholder images');
    console.log('Success Professional appearance increases conversions');
    console.log('Success CORS-free image serving ensures reliability');
    
    db.close();
    
  } catch (error) {
    console.error('Error Fatal error:', error.message);
  } finally {
    await extractor.closeBrowser();
  }
}

// Run the extraction
main().catch(console.error);