import { db } from './db';
import { products } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { config } from 'dotenv';
import { sqliteDb } from './db';
import { UniversalUrlDetector } from './url-detector';
import { universalScraper } from './universal-scraper';
import { HybridProcessingService } from './hybrid-processing-service';

config({ path: '.env' });

interface ValuePicksProductInfo {
  id: string;
  name: string;
  description: string;
  price: string;
  originalPrice?: string;
  currency: string;
  imageUrl: string;
  affiliateUrl: string;
  originalUrl?: string;
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
  telegramMessageId?: number;
  telegramChannelId?: number;
  createdAt: string;
  sourceMetadata?: any;
  hasLimitedOffer?: boolean;
  limitedOfferText?: string;
}

export class ValuePicksService extends HybridProcessingService {
  private source: string;

  constructor() {
    // Load Value Picks configuration from environment
    const affiliateTemplate = process.env.VALUE_PICKS_AFFILIATE_TEMPLATE || 'https://valuepicks.com/redirect?url={URL}';
    const channelId = parseInt(process.env.VALUE_PICKS_CHANNEL_ID || '0');
    const channelTitle = process.env.VALUE_PICKS_CHANNEL_TITLE || 'PNT EarnKaro';
    
    super('Value Picks', affiliateTemplate, channelId, channelTitle);
    this.source = 'value-picks';
    
    // Log configuration (without sensitive data)
    console.log('Target Value Picks Service initialized:');
    console.log(`   Bot Name: ${process.env.VALUE_PICKS_BOT_NAME || 'Pntearnkaro'}`);
    console.log(`   Bot Username: ${process.env.VALUE_PICKS_BOT_USERNAME || 'pntearnkaro_bot'}`);
    console.log(`   Channel: ${process.env.VALUE_PICKS_CHANNEL_URL || 'https://t.me/pntearnkaro'}`);
    console.log(`   Channel Title: ${channelTitle}`);
    console.log(`   Bundle Processing: ${process.env.VALUE_PICKS_BUNDLE_PROCESSING || 'true'}`);
  }

  /**
   * Convert original URL to Value Picks affiliate URL (Implementation of abstract method)
   * Uses EarnKaro affiliate format with proper URL encoding
   */
  convertToAffiliateLink(originalUrl: string): string {
    try {
      // Clean the URL first
      const cleanUrl = this.cleanUrl(originalUrl);
      
      // Use the EarnKaro affiliate template from environment
      const template = process.env.VALUE_PICKS_AFFILIATE_TEMPLATE || 'https://ekaro.in/enkr2020/?url=%7B%7BURL_ENC%7D%7D&ref=4530348';
      
      // EarnKaro uses {{URL_ENC}} placeholder for encoded URLs
      let affiliateUrl = template;
      
      // Replace both possible placeholders
      if (template.includes('%7B%7BURL_ENC%7D%7D')) {
        // URL-encoded placeholder format
        affiliateUrl = template.replace('%7B%7BURL_ENC%7D%7D', encodeURIComponent(cleanUrl));
      } else if (template.includes('{{URL_ENC}}')) {
        // Direct placeholder format
        affiliateUrl = template.replace('{{URL_ENC}}', encodeURIComponent(cleanUrl));
      } else if (template.includes('{URL}')) {
        // Fallback to generic placeholder
        affiliateUrl = template.replace('{URL}', encodeURIComponent(cleanUrl));
      }
      
      console.log(`Link EarnKaro affiliate conversion:`);
      console.log(`   Original: ${cleanUrl}`);
      console.log(`   Affiliate: ${affiliateUrl}`);
      
      return affiliateUrl;
    } catch (error) {
      console.error('Error Error converting to EarnKaro affiliate URL:', error);
      return originalUrl;
    }
  }

  /**
   * Extract original URL from Value Picks affiliate URL
   */
  extractOriginalUrl(valuePicksUrl: string): string {
    try {
      const url = new URL(valuePicksUrl);
      return decodeURIComponent(url.searchParams.get('url') || valuePicksUrl);
    } catch (error) {
      return valuePicksUrl;
    }
  }

  /**
   * Check if URL is a Value Picks affiliate URL
   */
  isValuePicksUrl(url: string): boolean {
    return url.includes('valuepicks.com') || url.includes('value-picks');
  }

