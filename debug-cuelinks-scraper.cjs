// Debug Cuelinks Scraper Issues
// Test why the universal scraper is failing and falling back to placeholder data

const axios = require('axios');
const cheerio = require('cheerio');

class CuelinksScrapeDebugger {
  constructor() {
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    this.timeout = 15000;
  }

  async debugCuelinksIssues() {
    console.log('🔍 DEBUGGING CUELINKS SCRAPER ISSUES');
    console.log('=====================================');
    
    // Test URLs from recent Cuelinks posts
    const testUrls = [
      'https://www.amazon.in/dp/B08N5WRWNW', // Example Amazon product
      'https://www.flipkart.com/samsung-galaxy-m34-5g-waterfall-blue-128-gb/p/itm6c7d4c2b85c27', // Example Flipkart
      'https://www.myntra.com/tshirts/roadster/roadster-men-navy-blue-solid-round-neck-t-shirt/1700834/buy' // Example Myntra
    ];

    for (const url of testUrls) {
      console.log(`\n🔗 Testing URL: ${url}`);
      await this.testSingleUrl(url);
    }
  }

  async testSingleUrl(url) {
    try {
      console.log(`   📡 Fetching page...`);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive'
        },
        timeout: this.timeout,
        maxRedirects: 5
      });

      if (!response.data) {
        console.log(`   ❌ No response data received`);
        return;
      }

      console.log(`   ✅ Page fetched successfully (${response.data.length} chars)`);
      
      const $ = cheerio.load(response.data);
      const platform = this.detectPlatform(url);
      
      console.log(`   🏪 Platform: ${platform}`);
      
      // Test different extraction methods
      const extractedData = this.extractProductData($, url, platform);
      
      console.log(`   📊 Extracted Data:`);
      console.log(`      Title: ${extractedData.title || 'NOT FOUND'}`);
      console.log(`      Price: ${extractedData.price || 'NOT FOUND'}`);
      console.log(`      Original Price: ${extractedData.originalPrice || 'NOT FOUND'}`);
      console.log(`      Image: ${extractedData.imageUrl ? 'FOUND' : 'NOT FOUND'}`);
      console.log(`      Discount: ${extractedData.discount || 'NOT CALCULATED'}`);
      
      // Test specific selectors
      this.testSpecificSelectors($, platform);
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  detectPlatform(url) {
    const domain = url.toLowerCase();
    if (domain.includes('amazon.')) return 'amazon';
    if (domain.includes('flipkart.')) return 'flipkart';
    if (domain.includes('myntra.')) return 'myntra';
    if (domain.includes('nykaa.')) return 'nykaa';
    return 'unknown';
  }

  extractProductData($, url, platform) {
    let title, price, originalPrice, imageUrl, discount;

    // Platform-specific extraction
    switch (platform) {
      case 'amazon':
        title = this.extractAmazonTitle($);
        price = this.extractAmazonPrice($);
        originalPrice = this.extractAmazonOriginalPrice($);
        imageUrl = this.extractAmazonImage($);
        break;
      
      case 'flipkart':
        title = this.extractFlipkartTitle($);
        price = this.extractFlipkartPrice($);
        originalPrice = this.extractFlipkartOriginalPrice($);
        imageUrl = this.extractFlipkartImage($);
        break;
      
      default:
        title = this.extractGenericTitle($);
        price = this.extractGenericPrice($);
        originalPrice = this.extractGenericOriginalPrice($);
        imageUrl = this.extractGenericImage($);
    }

    // Calculate discount
    if (price && originalPrice) {
      const currentPrice = parseFloat(price.replace(/[^\d.]/g, ''));
      const origPrice = parseFloat(originalPrice.replace(/[^\d.]/g, ''));
      if (origPrice > currentPrice) {
        discount = `${Math.round(((origPrice - currentPrice) / origPrice) * 100)}%`;
      }
    }

    return { title, price, originalPrice, imageUrl, discount };
  }

  // Amazon-specific extractors
  extractAmazonTitle($) {
    const selectors = [
      '#productTitle',
      '.product-title',
      'h1.a-size-large',
      'h1[data-automation-id="product-title"]',
      '.a-size-large.product-title-word-break'
    ];
    
    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length && element.text().trim()) {
        return element.text().trim();
      }
    }
    return null;
  }

  extractAmazonPrice($) {
    const selectors = [
      '.a-price-current .a-offscreen',
      '.a-price .a-offscreen',
      '#priceblock_dealprice',
      '#priceblock_ourprice',
      '.a-price-whole'
    ];
    
    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length && element.text().trim()) {
        return element.text().trim();
      }
    }
    return null;
  }

  extractAmazonOriginalPrice($) {
    const selectors = [
      '.a-price.a-text-price .a-offscreen',
      '.a-price-was .a-offscreen',
      '#priceblock_listprice',
      '.a-text-strike .a-offscreen'
    ];
    
    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length && element.text().trim()) {
        return element.text().trim();
      }
    }
    return null;
  }

  extractAmazonImage($) {
    const selectors = [
      '#landingImage',
      '[data-testid="product-image"]',
      '.a-dynamic-image',
      '#imgTagWrapperId img'
    ];
    
    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length) {
        const src = element.attr('src') || element.attr('data-src');
        if (src && this.isValidImageUrl(src)) {
          return src;
        }
      }
    }
    return null;
  }

  // Flipkart-specific extractors
  extractFlipkartTitle($) {
    const selectors = [
      '.B_NuCI',
      '.x-product-title-label',
      'h1.yhB1nd',
      '._35KyD6'
    ];
    
    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length && element.text().trim()) {
        return element.text().trim();
      }
    }
    return null;
  }

  extractFlipkartPrice($) {
    const selectors = [
      '._30jeq3._16Jk6d',
      '._30jeq3',
      '._1_WHN1',
      '.CEmiEU .Nx9bqj'
    ];
    
    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length && element.text().trim()) {
        return element.text().trim();
      }
    }
    return null;
  }

  extractFlipkartOriginalPrice($) {
    const selectors = [
      '._3I9_wc._2p6lqe',
      '._3I9_wc',
      '._2p6lqe',
      '.CEmiEU ._3I9_wc'
    ];
    
    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length && element.text().trim()) {
        return element.text().trim();
      }
    }
    return null;
  }

  extractFlipkartImage($) {
    const selectors = [
      '._396cs4._2amPTt._3qGmMb img',
      '._2r_T1I img',
      '.CXW8mj img',
      '._1BweB8 img'
    ];
    
    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length) {
        const src = element.attr('src') || element.attr('data-src');
        if (src && this.isValidImageUrl(src)) {
          return src;
        }
      }
    }
    return null;
  }

  // Generic extractors
  extractGenericTitle($) {
    const selectors = [
      'h1',
      '.product-title',
      '.product-name',
      '[data-testid="product-title"]'
    ];
    
    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length && element.text().trim()) {
        return element.text().trim();
      }
    }
    return null;
  }

  extractGenericPrice($) {
    const selectors = [
      '.price',
      '.current-price',
      '.sale-price',
      '.offer-price'
    ];
    
    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length && element.text().trim()) {
        return element.text().trim();
      }
    }
    return null;
  }

  extractGenericOriginalPrice($) {
    const selectors = [
      '.original-price',
      '.regular-price',
      '.was-price',
      '.list-price'
    ];
    
    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length && element.text().trim()) {
        return element.text().trim();
      }
    }
    return null;
  }

  extractGenericImage($) {
    const selectors = [
      '.product-image img',
      '.main-image img',
      '.hero-image img',
      'img[alt*="product"]'
    ];
    
    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length) {
        const src = element.attr('src') || element.attr('data-src');
        if (src && this.isValidImageUrl(src)) {
          return src;
        }
      }
    }
    return null;
  }

  testSpecificSelectors($, platform) {
    console.log(`   🔍 Testing specific selectors for ${platform}:`);
    
    // Test common selectors
    const commonSelectors = [
      'h1', 'title', '.price', '.product-title', 
      '.product-image img', '.main-image img'
    ];
    
    for (const selector of commonSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`      ✅ ${selector}: ${elements.length} elements found`);
        if (elements.first().text().trim()) {
          console.log(`         Text: "${elements.first().text().trim().substring(0, 50)}..."`);
        }
      } else {
        console.log(`      ❌ ${selector}: No elements found`);
      }
    }
  }

  isValidImageUrl(url) {
    if (!url) return false;
    return url.includes('http') && (
      url.includes('.jpg') || url.includes('.jpeg') || 
      url.includes('.png') || url.includes('.webp') ||
      url.includes('images-') || url.includes('img.')
    );
  }
}

// Run the debugger
async function main() {
  const scrapeDebugger = new CuelinksScrapeDebugger();
  await scrapeDebugger.debugCuelinksIssues();
}

main().catch(console.error);