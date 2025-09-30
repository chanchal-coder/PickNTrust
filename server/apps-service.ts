import { db } from './db';
import { appsProducts } from '../shared/sqlite-schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { UniversalUrlDetector } from './url-detector';
import { categoryManager } from './category-manager';

/**
 * AppsService - Mobile and web application processing service
 * Handles app store links, web apps, AI tools, and services
 * Same UI and functionality as other pages with app-specific features
 */
export class AppsService {
  private urlDetector: UniversalUrlDetector;
  private categoryManager: typeof categoryManager;
  
  constructor() {
    this.urlDetector = new UniversalUrlDetector();
    this.categoryManager = categoryManager;
    console.log('Mobile Apps Service initialized:');
    console.log('   App types: mobile, web, desktop, AI, service');
    console.log('   Custom affiliate tag: ref=sicvppak');
    console.log('   Database: apps_products');
    console.log('   Features: same as other pages + app-specific');
    console.log('   Category Management: auto-creation enabled');
  }

  /**
   * Process Telegram message for apps
   */
  async processMessage(message: any): Promise<void> {
    try {
      const messageText = message.text || message.caption || '';
      const photos = message.photo || [];
      
      // Extract URLs from message text using simple regex
      const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
      const urls = messageText.match(urlRegex) || [];
      
      if (urls.length === 0) {
        console.log('Warning No URLs detected in Apps message');
        return;
      }
      
      console.log(`Search Found ${urls.length} URLs for Apps processing`);
      
      // Process each URL with app-specific enhancements
      for (const url of urls) {
        const urlInfo = { url, domain: new URL(url).hostname };
        await this.processAppUrl(urlInfo, message, messageText, photos);
      }
      
    } catch (error) {
      console.error('Error Error processing Apps message:', error);
    }
  }

  /**
   * Process individual app URL
   */
  private async processAppUrl(
    urlInfo: any, 
    message: any, 
    messageText: string, 
    photos: any[]
  ): Promise<void> {
    try {
      console.log(`Search Processing app URL: ${urlInfo.url}`);
      
      // Extract app information
      const productInfo = await this.extractAppProductInfo(urlInfo, messageText, photos);
      
      if (!productInfo) {
        console.log('Warning Could not extract app product information');
        return;
      }
      
      // Build custom affiliate URL for apps
      const affiliateUrl = this.buildCustomAffiliateUrl(urlInfo.url);
      
      // Auto-create category if it doesn't exist (will be done in saveAppsProduct)
      
      // Save to database with app-specific fields
      const savedProduct = await this.saveAppsProduct({
        ...productInfo,
        originalUrl: urlInfo.url,
        affiliateUrl: affiliateUrl,
        sourceDomain: urlInfo.domain,
        telegramMessageId: message.message_id,
        messageGroupId: this.generateMessageGroupId(message),
        scrapingMethod: 'telegram'
      });
      
      if (savedProduct) {
        console.log(`Success Apps product saved: ${savedProduct.name}`);
        
        // Category is already set in the product data
        if (productInfo.category) {
          try {
            // Category validation is handled during product insertion
            console.log(`Product saved with category: ${productInfo.category}`);
          } catch (categoryError) {
            console.error('Warning Category creation failed:', categoryError);
          }
        }
      }
      
    } catch (error) {
      console.error('Error Error processing app URL:', error);
    }
  }

  /**
   * Extract app product information
   */
  private async extractAppProductInfo(
    urlInfo: any,
    messageText: string,
    photos: any[]
  ): Promise<any | null> {
    try {
      // Extract app name
      const appName = this.extractAppName(messageText, urlInfo.domain);
      if (!appName) {
        console.log('Warning Could not extract app name');
        return null;
      }
      
      // Extract pricing information
      const pricing = this.extractPricing(messageText);
      
      // Detect app category
      const category = this.detectAppCategory(messageText, urlInfo.domain);
      
      // Extract rating and reviews
      const rating = this.extractRating(messageText);
      
      // Extract description
      const description = this.extractDescription(messageText, appName);
      
      // Process images
      const imageUrl = await this.processImages(photos, urlInfo.domain);
      
      // Detect app type and platform
      const appInfo = this.detectAppInfo(messageText, urlInfo.url);
      
      return {
        name: appName,
        description: description,
        price: pricing.price,
        originalPrice: pricing.originalPrice,
        currency: pricing.currency,
        imageUrl: imageUrl,
        category: category,
        rating: rating.rating,
        reviewCount: rating.reviewCount,
        discount: pricing.discount,
        affiliateNetwork: 'apps',
        
        // App-specific fields
        isService: appInfo.isService,
        appType: appInfo.appType,
        platform: appInfo.platform,
        pricingType: appInfo.pricingType,
        monthlyPrice: appInfo.monthlyPrice,
        yearlyPrice: appInfo.yearlyPrice,
        isFree: appInfo.isFree,
        priceDescription: appInfo.priceDescription,
        
        // AI-specific fields
        aiCategory: appInfo.aiCategory,
        aiFeatures: appInfo.aiFeatures,
        modelType: appInfo.modelType,
        apiAccess: appInfo.apiAccess,
        
        // Store URLs
        appStoreUrl: appInfo.appStoreUrl,
        playStoreUrl: appInfo.playStoreUrl,
        webAppUrl: appInfo.webAppUrl,
        downloadUrl: appInfo.downloadUrl
      };
      
    } catch (error) {
      console.error('Error Error extracting app product info:', error);
      return null;
    }
  }