  /**
   * Clean and normalize URL
   */
  private cleanUrl(url: string): string {
    try {
      // Remove tracking parameters and normalize
      const urlObj = new URL(url);
      const cleanParams = new URLSearchParams();
      
      // Keep essential parameters, remove tracking
      urlObj.searchParams.forEach((value, key) => {
        if (!key.match(/^(utm_|fbclid|gclid|ref|tag)/)) {
          cleanParams.set(key, value);
        }
      });
      
      return `${urlObj.origin}${urlObj.pathname}${cleanParams.toString() ? '?' + cleanParams.toString() : ''}`;
    } catch (error) {
      return url;
    }
  }

  /**
   * Create product info from scraped data (Implementation of abstract method)
   */
  async createProductInfo(message: any, urlData: any, scrapedData: any, bundleInfo: any): Promise<any> {
    try {
      const messageId = message.message_id;
      const date = new Date(message.date * 1000);
      const originalUrl = urlData.url;
      
      console.log(`Products Creating Value Picks product info for: ${scrapedData?.title || 'Unknown Product'}`);
      
      // Convert original URL to Value Picks affiliate URL
      const affiliateUrl = this.convertToAffiliateLink(originalUrl);
      
      // Create comprehensive product info
      const productInfo = {
        id: `value_picks_${messageId}_${Date.now()}_${bundleInfo.productSequence || 1}`,
        name: scrapedData?.title || `Product from ${this.extractDomainFromUrl(originalUrl)}`,
        description: scrapedData?.description || `${scrapedData?.title || 'Product'}\n\nProduct sourced from ${this.extractDomainFromUrl(originalUrl)} via Value Picks affiliate network.`,
        price: scrapedData?.price || '999',
        originalPrice: scrapedData?.originalPrice || null,
        currency: this.extractCurrencyFromPrice(scrapedData?.price) || 'INR',
        imageUrl: scrapedData?.imageUrl || this.generateFallbackImage(originalUrl),
        affiliateUrl: affiliateUrl,
        originalUrl: originalUrl,
        category: scrapedData?.category || this.categorizeFromUrl(originalUrl),
        rating: scrapedData?.rating || '4.2',
        reviewCount: scrapedData?.reviewCount || 150,
        discount: this.calculateDiscount(scrapedData?.price, scrapedData?.originalPrice),
        isNew: this.checkIfNew(message.text || message.caption || '') || this.isRecentProduct(date),
        isFeatured: this.shouldBeFeatured(scrapedData),
        hasLimitedOffer: scrapedData?.hasLimitedOffer || false,
        limitedOfferText: scrapedData?.limitedOfferText || null,
        source: 'value-picks',
        sourceType: 'value_picks',
        networkBadge: 'Value Picks',
        affiliateNetwork: 'value-picks',
        telegramMessageId: messageId,
        telegramChannelId: message.chat?.id || this.channelId,
        createdAt: date.toISOString(),
        // Bundle fields
        messageGroupId: bundleInfo.messageGroupId,
        productSequence: bundleInfo.productSequence || 1,
        totalInGroup: bundleInfo.totalInGroup || 1,
        sourceMetadata: {
          telegramMessage: {
            messageId: message.message_id,
            channelId: message.chat?.id,
            channelTitle: message.chat?.title,
            date: message.date,
            forwardFrom: message.forward_from,
            forwardFromChat: message.forward_from_chat
          },
          scrapingData: {
            scrapedAt: new Date().toISOString(),
            domain: this.extractDomainFromUrl(originalUrl),
            scrapingSuccess: true,
            extractedData: {
              hasOriginalPrice: !!scrapedData?.originalPrice,
              hasRating: !!scrapedData?.rating,
              hasReviews: (scrapedData?.reviewCount || 0) > 0,
              hasDescription: !!scrapedData?.description,
              hasLimitedOffer: !!scrapedData?.hasLimitedOffer
            }
          },
          bundleInfo: {
            bundleType: bundleInfo.bundleType,
            additionalProducts: bundleInfo.additionalProducts
          }
        }
      };
      
      return productInfo;
    } catch (error) {
      console.error('Error Error creating Value Picks product info:', error);
      return null;
    }
  }

