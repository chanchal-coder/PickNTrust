import { db } from './db';
import { products } from '../shared/sqlite-schema';
import { eq } from 'drizzle-orm';
import { config } from 'dotenv';
import { sqliteDb } from './db';
import { cueLinksWebScraper } from './cuelinks-scraper';
import { UniversalUrlDetector } from './url-detector';
import { universalScraper } from './universal-scraper';

// Load CueLinks environment variables
config({ path: '.env.cuelinks' });
interface CueLinksProductInfo {
  id: string;
  name: string;
  description: string;
  price: string;
  originalPrice?: string;
  currency: string;
  imageUrl: string;
  affiliateUrl: string;
  cuelinksUrl?: string;
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
}

export class CueLinksService {
  private affiliateTemplate: string;
  private cid: string;
  private source: string;
  private channelId: number;
  private channelTitle: string;

  constructor() {
    this.affiliateTemplate = process.env.CUELINKS_AFFILIATE_URL || 'https://linksredirect.com/?cid=243942&source=linkkit&url={{URL_ENC}}';
    this.cid = process.env.CUELINKS_CID || '243942';
    this.source = process.env.CUELINKS_SOURCE || 'linkkit';
    this.channelId = parseInt(process.env.CUE_PICKS_CHANNEL_ID || '-1003064466091');
    this.channelTitle = process.env.CUE_PICKS_CHANNEL_TITLE || 'PNT Cuelinks';
  }

  /**
   * Convert original URL to CueLinks affiliate URL
   */
  convertToAffiliateLink(originalUrl: string): string {
    try {
      // Clean and validate URL
      const cleanUrl = this.cleanUrl(originalUrl);
      
      // URL encode the original URL
      const encodedUrl = encodeURIComponent(cleanUrl);
      
      // Replace placeholder with encoded URL
      const affiliateUrl = this.affiliateTemplate.replace('{{URL_ENC}}', encodedUrl);
      
      console.log(`Link CueLinks conversion: ${cleanUrl} → ${affiliateUrl}`);
      return affiliateUrl;
    } catch (error) {
      console.error('Error Error converting URL to CueLinks:', error);
      return originalUrl; // Return original URL as fallback
    }
  }

  /**
   * Extract original URL from CueLinks URL
   */
  extractOriginalUrl(cuelinksUrl: string): string {
    try {
      const urlMatch = cuelinksUrl.match(/url=([^&]+)/);
      return urlMatch ? decodeURIComponent(urlMatch[1]) : cuelinksUrl;
    } catch (error) {
      console.error('Error Error extracting original URL:', error);
      return cuelinksUrl;
    }
  }

  /**
   * Check if URL is already a CueLinks URL
   */
  isCueLinksUrl(url: string): boolean {
    return url.includes('linksredirect.com') && url.includes(`cid=${this.cid}`);
  }

  /**
   * Clean and validate URL
   */
  private cleanUrl(url: string): string {
    // Remove extra spaces and normalize
    let cleanUrl = url.trim();
    
    // Add https:// if no protocol
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }
    
