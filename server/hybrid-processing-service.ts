import { UniversalUrlDetector } from './url-detector';
import { universalScraper } from './universal-scraper';

/**
 * Base class for hybrid multi-link processing
 * Can be extended by all product services (Amazon, CueLinks, Value Picks, etc.)
 */
export abstract class HybridProcessingService {
  protected serviceName: string;
  protected affiliateTemplate: string;
  protected channelId: number;
  protected channelTitle: string;

  constructor(serviceName: string, affiliateTemplate: string, channelId: number, channelTitle: string) {
    this.serviceName = serviceName;
    this.affiliateTemplate = affiliateTemplate;
    this.channelId = channelId;
    this.channelTitle = channelTitle;
  }

  /**
   * Main entry point for processing any message with hybrid approach
   */
  async processMessage(message: any): Promise<any[]> {
    try {
      const urls = await this.detectAllUrls(message.text || message.caption || '');
      const urlCount = urls.length;
      
      console.log(`Stats [${this.serviceName}] Detected ${urlCount} URLs in message ${message.message_id}`);
      
      if (urlCount === 0) {
        console.log(`Error [${this.serviceName}] No valid URLs found in message`);
        return [];
      }
      
      if (urlCount === 1) {
        // Scenario 1: Single product (current behavior)
        console.log(`Mobile [${this.serviceName}] Processing single product`);
        const product = await this.processSingleProduct(message, urls[0]);
        return product ? [product] : [];
        
      } else if (urlCount >= 2 && urlCount <= 3) {
        // Scenario 2: Small bundle - individual products with grouping
        console.log(`Products [${this.serviceName}] Processing small bundle (${urlCount} products)`);
        return await this.processSmallBundle(message, urls);
        
      } else if (urlCount >= 4) {
        // Scenario 3: Large bundle - primary product + metadata
        console.log(`Deal [${this.serviceName}] Processing large bundle (${urlCount} products)`);
        const bundleProduct = await this.processLargeBundle(message, urls);
        return bundleProduct ? [bundleProduct] : [];
      }
      
      return [];
    } catch (error) {
      console.error(`Error [${this.serviceName}] Error processing message:`, error);
      return [];
    }
  }