  /**
   * Create fallback product when scraping fails (Implementation of abstract method)
   */
  createFallbackProduct(message: any, urlData: any, bundleInfo: any = {}): any {
    const text = message.text || message.caption || '';
    const messageId = message.message_id;
    const date = new Date(message.date * 1000);
    const originalUrl = urlData.url;
    
    console.log(`Warning Creating fallback Value Picks product for: ${originalUrl}`);
    
    return {
      id: `value_picks_fallback_${messageId}_${Date.now()}_${bundleInfo.productSequence || 1}`,
      name: this.extractProductNameFromContext(urlData.context) || this.extractProductName(text),
      description: this.extractDescription(text),
      price: this.extractPriceFromContext(urlData.context) || this.extractPrice(text),
      originalPrice: this.extractOriginalPrice(text),
      currency: this.extractCurrency(text),
      imageUrl: this.extractImageUrl(message),
      affiliateUrl: this.convertToAffiliateLink(originalUrl),
      originalUrl: originalUrl,
      category: this.extractCategory(text),
      rating: this.extractRating(text),
      reviewCount: this.extractReviewCount(text),
      discount: this.extractDiscount(text),
      isNew: this.checkIfNew(text),
      isFeatured: false,
      hasLimitedOffer: false,
      limitedOfferText: null,
      source: 'value-picks',
      sourceType: 'value_picks',
      networkBadge: 'Value Picks',
      affiliateNetwork: 'value-picks',
      telegramMessageId: messageId,
      telegramChannelId: message.chat?.id || this.channelId,
      createdAt: date.toISOString(),
      // Bundle fields
      messageGroupId: bundleInfo.messageGroupId,
      productSequence: bundleInfo.productSequence || 1,
      totalInGroup: bundleInfo.totalInGroup || 1,
      sourceMetadata: {
        telegramMessage: {
          messageId: message.message_id,
          channelId: message.chat?.id,
          channelTitle: message.chat?.title || 'Value Picks',
          date: message.date
        },
        scrapingData: {
          scrapedAt: new Date().toISOString(),
          domain: this.extractDomainFromUrl(originalUrl),
          scrapingSuccess: false,
          fallbackUsed: true
        },
        bundleInfo: {
          bundleType: bundleInfo.bundleType,
          additionalProducts: bundleInfo.additionalProducts
        }
      }
    };
  }

  /**
   * Legacy method for backward compatibility - now uses hybrid processing
   */
  async extractProductInfo(message: any): Promise<any> {
    console.log(`Mobile [Value Picks] Legacy extractProductInfo called - using hybrid processing`);
    
    // Use new hybrid processing approach
    const products = await this.processMessage(message);
    
    // Return first product for backward compatibility
    return products.length > 0 ? products[0] : null;
  }

  /**
   * Save product to database (Implementation of abstract method)
   */
  async saveProduct(productInfo: any): Promise<void> {
    try {
      console.log(`Save Saving Value Picks product to database: ${productInfo.name}`);
      
      const currentTime = Math.floor(Date.now() / 1000);
      const expiresAt = currentTime + (24 * 60 * 60); // 24 hours - Amazon Associates cookie expiry
      
      const insertQuery = sqliteDb.prepare(`
        INSERT INTO value_picks_products (
          name, description, price, original_price, currency, image_url,
          affiliate_url, category, rating, review_count,
          discount, is_featured, affiliate_network,
          telegram_message_id, telegram_channel_id, telegram_channel_name,
          click_count, conversion_count, processing_status, expires_at,
          created_at, updated_at, display_pages, source_metadata, tags,
          has_limited_offer, limited_offer_text,
          message_group_id, product_sequence, total_in_group
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
      `);
      
      const result = insertQuery.run(
        productInfo.name,
        productInfo.description,
        productInfo.price,
        productInfo.originalPrice,
        productInfo.currency,
        productInfo.imageUrl,
        productInfo.affiliateUrl,
        productInfo.category,
        productInfo.rating,
        productInfo.reviewCount || 0,
        productInfo.discount,
        productInfo.isFeatured ? 1 : 0,
        productInfo.affiliateNetwork,
        productInfo.telegramMessageId,
        productInfo.telegramChannelId,
        productInfo.telegramChannelName || 'Value Picks',
        0, // click_count
        0, // conversion_count
        'active',
        expiresAt,
        currentTime,
        currentTime,
        'value-picks', // display_pages
        productInfo.sourceMetadata ? JSON.stringify(productInfo.sourceMetadata) : null,
        productInfo.tags ? JSON.stringify(productInfo.tags) : null,
        productInfo.hasLimitedOffer ? 1 : 0,
        productInfo.limitedOfferText || null,
        // Bundle fields
        productInfo.messageGroupId || null,
        productInfo.productSequence || 1,
        productInfo.totalInGroup || 1
      );
      
      console.log(`Success Successfully saved Value Picks product with ID: ${result.lastInsertRowid}`);
      
    } catch (error) {
      console.error('Error Error saving Value Picks product:', error);
      throw error;
    }
  }

