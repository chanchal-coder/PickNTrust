/**
 * Bot Posting Integration Service
 * Integrates the Enhanced Posting System with existing Telegram bots
 * Provides a unified interface for all bots to use robust posting
 */

import EnhancedPostingSystem, { ProductData } from './enhanced-posting-system';
import { Database } from 'better-sqlite3';
import { socialMediaService } from './social-media-service.js';
import path from 'path';

// Bot configuration interface
interface BotConfig {
  name: string;
  tableName: string;
  displayPage: string;
  defaultCategory: string;
  qualityThreshold: number;
}

// Message processing result
interface ProcessingResult {
  success: boolean;
  reason: string;
  productId?: string;
  quality?: any;
  botType: string;
}

class BotPostingIntegration {
  private enhancedPosting: EnhancedPostingSystem;
  private db: Database;
  private botConfigs: Map<string, BotConfig>;

  constructor() {
    // Initialize database connection
    const dbPath = path.join(__dirname, '..', 'database.sqlite');
    this.db = new (require('better-sqlite3'))(dbPath);
    
    // Initialize enhanced posting system
    this.enhancedPosting = new EnhancedPostingSystem(this.db);
    
    // Configure bot settings
    this.botConfigs = new Map([
      ['click-picks', {
        name: 'Click Picks',
        tableName: 'click_picks_products',
        displayPage: 'click-picks',
        defaultCategory: 'Electronics',
        qualityThreshold: 60
      }],
      ['global-picks', {
        name: 'Global Picks',
        tableName: 'global_picks_products',
        displayPage: 'global-picks',
        defaultCategory: 'General',
        qualityThreshold: 50
      }],
      ['deals-hub', {
        name: 'DealsHub',
        tableName: 'deals_hub_products',
        displayPage: 'deals-hub',
        defaultCategory: 'Electronics',
        qualityThreshold: 60
      }],
      ['loot-box', {
        name: 'Loot Box',
        tableName: 'loot_box_products',
        displayPage: 'loot-box',
        defaultCategory: 'Mystery',
        qualityThreshold: 40
      }],
      ['value-picks', {
        name: 'Value Picks',
        tableName: 'value_picks_products',
        displayPage: 'value-picks',
        defaultCategory: 'General',
        qualityThreshold: 55
      }],
      ['travel-picks', {
        name: 'Travel Picks',
        tableName: 'travel_deals',
        displayPage: 'travel-picks',
        defaultCategory: 'Travel',
        qualityThreshold: 50
      }],
      ['cue-picks', {
        name: 'Cue Picks',
        tableName: 'cuelinks_products',
        displayPage: 'cue-picks',
        defaultCategory: 'General',
        qualityThreshold: 55
      }]
    ]);
  }