  /**
   * Detect all URLs in message text
   */
  protected async detectAllUrls(text: string): Promise<any[]> {
    try {
      // Use universal URL detector to find all e-commerce URLs
      const urls = [];
      const urlPatterns = [
        /https?:\/\/[^\s]+/g,
        /www\.[^\s]+/g
      ];

      for (const pattern of urlPatterns) {
        const matches = text.match(pattern);
        if (matches) {
          for (const match of matches) {
            let url = match.replace(/[.,;!?)]$/, ''); // Clean trailing punctuation
            if (!url.startsWith('http')) {
              url = 'https://' + url;
            }
            
            // Use URL detector to validate and get platform info
            const detectedUrl = await UniversalUrlDetector.detectAnyUrl(url);
            if (detectedUrl) {
              urls.push({
                url: detectedUrl.url,
                platform: detectedUrl.platform,
                type: detectedUrl.type,
                context: this.extractContextAroundUrl(text, url)
              });
            }
          }
        }
      }
      
      // Remove duplicates
      const uniqueUrls = urls.filter((url, index, self) => 
        index === self.findIndex(u => u.url === url.url)
      );
      
      return uniqueUrls;
    } catch (error) {
      console.error(`Error [${this.serviceName}] Error detecting URLs:`, error);
      return [];
    }
  }

  /**
   * Extract context around a specific URL in the text
   */
  protected extractContextAroundUrl(text: string, url: string): string {
    try {
      const urlIndex = text.indexOf(url);
      if (urlIndex === -1) return text;
      
      // Get 100 characters before and after the URL
      const start = Math.max(0, urlIndex - 100);
      const end = Math.min(text.length, urlIndex + url.length + 100);
      
      return text.substring(start, end).trim();
    } catch (error) {
      return text;
    }
  }

  /**
   * Process single product (Scenario 1)
   */
  protected async processSingleProduct(message: any, urlData: any): Promise<any | null> {
    try {
      console.log(`Link [${this.serviceName}] Processing single URL: ${urlData.url}`);
      
      // Use universal scraper for product data
      const scrapedData = await universalScraper.scrapeProduct(urlData.url);
      
      if (!scrapedData) {
        console.log(`Warning [${this.serviceName}] Scraping failed, using fallback`);
        return this.createFallbackProduct(message, urlData);
      }
      
      // Create product info with service-specific affiliate URL
      const productInfo = await this.createProductInfo(message, urlData, scrapedData, {
        messageGroupId: null,
        productSequence: 1,
        totalInGroup: 1
      });
      
      return productInfo;
    } catch (error) {
      console.error(`Error [${this.serviceName}] Error processing single product:`, error);
      return this.createFallbackProduct(message, urlData);
    }
  }

  /**
   * Process small bundle (Scenario 2: 2-3 products)
   */
  protected async processSmallBundle(message: any, urls: any[]): Promise<any[]> {
    try {
      const groupId = `${this.serviceName}_group_${message.message_id}`;
      const products = [];
      
      console.log(`Products [${this.serviceName}] Processing ${urls.length} products in small bundle`);
      
      for (let i = 0; i < urls.length; i++) {
        const urlData = urls[i];
        console.log(`Link [${this.serviceName}] Processing URL ${i + 1}/${urls.length}: ${urlData.url}`);
        
        try {
          // Scrape each product individually
          const scrapedData = await universalScraper.scrapeProduct(urlData.url);
          
          const productInfo = await this.createProductInfo(message, urlData, scrapedData, {
            messageGroupId: groupId,
            productSequence: i + 1,
            totalInGroup: urls.length
          });
          
          if (productInfo) {
            products.push(productInfo);
          }
        } catch (error) {
          console.error(`Error [${this.serviceName}] Error processing URL ${i + 1}:`, error);
          // Continue with other URLs even if one fails
          const fallbackProduct = this.createFallbackProduct(message, urlData, {
            messageGroupId: groupId,
            productSequence: i + 1,
            totalInGroup: urls.length
          });
          if (fallbackProduct) {
            products.push(fallbackProduct);
          }
        }
      }
      
      console.log(`Success [${this.serviceName}] Successfully processed ${products.length}/${urls.length} products in small bundle`);
      return products;
    } catch (error) {
      console.error(`Error [${this.serviceName}] Error processing small bundle:`, error);
      return [];
    }
  }

  /**
   * Process large bundle (Scenario 3: 4+ products)
   */
  protected async processLargeBundle(message: any, urls: any[]): Promise<any | null> {
    try {
      const bundleId = `${this.serviceName}_bundle_${message.message_id}`;
      
      console.log(`Deal [${this.serviceName}] Processing large bundle with ${urls.length} products`);
      
      // Take first URL as primary product
      const primaryUrl = urls[0];
      console.log(`Target [${this.serviceName}] Primary product: ${primaryUrl.url}`);
      
      // Scrape primary product fully
      const primaryScrapedData = await universalScraper.scrapeProduct(primaryUrl.url);
      
      // Process additional products with basic info only (for performance)
      const additionalProducts = [];
      for (let i = 1; i < urls.length; i++) {
        const urlData = urls[i];
        try {
          console.log(`Link [${this.serviceName}] Processing additional product ${i}/${urls.length - 1}: ${urlData.url}`);
          
          // For large bundles, we do lighter processing for additional products
          const basicInfo = {
            name: this.extractProductNameFromContext(urlData.context) || `Product ${i + 1}`,
            url: urlData.url,
            price: this.extractPriceFromContext(urlData.context) || '999',
            imageUrl: null // Will use placeholder
          };
          
          additionalProducts.push(basicInfo);
        } catch (error) {
          console.error(`Error [${this.serviceName}] Error processing additional product ${i}:`, error);
          // Continue with other products
        }
      }
      
      // Create primary product with bundle metadata
      const bundleProduct = await this.createProductInfo(message, primaryUrl, primaryScrapedData, {
        messageGroupId: bundleId,
        productSequence: 1,
        totalInGroup: urls.length,
        bundleType: 'large_bundle',
        additionalProducts: additionalProducts
      });
      
      console.log(`Success [${this.serviceName}] Successfully created large bundle with ${additionalProducts.length} additional products`);
      return bundleProduct;
    } catch (error) {
      console.error(`Error [${this.serviceName}] Error processing large bundle:`, error);
      return null;
    }
  }

  /**
   * Extract product name from context text
   */
  protected extractProductNameFromContext(context: string): string | null {
    try {
      // Look for product names in various formats
      const patterns = [
        /(?:Product|Item|Deal):\s*([^\n]+)/i,
        /^([^\n]{10,80})/,
        /"([^"]+)"/,
        /([A-Z][^\n]{10,60})/
      ];

      for (const pattern of patterns) {
        const match = context.match(pattern);
        if (match && match[1]) {
          return match[1].trim().substring(0, 100);
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract price from context text
   */
  protected extractPriceFromContext(context: string): string | null {
    try {
      const pricePatterns = [
        /₹\s*([0-9,]+(?:\.[0-9]{2})?)/,
        /Rs\.?\s*([0-9,]+(?:\.[0-9]{2})?)/i,
        /INR\s*([0-9,]+(?:\.[0-9]{2})?)/i,
        /Price:\s*₹?\s*([0-9,]+(?:\.[0-9]{2})?)/i,
        /\$\s*([0-9,]+(?:\.[0-9]{2})?)/,
        /€\s*([0-9,]+(?:\.[0-9]{2})?)/,
        /£\s*([0-9,]+(?:\.[0-9]{2})?)/
      ];

      for (const pattern of pricePatterns) {
        const match = context.match(pattern);
        if (match && match[1]) {
          return match[1].replace(/,/g, '');
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  // Abstract methods that must be implemented by each service
  abstract convertToAffiliateLink(originalUrl: string): string;
  abstract createProductInfo(message: any, urlData: any, scrapedData: any, bundleInfo: any): Promise<any>;
  abstract createFallbackProduct(message: any, urlData: any, bundleInfo?: any): any;
  abstract saveProduct(productInfo: any): Promise<void>;

  /**
   * Process and save products from a message
   */
  async processAndSaveMessage(message: any): Promise<any[]> {
    try {
      const products = await this.processMessage(message);
      
      if (products.length === 0) {
        console.log(`Error [${this.serviceName}] No products to save from message ${message.message_id}`);
        return [];
      }
      
      console.log(`Save [${this.serviceName}] Saving ${products.length} products from message ${message.message_id}`);
      
      const savedProducts = [];
      for (const product of products) {
        try {
          await this.saveProduct(product);
          savedProducts.push(product);
          console.log(`Success [${this.serviceName}] Saved product: ${product.name}`);
        } catch (error) {
          console.error(`Error [${this.serviceName}] Error saving product ${product.name}:`, error);
        }
      }
      
      console.log(`Target [${this.serviceName}] Successfully saved ${savedProducts.length}/${products.length} products`);
      return savedProducts;
    } catch (error) {
      console.error(`Error [${this.serviceName}] Error processing and saving message:`, error);
      return [];
    }
  }
}

export default HybridProcessingService;