  // Helper methods for extracting information from text
  private extractProductName(text: string): string {
    // Look for product names in various formats
    const patterns = [
      /(?:Product|Item|Deal):\s*([^\n]+)/i,
      /^([^\n]{10,80})/,
      /"([^"]+)"/,
      /([A-Z][^\n]{10,60})/
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim().substring(0, 100);
      }
    }

    return text.substring(0, 50).trim() || 'Value Picks Product';
  }

  private extractDescription(text: string): string {
    // Extract description from text
    const lines = text.split('\n').filter(line => line.trim().length > 10);
    return lines.slice(1, 3).join(' ').substring(0, 200) || 'Product from Value Picks';
  }

  private extractPrice(text: string): string {
    const pricePatterns = [
      /₹\s*([0-9,]+(?:\.[0-9]{2})?)/,
      /Rs\.?\s*([0-9,]+(?:\.[0-9]{2})?)/i,
      /INR\s*([0-9,]+(?:\.[0-9]{2})?)/i,
      /Price:\s*₹?\s*([0-9,]+(?:\.[0-9]{2})?)/i
    ];

    for (const pattern of pricePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].replace(/,/g, '');
      }
    }

    return '999';
  }

  private extractOriginalPrice(text: string): string | null {
    const originalPricePatterns = [
      /(?:was|originally|mrp)\s*₹?\s*([0-9,]+(?:\.[0-9]{2})?)/i,
      /₹\s*([0-9,]+)\s*(?:now|sale)/i
    ];

    for (const pattern of originalPricePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].replace(/,/g, '');
      }
    }
    return null;
  }

  private extractCurrency(text: string): string {
    if (text.includes('₹') || text.includes('INR') || text.includes('Rs')) return 'INR';
    if (text.includes('$') || text.includes('USD')) return 'USD';
    if (text.includes('€') || text.includes('EUR')) return 'EUR';
    if (text.includes('£') || text.includes('GBP')) return 'GBP';
    return 'INR';
  }

  private extractImageUrl(message: any): string {
    if (message.photo && message.photo.length > 0) {
      return `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${message.photo[message.photo.length - 1].file_path}`;
    }
    return 'https://via.placeholder.com/300x300?text=Value+Picks+Product';
  }

  private extractUrl(text: string): string {
    const urlPatterns = [
      /https?:\/\/[^\s]+/g,
      /www\.[^\s]+/g
    ];

    for (const pattern of urlPatterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        let url = matches[0];
        // Clean up the URL
        url = url.replace(/[.,;!?)]$/, '');
        if (!url.startsWith('http')) {
          url = 'https://' + url;
        }
        return url;
      }
    }

    return 'https://valuepicks.com';
  }

  private extractCategory(text: string): string {
    const categoryKeywords = {
      'Electronics & Gadgets': ['phone', 'laptop', 'tablet', 'headphone', 'speaker', 'camera', 'tv', 'electronics'],
      'Fashion & Clothing': ['shirt', 'dress', 'shoes', 'bag', 'watch', 'fashion', 'clothing', 'apparel'],
      'Home & Kitchen': ['kitchen', 'home', 'furniture', 'decor', 'appliance', 'cookware'],
      'Health & Beauty': ['beauty', 'skincare', 'makeup', 'health', 'fitness', 'supplement'],
      'Sports & Fitness': ['sports', 'fitness', 'gym', 'exercise', 'outdoor', 'athletic'],
      'Books & Media': ['book', 'ebook', 'music', 'movie', 'game', 'media']
    };

    const lowerText = text.toLowerCase();
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return category;
      }
    }

    return 'General';
  }

  private extractRating(text: string): string {
    const ratingMatch = text.match(/([0-9]\.[0-9])\s*(?:star|rating|★)/i);
    return ratingMatch ? ratingMatch[1] : '4.2';
  }

  private extractReviewCount(text: string): number {
    const reviewPatterns = [
      /([0-9,]+)\s*(?:review|rating|customer)/i,
      /([0-9,]+)\s*people/i,
      /([0-9,]+)\s*user/i
    ];

    for (const pattern of reviewPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return parseInt(match[1].replace(/,/g, ''));
      }
    }

    return Math.floor(Math.random() * 500) + 50; // Random between 50-550
  }

  private extractDiscount(text: string): number | null {
    const discountPatterns = [
      /([0-9]+)%\s*(?:off|discount|save)/i,
      /save\s*([0-9]+)%/i,
      /discount\s*([0-9]+)%/i
    ];

    for (const pattern of discountPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return parseInt(match[1]);
      }
    }

    return null;
  }

  private checkIfNew(text: string): boolean {
    const newKeywords = ['new', 'latest', 'fresh', 'just launched', 'recently added'];
    const lowerText = text.toLowerCase();
    return newKeywords.some(keyword => lowerText.includes(keyword));
  }

  private isRecentProduct(date: Date): boolean {
    const daysSinceCreation = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceCreation <= 7; // Consider products from last 7 days as new
  }

  private shouldBeFeatured(scrapedData: any): boolean {
    // Mark as featured if it has good ratings and reviews, or significant discount
    const rating = parseFloat(scrapedData.rating || '0');
    const reviewCount = scrapedData.reviewCount || 0;
    const hasOriginalPrice = !!scrapedData.originalPrice;
    const hasLimitedOffer = !!scrapedData.hasLimitedOffer;
    
    return (
      (rating >= 4.0 && reviewCount >= 100) || // High rated with many reviews
      (hasOriginalPrice && rating >= 3.5) || // Has discount and decent rating
      reviewCount >= 500 || // Very popular product
      hasLimitedOffer // Has limited time offer
    );
  }

  /**
   * Helper methods for enhanced product processing
   */
  private extractDomainFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch (error) {
      return 'unknown';
    }
  }

  private extractCurrencyFromPrice(price: string): string {
    if (!price) return 'INR';
    if (price.includes('₹') || price.toLowerCase().includes('inr')) return 'INR';
    if (price.includes('$') || price.toLowerCase().includes('usd')) return 'USD';
    if (price.includes('€') || price.toLowerCase().includes('eur')) return 'EUR';
    if (price.includes('£') || price.toLowerCase().includes('gbp')) return 'GBP';
    return 'INR';
  }

  private generateFallbackImage(url: string): string {
    const domain = this.extractDomainFromUrl(url);
    return `https://via.placeholder.com/300x300?text=${encodeURIComponent(domain)}`;
  }

  private categorizeFromUrl(url: string): string {
    const domain = this.extractDomainFromUrl(url).toLowerCase();
    
    if (domain.includes('amazon') || domain.includes('flipkart')) return 'Electronics & Gadgets';
    if (domain.includes('myntra') || domain.includes('ajio')) return 'Fashion & Clothing';
    if (domain.includes('nykaa') || domain.includes('beauty')) return 'Health & Beauty';
    if (domain.includes('book') || domain.includes('kindle')) return 'Books & Media';
    
    return 'General';
  }

  private calculateDiscount(currentPrice: string, originalPrice: string): number | null {
    if (!currentPrice || !originalPrice) return null;
    
    try {
      const current = parseFloat(currentPrice.replace(/[^0-9.]/g, ''));
      const original = parseFloat(originalPrice.replace(/[^0-9.]/g, ''));
      
      if (original > current && original > 0) {
        return Math.round(((original - current) / original) * 100);
      }
    } catch (error) {
      console.error('Error calculating discount:', error);
    }
    
    return null;
  }

  // Legacy createFallbackProductInfo method removed - now using createFallbackProduct from base class
}

export const valuePicksService = new ValuePicksService();