  /**
   * Process Telegram message with enhanced posting logic
   */
  async processMessage(message: any, botType: string): Promise<ProcessingResult> {
    console.log(`🤖 ${botType.toUpperCase()} Bot: Processing message...`);
    
    try {
      // Extract product data from message
      const rawData = this.extractProductData(message, botType);
      
      if (!rawData) {
        return {
          success: false,
          reason: 'Could not extract product data from message',
          botType
        };
      }
      
      // Apply bot-specific enhancements
      const enhancedData = this.applyBotSpecificEnhancements(rawData, botType);
      
      // Use enhanced posting system
      const result = await this.enhancedPosting.smartPost(enhancedData, botType);
      
      if (result.success) {
        // Store in appropriate database table
        const productId = await this.storeInDatabase(enhancedData, botType);
        
        // Trigger social media posting after successful website posting
        try {
          const socialMediaData = {
            id: productId,
            name: enhancedData.title || 'Special Deal',
            description: enhancedData.description || 'Check website for details',
            price: String(enhancedData.price || 'See website'),
            originalPrice: enhancedData.originalPrice ? String(enhancedData.originalPrice) : undefined,
            imageUrl: enhancedData.imageUrl || '/assets/default-product.jpg',
            productUrl: enhancedData.affiliateUrl || '',
            category: enhancedData.category || 'general',
            page: botType
          };
          
          const socialResults = await socialMediaService.autoPostFromTelegramBot(socialMediaData);
          const successfulPosts = socialResults.filter(r => r.success).length;
          
          if (successfulPosts > 0) {
            console.log(`📱 ${botType.toUpperCase()}: Posted to ${successfulPosts} social media platforms`);
          }
        } catch (socialError) {
          console.error(`📱 ${botType.toUpperCase()}: Social media posting failed:`, socialError);
          // Don't fail the main process if social media posting fails
        }
        
        console.log(`✅ ${botType.toUpperCase()}: Posted successfully (Quality: ${result.quality?.grade})`);
        return {
          success: true,
          reason: result.reason,
          productId,
          quality: result.quality,
          botType
        };
      } else {
        console.log(`❌ ${botType.toUpperCase()}: ${result.reason}`);
        return {
          success: false,
          reason: result.reason,
          quality: result.quality,
          botType
        };
      }
      
    } catch (error) {
      console.error(`💥 ${botType.toUpperCase()} Error:`, error);
      return {
        success: false,
        reason: `Processing error: ${error.message}`,
        botType
      };
    }
  }

  /**
   * Extract product data from Telegram message
   */
  private extractProductData(message: any, botType: string): ProductData | null {
    try {
      const text = message.text || message.caption || '';
      
      // Common extraction patterns
      const patterns = {
        title: /(?:^|\n)([^\n]{10,100})(?=\n|$)/i,
        price: /(?:₹|\$|price[:\s]*)(\d+(?:[,.]\d+)*)/i,
        originalPrice: /(?:was|original|mrp)[:\s]*(?:₹|\$)?(\d+(?:[,.]\d+)*)/i,
        rating: /(\d+(?:\.\d+)?)\s*(?:star|rating|⭐)/i,
        reviewCount: /(\d+(?:[,.]\d+)*)\s*(?:review|rating)s?/i
      };
      
      // Extract basic information
      const titleMatch = text.match(patterns.title);
      const priceMatch = text.match(patterns.price);
      const originalPriceMatch = text.match(patterns.originalPrice);
      const ratingMatch = text.match(patterns.rating);
      const reviewMatch = text.match(patterns.reviewCount);
      
      // Extract URLs
      const urls = this.extractUrls(text);
      const imageUrl = this.extractImageUrl(message);
      
      // Determine affiliate URL (usually the last URL or specific patterns)
      const affiliateUrl = this.determineAffiliateUrl(urls, botType);
      
      // Build product data
      const productData: ProductData = {
        title: titleMatch?.[1]?.trim(),
        description: this.extractDescription(text),
        price: priceMatch?.[1]?.replace(/[,]/g, ''),
        originalPrice: originalPriceMatch?.[1]?.replace(/[,]/g, ''),
        imageUrl: imageUrl,
        affiliateUrl: affiliateUrl,
        rating: ratingMatch?.[1],
        reviewCount: reviewMatch?.[1]?.replace(/[,]/g, ''),
        source: botType,
        category: this.detectCategory(text, botType),
        currency: this.detectCurrency(text)
      };
      
      // Validate minimum required data
      if (!productData.title && !productData.price && !productData.affiliateUrl) {
        console.log(`⚠️ Insufficient data extracted from ${botType} message`);
        return null;
      }
      
      return productData;
      
    } catch (error) {
      console.error(`Error extracting data from ${botType} message:`, error);
      return null;
    }
  }

  /**
   * Extract URLs from message text
   */
  private extractUrls(text: string): string[] {
    const urlRegex = /https?:\/\/[^\s\n]+/gi;
    return text.match(urlRegex) || [];
  }

