import { db } from './db';
import { dealsHubProducts } from '../shared/sqlite-schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { UniversalUrlDetector } from './url-detector';
import { CategoryManager } from './category-manager';

/**
 * DealsHubService - Deals and offers processing service
 * Handles flash sales, limited time offers, and special deals
 * Same UI and functionality as other pages with deal-specific features
 */
export class DealsHubService {
  private urlDetector: UniversalUrlDetector;
  private categoryManager: CategoryManager;
  
  constructor() {
    this.urlDetector = new UniversalUrlDetector();
    this.categoryManager = CategoryManager.getInstance();
    console.log('Hot Deals Hub Service initialized:');
    console.log('   Deal types: flash sales, limited offers, special deals');
    console.log('   Custom affiliate tag: ref=dealhub');
    console.log('   Database: deals_hub_products');
    console.log('   Features: same as other pages + deal-specific');
    console.log('   Category Management: auto-creation enabled');
  }

  /**
   * Process Telegram message for deals
   */
  async processMessage(message: any): Promise<void> {
    try {
      const messageText = message.text || message.caption || '';
      const photos = message.photo || [];
      
      // Extract URLs from message text using simple regex
      const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
      const urls = messageText.match(urlRegex) || [];
      
      if (urls.length === 0) {
        console.log('Warning No URLs detected in Deals Hub message');
        return;
      }
      
      console.log(`Search Found ${urls.length} URLs for Deals Hub processing`);
      
      // Process each URL with deal-specific enhancements
      for (const url of urls) {
        const urlInfo = { url, domain: new URL(url).hostname };
        await this.processDealUrl(urlInfo, message, messageText, photos);
      }
      
    } catch (error) {
      console.error('Error Error processing Deals Hub message:', error);
    }
  }

