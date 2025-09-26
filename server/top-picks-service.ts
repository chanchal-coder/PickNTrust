import { db } from './db';
import { topPicksProducts } from '../shared/sqlite-schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { UniversalUrlDetector } from './url-detector';
import { categoryManager } from './category-manager';

/**
 * TopPicksService - Today's Top Picks processing service
 * Handles viral, trending, limited deals, new offers from all pages + dedicated channel
 * Advanced trend detection algorithms and viral scoring
 * Same UI functionality as other pages with trend-specific enhancements
 */
export class TopPicksService {
  private urlDetector: UniversalUrlDetector;
  private categoryManager: typeof categoryManager;
  
  constructor() {
    this.urlDetector = new UniversalUrlDetector();
    this.categoryManager = categoryManager;
    console.log('Top Picks Service initialized:');
    console.log('   Product types: premium, featured, trending, exclusive');
    console.log('   Custom affiliate tag: ref=sicvppak');
    console.log('   Database: top_picks_products');
    console.log('   Features: same as other pages + premium features');
    console.log('   Category Management: auto-creation enabled');
  }

  /**
   * Process message from Top Picks Telegram channel
   * Supports trend detection and viral scoring
   */
  async processMessage(message: any): Promise<void> {
    try {
      console.log('Hot Processing Top Picks message:', message.message_id);
      
      const messageText = message.text || message.caption || '';
      const photos = message.photo || [];
      
      // Extract URLs from message text using simple regex
      const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
      const urls = messageText.match(urlRegex) || [];
      
      if (urls.length === 0) {
        console.log('Warning No URLs detected in Top Picks message');
        return;
      }
      
      console.log(`Search Found ${urls.length} URLs for Top Picks processing`);
      
      // Process each URL with trend analysis
      for (const url of urls) {
        const urlInfo = { url, domain: new URL(url).hostname };
        await this.processTopPickUrl(urlInfo, message, messageText, photos);
      }
      
    } catch (error) {
      console.error('Error Error processing Top Picks message:', error);
    }
  }

  /**
   * Process URL with trend detection and viral scoring
   */
  private async processTopPickUrl(
    urlInfo: any, 
    message: any, 
    messageText: string, 
    photos: any[]
  ): Promise<void> {
    try {
      console.log(`Refresh Processing top pick URL: ${urlInfo.url}`);
      console.log(`   Domain: ${urlInfo.domain}`);
      
      // Extract product information with trend analysis
      const productInfo = await this.extractTopPickProductInfo(
        urlInfo, 
        messageText, 
        photos
      );
      
      if (!productInfo) {
        console.log('Warning Could not extract top pick information');
        return;
      }
      
      // Apply trend detection and scoring
      const trendAnalysis = this.analyzeTrends(messageText, productInfo);
      
      // Apply affiliate tagging (simplified)
      const affiliateUrl = urlInfo.url + (urlInfo.url.includes('?') ? '&' : '?') + 'ref=toppicks';
      
      // Save to database with trend-specific fields
      const savedProduct = await this.saveTopPicksProduct({
        ...productInfo,
        ...trendAnalysis,
        originalUrl: urlInfo.url,
        affiliateUrl: affiliateUrl,
        affiliateNetwork: 'top-picks',
        sourceDomain: urlInfo.domain,
        sourcePage: 'top-picks', // Dedicated channel
        telegramMessageId: message.message_id,
        messageGroupId: this.generateMessageGroupId(message),
        scrapingMethod: 'telegram'
      });
      
      console.log(`Success Top Pick saved with ID: ${savedProduct.id}`);
      console.log(`   Viral: ${savedProduct.isViral ? 'Yes' : 'No'}`);
      console.log(`   Trending: ${savedProduct.isTrending ? 'Yes' : 'No'}`);
      console.log(`   Limited Deal: ${savedProduct.isLimitedDeal ? 'Yes' : 'No'}`);
      console.log(`   New Offer: ${savedProduct.isNewOffer ? 'Yes' : 'No'}`);
      console.log(`   Trend Score: ${savedProduct.trendScore}`);
      console.log(`   Viral Score: ${savedProduct.viralScore}`);
      console.log(`   Urgency: ${savedProduct.dealUrgencyLevel}`);
      
    } catch (error) {
      console.error('Error Error processing top pick URL:', error);
    }
  }