    return cleanUrl;
  }

  /**
   * Extract product information from Telegram message using web scraping
   */
  async extractProductInfo(message: any): Promise<any> {
    try {
      const text = message.text || message.caption || '';
      const messageId = message.message_id;
      const date = new Date(message.date * 1000);

      console.log(`Mobile Processing CueLinks message ${messageId}: ${text.substring(0, 100)}...`);

      // Use universal URL detector to find any e-commerce URL
      const detectedUrl = await UniversalUrlDetector.detectAnyUrl(text);
      if (!detectedUrl) {
        console.log('Error No valid e-commerce URL found in message');
        return null;
      }

      console.log(`Link Detected ${detectedUrl.platform} URL (${detectedUrl.type}): ${detectedUrl.url}`);
      const originalUrl = detectedUrl.url;

            // Use bulletproof universal scraper - BUSINESS CRITICAL
      console.log(`Launch ENTERPRISE SCRAPING: Using universal scraper for business-critical affiliate link`);
      const scrapedData = await universalScraper.scrapeProduct(originalUrl);
      
      if (!scrapedData || !scrapedData.title || scrapedData.title === 'Unknown Product' || scrapedData.title === 'Failed to scrape product') {
        console.log('Warning Universal scraper returned insufficient data, using enhanced fallback');
        return this.createFallbackProductInfo(message, originalUrl);
      }

      console.log(`Success UNIVERSAL SCRAPER SUCCESS - Business protected!`);
      console.log(`   Title: ${scrapedData.title}`);
      console.log(`   Price: ${scrapedData.price}`);
      console.log(`   Original Price: ${scrapedData.originalPrice ? scrapedData.originalPrice : 'None'}`);
      console.log(`   Rating: ${scrapedData.rating || 'N/A'}`);
      console.log(`   Image: ${scrapedData.imageUrl?.substring(0, 50)}...`);
      console.log(`   Discount: ${scrapedData.discount ? scrapedData.discount + '%' : 'None'}`);

      // Convert original URL to CueLinks affiliate URL
      const affiliateUrl = this.convertToAffiliateLink(originalUrl);
      console.log(`Link Generated CueLinks affiliate URL: ${affiliateUrl.substring(0, 80)}...`);

      // Create comprehensive product info with enhanced scraped data
      const productInfo = {
        id: `cuelinks_${messageId}_${Date.now()}`,
        name: scrapedData.title || `Product from ${this.extractDomainFromUrl(originalUrl)}`,
        description: scrapedData.description || `${scrapedData.title}\n\nProduct sourced from ${this.extractDomainFromUrl(originalUrl)} via CueLinks affiliate network.`,
        price: scrapedData.price || '999',
        originalPrice: scrapedData.originalPrice || null,
        currency: this.extractCurrencyFromPrice(scrapedData.price) || 'INR',
        imageUrl: scrapedData.imageUrl || this.generateFallbackImage(originalUrl),
        affiliateUrl: affiliateUrl,
        cuelinksUrl: affiliateUrl,
        originalUrl: originalUrl,
        category: scrapedData.category || this.categorizeFromUrl(originalUrl),
        rating: scrapedData.rating || '4.2',
        reviewCount: scrapedData.reviewCount || 150,
        discount: this.calculateDiscount(scrapedData.price, scrapedData.originalPrice),
        isNew: this.checkIfNew(text) || this.isRecentProduct(date),
        isFeatured: this.shouldBeFeatured(scrapedData),
        hasLimitedOffer: scrapedData.hasLimitedOffer || false,
        source: 'cuelinks',
        sourceType: 'cue_picks',
        networkBadge: 'Cue Picks',
        affiliateNetwork: 'cuelinks',
        telegramMessageId: messageId,
        telegramChannelId: message.chat?.id || this.channelId,
        createdAt: date.toISOString(),
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
              hasOriginalPrice: !!scrapedData.originalPrice,
              hasRating: !!scrapedData.rating,
              hasReviews: (scrapedData.reviewCount || 0) > 0,
              hasDescription: !!scrapedData.description
            }
          }
        }
      };

      return productInfo;
    } catch (error) {
      console.error('Error Error extracting product info:', error);
      // Return fallback data instead of throwing
      const text = message.text || message.caption || '';
      const originalUrl = this.extractUrl(text);
      return this.createFallbackProductInfo(message, originalUrl);
    }
  }

  /**
   * Save product to database
   */
  async saveProduct(productInfo: any): Promise<void> {
    try {
      // Check if product already exists in unified_content table
      const existingProduct = sqliteDb.prepare(`
        SELECT id FROM unified_content 
        WHERE source_id = ? AND title = ?
      `).get(productInfo.telegramMessageId, productInfo.name);

      if (existingProduct) {
        console.log(`Warning CueLinks product already exists, skipping: ${productInfo.name}`);
        return;
      }

      // Insert new product into unified_content table
      const insertProduct = sqliteDb.prepare(`
        INSERT INTO unified_content (
          title, description, price, original_price, currency,
          image_url, affiliate_url, content_type, page_type,
          category, subcategory, source_type, source_id,
          affiliate_platform, rating, review_count, discount,
          is_active, is_featured, display_order, display_pages,
          has_timer, timer_duration, timer_start_time,
          created_at, updated_at, processing_status, content,
          source_platform, affiliate_urls, status, visibility,
          media_urls
        ) VALUES (
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?
        )
      `);

      const now = Date.now();
      const displayPages = 'cue-picks,all-products';
      
      insertProduct.run(
        productInfo.name,
        productInfo.description,
        productInfo.price,
        productInfo.originalPrice,
        productInfo.currency,
        productInfo.imageUrl,
        productInfo.affiliateUrl,
        'product',
        'cue-picks',
        productInfo.category,
        null, // subcategory
        'telegram',
        productInfo.telegramMessageId.toString(),
        'cuelinks',
        productInfo.rating,
        productInfo.reviewCount,
        productInfo.discount,
        1, // is_active
        productInfo.isFeatured ? 1 : 0,
        0, // display_order
        displayPages,
        productInfo.hasLimitedOffer ? 1 : 0,
        null, // timer_duration
        null, // timer_start_time
        now,
        now,
        'active',
        JSON.stringify({
          originalUrl: productInfo.originalUrl,
          cuelinksUrl: productInfo.cuelinksUrl,
          sourceMetadata: productInfo.sourceMetadata,
          networkBadge: productInfo.networkBadge,
          limitedOfferText: productInfo.limitedOfferText
        }),
        'telegram',
        JSON.stringify([productInfo.affiliateUrl]),
        'active',
        'public',
        JSON.stringify([productInfo.imageUrl])
      );

      console.log(`Success CueLinks product saved to unified_content: ${productInfo.name}`);
    } catch (error) {
      console.error('Error Error saving CueLinks product:', error);
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

    return text.substring(0, 50).trim() || 'CueLinks Product';
  }

  private extractDescription(text: string): string {
    // Extract description from text
    const lines = text.split('\n').filter(line => line.trim().length > 10);
    return lines.slice(1, 3).join(' ').substring(0, 200) || 'Product from CueLinks';
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
      /(?:was|originally|mrp)\s*₹\s*([0-9,]+(?:\.[0-9]{2})?)/i,
      /₹\s*([0-9,]+)\s*₹\s*([0-9,]+)/
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
    if (text.includes('₹') || text.includes('Rs') || text.includes('INR')) {
      return 'INR';
    }
    if (text.includes('$') || text.includes('USD')) {
      return 'USD';
    }
    if (text.includes('€') || text.includes('EUR')) {
      return 'EUR';
    }
    return 'INR'; // Default to INR
  }

  private extractImageUrl(message: any): string {
    // Extract image URL from message
    if (message.photo && message.photo.length > 0) {
      // Use the largest photo
      const photo = message.photo[message.photo.length - 1];
      return `https://api.telegram.org/file/bot${process.env.CUE_PICKS_BOT_TOKEN}/${photo.file_path}`;
    }
    
    // Default placeholder image
    return 'https://via.placeholder.com/300x300?text=CueLinks+Product';
  }

  private extractUrl(text: string): string {
    const urlPatterns = [
      // Direct HTTP/HTTPS URLs
      /https?:\/\/[^\s]+/g,
      
      // Major e-commerce platforms
      /(?:amazon|flipkart|myntra|ajio|nykaa|meesho|snapdeal|paytmmall|shopclues|tatacliq)\.(?:in|com)\/[^\s]+/gi,
      
      // Grocery & Food delivery
      /(?:bigbasket|grofers|blinkit|zepto|dunzo|swiggy|zomato)\.(?:in|com)\/[^\s]+/gi,
      
      // Travel & Entertainment
      /(?:bookmyshow|makemytrip|goibibo|cleartrip|yatra|ixigo|redbus)\.(?:in|com)\/[^\s]+/gi,
      
      // Fashion & Lifestyle
      /(?:jabong|koovs|limeroad|craftsvilla|westside|pantaloons|lifestyle|shoppersstop|fabindia)\.(?:in|com)\/[^\s]+/gi,
      
      // Kids & Baby
      /(?:firstcry|hopscotch|babyoye)\.(?:in|com)\/[^\s]+/gi,
      
      // Home & Furniture
      /(?:pepperfry|urbanladder|hometown|godrej|nilkamal)\.(?:in|com)\/[^\s]+/gi,
      
      // Electronics & Tech
      /(?:reliancedigital|croma|vijaysales|poorvika|sangeetha|ezone)\.(?:in|com)\/[^\s]+/gi,
      
      // Brand websites
      /(?:lenovo|dell|hp|apple|samsung|oneplus|mi|realme|vivo|oppo|boat|noise|fastrack|titan|tanishq|caratlane|bluestone)\.(?:in|com)\/[^\s]+/gi,
      
      // Generic domain patterns for any e-commerce site
      /(?:[a-zA-Z0-9-]+)\.(?:in|com|org|net)\/(?:product|item|p|dp|buy|shop)[^\s]*/gi
    ];

    for (const pattern of urlPatterns) {
      const matches = text.match(pattern);
      if (matches && matches[0]) {
        // Clean up the URL
        let url = matches[0].trim();
        // Remove trailing punctuation
        url = url.replace(/[.,;!?]+$/, '');
        return url;
      }
    }

    return 'https://example.com';
  }

  private extractCategory(text: string): string {
    const categoryKeywords = {
      'Electronics': ['phone', 'laptop', 'tablet', 'headphone', 'speaker', 'camera', 'tv', 'mobile'],
      'Fashion': ['shirt', 'dress', 'shoes', 'bag', 'watch', 'clothing', 'fashion', 'style'],
      'Home & Garden': ['home', 'kitchen', 'furniture', 'decor', 'garden', 'appliance'],
      'Health & Beauty': ['beauty', 'skincare', 'makeup', 'health', 'fitness', 'wellness'],
      'Sports & Fitness': ['sports', 'fitness', 'gym', 'exercise', 'outdoor', 'running'],
      'Books & Media': ['book', 'ebook', 'magazine', 'media', 'education', 'learning']
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
    const ratingPattern = /([0-9](?:\.[0-9])?)\s*(?:\/5|stars?|★)/i;
    const match = text.match(ratingPattern);
    return match ? match[1] : '4.0';
  }

  private extractReviewCount(text: string): number {
    const reviewPatterns = [
      /([0-9,]+)\s*reviews?/i,
      /([0-9,]+)\s*ratings?/i
    ];

    for (const pattern of reviewPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return parseInt(match[1].replace(/,/g, '')) || 0;
      }
    }

    return Math.floor(Math.random() * 1000) + 100; // Random review count
  }

  private extractDiscount(text: string): number | null {
    const discountPatterns = [
      /([0-9]+)%\s*off/i,
      /discount\s*([0-9]+)%/i,
      /save\s*([0-9]+)%/i
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
    const newIndicators = [
      /new/i,
      /latest/i,
      /fresh/i,
      /just\s+launched/i,
      /newly\s+launched/i,
      /brand\s+new/i
    ];

    return newIndicators.some(pattern => pattern.test(text));
  }

  private isRecentProduct(date: Date): boolean {
    const now = new Date();
    const hoursDiff = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    return hoursDiff <= 24; // Consider products from last 24 hours as "new"
  }

  private shouldBeFeatured(scrapedData: any): boolean {
    // Mark as featured if it has good ratings and reviews, or significant discount
    const rating = parseFloat(scrapedData.rating || '0');
    const reviewCount = scrapedData.reviewCount || 0;
    const hasOriginalPrice = !!scrapedData.originalPrice;
    
    return (
      (rating >= 4.0 && reviewCount >= 100) || // High rated with many reviews
      (hasOriginalPrice && rating >= 3.5) || // Has discount and decent rating
      reviewCount >= 500 // Very popular product
    );
  }

  /**
   * Helper methods for enhanced product processing
   */
  private extractDomainFromUrl(url: string): string {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return domain.charAt(0).toUpperCase() + domain.slice(1);
    } catch (error) {
      return 'Unknown Site';
    }
  }

  private extractCurrencyFromPrice(price: string): string {
    if (!price) return 'INR';
    if (price.includes('₹') || price.includes('Rs')) return 'INR';
    if (price.includes('$')) return 'USD';
    if (price.includes('€')) return 'EUR';
    if (price.includes('£')) return 'GBP';
    return 'INR'; // Default to INR
  }

  private generateFallbackImage(url: string): string {
    const domain = this.extractDomainFromUrl(url);
    return `https://via.placeholder.com/400x400?text=${encodeURIComponent(domain)}`;
  }

  private categorizeFromUrl(url: string): string {
    const domain = url.toLowerCase();
    
    if (domain.includes('amazon') || domain.includes('flipkart')) {
      return 'Electronics & Gadgets';
    } else if (domain.includes('myntra') || domain.includes('ajio') || domain.includes('westside')) {
      return 'Fashion & Lifestyle';
    } else if (domain.includes('nykaa') || domain.includes('beauty')) {
      return 'Beauty & Personal Care';
    } else if (domain.includes('bigbasket') || domain.includes('grofers')) {
      return 'Grocery & Food';
    } else if (domain.includes('pepperfry') || domain.includes('urbanladder')) {
      return 'Home & Furniture';
    } else if (domain.includes('firstcry') || domain.includes('hopscotch')) {
      return 'Kids & Baby';
    } else {
      return 'General';
    }
  }

  private calculateDiscount(currentPrice: string, originalPrice: string): number | null {
    if (!currentPrice || !originalPrice) return null;
    
    try {
      const current = parseFloat(currentPrice.replace(/[^\d.]/g, ''));
      const original = parseFloat(originalPrice.replace(/[^\d.]/g, ''));
      
      if (current && original && original > current) {
        return Math.round(((original - current) / original) * 100);
      }
    } catch (error) {
      console.error('Error calculating discount:', error);
    }
    
    return null;
  }

  private createFallbackProductInfo(message: any, originalUrl: string): any {
    const messageId = message.message_id;
    const date = new Date(message.date * 1000);
    const text = message.text || message.caption || '';
    const domain = this.extractDomainFromUrl(originalUrl || 'https://example.com');
    
    console.log(`Refresh Creating fallback product info for ${domain}`);
    
    // Try to extract a better product name from the message text
    let productName = this.extractProductName(text);
    
    // If extracted name is still a URL or too generic, create a better fallback
    if (!productName || productName.includes('http') || productName.includes('.com') || productName.length < 5) {
      // Try to get product name from URL path or create a descriptive name
      if (originalUrl && originalUrl.includes('/dp/')) {
        // Amazon product - extract product ID
        const productId = originalUrl.match(/\/dp\/([A-Z0-9]+)/);
        productName = productId ? `Amazon Product ${productId[1]}` : `${domain} Product`;
      } else {
        productName = `${domain} Product Deal`;
      }
    }
    
    return {
      id: `cuelinks_${messageId}_${Date.now()}`,
      name: productName,
      description: `Product shared from ${domain}. ${text.length > 20 ? text.substring(0, 100) + '...' : text}\n\nClick to view details on the original site.`,
      price: this.extractPrice(text) || '999',
      originalPrice: this.extractOriginalPrice(text),
      currency: this.extractCurrency(text) || 'INR',
      imageUrl: this.generateFallbackImage(originalUrl || 'https://example.com'),
      affiliateUrl: originalUrl ? this.convertToAffiliateLink(originalUrl) : originalUrl,
      cuelinksUrl: originalUrl ? this.convertToAffiliateLink(originalUrl) : originalUrl,
      originalUrl: originalUrl || 'https://example.com',
      category: this.extractCategory(text) || this.categorizeFromUrl(originalUrl || ''),
      rating: this.extractRating(text) || '4.0',
      reviewCount: this.extractReviewCount(text) || 0,
      discount: this.extractDiscount(text),
      isNew: this.checkIfNew(text),
      isFeatured: false,
      source: 'cuelinks',
      sourceType: 'cue_picks',
      networkBadge: 'Cue Picks',
      affiliateNetwork: 'cuelinks',
      telegramMessageId: messageId,
      telegramChannelId: message.chat?.id || this.channelId,
      createdAt: date.toISOString(),
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
          domain: domain,
          scrapingSuccess: false,
          fallbackReason: 'Web scraping failed - using text extraction fallback'
        }
      }
    };
  }
}

export const cueLinksService = new CueLinksService();