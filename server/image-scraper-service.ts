// @ts-nocheck
// Real Product Image Scraper Service
// Extracts authentic product images from affiliate URLs to build customer trust

import * as puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

interface ProductImageResult {
  success: boolean;
  imageUrl?: string;
  originalUrl: string;
  method: 'scraping' | 'meta-tags' | 'fallback';
  error?: string;
  cached?: boolean;
}

interface ImageScrapingConfig {
  timeout: number;
  userAgent: string;
  enableCache: boolean;
  cacheDir: string;
  maxRetries: number;
}

class RealProductImageScraper {
  private browser: puppeteer.Browser | null = null;
  private config: ImageScrapingConfig;
  private imageCache = new Map<string, ProductImageResult>();

  constructor() {
    this.config = {
      timeout: 30000,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      enableCache: true,
      cacheDir: './image-cache',
      maxRetries: 3
    };
  }

  async initBrowser(): Promise<void> {
    if (!this.browser) {
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
  }

  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  // Extract real product images from affiliate URLs
  async extractRealProductImage(affiliateUrl: string, productName: string): Promise<ProductImageResult> {
    const cacheKey = this.generateCacheKey(affiliateUrl);
    
    // Check cache first
    if (this.config.enableCache && this.imageCache.has(cacheKey)) {
      const cached = this.imageCache.get(cacheKey)!;
      return { ...cached, cached: true };
    }

    console.log(`Search Extracting real image for: ${productName}`);
    console.log(`Link From URL: ${affiliateUrl}`);

    // Try multiple methods in order of reliability
    const methods = [
      () => this.scrapeWithPuppeteer(affiliateUrl, productName),
      () => this.scrapeWithCheerio(affiliateUrl, productName),
      () => this.extractFromMetaTags(affiliateUrl, productName)
    ];

    for (const method of methods) {
      try {
        const result = await method();
        if (result.success && result.imageUrl) {
          // Cache successful result
          if (this.config.enableCache) {
            this.imageCache.set(cacheKey, result);
          }
          return result;
        }
      } catch (error) {
        console.warn(`Warning Method failed for ${productName}:`, error.message);
        continue;
      }
    }

    // Return fallback result
    return {
      success: false,
      originalUrl: affiliateUrl,
      method: 'fallback',
      error: 'Could not extract real product image from any method'
    };
  }

  // Method 1: Advanced Puppeteer scraping with smart selectors
  private async scrapeWithPuppeteer(url: string, productName: string): Promise<ProductImageResult> {
    await this.initBrowser();
    const page = await this.browser!.newPage();
    
    try {
      await page.setUserAgent(this.config.userAgent);
      await page.setViewport({ width: 1920, height: 1080 });
      
      console.log(`AI Puppeteer scraping: ${url}`);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: this.config.timeout });
      
      // Wait for images to load
      await page.waitForTimeout(3000);
      
      // Smart image selectors based on common e-commerce patterns
      const imageSelectors = [
        // Amazon specific
        '#landingImage',
        '[data-testid="product-image"]',
        '.a-dynamic-image',
        '#imgTagWrapperId img',
        
        // Flipkart specific
        '._396cs4._2amPTt._3qGmMb img',
        '._1AtVbE img',
        
        // Generic e-commerce
        '[data-testid="main-image"]',
        '.product-image img',
        '.product-photo img',
        '.main-image img',
        '.hero-image img',
        '.product-gallery img:first-child',
        
        // Shopify patterns
        '.product__media img',
        '.product-single__photo img',
        
        // Generic fallbacks
        'img[alt*="product"]',
        'img[alt*="Product"]',
        'main img:first-of-type',
        '.container img:first-of-type'
      ];
      
      for (const selector of imageSelectors) {
        try {
          const imageUrl = await page.$eval(selector, (img: HTMLImageElement) => {
            // Get the highest resolution image available
            const srcset = img.srcset;
            if (srcset) {
              const sources = srcset.split(',').map(s => s.trim());
              const highRes = sources[sources.length - 1];
              return highRes.split(' ')[0];
            }
            return img.src;
          });
          
          if (imageUrl && this.isValidImageUrl(imageUrl)) {
            console.log(`Success Found image with selector: ${selector}`);
            return {
              success: true,
              imageUrl: this.cleanImageUrl(imageUrl),
              originalUrl: url,
              method: 'scraping'
            };
          }
        } catch (error) {
          continue; // Try next selector
        }
      }
      
      throw new Error('No valid product image found with Puppeteer');
      
    } finally {
      await page.close();
    }
  }

  // Method 2: Fast Cheerio scraping for simple pages
  private async scrapeWithCheerio(url: string, productName: string): Promise<ProductImageResult> {
    console.log(`Global Cheerio scraping: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': this.config.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: this.config.timeout
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Try various image selectors
    const selectors = [
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
      '.product-image img',
      '.main-image img',
      '[data-testid="product-image"]',
      'img[alt*="product"]',
      'img[alt*="Product"]'
    ];
    
    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length) {
        let imageUrl = '';
        
        if (selector.includes('meta')) {
          imageUrl = element.attr('content') || '';
        } else {
          imageUrl = element.attr('src') || element.attr('data-src') || '';
        }
        
        if (imageUrl && this.isValidImageUrl(imageUrl)) {
          console.log(`Success Found image with Cheerio selector: ${selector}`);
          return {
            success: true,
            imageUrl: this.cleanImageUrl(imageUrl),
            originalUrl: url,
            method: 'scraping'
          };
        }
      }
    }
    
    throw new Error('No valid product image found with Cheerio');
  }

  // Method 3: Extract from meta tags (fastest)
  private async extractFromMetaTags(url: string, productName: string): Promise<ProductImageResult> {
    console.log(`🏷️ Meta tag extraction: ${url}`);
    
    const response = await fetch(url, {
      headers: { 'User-Agent': this.config.userAgent },
      timeout: 10000
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Check Open Graph and Twitter meta tags
    const ogImage = $('meta[property="og:image"]').attr('content');
    const twitterImage = $('meta[name="twitter:image"]').attr('content');
    
    const imageUrl = ogImage || twitterImage;
    
    if (imageUrl && this.isValidImageUrl(imageUrl)) {
      console.log(`Success Found image from meta tags`);
      return {
        success: true,
        imageUrl: this.cleanImageUrl(imageUrl),
        originalUrl: url,
        method: 'meta-tags'
      };
    }
    
    throw new Error('No valid product image found in meta tags');
  }

  // Validate if URL is a proper image
  private isValidImageUrl(url: string): boolean {
    if (!url || url.length < 10) return false;
    
    // Check for common image extensions or patterns
    const imagePatterns = [
      /\.(jpg|jpeg|png|webp|gif|bmp|svg)$/i,
      /\/images\//,
      /\/media\//,
      /\/photos\//,
      /image/i,
      /photo/i
    ];
    
    return imagePatterns.some(pattern => pattern.test(url)) && 
           !url.includes('placeholder') && 
           !url.includes('loading') &&
           !url.includes('spinner');
  }

  // Clean and normalize image URL
  private cleanImageUrl(url: string): string {
    // Convert relative URLs to absolute
    if (url.startsWith('//')) {
      return 'https:' + url;
    }
    
    // Remove query parameters that might cause issues
    const cleanUrl = url.split('?')[0];
    
    return cleanUrl;
  }

  // Generate cache key for URL
  private generateCacheKey(url: string): string {
    return createHash('md5').update(url).digest('hex');
  }

  // Bulk process multiple products
  async processMultipleProducts(products: Array<{id: number, name: string, affiliateUrl: string}>): Promise<Array<{id: number, result: ProductImageResult}>> {
    console.log(`Refresh Processing ${products.length} products for real images...`);
    
    const results = [];
    
    for (const product of products) {
      try {
        const result = await this.extractRealProductImage(product.affiliateUrl, product.name);
        results.push({ id: product.id, result });
        
        // Add delay to avoid being blocked
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Error Failed to process ${product.name}:`, error.message);
        results.push({
          id: product.id,
          result: {
            success: false,
            originalUrl: product.affiliateUrl,
            method: 'fallback',
            error: error.message
          }
        });
      }
    }
    
    return results;
  }
}

// Export singleton instance
export const realImageScraper = new RealProductImageScraper();

// Cleanup on process exit
process.on('exit', async () => {
  await realImageScraper.closeBrowser();
});

process.on('SIGINT', async () => {
  await realImageScraper.closeBrowser();
  process.exit(0);
});

export type { ProductImageResult };