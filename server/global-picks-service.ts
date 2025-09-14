import { db } from './db';
import { globalPicksProducts } from '../shared/sqlite-schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { UniversalUrlDetector } from './url-detector';
import { CategoryManager } from './category-manager';

/**
 * GlobalPicksService - Global products and deals processing service
 * Handles international products, global deals, and worldwide offers
 * Same UI and functionality as other pages with global-specific features
 */
export class GlobalPicksService {
  private urlDetector: UniversalUrlDetector;
  private categoryManager: CategoryManager;
  
  constructor() {
    this.urlDetector = new UniversalUrlDetector();
    this.categoryManager = CategoryManager.getInstance();
    console.log('🌍 Global Picks Service initialized:');
    console.log('   Product types: international products, global deals, worldwide offers');
    console.log('   Custom affiliate tag: ref=globalpicks');
    console.log('   Database: global_picks_products');
    console.log('   Features: same as other pages + global-specific');
    console.log('   Category Management: auto-creation enabled');
  }

  /**
   * Process Telegram message for global picks
   */
  async processMessage(message: any): Promise<void> {
    try {
      const messageText = message.text || message.caption || '';
      const photos = message.photo || [];
      
      // Extract URLs from message text using simple regex
      const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
      const urls = messageText.match(urlRegex) || [];
      
      if (urls.length === 0) {
        console.log('Warning No URLs detected in Global Picks message');
        return;
      }
      
      console.log(`Search Found ${urls.length} URLs for Global Picks processing`);
      
      // Process each URL with global-specific enhancements
      for (const url of urls) {
        const urlInfo = { url, domain: new URL(url).hostname };
        await this.processGlobalUrl(urlInfo, message, messageText, photos);
      }
      
    } catch (error) {
      console.error('Error Error processing Global Picks message:', error);
    }
  }

  /**
   * Process individual global URL
   */
  private async processGlobalUrl(
    urlInfo: any, 
    message: any, 
    messageText: string, 
    photos: any[]
  ): Promise<void> {
    try {
      console.log(`Search Processing global URL: ${urlInfo.url}`);
      
      // Extract global product information
      const productInfo = await this.extractGlobalProductInfo(urlInfo, messageText, photos);
      
      if (!productInfo) {
        console.log('Warning Could not extract global product information');
        return;
      }
      
      // Build custom affiliate URL for global picks
      const affiliateUrl = this.buildCustomAffiliateUrl(urlInfo.url);
      
      // Auto-create category if it doesn't exist (will be done in saveGlobalProduct)
      
      // Save to database with global-specific fields
      const savedProduct = await this.saveGlobalProduct({
        ...productInfo,
        originalUrl: urlInfo.url,
        affiliateUrl: affiliateUrl,
        sourceDomain: urlInfo.domain,
        telegramMessageId: message.message_id,
        messageGroupId: this.generateMessageGroupId(message),
        scrapingMethod: 'telegram'
      });
      
      if (savedProduct) {
        console.log(`Success Global product saved: ${savedProduct.name}`);
        
        // Auto-create category and link product
        if (productInfo.category) {
          try {
            await this.categoryManager.ensureCategoryExists(productInfo.category, {
              productId: savedProduct.id,
              productTable: 'global_picks_products',
              pageName: 'global-picks',
              productName: savedProduct.name,
              productPrice: savedProduct.price?.toString(),
              productImageUrl: savedProduct.imageUrl,
              categoryType: 'product'
            });
          } catch (categoryError) {
            console.error('Warning Category creation failed:', categoryError);
          }
        }
      }
      
    } catch (error) {
      console.error('Error Error processing global URL:', error);
    }
  }

  /**
   * Extract global product information
   */
  private async extractGlobalProductInfo(
    urlInfo: any,
    messageText: string,
    photos: any[]
  ): Promise<any | null> {
    try {
      // Extract product name
      const productName = this.extractProductName(messageText, urlInfo.domain);
      if (!productName) {
        console.log('Warning Could not extract product name');
        return null;
      }
      
      // Extract pricing information
      const pricing = this.extractPricing(messageText);
      
      // Detect product category
      const category = this.detectCategory(messageText, urlInfo.domain);
      
      // Extract rating and reviews
      const rating = this.extractRating(messageText);
      
      // Extract description
      const description = this.extractDescription(messageText, productName);
      
      // Process images
      const imageUrl = await this.processImages(photos, urlInfo.domain);
      
      return {
        name: productName,
        description: description,
        price: pricing.price,
        originalPrice: pricing.originalPrice,
        currency: pricing.currency,
        imageUrl: imageUrl,
        category: category,
        rating: rating.rating,
        reviewCount: rating.reviewCount,
        discount: pricing.discount,
        affiliateNetwork: 'global'
      };
      
    } catch (error) {
      console.error('Error Error extracting global product info:', error);
      return null;
    }
  }

