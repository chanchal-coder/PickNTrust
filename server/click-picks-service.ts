/**
 * Click Picks Service
 * Handles Click Picks product management and processing
 * Similar to Prime Picks and Cue Picks services
 */

import { sqliteDb } from './db.js';

export interface ClickPicksProduct {
  id?: number;
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
  isFeatured?: boolean;
  isNew?: boolean;
  affiliateNetwork?: string;
  telegramMessageId?: number;
  processingStatus?: string;
  sourceMetadata?: string;
  createdAt?: number;
  messageGroupId?: string;
  productSequence?: number;
  totalInGroup?: number;
  hasLimitedOffer?: boolean;
  limitedOfferText?: string;
  offerExpiresAt?: number;
}

export class ClickPicksService {
  private db = sqliteDb;

  /**
   * Process message from Telegram bot manager
   * This is the main entry point called by the bot system
   */
  async processMessage(message: any): Promise<any[]> {
    try {
      console.log(`Mobile [Click Picks] Processing message ${message.id}`);
      console.log(`   Text: ${message.text?.substring(0, 100)}...`);
      
      if (!message.text) {
        console.log('Warning No text content in Click Picks message');
        return [];
      }
      
      // Extract URLs from message
      const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
      const urls = message.text.match(urlRegex) || [];
      
      console.log(`Search Found ${urls.length} URLs in Click Picks message`);
      
      if (urls.length === 0) {
        console.log('Warning No URLs detected in Click Picks message');
        return [];
      }
      
      const processedProducts = [];
      
      for (const url of urls) {
        try {
          console.log(`Refresh Processing Click Picks URL: ${url}`);
          
          // Create product data from URL and message
          const productData = await this.extractProductFromUrl(url, message);
          
          if (productData) {
            // Save to database
            const productId = await this.addProduct(productData);
            console.log(`Success Click Picks product saved with ID: ${productId}`);
            
            processedProducts.push({
              ...productData,
              id: productId
            });
          }
          
        } catch (error) {
          console.error(`Error Error processing Click Picks URL ${url}:`, error);
        }
      }
      
      console.log(`Success Click Picks processed ${processedProducts.length} products`);
      return processedProducts;
      
    } catch (error) {
      console.error('Error Error in Click Picks processMessage:', error);
      return [];
    }
  }
  
  /**
   * Extract product information from URL and message
   */
  private async extractProductFromUrl(url: string, message: any): Promise<ClickPicksProduct | null> {
    try {
      // Basic product extraction - you can enhance this with web scraping
      const productName = this.extractProductName(message.text, url);
      const price = this.extractPrice(message.text);
      const category = this.extractCategory(message.text, url);
      
      return {
        name: productName,
        description: this.extractDescription(message.text),
        price: price,
        currency: 'INR',
        imageUrl: this.generateFallbackImage(url),
        affiliateUrl: this.convertToAffiliateLink(url),
        category: category,
        rating: '4.0',
        reviewCount: 0,
        affiliateNetwork: 'click-picks',
        telegramMessageId: message.id,
        createdAt: Math.floor(Date.now() / 1000)
      };
      
    } catch (error) {
      console.error('Error Error extracting Click Picks product:', error);
      return null;
    }
  }
  
  private extractProductName(text: string, url: string): string {
    // Extract product name from text or URL
    const lines = text.split('\n').filter(line => line.trim().length > 5);
    const firstLine = lines[0]?.replace(/[Hot💥FastTargetSpecialLaunch]/g, '').trim();
    
    if (firstLine && firstLine.length > 10) {
      return firstLine.substring(0, 100);
    }
    
    // Fallback to URL-based name
    const domain = new URL(url).hostname.replace('www.', '');
    return `Product from ${domain}`;
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
  
  private extractDescription(text: string): string {
    const lines = text.split('\n').filter(line => line.trim().length > 10);
    return lines.slice(1, 3).join(' ').substring(0, 200) || 'Click Picks product';
  }
  
  private extractCategory(text: string, url: string): string {
    // Category detection from URL or text
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('electronics') || urlLower.includes('mobile') || urlLower.includes('laptop')) {
      return 'Electronics';
    }
    if (urlLower.includes('fashion') || urlLower.includes('clothing') || urlLower.includes('shirt')) {
      return 'Fashion';
    }
    if (urlLower.includes('home') || urlLower.includes('kitchen') || urlLower.includes('furniture')) {
      return 'Home & Kitchen';
    }
    
    return 'General';
  }
  
  private generateFallbackImage(url: string): string {
    const domain = new URL(url).hostname.replace('www.', '');
    return `https://via.placeholder.com/300x300?text=${encodeURIComponent(domain)}`;
  }
  
