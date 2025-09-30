// @ts-nocheck
// Enhanced Universal Web Scraper
// Supports any e-commerce platform with generic selectors and platform-specific optimizations

import * as puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import { ResolvedURL } from './universal-url-resolver.js';
import { platformDetector, PlatformInfo, ProductSelectors } from './platform-detector.js';

interface ScrapedProduct {
  name: string;
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
  platformName: string;
  productId?: string;
  scrapingMethod: 'puppeteer' | 'fetch' | 'fallback';
  success: boolean;
  error?: string;
}

class EnhancedUniversalScraper {
  private browser: puppeteer.Browser | null = null;
  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
  private timeout = 30000; // 30 seconds

  /**
   * Initialize browser instance
   */
  private async initBrowser(): Promise<puppeteer.Browser> {
    if (!this.browser) {
      console.log('Launch Initializing browser for scraping...');
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
    }
    return this.browser;
  }

  /**
   * Scrape product using Puppeteer (for JavaScript-heavy sites)
   */
  private async scrapeWithPuppeteer(url: string, platformInfo: PlatformInfo): Promise<ScrapedProduct> {
    console.log(`AI Scraping with Puppeteer: ${url}`);
    
    const browser = await this.initBrowser();
    const page = await browser.newPage();
    
    try {
      // Set user agent and viewport
      await page.setUserAgent(this.userAgent);
      await page.setViewport({ width: 1920, height: 1080 });
      
      // Navigate to page
      await page.goto(url, { 
        waitUntil: 'networkidle2', 
        timeout: this.timeout 
      });
      
      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Extract product data
      const productData = await page.evaluate(`
        (function(selectors) {
          const getTextBySelectors = function(selectorList) {
            for (const selector of selectorList) {
              const element = document.querySelector(selector);
              if (element) {
                return element.textContent && element.textContent.trim() || element.getAttribute('alt') && element.getAttribute('alt').trim();
              }
            }
            return undefined;
          };
          
          const getImageBySelectors = function(selectorList) {
            for (const selector of selectorList) {
              const element = document.querySelector(selector);
              if (element) {
                return element.src || element.getAttribute('data-src') || element.getAttribute('data-lazy-src');
              }
            }
            return undefined;
          };
          
          return {
            name: getTextBySelectors(selectors.title || []),
            price: getTextBySelectors(selectors.price || []),
            originalPrice: getTextBySelectors(selectors.originalPrice || []),
            imageUrl: getImageBySelectors(selectors.image || []),
            description: getTextBySelectors(selectors.description || []),
            rating: getTextBySelectors(selectors.rating || []),
            reviewCount: getTextBySelectors(selectors.reviewCount || []),
            brand: getTextBySelectors(selectors.brand || []),
            availability: getTextBySelectors(selectors.availability || [])
          };
        })(${JSON.stringify(platformInfo.selectors!)})
      `);
      
      return this.processScrapedData(productData, platformInfo, 'puppeteer');
      
    } catch (error) {
      console.error(`Error Puppeteer scraping failed: ${error}`);
      throw error;
    } finally {
      await page.close();
    }
  }

