// URL Processing Service
// Main orchestrator that combines URL resolution, platform detection, scraping, and affiliate conversion

import { urlResolver, ResolvedURL } from './universal-url-resolver';
import { platformDetector, PlatformInfo } from './platform-detector';
import { enhancedScraper, ScrapedProduct } from './enhanced-universal-scraper';
import { affiliateConverter, ConvertedLink } from './affiliate-converter';
import { sqliteDb } from './db';

interface ProcessingResult {
  success: boolean;
  originalUrl: string;
  resolvedUrl?: ResolvedURL;
  platformInfo?: PlatformInfo;
  scrapedData?: ScrapedProduct;
  affiliateLink?: ConvertedLink;
  productCard?: ProductCardData;
  products?: ProductCardData[];
  error?: string;
  processingTime: number;
}

interface ProductCardData {
  id: string;
  name: string;
  description: string;
  price: string;
  originalPrice?: string;
  currency: string;
  imageUrl: string;
  affiliateUrl: string;
  category: string;
  rating: string;
  reviewCount: number;
  discount?: number;
  isNew: boolean;
  isFeatured: boolean;
  source: string;
  sourceType: string;
  networkBadge: string;
  affiliateNetwork: string;
  platform: string;
  productId?: string;
  createdAt: string;
}

interface BulkProcessingResult {
  totalUrls: number;
  successfullyProcessed: number;
  failed: number;
  results: ProcessingResult[];
  processingTime: number;
}

class URLProcessingService {
  private processingQueue: Map<string, ProcessingResult> = new Map();
  private maxConcurrentProcessing = 3;
  private currentlyProcessing = 0;