  /**
   * Extract image URL from message
   */
  private extractImageUrl(message: any): string | undefined {
    // Check for photo in message
    if (message.photo && message.photo.length > 0) {
      // Get the largest photo
      const largestPhoto = message.photo.reduce((prev: any, current: any) => 
        (prev.file_size > current.file_size) ? prev : current
      );
      return `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${largestPhoto.file_path}`;
    }
    
    // Check for image URLs in text
    const text = message.text || message.caption || '';
    const imageUrlRegex = /https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)/i;
    const match = text.match(imageUrlRegex);
    return match?.[0];
  }

  /**
   * Determine the affiliate URL from extracted URLs
   */
  private determineAffiliateUrl(urls: string[], botType: string): string | undefined {
    if (urls.length === 0) return undefined;
    
    // Priority order for different bot types
    const priorityDomains = {
      'click-picks': ['amazon.in', 'flipkart.com', 'myntra.com'],
      'global-picks': ['amazon.in', 'amazon.com', 'flipkart.com'],
      'deals-hub': ['amazon.in', 'flipkart.com', 'clk.omgt5.com'],
      'loot-box': ['amazon.in', 'flipkart.com'],
      'value-picks': ['amazon.in', 'flipkart.com', 'clk.omgt5.com'],
      'travel-picks': ['makemytrip.com', 'booking.com', 'agoda.com'],
      'cue-picks': ['clk.omgt5.com', 'inrdeals.com', 'amazon.in']
    };
    
    const domains = priorityDomains[botType] || ['amazon.in', 'flipkart.com'];
    
    // Find URL matching priority domains
    for (const domain of domains) {
      const matchingUrl = urls.find(url => url.includes(domain));
      if (matchingUrl) return matchingUrl;
    }
    
    // Return the last URL as fallback (often the affiliate link)
    return urls[urls.length - 1];
  }

  /**
   * Extract description from message text
   */
  private extractDescription(text: string): string {
    // Remove URLs and clean up text
    const cleanText = text
      .replace(/https?:\/\/[^\s]+/gi, '')
      .replace(/[\n\r]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Take first 200 characters as description
    return cleanText.substring(0, 200);
  }

  /**
   * Detect product category from text
   */
  private detectCategory(text: string, botType: string): string {
    const categoryKeywords = {
      'Electronics': ['phone', 'laptop', 'headphone', 'speaker', 'camera', 'tablet', 'watch', 'earbuds'],
      'Fashion': ['shirt', 'dress', 'shoes', 'bag', 'clothing', 'fashion', 'style', 'wear'],
      'Home': ['home', 'kitchen', 'furniture', 'decor', 'appliance', 'bedding'],
      'Beauty': ['beauty', 'cosmetic', 'skincare', 'makeup', 'cream', 'lotion'],
      'Sports': ['sports', 'fitness', 'gym', 'exercise', 'yoga', 'running'],
      'Books': ['book', 'novel', 'guide', 'manual', 'reading'],
      'Travel': ['hotel', 'flight', 'travel', 'trip', 'vacation', 'booking']
    };
    
    const lowerText = text.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return category;
      }
    }
    
    // Return bot-specific default category
    const config = this.botConfigs.get(botType);
    return config?.defaultCategory || 'General';
  }

  /**
   * Detect currency from text
   */
  private detectCurrency(text: string): string {
    if (text.includes('₹')) return 'INR';
    if (text.includes('$')) return 'USD';
    if (text.includes('€')) return 'EUR';
    if (text.includes('£')) return 'GBP';
    return 'INR'; // Default
  }

  /**
   * Apply bot-specific enhancements to product data
   */
  private applyBotSpecificEnhancements(data: ProductData, botType: string): ProductData {
    const enhanced = { ...data };
    const config = this.botConfigs.get(botType);
    
    if (!config) return enhanced;
    
    // Set bot-specific defaults
    enhanced.source = botType;
    enhanced.displayPages = [config.displayPage];
    
    // Apply bot-specific category if not detected
    if (!enhanced.category || enhanced.category === 'General') {
      enhanced.category = config.defaultCategory;
    }
    
    // Bot-specific enhancements
    switch (botType) {
      case 'travel-picks':
        enhanced.travelType = this.detectTravelType(data.title || '');
        break;
        
      case 'loot-box':
        enhanced.mysteryLevel = this.detectMysteryLevel(data.title || '');
        break;
        
      case 'deals-hub':
        enhanced.dealType = this.detectDealType(data.title || '');
        break;
    }
    
    return enhanced;
  }

  /**
   * Store product in appropriate database table
   */
  private async storeInDatabase(data: ProductData, botType: string): Promise<string> {
    const config = this.botConfigs.get(botType);
    if (!config) throw new Error(`Unknown bot type: ${botType}`);
    
    try {
      // Prepare data for database insertion
      const dbData = {
        name: data.title || 'Special Deal',
        description: data.description || 'Check website for details',
        price: String(data.price || 'See website'),
        original_price: data.originalPrice ? String(data.originalPrice) : null,
        currency: data.currency || 'INR',
        image_url: data.imageUrl || '/assets/default-product.jpg',
        affiliate_url: data.affiliateUrl || '',
        category: data.category || config.defaultCategory,
        rating: Number(data.rating) || 0,
        review_count: Number(data.reviewCount) || 0,
        processing_status: 'active',
        source: botType,
        display_pages: config.displayPage,
        created_at: Math.floor(Date.now() / 1000)
      };
      
      // Insert into database
      const columns = Object.keys(dbData).join(', ');
      const placeholders = Object.keys(dbData).map(() => '?').join(', ');
      const values = Object.values(dbData);
      
      const stmt = this.db.prepare(`
        INSERT INTO ${config.tableName} (${columns})
        VALUES (${placeholders})
      `);
      
      const result = stmt.run(...values);
      
      console.log(`💾 Stored in ${config.tableName} with ID: ${result.lastInsertRowid}`);
      return `${botType}_${result.lastInsertRowid}`;
      
    } catch (error) {
      console.error(`Database storage error for ${botType}:`, error);
      throw error;
    }
  }

  /**
   * Utility functions for bot-specific enhancements
   */
  private detectTravelType(title: string): string {
    const types = {
      'hotel': ['hotel', 'resort', 'stay', 'accommodation'],
      'flight': ['flight', 'airline', 'air', 'fly'],
      'package': ['package', 'tour', 'trip', 'vacation'],
      'activity': ['activity', 'experience', 'adventure', 'tour']
    };
    
    const lowerTitle = title.toLowerCase();
    for (const [type, keywords] of Object.entries(types)) {
      if (keywords.some(keyword => lowerTitle.includes(keyword))) {
        return type;
      }
    }
    return 'general';
  }

  private detectMysteryLevel(title: string): string {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('premium') || lowerTitle.includes('luxury')) return 'premium';
    if (lowerTitle.includes('surprise') || lowerTitle.includes('mystery')) return 'mystery';
    return 'standard';
  }

  private detectDealType(title: string): string {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('flash')) return 'flash';
    if (lowerTitle.includes('daily')) return 'daily';
    if (lowerTitle.includes('clearance')) return 'clearance';
    if (lowerTitle.includes('hot')) return 'hot';
    return 'general';
  }

  /**
   * Get posting statistics for all bots
   */
  public getStats(): any {
    return this.enhancedPosting.getStats();
  }

  /**
   * Get bot-specific configuration
   */
  public getBotConfig(botType: string): BotConfig | undefined {
    return this.botConfigs.get(botType);
  }

  /**
   * Reset statistics
   */
  public resetStats(): void {
    this.enhancedPosting.resetStats();
  }
}

// Export singleton instance
const botPostingIntegration = new BotPostingIntegration();
export { botPostingIntegration, BotPostingIntegration };
export type { ProcessingResult };