  /**
   * Scrape product using fetch + Cheerio (for static content)
   */
  private async scrapeWithFetch(url: string, platformInfo: PlatformInfo): Promise<ScrapedProduct> {
    console.log(`📄 Scraping with Fetch: ${url}`);
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: this.timeout
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      const getTextBySelectors = (selectorList: string[]): string | undefined => {
        for (const selector of selectorList) {
          const element = $(selector).first();
          if (element.length) {
            return element.text().trim() || element.attr('alt')?.trim();
          }
        }
        return undefined;
      };
      
      const getAllImagesBySelectors = (selectorList: string[]): string[] => {
        const imageUrls: string[] = [];
        
        for (const selector of selectorList) {
          $(selector).each((_, element) => {
            const $el = $(element);
            const src = $el.attr('src') || $el.attr('data-src') || $el.attr('data-lazy-src') || $el.attr('data-original');
            if (src && !imageUrls.includes(src)) {
              imageUrls.push(src);
            }
          });
        }
        
        // Also check for meta property images (Open Graph, etc.)
        $('meta[property="og:image"]').each((_, element) => {
          const content = $(element).attr('content');
          if (content && !imageUrls.includes(content)) {
            imageUrls.push(content);
          }
        });
        
        $('meta[name="twitter:image"]').each((_, element) => {
          const content = $(element).attr('content');
          if (content && !imageUrls.includes(content)) {
            imageUrls.push(content);
          }
        });
        
        return imageUrls;
      };
      
      const productData = {
        name: getTextBySelectors(platformInfo.selectors?.title || []),
        price: getTextBySelectors(platformInfo.selectors?.price || []),
        originalPrice: getTextBySelectors(platformInfo.selectors?.originalPrice || []),
        imageUrl: getAllImagesBySelectors(platformInfo.selectors?.image || []),
        description: getTextBySelectors(platformInfo.selectors?.description || []),
        rating: getTextBySelectors(platformInfo.selectors?.rating || []),
        reviewCount: getTextBySelectors(platformInfo.selectors?.reviewCount || []),
        brand: getTextBySelectors(platformInfo.selectors?.brand || []),
        availability: getTextBySelectors(platformInfo.selectors?.availability || [])
      };
      
      return this.processScrapedData(productData, platformInfo, 'fetch');
      
    } catch (error) {
      console.error(`Error Fetch scraping failed: ${error}`);
      throw error;
    }
  }

  /**
   * Process and clean scraped data
   */
  private processScrapedData(data: any, platformInfo: PlatformInfo, method: 'puppeteer' | 'fetch' | 'fallback'): ScrapedProduct {
    // Clean and process price
    const cleanPrice = (priceText?: string): string => {
      if (!priceText) return '0';
      return priceText.replace(/[^0-9.,]/g, '').replace(/,/g, '') || '0';
    };
    
    // Extract currency
    const extractCurrency = (priceText?: string): string => {
      if (!priceText) return 'INR';
      if (priceText.includes('₹') || priceText.includes('Rs')) return 'INR';
      if (priceText.includes('$')) return 'USD';
      if (priceText.includes('€')) return 'EUR';
      if (priceText.includes('£')) return 'GBP';
      return 'INR'; // Default to INR
    };
    
    // Calculate discount
    const calculateDiscount = (price: string, originalPrice?: string): number => {
      if (!originalPrice) return 0;
      const priceNum = parseFloat(price);
      const originalPriceNum = parseFloat(originalPrice);
      if (originalPriceNum > priceNum) {
        return Math.round(((originalPriceNum - priceNum) / originalPriceNum) * 100);
      }
      return 0;
    };
    
    // Extract review count number
    const extractReviewCount = (reviewText?: string): number => {
      if (!reviewText) return 0;
      const match = reviewText.match(/([0-9,]+)/);
      return match ? parseInt(match[1].replace(/,/g, '')) : 0;
    };
    
    // Smart image URL selection and cleaning
    const selectBestImage = (imageUrls: string[]): string => {
      if (!imageUrls || imageUrls.length === 0) return '';
      
      // Filter out unwanted images
      const filteredImages = imageUrls.filter(url => {
        const lowerUrl = url.toLowerCase();
        return !lowerUrl.includes('logo') &&
               !lowerUrl.includes('icon') &&
               !lowerUrl.includes('banner') &&
               !lowerUrl.includes('placeholder') &&
               !lowerUrl.includes('default') &&
               !lowerUrl.includes('no-image') &&
               !lowerUrl.includes('loading') &&
               !lowerUrl.includes('spinner') &&
               !lowerUrl.includes('thumb') &&
               !lowerUrl.endsWith('.svg') &&
               (lowerUrl.includes('.jpg') || lowerUrl.includes('.jpeg') || lowerUrl.includes('.png') || lowerUrl.includes('.webp'));
      });
      
      if (filteredImages.length === 0) return imageUrls[0] || '';
      
      // Prefer larger images (look for size indicators)
      const largeImages = filteredImages.filter(url => {
        const lowerUrl = url.toLowerCase();
        return lowerUrl.includes('large') || 
               lowerUrl.includes('big') || 
               lowerUrl.includes('main') || 
               lowerUrl.includes('hero') ||
               lowerUrl.includes('primary') ||
               /\d{3,4}x\d{3,4}/.test(lowerUrl) || // Contains dimensions like 800x600
               /w_\d{3,4}/.test(lowerUrl) || // Contains width like w_800
               /h_\d{3,4}/.test(lowerUrl); // Contains height like h_600
      });
      
      return largeImages.length > 0 ? largeImages[0] : filteredImages[0];
    };
    
    const cleanImageUrl = (imageUrl?: string | string[]): string => {
      let finalUrl = '';
      
      if (Array.isArray(imageUrl)) {
        finalUrl = selectBestImage(imageUrl);
      } else {
        finalUrl = imageUrl || '';
      }
      
      if (!finalUrl) return '';
      if (finalUrl.startsWith('//')) return 'https:' + finalUrl;
      if (finalUrl.startsWith('/')) {
        try {
          return new URL(finalUrl, 'https://' + platformInfo.platform).toString();
        } catch {
          return finalUrl;
        }
      }
      return finalUrl;
    };
    
    const price = cleanPrice(data.price);
    const originalPrice = cleanPrice(data.originalPrice);
    const currency = extractCurrency(data.price);
    
    return {
      name: data.name || 'Unknown Product',
      description: data.description || '',
      price,
      originalPrice: originalPrice !== '0' ? originalPrice : undefined,
      currency,
      imageUrl: cleanImageUrl(data.imageUrl),
      rating: data.rating || '',
      reviewCount: extractReviewCount(data.reviewCount),
      discount: calculateDiscount(price, originalPrice),
      brand: data.brand || '',
      availability: data.availability || '',
      platform: platformInfo.platform,
      platformName: platformInfo.platformName,
      productId: platformInfo.productId,
      scrapingMethod: method,
      success: true
    };
  }

  /**
   * Main scraping method with fallback strategies
   */
  async scrapeProduct(resolvedUrl: ResolvedURL): Promise<ScrapedProduct> {
    console.log(`Target Starting product scraping for: ${resolvedUrl.finalUrl}`);
    
    // Detect platform
    const platformInfo = platformDetector.detectPlatform(resolvedUrl);
    console.log(`Search Platform: ${platformInfo.platformName} (${platformInfo.platform})`);
    
    // Try different scraping strategies
    const strategies = [
      () => this.scrapeWithFetch(resolvedUrl.finalUrl, platformInfo),
      () => this.scrapeWithPuppeteer(resolvedUrl.finalUrl, platformInfo)
    ];
    
    let lastError: Error | null = null;
    
    for (const strategy of strategies) {
      try {
        const result = await strategy();
        if (result.success && result.name && result.name !== 'Unknown Product') {
          console.log(`Success Successfully scraped: ${result.name}`);
          return result;
        }
      } catch (error) {
        console.log(`Warning Strategy failed, trying next...`);
        lastError = error as Error;
      }
    }
    
    // All strategies failed
    console.error(`Error All scraping strategies failed for: ${resolvedUrl.finalUrl}`);
    return {
      name: 'Failed to scrape product',
      price: '0',
      currency: 'INR',
      imageUrl: '',
      platform: platformInfo.platform,
      platformName: platformInfo.platformName,
      productId: platformInfo.productId,
      scrapingMethod: 'fallback',
      success: false,
      error: lastError?.message || 'Unknown scraping error'
    };
  }

  /**
   * Batch scrape multiple products
   */
  async scrapeMultipleProducts(resolvedUrls: ResolvedURL[]): Promise<ScrapedProduct[]> {
    console.log(`Target Batch scraping ${resolvedUrls.length} products...`);
    
    const results: ScrapedProduct[] = [];
    
    // Process in batches to avoid overwhelming the system
    const batchSize = 3;
    for (let i = 0; i < resolvedUrls.length; i += batchSize) {
      const batch = resolvedUrls.slice(i, i + batchSize);
      const batchPromises = batch.map(url => 
        this.scrapeProduct(url).catch(error => ({
          name: 'Scraping failed',
          price: '0',
          currency: 'INR',
          imageUrl: '',
          platform: 'unknown',
          platformName: 'Unknown',
          scrapingMethod: 'fallback' as const,
          success: false,
          error: error.message
        } as ScrapedProduct))
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Small delay between batches
      if (i + batchSize < resolvedUrls.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  /**
   * Close browser instance
   */
  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log('🔒 Browser closed');
    }
  }

  /**
   * Test scraping for a specific platform
   */
  async testPlatformScraping(platform: string, testUrl: string): Promise<ScrapedProduct> {
    const mockResolvedUrl: ResolvedURL = {
      originalUrl: testUrl,
      finalUrl: testUrl,
      redirectChain: [testUrl],
      isShortened: false,
      platform,
      productId: 'test'
    };
    
    return await this.scrapeProduct(mockResolvedUrl);
  }
}

// Export singleton instance
export const enhancedScraper = new EnhancedUniversalScraper();
export type { ScrapedProduct };

// Cleanup on process exit
process.on('exit', () => {
  enhancedScraper.closeBrowser();
});

process.on('SIGINT', () => {
  enhancedScraper.closeBrowser();
  process.exit();
});