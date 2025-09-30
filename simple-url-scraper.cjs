// Simple URL Scraper for Bot Integration
// Extracts product details from URLs using basic web scraping

const axios = require('axios');
const cheerio = require('cheerio');

class SimpleURLScraper {
  constructor() {
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    this.timeout = 15000; // 15 seconds
  }

  /**
   * Scrape product details from URL
   */
  async scrapeProductFromURL(url) {
    try {
      console.log(`🔍 Scraping product from: ${url}`);
      
      // First resolve any redirects
      const finalUrl = await this.resolveRedirects(url);
      console.log(`📍 Final URL: ${finalUrl}`);
      
      // Fetch the page
      const response = await axios.get(finalUrl, {
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
        throw new Error('No response data received');
      }

      const $ = cheerio.load(response.data);
      
      // Extract product details using generic selectors
      const productData = this.extractProductData($, finalUrl);
      
      console.log('✅ Scraped product data:', {
        title: productData.title,
        price: productData.price,
        originalPrice: productData.originalPrice,
        imageUrl: productData.imageUrl ? 'Found' : 'Not found'
      });
      
      return productData;
      
    } catch (error) {
      console.error(`❌ Scraping failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Resolve URL redirects to get final URL
   */
  async resolveRedirects(url) {
    try {
      const response = await axios.head(url, {
        headers: { 'User-Agent': this.userAgent },
        maxRedirects: 10,
        timeout: 10000
      });
      return response.request.res.responseUrl || url;
    } catch (error) {
      // If HEAD fails, try GET with limited data
      try {
        const response = await axios.get(url, {
          headers: { 'User-Agent': this.userAgent },
          maxRedirects: 10,
          timeout: 10000,
          responseType: 'stream'
        });
        response.data.destroy(); // Don't download the full response
        return response.request.res.responseUrl || url;
      } catch {
        return url; // Return original URL if redirect resolution fails
      }
    }
  }

  /**
   * Extract product data from page using generic selectors
   */
  extractProductData($, url) {
    const platform = this.detectPlatform(url);
    
    // Generic selectors that work across most e-commerce sites
    const titleSelectors = [
      'h1',
      '.product-title',
      '.product-name',
      '[data-testid="product-title"]',
      '.pdp-product-name',
      '.product-info h1',
      '.item-title',
      '#productTitle',
      '.a-size-large.product-title-word-break'
    ];

    const priceSelectors = [
      // Flipkart specific
      '._30jeq3._16Jk6d',
      '._30jeq3',
      '._1_WHN1',
      '.CEmiEU .Nx9bqj',
      '.CEmiEU ._30jeq3',
      '._16Jk6d',
      '.Nx9bqj',
      // Generic
      '.price',
      '.current-price',
      '.sale-price',
      '.offer-price',
      '.price-current',
      '.price-now',
      '[data-testid="price"]',
      '.a-price-whole',
      '.a-offscreen',
      '.notranslate'
    ];

    const originalPriceSelectors = [
      // Flipkart specific
      '._3I9_wc._2p6lqe',
      '._3I9_wc',
      '._2p6lqe',
      '.CEmiEU ._3I9_wc',
      '._1vC4OE',
      // Generic
      '.original-price',
      '.regular-price',
      '.was-price',
      '.list-price',
      '.mrp',
      '.price-original',
      '[data-testid="original-price"]',
      '.a-price.a-text-price .a-offscreen'
    ];

    const imageSelectors = [
      // Flipkart specific
      '._396cs4._2amPTt._3qGmMb img',
      '._2r_T1I img',
      '.CXW8mj img',
      '._1BweB8 img',
      '._396cs4 img',
      '.q6DClP img',
      // Generic
      '.product-image img',
      '.main-image img',
      '.hero-image img',
      '[data-testid="product-image"]',
      '#landingImage',
      '.a-dynamic-image',
      '.product-gallery img:first-child',
      'img[alt*="product"]',
      'img[alt*="Product"]'
    ];

    // Extract title
    let title = null;
    for (const selector of titleSelectors) {
      const element = $(selector).first();
      if (element.length && element.text().trim()) {
        title = element.text().trim();
        break;
      }
    }

    // Extract current price
    let price = null;
    for (const selector of priceSelectors) {
      const element = $(selector).first();
      if (element.length && element.text().trim()) {
        const priceText = element.text().trim();
        const priceMatch = priceText.match(/[\d,]+(?:\.\d+)?/);
        if (priceMatch) {
          price = `₹${priceMatch[0]}`;
          break;
        }
      }
    }

    // Extract original price
    let originalPrice = null;
    for (const selector of originalPriceSelectors) {
      const element = $(selector).first();
      if (element.length && element.text().trim()) {
        const priceText = element.text().trim();
        const priceMatch = priceText.match(/[\d,]+(?:\.\d+)?/);
        if (priceMatch) {
          originalPrice = `₹${priceMatch[0]}`;
          break;
        }
      }
    }

    // Extract image URL
    let imageUrl = null;
    for (const selector of imageSelectors) {
      const element = $(selector).first();
      if (element.length) {
        const src = element.attr('src') || element.attr('data-src') || element.attr('data-original');
        if (src && this.isValidImageUrl(src)) {
          imageUrl = this.cleanImageUrl(src, url);
          break;
        }
      }
    }

    // Calculate discount if both prices are available
    let discount = null;
    if (price && originalPrice) {
      const currentPrice = parseFloat(price.replace(/[₹,]/g, ''));
      const origPrice = parseFloat(originalPrice.replace(/[₹,]/g, ''));
      if (origPrice > currentPrice) {
        discount = `${Math.round(((origPrice - currentPrice) / origPrice) * 100)}%`;
      }
    }

    return {
      title: title || 'Product Deal',
      price: price,
      originalPrice: originalPrice,
      discount: discount,
      imageUrl: imageUrl,
      platform: platform,
      url: url
    };
  }

  /**
   * Detect platform from URL
   */
  detectPlatform(url) {
    const lowerUrl = url.toLowerCase();
    
    if (lowerUrl.includes('amazon')) return 'amazon';
    if (lowerUrl.includes('flipkart')) return 'flipkart';
    if (lowerUrl.includes('myntra')) return 'myntra';
    if (lowerUrl.includes('ajio')) return 'ajio';
    if (lowerUrl.includes('nykaa')) return 'nykaa';
    if (lowerUrl.includes('meesho')) return 'meesho';
    if (lowerUrl.includes('snapdeal')) return 'snapdeal';
    if (lowerUrl.includes('paytm')) return 'paytm';
    if (lowerUrl.includes('shopclues')) return 'shopclues';
    if (lowerUrl.includes('tatacliq')) return 'tatacliq';
    
    return 'unknown';
  }

  /**
   * Check if image URL is valid
   */
  isValidImageUrl(src) {
    if (!src) return false;
    
    // Skip placeholder images
    const placeholderPatterns = [
      'placeholder',
      'no-image',
      'default',
      'loading',
      'spinner',
      'blank'
    ];
    
    const lowerSrc = src.toLowerCase();
    if (placeholderPatterns.some(pattern => lowerSrc.includes(pattern))) {
      return false;
    }
    
    // Check for valid image extensions or image-like URLs
    return /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(src) || 
           src.includes('/image/') || 
           src.includes('images/') ||
           src.includes('img/');
  }

  /**
   * Clean and normalize image URL
   */
  cleanImageUrl(src, baseUrl) {
    if (!src) return null;
    
    // Handle relative URLs
    if (src.startsWith('//')) {
      return 'https:' + src;
    } else if (src.startsWith('/')) {
      try {
        const urlObj = new URL(baseUrl);
        return `${urlObj.protocol}//${urlObj.host}${src}`;
      } catch {
        return src;
      }
    }
    
    return src;
  }
}

module.exports = { SimpleURLScraper };