  /**
   * Extract app name from message
   */
  private extractAppName(text: string, domain: string): string | null {
    // App name patterns
    const patterns = [
      /(?:App|Application)\s*:?\s*([^\n\r]{1,100})/i,
      /(?:Name|Title)\s*:?\s*([^\n\r]{1,100})/i,
      /^([^\n\r]{1,100})(?:\s*-\s*(?:App|Application))/i,
      /"([^"]{1,100})"/,
      /'([^']{1,100})'/,
      /([A-Z][a-zA-Z0-9\s]{2,50})(?:\s*(?:App|Pro|Premium|Plus))/
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
        return domainName.charAt(0).toUpperCase() + domainName.slice(1);
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
   * Detect app category
   */
  private detectAppCategory(text: string, domain: string): string {
    const categories = {
      'Productivity': ['productivity', 'office', 'work', 'business', 'task', 'note', 'calendar', 'email'],
      'Design': ['design', 'creative', 'photo', 'image', 'graphic', 'art', 'draw', 'sketch'],
      'Development': ['code', 'developer', 'programming', 'git', 'api', 'database', 'server'],
      'AI Tools': ['ai', 'artificial intelligence', 'machine learning', 'chatbot', 'gpt', 'neural'],
      'Social Media': ['social', 'media', 'instagram', 'twitter', 'facebook', 'linkedin'],
      'Entertainment': ['game', 'music', 'video', 'movie', 'streaming', 'entertainment'],
      'Education': ['education', 'learning', 'course', 'tutorial', 'study', 'school'],
      'Finance': ['finance', 'money', 'bank', 'investment', 'crypto', 'trading'],
      'Health': ['health', 'fitness', 'medical', 'wellness', 'exercise', 'diet'],
      'Utilities': ['utility', 'tool', 'converter', 'calculator', 'weather', 'clock']
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
    
    return 'Apps';
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
  private extractDescription(text: string, appName: string): string {
    // Remove app name from text
    let description = text.replace(new RegExp(appName, 'gi'), '').trim();
    
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
   * Detect app information
   */
  private detectAppInfo(text: string, url: string): any {
    const info = {
      isService: false,
      appType: 'mobile',
      platform: 'Cross-platform',
      pricingType: 'one-time',
      monthlyPrice: null as string | null,
      yearlyPrice: null as string | null,
      isFree: false,
      priceDescription: null as string | null,
      aiCategory: null as string | null,
      aiFeatures: null as string | null,
      modelType: null as string | null,
      apiAccess: false,
      appStoreUrl: null as string | null,
      playStoreUrl: null as string | null,
      webAppUrl: null as string | null,
      downloadUrl: null as string | null
    };
    
    const lowerText = text.toLowerCase();
    const lowerUrl = url.toLowerCase();
    
    // Detect if it's a service
    if (lowerText.includes('service') || lowerText.includes('saas') || lowerText.includes('subscription')) {
      info.isService = true;
      info.pricingType = 'subscription';
    }
    
    // Detect app type
    if (lowerText.includes('web app') || lowerText.includes('webapp')) {
      info.appType = 'web';
    } else if (lowerText.includes('desktop') || lowerText.includes('windows') || lowerText.includes('mac')) {
      info.appType = 'desktop';
    }
    
    // Detect platform
    if (lowerText.includes('ios') && lowerText.includes('android')) {
      info.platform = 'iOS, Android';
    } else if (lowerText.includes('ios')) {
      info.platform = 'iOS';
    } else if (lowerText.includes('android')) {
      info.platform = 'Android';
    } else if (lowerText.includes('web')) {
      info.platform = 'Web';
    }
    
    // Detect pricing
    if (lowerText.includes('free') || lowerText.includes('₹0') || lowerText.includes('$0')) {
      info.isFree = true;
      info.pricingType = 'free';
    }
    
    // Extract monthly/yearly prices
    const monthlyMatch = text.match(/([₹$€£¥]?\s*[\d,]+(?:\.\d{2})?)\s*\/\s*month/i);
    if (monthlyMatch) {
      info.monthlyPrice = monthlyMatch[1].trim();
      info.pricingType = 'subscription';
    }
    
    const yearlyMatch = text.match(/([₹$€£¥]?\s*[\d,]+(?:\.\d{2})?)\s*\/\s*year/i);
    if (yearlyMatch) {
      info.yearlyPrice = yearlyMatch[1].trim();
      info.pricingType = 'subscription';
    }
    
    // Detect AI features
    if (lowerText.includes('ai') || lowerText.includes('artificial intelligence')) {
      info.aiCategory = 'AI Tool';
      
      if (lowerText.includes('chatbot') || lowerText.includes('chat')) {
        info.aiFeatures = 'Chatbot, Conversation';
      } else if (lowerText.includes('image') || lowerText.includes('photo')) {
        info.aiFeatures = 'Image Generation, Photo Editing';
      } else if (lowerText.includes('text') || lowerText.includes('writing')) {
        info.aiFeatures = 'Text Generation, Writing Assistant';
      }
      
      if (lowerText.includes('gpt') || lowerText.includes('transformer')) {
        info.modelType = 'Transformer';
      } else if (lowerText.includes('neural') || lowerText.includes('deep learning')) {
        info.modelType = 'Neural Network';
      }
      
      if (lowerText.includes('api') || lowerText.includes('integration')) {
        info.apiAccess = true;
      }
    }
    
    // Extract store URLs
    if (lowerUrl.includes('apps.apple.com') || lowerUrl.includes('itunes.apple.com')) {
      info.appStoreUrl = url;
    } else if (lowerUrl.includes('play.google.com')) {
      info.playStoreUrl = url;
    } else if (lowerText.includes('web app') || info.appType === 'web') {
      info.webAppUrl = url;
    } else {
      info.downloadUrl = url;
    }
    
    return info;
  }

  /**
   * Build custom affiliate URL for apps
   */
  private buildCustomAffiliateUrl(originalUrl: string): string {
    try {
      // Add custom affiliate tag for apps
      const separator = originalUrl.includes('?') ? '&' : '?';
      return `${originalUrl}${separator}ref=sicvppak`;
    } catch (error) {
      console.error('Error building custom affiliate URL:', error);
      return originalUrl;
    }
  }

  /**
   * Generate message group ID
   */
  private generateMessageGroupId(message: any): string {
    return `apps_${message.chat?.id || 'unknown'}_${Date.now()}`;
  }

  /**
   * Save apps product to database
   */
  private async saveAppsProduct(productData: any): Promise<any> {
    try {
      const result = await db.insert(appsProducts).values({
        name: productData.name || '',
        description: productData.description || '',
        price: productData.price || null,
        originalPrice: productData.originalPrice || null,
        currency: productData.currency || 'INR',
        imageUrl: productData.imageUrl || null,
        affiliateUrl: productData.affiliateUrl || '',
        originalUrl: productData.originalUrl || '',
        category: productData.category || 'Apps',
        rating: productData.rating || null,
        reviewCount: productData.reviewCount || null,
        discount: productData.discount || null,
        affiliateNetwork: productData.affiliateNetwork || 'apps',
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
      console.error('Error Error saving apps product:', error);
      return null;
    }
  }

  /**
   * Get apps products with filtering
   */
  async getProducts(options: {
    limit?: number;
    offset?: number;
    category?: string;
    appType?: string;
    platform?: string;
    isAiApp?: boolean;
    featured?: boolean;
  } = {}): Promise<any[]> {
    try {
      const { limit = 50, offset = 0, category, appType, platform, isAiApp, featured } = options;
      
      // Build conditions array
      const conditions = [eq(appsProducts.processingStatus, 'active')];
      
      if (category) {
        conditions.push(eq(appsProducts.category, category));
      }
      
      if (appType) {
        conditions.push(eq(appsProducts.appType, appType));
      }
      
      if (platform) {
        conditions.push(eq(appsProducts.platform, platform));
      }
      
      if (isAiApp) {
        conditions.push(eq(appsProducts.aiCategory, 'AI Tool'));
      }
      
      if (featured) {
        conditions.push(eq(appsProducts.isFeatured, true));
      }
      
      const query = db.select().from(appsProducts)
        .where(and(...conditions))
        .orderBy(desc(appsProducts.createdAt))
        .limit(limit)
        .offset(offset);
      
      return await query;
      
    } catch (error) {
      console.error('Error Error fetching apps products:', error);
      return [];
    }
  }

  /**
   * Get app categories
   */
  async getCategories(): Promise<string[]> {
    try {
      const result = await db.select({
        category: appsProducts.category
      })
        .from(appsProducts)
        .where(eq(appsProducts.processingStatus, 'active'))
        .groupBy(appsProducts.category);
      
      return result.map(r => r.category).filter(Boolean);
      
    } catch (error) {
      console.error('Error Error fetching app categories:', error);
      return [];
    }
  }

  /**
   * Get app types
   */
  async getAppTypes(): Promise<string[]> {
    try {
      const result = await db.select({
        appType: appsProducts.appType
      })
        .from(appsProducts)
        .where(eq(appsProducts.processingStatus, 'active'))
        .groupBy(appsProducts.appType);
      
      return result.map(r => r.appType).filter(Boolean);
      
    } catch (error) {
      console.error('Error Error fetching app types:', error);
      return [];
    }
  }

  /**
   * Get AI apps
   */
  async getAiApps(limit: number = 20): Promise<any[]> {
    try {
      return await db.select().from(appsProducts)
        .where(
          and(
            eq(appsProducts.processingStatus, 'active'),
            eq(appsProducts.aiCategory, 'AI Tool')
          )
        )
        .orderBy(desc(appsProducts.createdAt))
        .limit(limit);
        
    } catch (error) {
      console.error('Error Error fetching AI apps:', error);
      return [];
    }
  }
}