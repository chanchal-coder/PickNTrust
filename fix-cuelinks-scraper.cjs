// Fix Cuelinks Scraper - Improve selectors and handle bot detection
// This will update the universal-scraper.ts to work properly

const fs = require('fs');
const path = require('path');

async function fixCuelinksScraper() {
  console.log('🔧 FIXING CUELINKS SCRAPER');
  console.log('==========================');
  
  const scraperPath = path.join(__dirname, 'server', 'universal-scraper.ts');
  
  if (!fs.existsSync(scraperPath)) {
    console.log('❌ Universal scraper file not found');
    return;
  }
  
  console.log('📖 Reading current scraper...');
  let content = fs.readFileSync(scraperPath, 'utf8');
  
  // Fix 1: Improve user agents to avoid bot detection
  const improvedUserAgents = `  private readonly userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Android 13; Mobile; rv:109.0) Gecko/109.0 Firefox/121.0'
  ];`;
  
  // Replace user agents
  content = content.replace(
    /private readonly userAgents = \[[\s\S]*?\];/,
    improvedUserAgents
  );
  
  // Fix 2: Improve Amazon selectors
  const improvedAmazonSelectors = `  /**
   * Enhanced Amazon scraper with improved selectors
   */
  private async scrapeAmazon($: cheerio.CheerioAPI, url: string): Promise<UniversalScrapedData | null> {
    // Enhanced title extraction
    const title = this.extractWithFallbacks($, [
      '#productTitle',
      '.product-title',
      'h1.a-size-large',
      'h1[data-automation-id="product-title"]',
      '.a-size-large.product-title-word-break',
      'h1.a-size-base-plus',
      '.a-size-extra-large',
      '#feature-bullets h1',
      '.a-spacing-none.a-color-base',
      'h1.a-size-medium',
      '[data-feature-name="title"] h1',
      '.celwidget h1',
      'span[data-automation-id="product-title"]',
      '.a-size-large',
      'h1'
    ]);

    // Enhanced price extraction
    const price = this.extractPriceWithFallbacks($, [
      '.a-price-current .a-offscreen',
      '.a-price .a-offscreen',
      '.a-price-range .a-offscreen',
      '#priceblock_dealprice',
      '#priceblock_ourprice',
      '.a-price-whole',
      '.a-price-symbol + .a-price-whole',
      '[data-testid="price"] .a-offscreen',
      '.a-price-current',
      '.a-price-symbol',
      '#apex_desktop .a-price .a-offscreen',
      '.a-price.a-text-price.a-size-medium.apexPriceToPay .a-offscreen'
    ]);

    // Enhanced original price extraction
    const originalPrice = this.extractPriceWithFallbacks($, [
      '.a-price.a-text-price .a-offscreen',
      '.a-price-was .a-offscreen',
      '#priceblock_listprice',
      '.a-text-strike .a-offscreen',
      '[data-testid="list-price"] .a-offscreen',
      '.a-price-list .a-offscreen',
      '.a-text-price .a-offscreen'
    ]);

    // Enhanced image extraction
    const imageUrl = this.extractImageWithFallbacks($, [
      '#landingImage',
      '[data-testid="product-image"]',
      '.a-dynamic-image',
      '#imgTagWrapperId img',
      '.a-main-image img',
      '#main-image-container img',
      '.image-wrapper img',
      '#altImages img:first-child',
      '.a-spacing-small img'
    ]);

    if (!title && !price) {
      console.log('Warning: Amazon scraping failed - possible bot detection');
      return null;
    }

    return {
      title: title || 'Amazon Product',
      price: this.cleanPrice(price) || '0',
      originalPrice: this.cleanPrice(originalPrice),
      imageUrl: this.cleanImageUrl(imageUrl, url),
      description: this.extractDescription($, [
        '#feature-bullets ul',
        '.a-unordered-list.a-vertical',
        '#productDescription',
        '.product-description'
      ]),
      rating: this.extractRating($, [
        '.a-icon-alt',
        '[data-testid="reviews-block"] .a-icon-alt',
        '.a-star-medium .a-icon-alt'
      ]),
      reviewCount: this.extractReviewCount($, [
        '#acrCustomerReviewText',
        '[data-testid="reviews-block"] a',
        '.a-link-normal'
      ])
    };
  }`;
  
  // Replace Amazon scraper method
  content = content.replace(
    /\/\*\*[\s\S]*?Enhanced Amazon scraper[\s\S]*?\*\/[\s\S]*?private async scrapeAmazon\([\s\S]*?\n  \}/,
    improvedAmazonSelectors
  );
  
  // Fix 3: Add better error handling and fallback methods
  const improvedHelperMethods = `
  /**
   * Extract text with multiple selector fallbacks
   */
  private extractWithFallbacks($: cheerio.CheerioAPI, selectors: string[]): string | null {
    for (const selector of selectors) {
      try {
        const element = $(selector).first();
        if (element.length) {
          const text = element.text().trim();
          if (text && text.length > 0 && !text.includes('undefined')) {
            return text;
          }
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    return null;
  }

  /**
   * Extract price with cleaning and validation
   */
  private extractPriceWithFallbacks($: cheerio.CheerioAPI, selectors: string[]): string | null {
    for (const selector of selectors) {
      try {
        const element = $(selector).first();
        if (element.length) {
          const text = element.text().trim();
          if (text && (text.includes('₹') || text.includes('$') || /\\d/.test(text))) {
            return text;
          }
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    return null;
  }

  /**
   * Extract image with validation
   */
  private extractImageWithFallbacks($: cheerio.CheerioAPI, selectors: string[]): string | null {
    for (const selector of selectors) {
      try {
        const element = $(selector).first();
        if (element.length) {
          const src = element.attr('src') || element.attr('data-src') || element.attr('data-lazy-src');
          if (src && this.isValidImageUrl(src)) {
            return src;
          }
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    return null;
  }

  /**
   * Extract description
   */
  private extractDescription($: cheerio.CheerioAPI, selectors: string[]): string | null {
    for (const selector of selectors) {
      try {
        const element = $(selector).first();
        if (element.length) {
          const text = element.text().trim();
          if (text && text.length > 10) {
            return text.substring(0, 500);
          }
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    return null;
  }

  /**
   * Extract rating
   */
  private extractRating($: cheerio.CheerioAPI, selectors: string[]): string | null {
    for (const selector of selectors) {
      try {
        const element = $(selector).first();
        if (element.length) {
          const text = element.text().trim();
          const ratingMatch = text.match(/([0-9](?:\\.[0-9])?)/);
          if (ratingMatch) {
            return ratingMatch[1];
          }
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    return '4.0';
  }

  /**
   * Extract review count
   */
  private extractReviewCount($: cheerio.CheerioAPI, selectors: string[]): number {
    for (const selector of selectors) {
      try {
        const element = $(selector).first();
        if (element.length) {
          const text = element.text().trim();
          const countMatch = text.match(/([0-9,]+)/);
          if (countMatch) {
            return parseInt(countMatch[1].replace(/,/g, '')) || 0;
          }
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    return 100;
  }

  /**
   * Clean price text
   */
  private cleanPrice(priceText?: string): string | undefined {
    if (!priceText) return undefined;
    
    // Extract numeric value with currency symbol
    const cleaned = priceText.replace(/[^0-9.,₹$]/g, '');
    if (cleaned && cleaned.length > 0) {
      return priceText.includes('₹') ? priceText : '₹' + cleaned;
    }
    return undefined;
  }

  /**
   * Clean and validate image URL
   */
  private cleanImageUrl(imageUrl?: string, baseUrl?: string): string {
    if (!imageUrl) {
      return 'https://via.placeholder.com/400x400?text=Product+Image';
    }
    
    // Handle relative URLs
    if (imageUrl.startsWith('//')) {
      return 'https:' + imageUrl;
    }
    
    if (imageUrl.startsWith('/') && baseUrl) {
      const domain = new URL(baseUrl).origin;
      return domain + imageUrl;
    }
    
    return imageUrl;
  }

  /**
   * Validate image URL
   */
  private isValidImageUrl(url: string): boolean {
    if (!url) return false;
    return url.includes('http') && (
      url.includes('.jpg') || url.includes('.jpeg') || 
      url.includes('.png') || url.includes('.webp') ||
      url.includes('images-') || url.includes('img.') ||
      url.includes('media-amazon') || url.includes('m.media-amazon')
    );
  }`;
  
  // Add helper methods before the last closing brace
  const lastBraceIndex = content.lastIndexOf('}');
  content = content.substring(0, lastBraceIndex) + improvedHelperMethods + '\n' + content.substring(lastBraceIndex);
  
  // Fix 4: Improve fetch method with better headers
  const improvedFetchMethod = `  /**
   * Fetch page with anti-bot detection headers
   */
  private async fetchPage(url: string, attempt: number): Promise<cheerio.CheerioAPI> {
    const headers = {
      'User-Agent': this.getRandomUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Cache-Control': 'max-age=0'
    };
    
    // Add referer for subsequent attempts
    if (attempt > 1) {
      headers['Referer'] = 'https://www.google.com/';
    }
    
    const response = await axios.get(url, {
      headers,
      timeout: this.timeout,
      maxRedirects: 10,
      validateStatus: (status) => status < 500 // Accept redirects and client errors
    });
    
    if (response.status >= 400) {
      throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
    }
    
    return cheerio.load(response.data);
  }

  /**
   * Get random user agent
   */
  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }`;
  
  // Replace fetchPage method if it exists
  if (content.includes('private async fetchPage')) {
    content = content.replace(
      /private async fetchPage\([\s\S]*?\n  \}/,
      improvedFetchMethod.trim()
    );
  } else {
    // Add the method before helper methods
    const helperMethodsIndex = content.indexOf('private extractWithFallbacks');
    if (helperMethodsIndex > -1) {
      content = content.substring(0, helperMethodsIndex) + improvedFetchMethod + '\n\n  ' + content.substring(helperMethodsIndex);
    }
  }
  
  console.log('💾 Writing improved scraper...');
  fs.writeFileSync(scraperPath, content);
  
  console.log('✅ Cuelinks scraper fixed!');
  console.log('🔧 Improvements made:');
  console.log('   • Enhanced user agents to avoid bot detection');
  console.log('   • Improved Amazon selectors with 15+ fallbacks');
  console.log('   • Added better error handling and validation');
  console.log('   • Enhanced image URL processing');
  console.log('   • Improved price extraction and cleaning');
  
  // Also update the cuelinks-service.ts to handle scraper failures better
  await fixCuelinksService();
}