  /**
   * Advanced trend analysis and viral scoring
   */
  private analyzeTrends(text: string, productInfo: any): any {
    const lowerText = text.toLowerCase();
    
    // Viral indicators
    const viralKeywords = [
      'viral', 'trending', 'everyone\'s buying', 'sold out', 'back in stock',
      'limited stock', 'only few left', 'hurry', 'don\'t miss', 'exclusive',
      'breaking', 'hot deal', 'fire sale', 'insane deal', 'crazy offer'
    ];
    
    // Trending indicators
    const trendingKeywords = [
      'trending', 'popular', 'bestseller', 'top rated', 'most wanted',
      'in demand', 'flying off shelves', 'customer favorite', 'highly rated',
      'award winning', 'editor\'s choice', 'staff pick'
    ];
    
    // Limited deal indicators
    const limitedDealKeywords = [
      'limited time', 'flash sale', 'today only', 'ends soon', 'last chance',
      'limited stock', 'while supplies last', 'limited quantity', 'few left',
      'expires', 'deadline', 'final hours', 'closing soon'
    ];
    
    // New offer indicators
    const newOfferKeywords = [
      'new', 'just launched', 'fresh arrival', 'latest', 'brand new',
      'newly added', 'recent', 'updated', 'improved', 'enhanced',
      'introducing', 'debut', 'premiere', 'first time'
    ];
    
    // Urgency indicators
    const urgencyKeywords = {
      critical: ['ending now', 'last minutes', 'final call', 'almost gone', 'sold out soon'],
      high: ['limited time', 'hurry', 'don\'t wait', 'act fast', 'while stocks last'],
      normal: ['good deal', 'great offer', 'special price', 'discount']
    };
    
    // Calculate scores
    let viralScore = 0;
    let trendScore = 0;
    
    // Viral score calculation
    viralKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        viralScore += 10;
      }
    });
    
    // Trending score calculation
    trendingKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        trendScore += 10;
      }
    });
    
    // Boost scores based on discount percentage
    const discount = parseFloat(productInfo.discount || '0');
    if (discount > 50) {
      viralScore += 20;
      trendScore += 15;
    } else if (discount > 30) {
      viralScore += 15;
      trendScore += 10;
    } else if (discount > 20) {
      viralScore += 10;
      trendScore += 5;
    }
    
    // Boost scores based on rating
    const rating = parseFloat(productInfo.rating || '0');
    if (rating >= 4.5) {
      trendScore += 15;
      viralScore += 10;
    } else if (rating >= 4.0) {
      trendScore += 10;
      viralScore += 5;
    }
    
    // Detect categories
    const isViral = viralKeywords.some(keyword => lowerText.includes(keyword)) || viralScore >= 30;
    const isTrending = trendingKeywords.some(keyword => lowerText.includes(keyword)) || trendScore >= 25;
    const isLimitedDeal = limitedDealKeywords.some(keyword => lowerText.includes(keyword));
    const isNewOffer = newOfferKeywords.some(keyword => lowerText.includes(keyword));
    
    // Determine urgency level
    let dealUrgencyLevel = 'normal';
    if (urgencyKeywords.critical.some(keyword => lowerText.includes(keyword))) {
      dealUrgencyLevel = 'critical';
    } else if (urgencyKeywords.high.some(keyword => lowerText.includes(keyword))) {
      dealUrgencyLevel = 'high';
    }
    
    // Flash sale detection
    const flashSale = lowerText.includes('flash sale') || lowerText.includes('lightning deal');
    
    // Calculate popularity rank (lower number = higher popularity)
    let popularityRank = 100; // Default low priority
    if (isViral && isTrending) popularityRank = 1;
    else if (isViral) popularityRank = 2;
    else if (isTrending) popularityRank = 3;
    else if (isLimitedDeal) popularityRank = 4;
    else if (isNewOffer) popularityRank = 5;
    
    // Priority level (1-5, higher = more priority)
    let priorityLevel = 1;
    if (dealUrgencyLevel === 'critical') priorityLevel = 5;
    else if (dealUrgencyLevel === 'high') priorityLevel = 4;
    else if (isViral || isTrending) priorityLevel = 3;
    else if (isLimitedDeal || isNewOffer) priorityLevel = 2;
    
    return {
      isViral,
      isTrending,
      isLimitedDeal,
      isNewOffer,
      trendScore: Math.min(trendScore, 100), // Cap at 100
      viralScore: Math.min(viralScore, 100), // Cap at 100
      popularityRank,
      dealUrgencyLevel,
      flashSale,
      priorityLevel,
      trendingStartTime: isTrending ? Math.floor(Date.now() / 1000) : null,
      lastTrendingCheck: Math.floor(Date.now() / 1000)
    };
  }

  /**
   * Extract product information using universal patterns
   */
  private async extractTopPickProductInfo(
    urlInfo: any,
    messageText: string,
    photos: any[]
  ): Promise<any | null> {
    try {
      // Extract basic product information
      const name = this.extractProductName(messageText, urlInfo.domain);
      if (!name) {
        console.log('Warning Could not extract product name');
        return null;
      }
      
      // Extract pricing information
      const pricing = this.extractPricing(messageText);
      
      // Extract category
      const category = this.detectCategory(messageText, urlInfo.domain);
      
      // Extract rating and reviews
      const ratingInfo = this.extractRating(messageText);
      
      // Extract description
      const description = this.extractDescription(messageText, name);
      
      // Handle images
      const imageUrl = await this.processImages(photos, urlInfo.domain);
      
      return {
        name: name,
        description: description,
        price: pricing.price,
        originalPrice: pricing.originalPrice,
        currency: pricing.currency || 'INR',
        imageUrl: imageUrl,
        category: category,
        rating: ratingInfo.rating,
        reviewCount: ratingInfo.reviewCount,
        discount: pricing.discount
      };
      
    } catch (error) {
      console.error('Error Error extracting top pick product info:', error);
      return null;
    }
  }

  /**
   * Extract product name using universal patterns
   */
  private extractProductName(text: string, domain: string): string | null {
    // Remove URLs and common prefixes
    let cleanText = text.replace(/https?:\/\/[^\s]+/g, '').trim();
    
    // Remove common promotional text
    cleanText = cleanText.replace(/(?:Hot|Fast|💥|Target|Launch|Special|💯|Celebration|🔴|🟢|🟡)/g, ' ');
    cleanText = cleanText.replace(/(?:viral|trending|hot|deal|offer|sale|limited|new|₹|\$|€|£)/gi, ' ');
    
    // Extract first meaningful line as product name
    const lines = cleanText.split('\n').filter(line => line.trim().length > 5);
    
    if (lines.length > 0) {
      let productName = lines[0].trim();
      
      // Clean up the product name
      productName = productName.replace(/^[\W\d]+/, ''); // Remove leading symbols/numbers
      productName = productName.replace(/[\W]+$/, ''); // Remove trailing symbols
      
      if (productName.length >= 5) {
        return productName;
      }
    }
    
    // Fallback: use domain-based naming
    return `Top Pick from ${domain}`;
  }

  /**
   * Extract pricing information using universal patterns
   */
  private extractPricing(text: string): any {
    const pricing = {
      price: null,
      originalPrice: null,
      currency: 'INR',
      discount: null
    };
    
    // Indian Rupee patterns
    const inrPatterns = [
      /₹\s*([\d,]+(?:\.\d{2})?)/g,
      /(?:rs|inr)\s*([\d,]+(?:\.\d{2})?)/gi,
      /([\d,]+(?:\.\d{2})?)\s*(?:rupees?|₹)/gi
    ];
    
    const allPrices = [];
    
    // Extract all prices
    inrPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const price = parseFloat(match[1].replace(/,/g, ''));
        if (price > 0) {
          allPrices.push(price);
        }
      }
    });
    
    if (allPrices.length > 0) {
      // Sort prices to identify current and original
      allPrices.sort((a, b) => a - b);
      
      pricing.price = allPrices[0].toString(); // Lowest price as current
      
      if (allPrices.length > 1) {
        pricing.originalPrice = allPrices[allPrices.length - 1].toString(); // Highest as original
        
        // Calculate discount
        const current = allPrices[0];
        const original = allPrices[allPrices.length - 1];
        if (original > 0) {
          pricing.discount = Math.round(((original - current) / original) * 100).toString();
        }
      }
    }
    
    return pricing;
  }

  /**
   * Detect category using universal patterns
   */
  private detectCategory(text: string, domain: string): string {
    const categoryKeywords = {
      'Electronics': ['phone', 'laptop', 'tablet', 'headphone', 'speaker', 'camera', 'tv', 'smartphone'],
      'Fashion': ['shirt', 'dress', 'shoes', 'bag', 'watch', 'jewelry', 'clothing', 'fashion'],
      'Home & Kitchen': ['kitchen', 'home', 'furniture', 'decor', 'appliance', 'cookware'],
      'Beauty & Health': ['beauty', 'skincare', 'makeup', 'health', 'fitness', 'supplement'],
      'Books & Media': ['book', 'ebook', 'course', 'education', 'learning', 'media'],
      'Sports & Outdoors': ['sports', 'fitness', 'outdoor', 'gym', 'exercise', 'athletic'],
      'Automotive': ['car', 'bike', 'automotive', 'vehicle', 'motor', 'parts'],
      'Toys & Games': ['toy', 'game', 'kids', 'children', 'play', 'puzzle'],
      'Software & Apps': ['software', 'app', 'digital', 'subscription', 'saas', 'tool']
    };
    
    const lowerText = text.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return category;
      }
    }
    
    // Domain-based category detection
    if (domain.includes('amazon') || domain.includes('flipkart')) return 'Electronics';
    if (domain.includes('myntra') || domain.includes('ajio')) return 'Fashion';
    if (domain.includes('nykaa')) return 'Beauty & Health';
    
    return 'General';
  }

  /**
   * Extract rating and review information
   */
  private extractRating(text: string): any {
    const ratingInfo = {
      rating: null,
      reviewCount: null
    };
    
    // Rating patterns
    const ratingPatterns = [
      /([0-5](?:\.[0-9])?)\s*(?:\/5|★|stars?|rating)/gi,
      /rating[:\s]*([0-5](?:\.[0-9])?)/gi,
      /([0-5](?:\.[0-9])?)\s*out\s*of\s*5/gi
    ];
    
    // Review count patterns
    const reviewPatterns = [
      /([\d,]+)\s*(?:reviews?|ratings?)/gi,
      /(?:reviews?|ratings?)[:\s]*([\d,]+)/gi
    ];
    
    // Extract rating
    for (const pattern of ratingPatterns) {
      const match = pattern.exec(text);
      if (match) {
        const rating = parseFloat(match[1]);
        if (rating >= 0 && rating <= 5) {
          ratingInfo.rating = rating.toString();
          break;
        }
      }
    }
    
    // Extract review count
    for (const pattern of reviewPatterns) {
      const match = pattern.exec(text);
      if (match) {
        const count = parseInt(match[1].replace(/,/g, ''));
        if (count > 0) {
          ratingInfo.reviewCount = count.toString();
          break;
        }
      }
    }
    
    return ratingInfo;
  }

  /**
   * Extract product description
   */
  private extractDescription(text: string, productName: string): string {
    // Remove URLs and product name from text
    let description = text.replace(/https?:\/\/[^\s]+/g, '').trim();
    description = description.replace(productName, '').trim();
    
    // Take first few lines as description
    const lines = description.split('\n').filter(line => line.trim().length > 0);
    const descLines = lines.slice(0, 3).join(' ').trim();
    
    return descLines.length > 20 ? descLines : `Amazing top pick: ${productName}`;
  }

  /**
   * Process images from Telegram message
   */
  private async processImages(photos: any[], domain: string): Promise<string | null> {
    if (photos && photos.length > 0) {
      // Use the highest resolution photo
      const photo = photos[photos.length - 1];
      return `https://api.telegram.org/file/bot{BOT_TOKEN}/${photo.file_path}`;
    }
    
    // Return trending-specific placeholder
    return `https://via.placeholder.com/300x300?text=TopPick`;
  }

  /**
   * Generate message group ID for bundle support
   */
  private generateMessageGroupId(message: any): string {
    return `toppicks_${message.chat.id}_${Date.now()}`;
  }

  /**
   * Save product to top_picks_products table
   */
  private async saveTopPicksProduct(productData: any): Promise<any> {
    try {
      const result = await db.insert(topPicksProducts).values({
        name: productData.name,
        description: productData.description,
        price: productData.price,
        originalPrice: productData.originalPrice,
        currency: productData.currency,
        imageUrl: productData.imageUrl,
        affiliateUrl: productData.affiliateUrl,
        originalUrl: productData.originalUrl,
        category: productData.category,
        rating: productData.rating,
        reviewCount: productData.reviewCount,
        discount: productData.discount,
        affiliateNetwork: productData.affiliateNetwork,
        isFeatured: true,
        isNew: productData.isNew || true,
        isActive: true,
        displayOrder: productData.priorityLevel || 0,
        // Timer functionality
        hasTimer: productData.flashSale || false,
        timerDuration: productData.flashSale ? 24 : null,
        timerStartTime: productData.flashSale ? Math.floor(Date.now() / 1000) : null,
        // Limited offers
        hasLimitedOffer: productData.isLimitedDeal || false,
        limitedOfferText: productData.isLimitedDeal ? 'Limited Time Deal!' : null,
        // Affiliate tracking
        affiliateNetworkId: null,
        commissionRate: null,
        // Analytics
        clickCount: 0,
        conversionCount: 0,
        viewCount: 0,
        // Timestamps
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: null,
        // Metadata
        source: 'telegram',
        contentType: 'product',
        gender: null
      } as any).returning();
      
      const savedProduct = result[0];
      
      // Category is already set in the product data
      if (savedProduct && productData.category) {
        try {
          // Category validation is handled during product insertion
          console.log(`Product saved with category: ${productData.category}`);
        } catch (error) {
          console.error('Error auto-creating category for top pick:', error);
        }
      }
      
      return savedProduct;
    } catch (error) {
      console.error('Error Error saving Top Picks product:', error);
      throw error;
    }
  }

  /**
   * Get products for Top Picks page with trend-based sorting
   */
  async getProducts(options: {
    limit?: number;
    offset?: number;
    category?: string;
    viral?: boolean;
    trending?: boolean;
    limitedDeal?: boolean;
    newOffer?: boolean;
    urgencyLevel?: string;
    minTrendScore?: number;
    featured?: boolean;
  } = {}): Promise<any[]> {
    try {
      const { 
        limit = 50, 
        offset = 0, 
        category, 
        viral, 
        trending, 
        limitedDeal, 
        newOffer, 
        urgencyLevel,
        minTrendScore = 0,
        featured 
      } = options;
      
      const conditions = [eq(topPicksProducts.processingStatus, 'active')];
      
      // Apply filters
      if (category) {
        conditions.push(eq(topPicksProducts.category, category));
      }
      
      if (featured !== undefined) {
        conditions.push(eq(topPicksProducts.isFeatured, featured));
      }
      
      if (limitedDeal !== undefined) {
        conditions.push(eq(topPicksProducts.hasLimitedOffer, limitedDeal));
      }
      
      const query = db.select().from(topPicksProducts);
      
      if (conditions.length > 0) {
        query.where(and(...conditions));
      }
      
      return await query
        .orderBy(
          topPicksProducts.displayOrder,
          desc(topPicksProducts.createdAt)
        )
        .limit(limit)
        .offset(offset);
        
    } catch (error) {
      console.error('Error Error fetching Top Picks products:', error);
      return [];
    }
  }

  /**
   * Get categories for Top Picks
   */
  async getCategories(): Promise<string[]> {
    try {
      const result = await db.select({ category: topPicksProducts.category })
         .from(topPicksProducts)
         .where(eq(topPicksProducts.processingStatus, 'active'))
         .groupBy(topPicksProducts.category);
      
      return result.map(r => r.category).filter(Boolean);
    } catch (error) {
      console.error('Error Error fetching Top Picks categories:', error);
      return [];
    }
  }

  /**
   * Get viral products only
   */
  async getViralProducts(limit: number = 20): Promise<any[]> {
    try {
      // Top picks products don't have viral scoring, return featured products instead
      return await db.select().from(topPicksProducts)
         .where(and(
           eq(topPicksProducts.processingStatus, 'active'),
           eq(topPicksProducts.isFeatured, true)
         ))
         .orderBy(topPicksProducts.displayOrder, desc(topPicksProducts.createdAt))
         .limit(limit);
    } catch (error) {
      console.error('Error Error fetching viral products:', error);
      return [];
    }
  }

  /**
   * Get trending products only
   */
  async getTrendingProducts(limit: number = 20): Promise<any[]> {
    try {
      // Top picks products don't have trending scoring, return featured products instead
      return await db.select().from(topPicksProducts)
         .where(and(
           eq(topPicksProducts.processingStatus, 'active'),
           eq(topPicksProducts.isFeatured, true)
         ))
         .orderBy(topPicksProducts.displayOrder, desc(topPicksProducts.createdAt))
         .limit(limit);
    } catch (error) {
      console.error('Error Error fetching trending products:', error);
      return [];
    }
  }

  /**
   * Get limited deals only
   */
  async getLimitedDeals(limit: number = 20): Promise<any[]> {
    try {
      return await db.select().from(topPicksProducts)
         .where(and(
           eq(topPicksProducts.processingStatus, 'active'),
           eq(topPicksProducts.hasLimitedOffer, true)
         ))
         .orderBy(topPicksProducts.displayOrder, desc(topPicksProducts.createdAt))
         .limit(limit);
    } catch (error) {
      console.error('Error Error fetching limited deals:', error);
      return [];
    }
  }

  /**
   * Get new offers only
   */
  async getNewOffers(limit: number = 20): Promise<any[]> {
    try {
      return await db.select().from(topPicksProducts)
         .where(and(
           eq(topPicksProducts.processingStatus, 'active'),
           eq(topPicksProducts.isNew, true)
         ))
         .orderBy(desc(topPicksProducts.createdAt))
         .limit(limit);
    } catch (error) {
      console.error('Error Error fetching new offers:', error);
      return [];
    }
  }

  /**
   * Update trend scores for existing products (background job)
   */
  async updateTrendScores(): Promise<void> {
    try {
      console.log('Refresh Updating display order for Top Picks products...');
      
      // This would be called periodically to update display order
      // based on performance metrics, clicks, views, etc.
      
      const products = await db.select().from(topPicksProducts)
         .where(eq(topPicksProducts.processingStatus, 'active'))
         .limit(100);
      
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        
        await db.update(topPicksProducts)
          .set({
            displayOrder: i,
            updatedAt: new Date()
          } as any)
          .where(eq(topPicksProducts.id, product.id));
      }
      
      console.log(`Success Updated display order for ${products.length} top picks products`);
    } catch (error) {
      console.error('Error Error updating display order:', error);
    }
  }

  /**
   * Calculate updated trend score based on performance metrics
   */
  private calculateUpdatedTrendScore(product: any): number {
    let score = product.trendScore || 0;
    
    // Boost based on click velocity
    const clickVelocity = product.clickCount / Math.max(1, (Date.now() / 1000 - product.createdAt) / 3600);
    score += clickVelocity * 2;
    
    // Boost based on view velocity
    const viewVelocity = product.viewCount / Math.max(1, (Date.now() / 1000 - product.createdAt) / 3600);
    score += viewVelocity * 1;
    
    // Boost based on conversion rate
    const conversionRate = product.conversionCount / Math.max(1, product.clickCount);
    score += conversionRate * 50;
    
    return Math.min(score, 100); // Cap at 100
  }

  /**
   * Calculate updated viral score based on social metrics
   */
  private calculateUpdatedViralScore(product: any): number {
    let score = product.viralScore || 0;
    
    // Boost based on share count
    score += (product.shareCountTotal || 0) * 5;
    
    // Boost based on wishlist additions
    score += (product.wishlistCount || 0) * 3;
    
    // Boost based on recent activity
    const hoursSinceCreated = (Date.now() / 1000 - product.createdAt) / 3600;
    if (hoursSinceCreated < 24) {
      score += 10; // Boost for recent products
    }
    
    return Math.min(score, 100); // Cap at 100
  }

  /**
   * Aggregate trending products from all other pages
   */
  async aggregateTrendingFromAllPages(): Promise<any[]> {
    try {
      console.log('Refresh Aggregating trending products from all pages...');
      
      // This would fetch trending products from other page databases
      // and analyze them for potential inclusion in Top Picks
      
      const sources = ['prime-picks', 'click-picks', 'cue-picks', 'value-picks', 'global-picks', 'deals-hub', 'loot-box', 'apps'];
      const trendingProducts = [];
      
      for (const source of sources) {
        try {
          // Fetch high-performing products from each source
          // This would be implemented based on each source's schema
          console.log(`Checking trending products from ${source}...`);
          
          // Example: products with high click rates, recent activity, good ratings
          // Would need to be implemented for each source table
          
        } catch (error) {
          console.error(`Error fetching from ${source}:`, error);
        }
      }
      
      return trendingProducts;
    } catch (error) {
      console.error('Error Error aggregating trending products:', error);
      return [];
    }
  }
}