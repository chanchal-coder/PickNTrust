import { db } from './db';
import { lootBoxProducts } from '../shared/sqlite-schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { UniversalUrlDetector } from './url-detector';
import { CategoryManager } from './category-manager';

/**
 * LootBoxService - Loot box and mystery deals processing service
 * Handles DeoDap products, mystery boxes, and surprise deals
 * Same UI and functionality as other pages with loot-specific features
 */
export class LootBoxService {
  private urlDetector: UniversalUrlDetector;
  private categoryManager: CategoryManager;
  
  constructor() {
    this.urlDetector = new UniversalUrlDetector();
    this.categoryManager = CategoryManager.getInstance();
    console.log('Products Loot Box Service initialized:');
    console.log('   Product types: mystery boxes, surprise deals, DeoDap products');
    console.log('   Custom affiliate tag: ref=lootbox');
    console.log('   Database: loot_box_products');
    console.log('   Features: same as other pages + loot-specific');
    console.log('   Category Management: auto-creation enabled');
  }

  /**
   * Process Telegram message for loot box
   */
  async processMessage(message: any): Promise<void> {
    try {
      const messageText = message.text || message.caption || '';
      const photos = message.photo || [];
      
      // Detect message source
      const messageSource = this.detectMessageSource(message);
      console.log(`📨 Processing message from: ${messageSource}`);
      
      // Extract URLs from message text using simple regex
      const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
      const urls = messageText.match(urlRegex) || [];
      
      if (urls.length === 0) {
        console.log('Warning No URLs detected in Loot Box message');
        return;
      }
      
      console.log(`Search Found ${urls.length} URLs for Loot Box processing`);
      
      // Process each URL with loot-specific enhancements
      for (const url of urls) {
        const urlInfo = { url, domain: new URL(url).hostname };
        await this.processLootUrl(urlInfo, message, messageText, photos, messageSource);
      }
      
    } catch (error) {
      console.error('Error Error processing Loot Box message:', error);
    }
  }

  /**
   * Detect the source of the message
   */
  private detectMessageSource(message: any): string {
    if (message.from?.is_bot) {
      const botUsername = message.from?.username || 'unknown_bot';
      console.log(`AI Bot message detected: @${botUsername}`);
      
      // Identify specific bots
      if (botUsername.includes('earnkaro')) {
        return 'earnkaro_bot';
      } else if (botUsername.includes('cuelinks')) {
        return 'cuelinks_bot';
      } else {
        return 'other_bot';
      }
    } else {
      console.log('👤 Human message detected');
      return 'human';
    }
  }