  /**
   * Extract product name from message
   */
  private extractProductName(text: string, domain: string): string | null {
    // Product name patterns
    const patterns = [
      /(?:Product|Item|Deal)\s*:?\s*([^\n\r]{1,100})/i,
      /(?:Name|Title)\s*:?\s*([^\n\r]{1,100})/i,
      /^([^\n\r]{1,100})(?:\s*-\s*(?:Product|Item|Deal))/i,
      /"([^"]{1,100})"/,
      /'([^']{1,100})'/,
      /([A-Z][a-zA-Z0-9\s]{2,50})(?:\s*(?:Product|Item|Deal|Offer))/
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const name = match[1].trim();
        if (name.length > 2 && name.length < 100) {
          return name;
        }
      }
    }
    
    // Extract from domain
    if (domain) {
      const domainName = domain.replace(/^www\./, '').split('.')[0];
      if (domainName.length > 2) {
        return domainName.charAt(0).toUpperCase() + domainName.slice(1) + ' Product';
      }
    }
    
    return null;
  }

  /**
   * Extract pricing information
   */
  private extractPricing(text: string): any {
    const pricing = {
      price: null as string | null,
      originalPrice: null as string | null,
      currency: 'USD',
      discount: null as number | null
    };
    
    // Price patterns
    const pricePatterns = [
      /(?:Price|Cost)\s*:?\s*([₹$€£¥]?\s*[\d,]+(?:\.\d{2})?)/i,
      /([₹$€£¥]\s*[\d,]+(?:\.\d{2})?)/g,
      /(?:Free|₹0|\$0)/i
    ];
    
    // Check for free
    if (/\b(?:free|₹0|\$0|no cost)\b/i.test(text)) {
      pricing.price = '0';
      pricing.currency = 'USD';
      return pricing;
    }
    
    // Extract prices
    const prices: string[] = [];
    for (const pattern of pricePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        prices.push(...matches);
      }
    }
    
    if (prices.length > 0) {
      // Clean and parse first price
      const firstPrice = prices[0].replace(/[^\d.,₹$€£¥]/g, '');
      pricing.price = firstPrice;
      
      // Detect currency
      if (text.includes('₹')) pricing.currency = 'INR';
      else if (text.includes('$')) pricing.currency = 'USD';
      else if (text.includes('€')) pricing.currency = 'EUR';
      else if (text.includes('£')) pricing.currency = 'GBP';
      
      // If multiple prices, second might be original
      if (prices.length > 1) {
        pricing.originalPrice = prices[1].replace(/[^\d.,₹$€£¥]/g, '');
        
        // Calculate discount
        const current = parseFloat(pricing.price.replace(/[^\d.]/g, ''));
        const original = parseFloat(pricing.originalPrice.replace(/[^\d.]/g, ''));
        if (current && original && original > current) {
          pricing.discount = Math.round(((original - current) / original) * 100);
        }
      }
    }
    
    return pricing;
  }

  /**
   * Detect product category
   */
  private detectCategory(text: string, domain: string): string {
    const categories = {
      'Electronics': ['electronics', 'phone', 'laptop', 'gadget', 'tech', 'mobile', 'computer'],
      'Fashion': ['fashion', 'clothing', 'apparel', 'shoes', 'dress', 'shirt', 'jeans'],
      'Home & Garden': ['home', 'kitchen', 'furniture', 'decor', 'garden', 'appliance'],
      'Beauty': ['beauty', 'cosmetic', 'skincare', 'makeup', 'perfume', 'hair'],
      'Sports': ['sports', 'fitness', 'gym', 'exercise', 'outdoor', 'athletic'],
      'Books': ['book', 'ebook', 'novel', 'textbook', 'magazine', 'reading'],
      'Toys': ['toy', 'game', 'kids', 'children', 'play', 'educational'],
      'Automotive': ['car', 'auto', 'vehicle', 'motorcycle', 'parts', 'accessories'],
      'Health': ['health', 'medical', 'wellness', 'supplement', 'vitamin', 'medicine'],
      'Food': ['food', 'grocery', 'snack', 'beverage', 'organic', 'gourmet']
    };
    
    const lowerText = text.toLowerCase();
    const lowerDomain = domain.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword) || lowerDomain.includes(keyword)) {
          return category;
        }
      }
    }
    
    return 'Global Picks';
  }

  /**
   * Extract rating information
   */
  private extractRating(text: string): any {
    const rating = {
      rating: null as string | null,
      reviewCount: null as number | null
    };
    
    // Rating patterns
    const ratingPatterns = [
      /(?:Rating|Score)\s*:?\s*([0-5](?:\.[0-9])?)/i,
      /([0-5](?:\.[0-9])?)\s*(?:\/5|stars?|⭐)/i,
      /⭐\s*([0-5](?:\.[0-9])?)/
    ];
    
    for (const pattern of ratingPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        rating.rating = match[1];
        break;
      }
    }
    
    // Review count patterns
    const reviewPatterns = [
      /([\d,]+)\s*(?:reviews?|ratings?)/i,
      /(?:reviews?|ratings?)\s*:?\s*([\d,]+)/i
    ];
    
    for (const pattern of reviewPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        rating.reviewCount = parseInt(match[1].replace(/,/g, ''));
        break;
      }
    }
    
    return rating;
  }

  /**
   * Extract description
   */
  private extractDescription(text: string, productName: string): string {
    // Remove product name from text
    let description = text.replace(new RegExp(productName, 'gi'), '').trim();
    
    // Remove URLs
    description = description.replace(/https?:\/\/[^\s]+/g, '').trim();
    
    // Remove price information
    description = description.replace(/[₹$€£¥]\s*[\d,]+(?:\.\d{2})?/g, '').trim();
    
    // Take first meaningful sentence or paragraph
    const sentences = description.split(/[.!?\n]/);
    for (const sentence of sentences) {
      const cleaned = sentence.trim();
      if (cleaned.length > 20 && cleaned.length < 500) {
        return cleaned;
      }
    }
    
    // Fallback to first 200 characters
    return description.substring(0, 200).trim();
  }

  /**
   * Process images from message
   */
  private async processImages(photos: any[], domain: string): Promise<string | null> {
    if (photos && photos.length > 0) {
      // Use the largest photo
      const photo = photos[photos.length - 1];
      return `https://api.telegram.org/file/bot<BOT_TOKEN>/${photo.file_path}`;
    }
    return null;
  }

  /**
   * Build custom affiliate URL for global picks
   */
  private buildCustomAffiliateUrl(originalUrl: string): string {
    try {
      // Add custom affiliate tag for global picks
      const separator = originalUrl.includes('?') ? '&' : '?';
      return `${originalUrl}${separator}ref=globalpicks`;
    } catch (error) {
      console.error('Error building custom affiliate URL:', error);
      return originalUrl;
    }
  }

  /**
   * Generate message group ID
   */
  private generateMessageGroupId(message: any): string {
    return `global_${message.chat?.id || 'unknown'}_${Date.now()}`;
  }

  /**
   * Save global product to database
   */
  private async saveGlobalProduct(productData: any): Promise<any> {
    try {
      const result = await db.insert(globalPicksProducts).values({
        name: productData.name || '',
        description: productData.description || '',
        price: productData.price || null,
        originalPrice: productData.originalPrice || null,
        currency: productData.currency || 'USD',
        imageUrl: productData.imageUrl || null,
        affiliateUrl: productData.affiliateUrl || '',
        originalUrl: productData.originalUrl || '',
        category: productData.category || 'Global Picks',
        rating: productData.rating || null,
        reviewCount: productData.reviewCount || null,
        discount: productData.discount || null,
        affiliateNetwork: productData.affiliateNetwork || 'global',
        sourceDomain: productData.sourceDomain || '',
        telegramMessageId: productData.telegramMessageId || null,
        messageGroupId: productData.messageGroupId || '',
        scrapingMethod: productData.scrapingMethod || 'telegram',
        processingStatus: 'active',
        affiliateTagApplied: true,
        createdAt: Math.floor(Date.now() / 1000)
      } as any).returning();
      
      return result[0];
      
    } catch (error) {
      console.error('Error Error saving global product:', error);
      return null;
    }
  }

  /**
   * Get global products with filtering
   */
  async getProducts(options: {
    limit?: number;
    offset?: number;
    category?: string;
    featured?: boolean;
  } = {}): Promise<any[]> {
    try {
      const { limit = 50, offset = 0, category, featured } = options;
      
      // Build conditions array
      const conditions = [eq(globalPicksProducts.processingStatus, 'active')];
      
      if (category) {
        conditions.push(eq(globalPicksProducts.category, category));
      }
      
      if (featured) {
        conditions.push(eq(globalPicksProducts.isFeatured, true));
      }
      
      const products = await db.select().from(globalPicksProducts)
        .where(and(...conditions))
        .orderBy(desc(globalPicksProducts.createdAt))
        .limit(limit)
        .offset(offset);
      
      return products;
      
    } catch (error) {
      console.error('Error Error fetching Global Picks products:', error);
      return [];
    }
  }

  /**
   * Get global categories
   */
  async getCategories(): Promise<string[]> {
    try {
      const result = await db.select({
        category: globalPicksProducts.category
      })
        .from(globalPicksProducts)
        .where(eq(globalPicksProducts.processingStatus, 'active'))
        .groupBy(globalPicksProducts.category);
      
      return result.map(r => r.category).filter(Boolean);
      
    } catch (error) {
      console.error('Error Error fetching global categories:', error);
      return [];
    }
  }

  /**
   * Get featured global products
   */
  async getFeaturedProducts(limit: number = 20): Promise<any[]> {
    try {
      return await db.select().from(globalPicksProducts)
        .where(
          and(
            eq(globalPicksProducts.processingStatus, 'active'),
            eq(globalPicksProducts.isFeatured, true)
          )
        )
        .orderBy(desc(globalPicksProducts.createdAt))
        .limit(limit);
        
    } catch (error) {
      console.error('Error Error fetching featured global products:', error);
      return [];
    }
  }
}