  /**
   * Process a single URL through the complete pipeline
   */
  async processURL(originalUrl: string, targetPage?: string): Promise<ProcessingResult> {
    const startTime = Date.now();
    console.log(`Target Starting URL processing pipeline for: ${originalUrl}`);
    
    try {
      // Step 1: Resolve URL (handle shortened URLs)
      console.log(`📍 Step 1: Resolving URL...`);
      const resolvedUrl = await urlResolver.resolveURL(originalUrl);
      console.log(`Success URL resolved: ${resolvedUrl.finalUrl}`);
      
      // Step 2: Detect platform
      console.log(`📍 Step 2: Detecting platform...`);
      const platformInfo = platformDetector.detectPlatform(resolvedUrl);
      console.log(`Success Platform detected: ${platformInfo.platformName}`);
      
      // Step 3: Scrape product data
      console.log(`📍 Step 3: Scraping product data...`);
      const scrapedData = await enhancedScraper.scrapeProduct(resolvedUrl);
      
      if (!scrapedData.success) {
        throw new Error(`Scraping failed: ${scrapedData.error}`);
      }
      console.log(`Success Product scraped: ${scrapedData.name}`);
      
      // Step 4: Convert to affiliate link
      console.log(`📍 Step 4: Converting to affiliate link...`);
      const affiliateLink = affiliateConverter.convertToAffiliate(resolvedUrl, platformInfo);
      console.log(`Success Affiliate link created: ${affiliateLink.isConverted ? 'Success' : 'Failed'}`);
      
      // Step 5: Create product card data
      console.log(`📍 Step 5: Creating product card data...`);
      const productCard = this.createProductCardData(scrapedData, affiliateLink, targetPage);
      console.log(`Success Product card created for: ${productCard.name}`);
      
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        originalUrl,
        resolvedUrl,
        platformInfo,
        scrapedData,
        affiliateLink,
        productCard,
        processingTime
      };
      
    } catch (error) {
      console.error(`Error URL processing failed: ${error}`);
      
      return {
        success: false,
        originalUrl,
        error: (error as Error).message,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Process multiple URLs in batches
   */
  async processBulkURLs(urls: string[], targetPage?: string): Promise<BulkProcessingResult> {
    const startTime = Date.now();
    console.log(`Target Starting bulk URL processing for ${urls.length} URLs...`);
    
    const results: ProcessingResult[] = [];
    let successCount = 0;
    let failCount = 0;
    
    // Process in batches to avoid overwhelming the system
    const batchSize = this.maxConcurrentProcessing;
    
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      console.log(`Products Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(urls.length / batchSize)}`);
      
      const batchPromises = batch.map(url => 
        this.processURL(url, targetPage).catch(error => ({
          success: false,
          originalUrl: url,
          error: error.message,
          processingTime: 0
        } as ProcessingResult))
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Count successes and failures
      batchResults.forEach(result => {
        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
      });
      
      // Small delay between batches
      if (i + batchSize < urls.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    const processingTime = Date.now() - startTime;
    
    console.log(`Success Bulk processing completed: ${successCount} success, ${failCount} failed`);
    
    return {
      totalUrls: urls.length,
      successfullyProcessed: successCount,
      failed: failCount,
      results,
      processingTime
    };
  }

  /**
   * Create product card data from scraped information
   */
  private createProductCardData(scrapedData: ScrapedProduct, affiliateLink: ConvertedLink, targetPage?: string): ProductCardData {
    const now = new Date().toISOString();
    const productId = `${scrapedData.platform}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Determine category
    const category = this.determineCategory(scrapedData.name, scrapedData.description);
    
    // Create network badge
    const networkBadge = affiliateLink.affiliateNetwork || scrapedData.platformName;
    
    return {
      id: productId,
      name: scrapedData.name,
      description: scrapedData.description || `${scrapedData.name} from ${scrapedData.platformName}`,
      price: scrapedData.price,
      originalPrice: scrapedData.originalPrice,
      currency: scrapedData.currency,
      imageUrl: scrapedData.imageUrl,
      affiliateUrl: affiliateLink.affiliateUrl,
      category,
      rating: scrapedData.rating || '0',
      reviewCount: scrapedData.reviewCount || 0,
      discount: scrapedData.discount,
      isNew: true, // Mark as new since it's just processed
      isFeatured: false,
      source: targetPage || 'url-processing',
      sourceType: scrapedData.platform,
      networkBadge,
      affiliateNetwork: affiliateLink.affiliateNetwork || 'Direct',
      platform: scrapedData.platform,
      productId: scrapedData.productId,
      createdAt: now
    };
  }

  /**
   * Determine product category from name and description
   */
  private determineCategory(name: string, description?: string): string {
    const text = `${name} ${description || ''}`.toLowerCase();
    
    // Category keywords mapping
    const categoryKeywords = {
      'Electronics': ['phone', 'laptop', 'tablet', 'headphone', 'earphone', 'speaker', 'camera', 'tv', 'monitor', 'keyboard', 'mouse'],
      'Fashion': ['shirt', 'dress', 'jeans', 'shoes', 'bag', 'watch', 'jewelry', 'clothing', 'apparel', 'fashion'],
      'Beauty & Personal Care': ['cream', 'lotion', 'shampoo', 'soap', 'makeup', 'skincare', 'beauty', 'cosmetic', 'perfume'],
      'Home & Kitchen': ['kitchen', 'home', 'furniture', 'decor', 'appliance', 'cookware', 'bedsheet', 'curtain', 'lamp'],
      'Sports & Fitness': ['fitness', 'gym', 'sports', 'exercise', 'yoga', 'running', 'workout', 'athletic'],
      'Books': ['book', 'novel', 'textbook', 'guide', 'manual', 'literature'],
      'Toys & Games': ['toy', 'game', 'puzzle', 'doll', 'action figure', 'board game'],
      'Health': ['vitamin', 'supplement', 'medicine', 'health', 'wellness', 'protein'],
      'Automotive': ['car', 'bike', 'motorcycle', 'automotive', 'vehicle', 'tire'],
      'Food & Beverages': ['food', 'snack', 'drink', 'beverage', 'coffee', 'tea', 'chocolate']
    };
    
    // Find matching category
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return category;
      }
    }
    
    return 'General'; // Default category
  }

  /**
   * Save processed product to database
   */
  async saveProductToDatabase(productCard: ProductCardData, targetTable: string = 'value_picks_products'): Promise<boolean> {
    try {
      console.log(`Save Saving product to ${targetTable}: ${productCard.name}`);
      
      // Determine the appropriate table and fields based on target
      let insertQuery: string;
      let params: any[];
      
      if (targetTable === 'amazon_products') {
        insertQuery = `
          INSERT INTO amazon_products (
            name, description, price, original_price, currency, image_url, affiliate_url,
            category, rating, review_count, discount, is_new, is_featured,
            affiliate_network, telegram_message_id, processing_status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        params = [
          productCard.name,
          productCard.description,
          productCard.price,
          productCard.originalPrice,
          productCard.currency,
          productCard.imageUrl,
          productCard.affiliateUrl,
          productCard.category,
          productCard.rating,
          productCard.reviewCount,
          productCard.discount,
          productCard.isNew ? 1 : 0,
          productCard.isFeatured ? 1 : 0,
          productCard.affiliateNetwork,
          Date.now(), // telegram_message_id as timestamp
          'active',
          Math.floor(Date.now() / 1000)
        ];
      } else if (targetTable === 'cuelinks_products') {
        insertQuery = `
          INSERT INTO cuelinks_products (
            name, description, price, original_price, currency, image_url, affiliate_url,
            category, rating, review_count, discount, is_new, is_featured,
            affiliate_network, telegram_message_id, processing_status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        params = [
          productCard.name,
          productCard.description,
          productCard.price,
          productCard.originalPrice,
          productCard.currency,
          productCard.imageUrl,
          productCard.affiliateUrl,
          productCard.category,
          productCard.rating,
          productCard.reviewCount,
          productCard.discount,
          productCard.isNew ? 1 : 0,
          productCard.isFeatured ? 1 : 0,
          productCard.affiliateNetwork,
          Date.now(), // telegram_message_id as timestamp
          'active',
          Math.floor(Date.now() / 1000)
        ];
      } else {
        // Default to value_picks_products
        insertQuery = `
          INSERT INTO value_picks_products (
            name, description, price, original_price, currency, image_url, affiliate_url,
            category, rating, review_count, discount, is_new, is_featured,
            affiliate_network, telegram_message_id, processing_status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        params = [
          productCard.name,
          productCard.description,
          productCard.price,
          productCard.originalPrice,
          productCard.currency,
          productCard.imageUrl,
          productCard.affiliateUrl,
          productCard.category,
          productCard.rating,
          productCard.reviewCount,
          productCard.discount,
          productCard.isNew ? 1 : 0,
          productCard.isFeatured ? 1 : 0,
          productCard.affiliateNetwork,
          Date.now(), // telegram_message_id as timestamp
          'active',
          Math.floor(Date.now() / 1000)
        ];
      }
      
      const result = sqliteDb.prepare(insertQuery).run(...params);
      
      if (result.changes > 0) {
        console.log(`Success Product saved successfully with ID: ${result.lastInsertRowid}`);
        return true;
      } else {
        console.error(`Error Failed to save product: No changes made`);
        return false;
      }
      
    } catch (error) {
      console.error(`Error Database save error: ${error}`);
      return false;
    }
  }

  /**
   * Get processing queue status
   */
  getQueueStatus(): { total: number; processing: number; completed: number } {
    const total = this.processingQueue.size;
    const completed = Array.from(this.processingQueue.values()).filter(r => r.success || r.error).length;
    const processing = this.currentlyProcessing;
    
    return { total, processing, completed };
  }

  /**
   * Clear processing queue
   */
  clearQueue(): void {
    this.processingQueue.clear();
    console.log('Cleanup Processing queue cleared');
  }

  /**
   * Test the complete processing pipeline
   */
  async testProcessingPipeline(testUrl: string): Promise<ProcessingResult> {
    console.log(`🧪 Testing processing pipeline with: ${testUrl}`);
    return await this.processURL(testUrl, 'test');
  }

  /**
   * Get supported platforms summary
   */
  getSupportedPlatforms(): { platforms: string[]; shorteners: string[]; affiliateNetworks: string[] } {
    return {
      platforms: platformDetector.getSupportedPlatforms().map(p => p.platformName),
      shorteners: urlResolver.getSupportedShorteners(),
      affiliateNetworks: affiliateConverter.getSupportedPlatforms()
    };
  }
}

// Export singleton instance
export const urlProcessingService = new URLProcessingService();
export type { ProcessingResult, ProductCardData, BulkProcessingResult };