  /**
   * Process individual loot URL
   */
  private async processLootUrl(
    urlInfo: any, 
    message: any, 
    messageText: string, 
    photos: any[],
    messageSource: string
  ): Promise<void> {
    try {
      console.log(`Search Processing loot URL: ${urlInfo.url} from ${messageSource}`);
      
      // Extract loot product information
      const productInfo = await this.extractLootProductInfo(urlInfo, messageText, photos);
      
      if (!productInfo) {
        console.log('Warning Could not extract loot product information');
        return;
      }
      
      // Build custom affiliate URL with source tracking
      const affiliateUrl = this.buildCustomAffiliateUrl(urlInfo.url, messageSource);
      
      // Auto-create category if it doesn't exist (will be done in saveLootProduct)
      
      // Save to database with loot-specific fields
        const savedProduct = await this.saveLootProduct({
          ...productInfo,
          originalUrl: urlInfo.url,
          affiliateUrl: affiliateUrl,
          sourceDomain: urlInfo.domain,
          telegramMessageId: message.message_id,
          messageGroupId: this.generateMessageGroupId(message),
          scrapingMethod: 'telegram',
          dealSource: messageSource
        });
      
      if (savedProduct) {
        console.log(`Success Loot product saved: ${savedProduct.name}`);
        
        // Auto-create category and link product
        if (productInfo.category) {
          try {
            await this.categoryManager.ensureCategoryExists(productInfo.category, {
              productId: savedProduct.id,
              productTable: 'loot_box_products',
              pageName: 'loot-box',
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
      console.error('Error Error processing loot URL:', error);
    }
  }

  /**
   * Extract loot product information
   */
  private async extractLootProductInfo(
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
      
      // Detect loot-specific information
      const lootInfo = this.detectLootInfo(messageText, urlInfo.url);
      
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
        affiliateNetwork: 'deodap',
        
        // Loot-specific fields
        isDigital: lootInfo.isDigital,
        isCourse: lootInfo.isCourse,
        serviceDuration: lootInfo.serviceDuration,
        accessType: lootInfo.accessType,
        deodapProductId: lootInfo.deodapProductId,
        deodapSeller: lootInfo.deodapSeller,
        deodapTags: lootInfo.deodapTags
      };
      
    } catch (error) {
      console.error('Error Error extracting loot product info:', error);
      return null;
    }
  }

  /**
   * Extract product name from message
   */
  private extractProductName(text: string, domain: string): string | null {
    // Product name patterns
    const patterns = [
      /(?:Product|Item|Course|Service)\s*:?\s*([^\n\r]{1,100})/i,
      /(?:Name|Title)\s*:?\s*([^\n\r]{1,100})/i,
      /^([^\n\r]{1,100})(?:\s*-\s*(?:Product|Item|Course|Service))/i,
      /"([^"]{1,100})"/,
      /'([^']{1,100})'/,
      /([A-Z][a-zA-Z0-9\s]{2,50})(?:\s*(?:Course|Service|Product|Deal))/
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
      'Digital Products': ['digital', 'ebook', 'software', 'app', 'template', 'plugin'],
      'Online Courses': ['course', 'training', 'tutorial', 'masterclass', 'workshop', 'certification'],
      'Services': ['service', 'consultation', 'coaching', 'mentoring', 'support', 'maintenance'],
      'Tools & Software': ['tool', 'software', 'saas', 'platform', 'system', 'automation'],
      'Creative Assets': ['design', 'graphics', 'photos', 'videos', 'audio', 'music'],
      'Business Resources': ['business', 'marketing', 'sales', 'finance', 'management', 'strategy'],
      'Health & Wellness': ['health', 'fitness', 'wellness', 'nutrition', 'meditation', 'yoga'],
      'Technology': ['tech', 'programming', 'coding', 'development', 'ai', 'machine learning'],
      'Lifestyle': ['lifestyle', 'personal', 'hobby', 'entertainment', 'travel', 'food'],
      'Education': ['education', 'learning', 'academic', 'research', 'study', 'knowledge']
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
    
    return 'Loot Box';
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
   * Detect loot-specific information
   */
  private detectLootInfo(text: string, url: string): any {
    const info = {
      isDigital: false,
      isCourse: false,
      serviceDuration: null as string | null,
      accessType: 'one-time',
      deodapProductId: null as string | null,
      deodapSeller: 'DeoDap',
      deodapTags: null as string | null
    };
    
    const lowerText = text.toLowerCase();
    const lowerUrl = url.toLowerCase();
    
    // Detect if it's digital
    if (lowerText.includes('digital') || lowerText.includes('download') || lowerText.includes('online')) {
      info.isDigital = true;
    }
    
    // Detect if it's a course
    if (lowerText.includes('course') || lowerText.includes('training') || lowerText.includes('tutorial')) {
      info.isCourse = true;
      info.isDigital = true;
    }
    
    // Detect access type
    if (lowerText.includes('lifetime') || lowerText.includes('permanent')) {
      info.accessType = 'lifetime';
    } else if (lowerText.includes('subscription') || lowerText.includes('monthly')) {
      info.accessType = 'subscription';
    }
    
    // Extract service duration
    const durationMatch = text.match(/(\d+)\s*(?:days?|weeks?|months?|years?)/i);
    if (durationMatch) {
      info.serviceDuration = durationMatch[0];
    }
    
    // Extract DeoDap product ID from URL
    if (lowerUrl.includes('deodap')) {
      const idMatch = url.match(/\/product\/(\w+)/i) || url.match(/id[=:]([\w-]+)/i);
      if (idMatch) {
        info.deodapProductId = idMatch[1];
      }
    }
    
    // Extract tags
    const tagMatch = text.match(/(?:tags?|categories?)\s*:?\s*([^\n\r]{1,200})/i);
    if (tagMatch) {
      info.deodapTags = tagMatch[1].trim();
    }
    
    return info;
  }

  /**
   * Build custom affiliate URL for loot box
   */
  private buildCustomAffiliateUrl(originalUrl: string, messageSource: string = 'manual'): string {
    try {
      // Remove existing affiliate parameters from bot messages
      const cleanUrl = this.removeExistingAffiliateParams(originalUrl, messageSource);
      
      // Add custom affiliate tag based on source
      const separator = cleanUrl.includes('?') ? '&' : '?';
      const sourceTag = this.getSourceTag(messageSource);
      
      const finalUrl = `${cleanUrl}${separator}ref=lootbox&source=${sourceTag}`;
      console.log(`Link Affiliate URL: ${originalUrl} → ${finalUrl}`);
      
      return finalUrl;
    } catch (error) {
      console.error('Error building custom affiliate URL:', error);
      return originalUrl;
    }
  }

  /**
   * Remove existing affiliate parameters from URLs
   */
  private removeExistingAffiliateParams(url: string, messageSource: string): string {
    try {
      const urlObj = new URL(url);
      
      // Remove common affiliate parameters based on source
      const paramsToRemove = this.getAffiliateParamsToRemove(messageSource);
      
      paramsToRemove.forEach(param => {
        urlObj.searchParams.delete(param);
      });
      
      return urlObj.toString();
    } catch (error) {
      console.error('Error cleaning affiliate URL:', error);
      return url;
    }
  }

  /**
   * Get affiliate parameters to remove based on message source
   */
  private getAffiliateParamsToRemove(messageSource: string): string[] {
    const commonParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
    
    switch (messageSource) {
      case 'earnkaro_bot':
        return [...commonParams, 'ref', 'referrer', 'earnkaro_ref', 'ek_ref'];
      case 'cuelinks_bot':
        return [...commonParams, 'ref', 'referrer', 'cue_ref', 'cl_ref'];
      default:
        return commonParams;
    }
  }

  /**
   * Get source tag for tracking
   */
  private getSourceTag(messageSource: string): string {
    switch (messageSource) {
      case 'earnkaro_bot':
        return 'earnkaro';
      case 'cuelinks_bot':
        return 'cuelinks';
      case 'other_bot':
        return 'bot';
      case 'human':
        return 'manual';
      default:
        return 'unknown';
    }
  }

  /**
   * Generate message group ID
   */
  private generateMessageGroupId(message: any): string {
    return `loot_${message.chat?.id || 'unknown'}_${Date.now()}`;
  }

  /**
   * Save loot product to database
   */
  private async saveLootProduct(productData: any): Promise<any> {
    try {
      // Ensure affiliate_url is never null or undefined
      const affiliateUrl = productData.affiliateUrl || productData.originalUrl || 'https://deodap.in';
      const originalUrl = productData.originalUrl || affiliateUrl;
      
      console.log(`Search Saving product with affiliate_url: ${affiliateUrl}`);
      
      const result = await db.insert(lootBoxProducts).values({
        name: productData.name || 'Untitled Product',
        description: productData.description || '',
        price: productData.price || null,
        originalPrice: productData.originalPrice || null,
        currency: productData.currency || 'INR',
        imageUrl: productData.imageUrl || null,
        affiliateUrl: affiliateUrl || productData.originalUrl || 'https://deodap.in', // Triple fallback
        originalUrl: originalUrl || productData.affiliateUrl || 'https://deodap.in', // Triple fallback
        category: productData.category || 'Loot Box',
        rating: productData.rating || null,
        reviewCount: productData.reviewCount || null,
        discount: productData.discount || null,
        affiliateNetwork: productData.affiliateNetwork || 'deodap',
        sourceDomain: productData.sourceDomain || 'deodap.in',
        telegramMessageId: productData.telegramMessageId || null,
        messageGroupId: productData.messageGroupId || '',
        scrapingMethod: productData.scrapingMethod || 'telegram',
        processingStatus: 'active',
        affiliateTagApplied: true,
        source: productData.dealSource || 'telegram',
        createdAt: Math.floor(Date.now() / 1000)
      } as any).returning();
      
      console.log(`Success Product saved successfully: ${result[0]?.name}`);
      return result[0];
      
    } catch (error) {
      console.error('Error Error saving loot product:', error);
      console.error('Error Product data:', JSON.stringify(productData, null, 2));
      return null;
    }
  }

  /**
   * Get loot products with filtering
   */
  async getProducts(options: {
    limit?: number;
    offset?: number;
    category?: string;
    productType?: string;
    featured?: boolean;
  } = {}): Promise<any[]> {
    try {
      const { limit = 50, offset = 0, category, productType, featured } = options;
      
      // Build conditions array
      const conditions = [eq(lootBoxProducts.processingStatus, 'active')];
      
      if (category) {
        conditions.push(eq(lootBoxProducts.category, category));
      }
      
      if (productType) {
        if (productType === 'digital') {
          conditions.push(eq(lootBoxProducts.isDigital, true));
        } else if (productType === 'course') {
          conditions.push(eq(lootBoxProducts.isCourse, true));
        }
      }
      
      if (featured) {
        conditions.push(eq(lootBoxProducts.isFeatured, true));
      }
      
      const products = await db.select()
        .from(lootBoxProducts)
        .where(and(...conditions))
        .orderBy(desc(lootBoxProducts.createdAt))
        .limit(limit)
        .offset(offset);
      
      return products;
      
    } catch (error) {
      console.error('Error Error fetching Loot Box products:', error);
      return [];
    }
  }

  /**
   * Get loot categories
   */
  async getCategories(): Promise<string[]> {
    try {
      const result = await db.select({
        category: lootBoxProducts.category
      })
        .from(lootBoxProducts)
        .where(eq(lootBoxProducts.processingStatus, 'active'))
        .groupBy(lootBoxProducts.category);
      
      return result.map(r => r.category).filter(Boolean);
      
    } catch (error) {
      console.error('Error Error fetching loot categories:', error);
      return [];
    }
  }

  /**
   * Get digital products
   */
  async getDigitalProducts(limit: number = 20): Promise<any[]> {
    try {
      return await db.select().from(lootBoxProducts)
        .where(
          and(
            eq(lootBoxProducts.processingStatus, 'active'),
            eq(lootBoxProducts.isDigital, true)
          )
        )
        .orderBy(desc(lootBoxProducts.createdAt))
        .limit(limit);
        
    } catch (error) {
      console.error('Error Error fetching digital products:', error);
      return [];
    }
  }

  /**
   * Get online courses
   */
  async getCourses(limit: number = 20): Promise<any[]> {
    try {
      return await db.select().from(lootBoxProducts)
        .where(
          and(
            eq(lootBoxProducts.processingStatus, 'active'),
            eq(lootBoxProducts.isCourse, true)
          )
        )
        .orderBy(desc(lootBoxProducts.createdAt))
        .limit(limit);
        
    } catch (error) {
      console.error('Error Error fetching courses:', error);
      return [];
    }
  }
}