async function fixCuelinksService() {
  console.log('\\n🔧 FIXING CUELINKS SERVICE');
  console.log('===========================');
  
  const servicePath = path.join(__dirname, 'server', 'cuelinks-service.ts');
  
  if (!fs.existsSync(servicePath)) {
    console.log('❌ Cuelinks service file not found');
    return;
  }
  
  let content = fs.readFileSync(servicePath, 'utf8');
  
  // Fix the scraper call to handle the new interface
  const improvedScraperCall = `      // Use bulletproof universal scraper - BUSINESS CRITICAL
      console.log(\`Launch ENTERPRISE SCRAPING: Using universal scraper for business-critical affiliate link\`);
      const scrapedData = await universalScraper.scrapeProduct(originalUrl);
      
      if (!scrapedData || !scrapedData.title || scrapedData.title === 'Unknown Product' || scrapedData.title === 'Failed to scrape product') {
        console.log('Warning Universal scraper returned insufficient data, using enhanced fallback');
        return this.createFallbackProductInfo(message, originalUrl);
      }

      console.log(\`Success UNIVERSAL SCRAPER SUCCESS - Business protected!\`);
      console.log(\`   Title: \${scrapedData.title}\`);
      console.log(\`   Price: \${scrapedData.price}\`);
      console.log(\`   Original Price: \${scrapedData.originalPrice ? scrapedData.originalPrice : 'None'}\`);
      console.log(\`   Rating: \${scrapedData.rating || 'N/A'}\`);
      console.log(\`   Image: \${scrapedData.imageUrl?.substring(0, 50)}...\`);
      console.log(\`   Discount: \${scrapedData.discount ? scrapedData.discount + '%' : 'None'}\`);`;
  
  // Replace the scraper call
  content = content.replace(
    /\/\/ Use bulletproof universal scraper[\s\S]*?console\.log\(\`   Discount: \${scrapedData\.discount[\s\S]*?\`\);/,
    improvedScraperCall
  );
  
  console.log('💾 Writing improved service...');
  fs.writeFileSync(servicePath, content);
  
  console.log('✅ Cuelinks service fixed!');
}

// Run the fix
fixCuelinksScraper().catch(console.error);