  private convertToAffiliateLink(url: string): string {
    // Simple affiliate link conversion - customize based on your affiliate program
    const affiliateTemplate = process.env.CLICK_PICKS_AFFILIATE_TEMPLATE || 'https://clickpicks.com/redirect?url={URL}';
    return affiliateTemplate.replace('{URL}', encodeURIComponent(url));
  }

  /**
   * Add a new Click Picks product
   */
  async addProduct(productData: ClickPicksProduct): Promise<number> {
    try {
      const insertQuery = `
        INSERT INTO click_picks_products (
          name, description, price, original_price, currency, image_url, affiliate_url,
          category, rating, review_count, discount, is_featured, is_new,
          affiliate_network, telegram_message_id, processing_status, source_metadata,
          message_group_id, product_sequence, total_in_group,
          has_limited_offer, limited_offer_text, offer_expires_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const result = this.db.prepare(insertQuery).run(
        productData.name,
        productData.description,
        productData.price,
        productData.originalPrice || null,
        productData.currency || 'INR',
        productData.imageUrl,
        productData.affiliateUrl,
        productData.category,
        productData.rating,
        productData.reviewCount,
        productData.discount || null,
        productData.isFeatured ? 1 : 0,
        productData.isNew ? 1 : 0,
        productData.affiliateNetwork || 'Click Picks Network',
        productData.telegramMessageId || null,
        productData.processingStatus || 'active',
        productData.sourceMetadata || null,
        productData.messageGroupId || null,
        productData.productSequence || 1,
        productData.totalInGroup || 1,
        productData.hasLimitedOffer ? 1 : 0,
        productData.limitedOfferText || null,
        productData.offerExpiresAt || null,
        Math.floor(Date.now() / 1000)
      );

      console.log(`Success Added Click Picks product: ${productData.name} (ID: ${result.lastInsertRowid})`);
      return result.lastInsertRowid as number;
    } catch (error) {
      console.error('Error Error adding Click Picks product:', error);
      throw error;
    }
  }

  /**
   * Get all active Click Picks products
   */
  async getProducts(limit?: number): Promise<ClickPicksProduct[]> {
    try {
      const currentTime = Math.floor(Date.now() / 1000);
      let query = `
        SELECT 
          id, name, description, price, original_price as originalPrice,
          currency, image_url as imageUrl, affiliate_url as affiliateUrl,
          category, rating, review_count as reviewCount, discount,
          is_featured as isFeatured, is_new as isNew, affiliate_network as affiliateNetwork,
          telegram_message_id as telegramMessageId, processing_status as processingStatus,
          source_metadata as sourceMetadata, created_at as createdAt,
          message_group_id as messageGroupId, product_sequence as productSequence,
          total_in_group as totalInGroup, has_limited_offer as hasLimitedOffer,
          limited_offer_text as limitedOfferText, offer_expires_at as offerExpiresAt
        FROM click_picks_products 
        WHERE processing_status = 'active'
        AND (offer_expires_at IS NULL OR offer_expires_at > ?)
        ORDER BY created_at DESC
      `;

      if (limit) {
        query += ` LIMIT ${limit}`;
      }

      const products = this.db.prepare(query).all(currentTime);
      return products as ClickPicksProduct[];
    } catch (error) {
      console.error('Error Error fetching Click Picks products:', error);
      return [];
    }
  }

  /**
   * Get Click Picks product by ID
   */
  async getProductById(id: number): Promise<ClickPicksProduct | null> {
    try {
      const query = `
        SELECT 
          id, name, description, price, original_price as originalPrice,
          currency, image_url as imageUrl, affiliate_url as affiliateUrl,
          category, rating, review_count as reviewCount, discount,
          is_featured as isFeatured, is_new as isNew, affiliate_network as affiliateNetwork,
          telegram_message_id as telegramMessageId, processing_status as processingStatus,
          source_metadata as sourceMetadata, created_at as createdAt,
          message_group_id as messageGroupId, product_sequence as productSequence,
          total_in_group as totalInGroup, has_limited_offer as hasLimitedOffer,
          limited_offer_text as limitedOfferText, offer_expires_at as offerExpiresAt
        FROM click_picks_products 
        WHERE id = ?
      `;

      const product = this.db.prepare(query).get(id);
      return product as ClickPicksProduct || null;
    } catch (error) {
      console.error('Error Error fetching Click Picks product by ID:', error);
      return null;
    }
  }

  /**
   * Update Click Picks product
   */
  async updateProduct(id: number, updates: Partial<ClickPicksProduct>): Promise<boolean> {
    try {
      const setClause = Object.keys(updates)
        .map(key => {
          // Convert camelCase to snake_case for database columns
          const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
          return `${dbKey} = ?`;
        })
        .join(', ');

      const values = Object.values(updates);
      values.push(id);

      const query = `UPDATE click_picks_products SET ${setClause} WHERE id = ?`;
      const result = this.db.prepare(query).run(...values);

      console.log(`Success Updated Click Picks product ID: ${id}`);
      return result.changes > 0;
    } catch (error) {
      console.error('Error Error updating Click Picks product:', error);
      return false;
    }
  }

  /**
   * Delete Click Picks product
   */
  async deleteProduct(id: number): Promise<boolean> {
    try {
      const result = this.db.prepare('DELETE FROM click_picks_products WHERE id = ?').run(id);
      console.log(`Success Deleted Click Picks product ID: ${id}`);
      return result.changes > 0;
    } catch (error) {
      console.error('Error Error deleting Click Picks product:', error);
      return false;
    }
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(category: string): Promise<ClickPicksProduct[]> {
    try {
      const currentTime = Math.floor(Date.now() / 1000);
      const query = `
        SELECT 
          id, name, description, price, original_price as originalPrice,
          currency, image_url as imageUrl, affiliate_url as affiliateUrl,
          category, rating, review_count as reviewCount, discount,
          is_featured as isFeatured, is_new as isNew, affiliate_network as affiliateNetwork,
          telegram_message_id as telegramMessageId, processing_status as processingStatus,
          source_metadata as sourceMetadata, created_at as createdAt,
          message_group_id as messageGroupId, product_sequence as productSequence,
          total_in_group as totalInGroup, has_limited_offer as hasLimitedOffer,
          limited_offer_text as limitedOfferText, offer_expires_at as offerExpiresAt
        FROM click_picks_products 
        WHERE processing_status = 'active'
        AND category = ?
        AND (offer_expires_at IS NULL OR offer_expires_at > ?)
        ORDER BY created_at DESC
      `;

      const products = this.db.prepare(query).all(category, currentTime);
      return products as ClickPicksProduct[];
    } catch (error) {
      console.error('Error Error fetching Click Picks products by category:', error);
      return [];
    }
  }

  /**
   * Get all categories from Click Picks products
   */
  async getCategories(): Promise<string[]> {
    try {
      const currentTime = Math.floor(Date.now() / 1000);
      const query = `
        SELECT DISTINCT category 
        FROM click_picks_products 
        WHERE processing_status = 'active'
        AND (offer_expires_at IS NULL OR offer_expires_at > ?)
        AND category IS NOT NULL 
        AND category != ''
        ORDER BY category
      `;

      const result = this.db.prepare(query).all(currentTime);
      return result.map((row: any) => row.category);
    } catch (error) {
      console.error('Error Error fetching Click Picks categories:', error);
      return [];
    }
  }

  /**
   * Process bulk products (for bundle processing)
   */
  async processBulkProducts(products: ClickPicksProduct[], messageGroupId: string): Promise<number[]> {
    const insertedIds: number[] = [];

    try {
      for (let i = 0; i < products.length; i++) {
        const product = {
          ...products[i],
          messageGroupId,
          productSequence: i + 1,
          totalInGroup: products.length
        };

        const id = await this.addProduct(product);
        insertedIds.push(id);
      }

      console.log(`Success Processed ${insertedIds.length} Click Picks products in bundle: ${messageGroupId}`);
      return insertedIds;
    } catch (error) {
      console.error('Error Error processing bulk Click Picks products:', error);
      throw error;
    }
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<{
    total: number;
    active: number;
    featured: number;
    categories: number;
  }> {
    try {
      const currentTime = Math.floor(Date.now() / 1000);
      
      const total = this.db.prepare('SELECT COUNT(*) as count FROM click_picks_products').get() as { count: number };
      const active = this.db.prepare(`
        SELECT COUNT(*) as count FROM click_picks_products 
        WHERE processing_status = 'active' 
        AND (offer_expires_at IS NULL OR offer_expires_at > ?)
      `).get(currentTime) as { count: number };
      const featured = this.db.prepare(`
        SELECT COUNT(*) as count FROM click_picks_products 
        WHERE processing_status = 'active' AND is_featured = 1
        AND (offer_expires_at IS NULL OR offer_expires_at > ?)
      `).get(currentTime) as { count: number };
      const categories = this.db.prepare(`
        SELECT COUNT(DISTINCT category) as count FROM click_picks_products 
        WHERE processing_status = 'active'
        AND (offer_expires_at IS NULL OR offer_expires_at > ?)
      `).get(currentTime) as { count: number };

      return {
        total: total.count,
        active: active.count,
        featured: featured.count,
        categories: categories.count
      };
    } catch (error) {
      console.error('Error Error fetching Click Picks stats:', error);
      return { total: 0, active: 0, featured: 0, categories: 0 };
    }
  }
}

// Export singleton instance
export const clickPicksService = new ClickPicksService();