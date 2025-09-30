import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import axios from 'axios';

interface UniversalScrapedData {
  name: string;
  title?: string;
  description?: string;
  price: string;
  originalPrice?: string;
  currency: string;
  imageUrl: string;
  category?: string;
  rating?: string;
  reviewCount?: number;
  discount?: number;
  brand?: string;
  availability?: string;
  platform: string;
  success: boolean;
  error?: string;
  hasLimitedOffer?: boolean;
  media_urls?: string[];
  affiliate_url?: string;
  timeout?: number;
}

class UniversalScraper {
  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
  private userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  ];
  private timeout = 30000;

  /**
   * Main scraping method
   */
  async scrapeProduct(url: string): Promise<UniversalScrapedData | null> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Detect platform and scrape accordingly
      if (url.includes('amazon.')) {
        return await this.scrapeAmazon($, url);
      } else {
        return await this.scrapeGeneric($, url);
      }
    } catch (error) {
      console.error('Scraping error:', error);
      return null;
    }
  }

  /**
   * Extract text with fallback selectors
   */
  private extractWithFallbacks($: cheerio.CheerioAPI, selectors: string[]): string {
    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const text = element.text().trim();
        if (text) return text;
      }
    }
    return '';
  }

  /**
   * Extract price with fallback selectors
   */
  private extractPriceWithFallbacks($: cheerio.CheerioAPI, selectors: string[]): string {
    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const text = element.text().trim();
        if (text && /[\d,.]/.test(text)) return text;
      }
    }
    return '';
  }

  /**
   * Extract image with fallback selectors
   */
  private extractImageWithFallbacks($: cheerio.CheerioAPI, selectors: string[]): string {
    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const src = element.attr('src') || element.attr('data-src') || element.attr('data-lazy-src');
        if (src && this.isValidImageUrl(src)) {
          return src;
        }
      }
    }
    return '';
  }

  /**
   * Extract rating with fallback selectors
   */
  private extractRatingWithFallbacks($: cheerio.CheerioAPI, selectors: string[]): string {
    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const text = element.text().trim();
        const ratingMatch = text.match(/([0-9](?:\.[0-9])?)/);
        if (ratingMatch) {
          return ratingMatch[1];
        }
      }
    }
    return '';
  }

  /**
   * Extract review count with fallback selectors
   */
  private extractReviewCountWithFallbacks($: cheerio.CheerioAPI, selectors: string[]): number {
    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const text = element.text().trim();
        const countMatch = text.match(/(\d+(?:,\d+)*)/);
        if (countMatch) {
          return parseInt(countMatch[1].replace(/,/g, ''));
        }
      }
    }
    return 0;
  }

  /**
   * Extract description with fallback selectors
   */
  private extractDescriptionWithFallbacks($: cheerio.CheerioAPI, selectors: string[]): string {
    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const text = element.text().trim();
        if (text && text.length > 10) {
          return text.substring(0, 500);
        }
      }
    }
    return '';
  }

  /**
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
      '.product-title-word-break',
      'span#productTitle'
    ]);

    // Enhanced price extraction
    const price = this.extractPriceWithFallbacks($, [
      '.a-price-current .a-offscreen',
      '.a-price .a-offscreen',
      '.a-price-current',
      '.a-price',
      '.pricePerUnit',
      '.a-price-range .a-offscreen',
      'span.a-price-symbol + span.a-price-whole',
      '.a-price-whole'
    ]);

    // Original price extraction
    const originalPrice = this.extractPriceWithFallbacks($, [
      '.a-price.a-text-price .a-offscreen',
      '.a-text-strike .a-offscreen',
      '.a-price-was .a-offscreen',
      'span[data-a-strike="true"]',
      '.a-text-strike'
    ]);

    const imageUrl = this.extractImageWithFallbacks($, [
      '#landingImage',
      '#imgBlkFront',
      '.a-dynamic-image',
      '.item-image img',
      '.product-image img',
      'img[data-old-hires]',
      'img[data-a-dynamic-image]'
    ]);

    const description = this.extractDescriptionWithFallbacks($, [
      '#feature-bullets ul',
      '.a-unordered-list.a-vertical',
      '#productDescription',
      '.product-description'
    ]);

    const rating = this.extractRatingWithFallbacks($, [
      '.a-icon-alt',
      '[data-testid="reviews-block"] .a-icon-alt',
      '.a-star-medium .a-icon-alt'
    ]);

    const reviewCount = this.extractReviewCountWithFallbacks($, [
      '#acrCustomerReviewText',
      '[data-testid="reviews-block"] a',
      '.a-link-normal'
    ]);

    if (!title && !price) {
      console.log('Warning: Amazon scraping failed - possible bot detection');
      return null;
    }

    return {
      name: title || 'Amazon Product',
      title: title || 'Amazon Product',
      description: description || '',
      price: this.cleanPrice(price) || 'Price not available',
      originalPrice: originalPrice ? this.cleanPrice(originalPrice) : undefined,
      currency: 'INR',
      imageUrl: this.cleanImageUrl(imageUrl, url),
      rating: rating || undefined,
      reviewCount: reviewCount || 0,
      platform: 'Amazon',
      success: true,
      hasLimitedOffer: this.detectLimitedOffer($).hasLimitedOffer
    };
  }

  /**
   * Generic scraper for other platforms
   */
  private async scrapeGeneric($: cheerio.CheerioAPI, url: string): Promise<UniversalScrapedData | null> {
    const title = this.extractWithFallbacks($, [
      'h1',
      '.product-title',
      '.product-name',
      '[data-testid="product-title"]',
      '.title',
      'title'
    ]);

    const price = this.extractPriceWithFallbacks($, [
      '.price',
      '.product-price',
      '[data-testid="price"]',
      '.cost',
      '.amount'
    ]);

    const originalPrice = this.extractPriceWithFallbacks($, [
      '.original-price',
      '.was-price',
      '.strike-price',
      '.old-price'
    ]);

    const imageUrl = this.extractImageWithFallbacks($, [
      '.product-image img',
      '.main-image img',
      '.hero-image img',
      'img[alt*="product"]',
      'img[alt*="Product"]'
    ]);

    const rating = this.extractRatingWithFallbacks($, [
      '.rating',
      '.stars',
      '[data-testid="rating"]'
    ]);

    const description = this.extractDescriptionWithFallbacks($, [
      '.product-description',
      '.description',
      '.product-details',
      '[data-testid="description"]'
    ]);

    const reviewCount = this.extractReviewCountWithFallbacks($, [
      '.review-count',
      '.reviews',
      '.rating-count'
    ]);

    return {
      name: title || 'Product',
      title: title || 'Product',
      description: description || '',
      price: this.cleanPrice(price) || 'Price not available',
      originalPrice: originalPrice ? this.cleanPrice(originalPrice) : undefined,
      currency: 'INR',
      imageUrl: this.cleanImageUrl(imageUrl, url),
      rating: rating || undefined,
      reviewCount: reviewCount || 0,
      platform: this.extractDomain(url),
      success: true,
      hasLimitedOffer: this.detectLimitedOffer($).hasLimitedOffer
    };
  }

  /**
   * Enhanced Flipkart scraper
   */
  private async scrapeFlipkart($: cheerio.CheerioAPI, url: string): Promise<UniversalScrapedData | null> {
    const title = this.extractWithFallbacks($, [
      '.B_NuCI',
      '._35KyD6',
      'h1 span',
      '.x2Jnpn'
    ]);

    const price = this.extractPriceWithFallbacks($, [
      '._30jeq3._16Jk6d',
      '._1_WHN1',
      '._3I9_wc._2p6lqe'
    ]);

    const originalPrice = this.extractPriceWithFallbacks($, [
      '._3I9_wc._27UcVY',
      '._14999d'
    ]);

    const imageUrl = this.extractImageWithFallbacks($, [
      '._396cs4 img',
      '._2r_T1I img',
      '.CXW8mj img'
    ]);

    return {
      name: title,
      title: title,
      price: this.cleanPrice(price) || 'Price not available',
      originalPrice: originalPrice ? this.cleanPrice(originalPrice) : undefined,
      currency: 'INR',
      imageUrl: this.cleanImageUrl(imageUrl, url),
      platform: 'Flipkart',
      success: true,
      category: 'Fashion',
      hasLimitedOffer: this.detectLimitedOffer($).hasLimitedOffer
    };
  }

  /**
   * Load page with enhanced error handling
   */
  private async loadPage(url: string): Promise<cheerio.CheerioAPI> {
    const headers = {
      'User-Agent': this.getRandomUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    };
    
    const response = await axios.get(url, {
      headers,
      timeout: this.timeout,
      maxRedirects: 10,
      validateStatus: (status) => status < 500 // Accept redirects and client errors
    });
    
    if (response.status >= 400) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return cheerio.load(response.data);
  }

  /**
   * Get random user agent
   */
  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  private validateEssentialData(data: UniversalScrapedData): boolean {
    return !!(data.name && data.name.length > 3 && data.price && parseFloat(data.price) > 0);
  }

  private enhanceScrapedData(data: UniversalScrapedData, url: string): UniversalScrapedData {
    // Calculate discount if both prices available
    if (data.originalPrice && data.price) {
      const original = parseFloat(data.originalPrice);
      const current = parseFloat(data.price);
      if (original > current) {
        data.discount = Math.round(((original - current) / original) * 100);
      }
    }

    // Ensure image URL is absolute
    if (data.imageUrl && !data.imageUrl.startsWith('http')) {
      const domain = this.extractDomain(url);
      data.imageUrl = data.imageUrl.startsWith('//') ? 'https:' + data.imageUrl : `https://${domain}${data.imageUrl}`;
    }

    return data;
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return 'unknown.com';
    }
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Detect limited time offers from page content
   */
  private detectLimitedOffer($: cheerio.CheerioAPI): { hasLimitedOffer: boolean; limitedOfferText?: string } {
    const limitedOfferKeywords = [
      'limited time',
      'flash sale',
      'today only',
      'hurry up',
      'limited stock',
      'sale ends',
      'offer expires',
      'limited offer',
      'deal of the day',
      'lightning deal'
    ];

    // Check for limited offer text in common selectors
    const offerSelectors = [
      '[class*="offer"]',
      '[class*="deal"]',
      '[class*="sale"]',
      '[class*="limited"]',
      '[class*="flash"]',
      '.badge',
      '.label',
      '.tag'
    ];

    for (const selector of offerSelectors) {
      try {
        let foundOffer = false;
        let offerText = '';
        
        $(selector).each((_, element) => {
          const text = $(element).text().toLowerCase().trim();
          for (const keyword of limitedOfferKeywords) {
            if (text.includes(keyword)) {
              foundOffer = true;
              offerText = $(element).text().trim();
              return false; // Break out of each loop
            }
          }
        });

        if (foundOffer) {
          return { hasLimitedOffer: true, limitedOfferText: offerText };
        }
      } catch (error) {
        // Continue to next selector
      }
    }

    return { hasLimitedOffer: false };
  }

  /**
   * Clean price text
   */
  private cleanPrice(priceText?: string): string | undefined {
    if (!priceText) return undefined;
    
    const cleaned = priceText.replace(/[^\d.,₹$]/g, '').replace(/,/g, '');
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
  }
}

// Export singleton instance
export const universalScraper = new UniversalScraper();