  /**
   * Process individual deal URL
   */
  private async processDealUrl(
    urlInfo: any, 
    message: any, 
    messageText: string, 
    photos: any[]
  ): Promise<void> {
    try {
      console.log(`Search Processing deal URL: ${urlInfo.url}`);
      
      // Extract deal information
      const productInfo = await this.extractDealProductInfo(urlInfo, messageText, photos);
      
      if (!productInfo) {
        console.log('Warning Could not extract deal product information');
        return;
      }
      
      // Build custom affiliate URL for deals
      const affiliateUrl = this.buildCustomAffiliateUrl(urlInfo.url);
      
      // Auto-create category if it doesn't exist (will be done in saveDealsProduct)
      
      // Save to database with deal-specific fields
      const savedProduct = await this.saveDealsProduct({
        ...productInfo,
        originalUrl: urlInfo.url,
        affiliateUrl: affiliateUrl,
        sourceDomain: urlInfo.domain,
        telegramMessageId: message.message_id,
        messageGroupId: this.generateMessageGroupId(message),
        scrapingMethod: 'telegram'
      });
      
      if (savedProduct) {
        console.log(`Success Deals product saved: ${savedProduct.name}`);
        
        // Auto-create category and link product
        if (productInfo.category) {
          try {
            await this.categoryManager.ensureCategoryExists(productInfo.category, {
              productId: savedProduct.id,
              productTable: 'deals_hub_products',
              pageName: 'deals-hub',
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
      console.error('Error Error processing deal URL:', error);
    }
  }

  /**
   * Extract deal product information
   */
  private async extractDealProductInfo(
    urlInfo: any,
    messageText: string,
    photos: any[]
  ): Promise<any | null> {
    try {
      // Extract deal name
      const dealName = this.extractDealName(messageText, urlInfo.domain);
      if (!dealName) {
        console.log('Warning Could not extract deal name');
        return null;
      }
      
      // Extract pricing information
      const pricing = this.extractPricing(messageText);
      
      // Detect deal category
      const category = this.detectDealCategory(messageText, urlInfo.domain);
      
      // Extract rating and reviews
      const rating = this.extractRating(messageText);
      
      // Extract description
      const description = this.extractDescription(messageText, dealName);
      
      // Process images
      const imageUrl = await this.processImages(photos, urlInfo.domain);
      
      // Detect deal type and urgency
      const dealInfo = this.detectDealInfo(messageText, urlInfo.url);
      
      return {
        name: dealName,
        description: description,
        price: pricing.price,
        originalPrice: pricing.originalPrice,
        currency: pricing.currency,
        imageUrl: imageUrl,
        category: category,
        rating: rating.rating,
        reviewCount: rating.reviewCount,
        discount: pricing.discount,
        affiliateNetwork: 'deals',
        
        // Deal-specific fields
        dealType: dealInfo.dealType,
        dealPriority: dealInfo.dealPriority,
        hasLimitedOffer: dealInfo.hasLimitedOffer,
        limitedOfferText: dealInfo.limitedOfferText,
        dealStartTime: dealInfo.dealStartTime,
        dealEndTime: dealInfo.dealEndTime,
        stockQuantity: dealInfo.stockQuantity,
        maxQuantityPerUser: dealInfo.maxQuantityPerUser
      };
      
    } catch (error) {
      console.error('Error Error extracting deal product info:', error);
      return null;
    }
  }

  /**
   * Extract deal name from message
   */
  private extractDealName(text: string, domain: string): string | null {
    // Deal name patterns
    const patterns = [
      /(?:Deal|Offer|Sale)\s*:?\s*([^\n\r]{1,100})/i,
      /(?:Name|Title|Product)\s*:?\s*([^\n\r]{1,100})/i,
      /^([^\n\r]{1,100})(?:\s*-\s*(?:Deal|Offer|Sale))/i,
      /"([^"]{1,100})"/,
      /'([^']{1,100})'/,
      /([A-Z][a-zA-Z0-9\s]{2,50})(?:\s*(?:Deal|Offer|Sale|Discount))/
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
        return domainName.charAt(0).toUpperCase() + domainName.slice(1) + ' Deal';
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
      /(?:Price|Cost|Deal Price)\s*:?\s*([₹$€£¥]?\s*[\d,]+(?:\.\d{2})?)/i,
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
   * Detect deal category
   */
  private detectDealCategory(text: string, domain: string): string {
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
    
    return 'Deals';
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
  private extractDescription(text: string, dealName: string): string {
    // Remove deal name from text
    let description = text.replace(new RegExp(dealName, 'gi'), '').trim();
    
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
   * Detect deal information
   */
  private detectDealInfo(text: string, url: string): any {
    const info = {
      dealType: 'regular',
      dealPriority: 0,
      hasLimitedOffer: false,
      limitedOfferText: null as string | null,
      dealStartTime: null as number | null,
      dealEndTime: null as number | null,
      stockQuantity: null as number | null,
      maxQuantityPerUser: 1
    };
    
    const lowerText = text.toLowerCase();
    
    // Detect deal type
    if (lowerText.includes('flash sale') || lowerText.includes('lightning deal')) {
      info.dealType = 'flash';
      info.dealPriority = 3;
    } else if (lowerText.includes('limited time') || lowerText.includes('limited offer')) {
      info.dealType = 'limited';
      info.dealPriority = 2;
      info.hasLimitedOffer = true;
    } else if (lowerText.includes('clearance') || lowerText.includes('final sale')) {
      info.dealType = 'clearance';
      info.dealPriority = 1;
    }
    
    // Extract limited offer text
    const limitedMatch = text.match(/(?:limited time|limited offer|hurry)[^.!?]*[.!?]/i);
    if (limitedMatch) {
      info.limitedOfferText = limitedMatch[0].trim();
      info.hasLimitedOffer = true;
    }
    
    // Extract stock quantity
    const stockMatch = text.match(/(\d+)\s*(?:left|remaining|in stock)/i);
    if (stockMatch) {
      info.stockQuantity = parseInt(stockMatch[1]);
      info.hasLimitedOffer = true;
    }
    
    // Extract max quantity per user
    const maxQtyMatch = text.match(/(?:limit|max)\s*(\d+)\s*per\s*(?:person|user|customer)/i);
    if (maxQtyMatch) {
      info.maxQuantityPerUser = parseInt(maxQtyMatch[1]);
    }
    
    // Extract deal end time (simplified)
    const endTimeMatch = text.match(/(?:ends?|expires?)\s*(?:in|on)\s*([^.!?\n]*)/i);
    if (endTimeMatch) {
      // Set a default end time (24 hours from now)
      info.dealEndTime = Math.floor(Date.now() / 1000) + (24 * 60 * 60);
    }
    
    return info;
  }

  /**
   * Build custom affiliate URL for deals
   */
  private buildCustomAffiliateUrl(originalUrl: string): string {
    try {
      // Add custom affiliate tag for deals
      const separator = originalUrl.includes('?') ? '&' : '?';
      return `${originalUrl}${separator}ref=dealhub`;
    } catch (error) {
      console.error('Error building custom affiliate URL:', error);
      return originalUrl;
    }
  }

  /**
   * Generate message group ID
   */
  private generateMessageGroupId(message: any): string {
    return `deals_${message.chat?.id || 'unknown'}_${Date.now()}`;
  }

  /**
   * Save deals product to database
   */
  private async saveDealsProduct(productData: any): Promise<any> {
    try {
      const result = await db.insert(dealsHubProducts).values({
        name: productData.name || '',
        description: productData.description || '',
        price: productData.price || null,
        originalPrice: productData.originalPrice || null,
        currency: productData.currency || 'INR',
        imageUrl: productData.imageUrl || null,
        affiliateUrl: productData.affiliateUrl || '',
        originalUrl: productData.originalUrl || '',
        category: productData.category || 'Deals',
        rating: productData.rating || null,
        reviewCount: productData.reviewCount || null,
        discount: productData.discount || null,
        affiliateNetwork: productData.affiliateNetwork || 'unknown',
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
      console.error('Error Error saving deals product:', error);
      return null;
    }
  }

  /**
   * Get deals products with filtering
   */
  async getProducts(options: {
    limit?: number;
    offset?: number;
    category?: string;
    dealType?: string;
    featured?: boolean;
  } = {}): Promise<any[]> {
    try {
      const { limit = 50, offset = 0, category, dealType, featured } = options;
      
      // Build conditions array
      const conditions = [eq(dealsHubProducts.processingStatus, 'active')];
      
      if (category) {
        conditions.push(eq(dealsHubProducts.category, category));
      }
      
      if (dealType) {
        conditions.push(eq(dealsHubProducts.dealType, dealType));
      }
      
      if (featured) {
        conditions.push(eq(dealsHubProducts.isFeatured, true));
      }
      
      const products = await db.select().from(dealsHubProducts)
        .where(and(...conditions))
        .orderBy(desc(dealsHubProducts.dealPriority), desc(dealsHubProducts.createdAt))
        .limit(limit)
        .offset(offset);
      
      return products;
      
    } catch (error) {
      console.error('Error Error fetching Deals Hub products:', error);
      return [];
    }
  }

  /**
   * Get deal categories
   */
  async getCategories(): Promise<string[]> {
    try {
      const result = await db.select({
        category: dealsHubProducts.category
      })
        .from(dealsHubProducts)
        .where(eq(dealsHubProducts.processingStatus, 'active'))
        .groupBy(dealsHubProducts.category);
      
      return result.map(r => r.category).filter(Boolean);
      
    } catch (error) {
      console.error('Error Error fetching deal categories:', error);
      return [];
    }
  }

  /**
   * Get deal types
   */
  async getDealTypes(): Promise<string[]> {
    try {
      const result = await db.select({
        dealType: dealsHubProducts.dealType
      })
        .from(dealsHubProducts)
        .where(eq(dealsHubProducts.processingStatus, 'active'))
        .groupBy(dealsHubProducts.dealType);
      
      return result.map(r => r.dealType).filter(Boolean);
      
    } catch (error) {
      console.error('Error Error fetching deal types:', error);
      return [];
    }
  }

  /**
   * Get flash deals
   */
  async getFlashDeals(limit: number = 20): Promise<any[]> {
    try {
      return await db.select().from(dealsHubProducts)
        .where(
          and(
            eq(dealsHubProducts.processingStatus, 'active'),
            eq(dealsHubProducts.dealType, 'flash')
          )
        )
        .orderBy(desc(dealsHubProducts.dealPriority), desc(dealsHubProducts.createdAt))
        .limit(limit);
        
    } catch (error) {
      console.error('Error Error fetching flash deals:', error);
      return [];
    }
  }
}