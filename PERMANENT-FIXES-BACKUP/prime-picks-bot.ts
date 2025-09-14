  /**
   * Extract pricing information using CORRECTED Amazon-specific DOM selectors
   * PERMANENT FIX - DO NOT REVERT THIS CODE
   */
  private extractPricing($: cheerio.Root): { price: string; originalPrice?: string; currency: string } {
    let currency = 'INR';
    let currentPrice: number | null = null;
    let originalPrice: number | null = null;

    // CORRECTED: Current price selectors (deal/discounted price)
    const currentPriceSelectors = [
      '.a-price.a-text-price.a-size-medium.apexPriceToPay .a-offscreen', // Main deal price
      '.a-price-current .a-offscreen', // Current price
      '#priceblock_dealprice', // Deal price block
      '#priceblock_ourprice', // Our price block
      '.a-price.a-text-price.a-size-large .a-offscreen' // Large price display
    ];

    // CORRECTED: Original price selectors (MRP/was price)
    const originalPriceSelectors = [
      '.a-price.a-text-price.a-size-base.a-color-secondary .a-offscreen', // MRP (most reliable)
      '.a-price-was .a-offscreen', // Was price
      '.a-text-strike .a-offscreen', // Strikethrough price
      '#priceblock_was', // Was price block
      '.a-price.a-text-price.a-size-small .a-offscreen' // Small MRP text
    ];

    // Extract current price (deal price)
    for (const selector of currentPriceSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const priceText = element.text().trim();
        console.log(`Search Current price selector: ${selector} = "${priceText}"`);
        
        if (priceText) {
          const priceMatch = priceText.match(/₹([\d,]+(?:\.\d{2})?)/); 
          if (priceMatch) {
            const numPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
            if (numPrice > 0 && numPrice < 1000000) {
              currentPrice = numPrice;
              console.log(`Success Current price: ₹${currentPrice}`);
              break;
            }
          }
        }
      }
    }

    // Extract original price (MRP)
    for (const selector of originalPriceSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const priceText = element.text().trim();
        console.log(`Search Original price selector: ${selector} = "${priceText}"`);
        
        if (priceText) {
          const priceMatch = priceText.match(/₹([\d,]+(?:\.\d{2})?)/); 
          if (priceMatch) {
            const numPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
            if (numPrice > 0 && numPrice < 1000000) {
              originalPrice = numPrice;
              console.log(`Success Original price: ₹${originalPrice}`);
              break;
            }
          }
        }
      }
    }

    // Fallback: If no current price found, use any price as current
    if (!currentPrice) {
      $('.a-price .a-offscreen').each((i, el) => {
        const priceText = $(el).text().trim();
        const priceMatch = priceText.match(/₹([\d,]+(?:\.\d{2})?)/); 
        if (priceMatch) {
          const numPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
          if (numPrice > 0 && numPrice < 1000000) {
            currentPrice = numPrice;
            console.log(`Fallback current price: ₹${currentPrice}`);
            return false; // Break out of each
          }
        }
      });
    }

    // Default if no price found
    if (!currentPrice) {
      currentPrice = 999;
      console.log(`Warning No price found, using default: ₹${currentPrice}`);
    }

    // CRITICAL FIX: Only set original price if it's HIGHER than current price
    if (originalPrice && originalPrice <= currentPrice) {
      console.log(`CORRECTED: Original price ${originalPrice} <= current ${currentPrice}, removing original`);
      originalPrice = null;
    }

    const price = `₹${Math.floor(currentPrice)}`;
    const originalPriceFormatted = originalPrice ? `₹${Math.floor(originalPrice)}` : undefined;

    console.log(`Price PERMANENT FIX: Current=${price}, Original=${originalPriceFormatted || 'N/A'}`);
    
    return { 
      price, 
      originalPrice: originalPriceFormatted, 
      currency 
    };
  }

  /**
   * Extract product image URL
   */
  private extractImageUrl($: cheerio.Root, message: TelegramBot.Message): string {
    // If message has photo, use Telegram photo
    if (message.photo && message.photo.length > 0) {
      const largestPhoto = message.photo[message.photo.length - 1];
      // Note: file_path would need to be obtained via getFile API call
      return `https://via.placeholder.com/300x300?text=Telegram+Photo`;
    }
    
    // Try to extract from page
    const imageSelectors = [
      '#landingImage',
      '.product-image img',
      '.pdp-image img',
      'img[data-automation-id="product-image"]'
    ];
    
    for (const selector of imageSelectors) {
      const src = $(selector).first().attr('src') || $(selector).first().attr('data-src');
      if (src && src.startsWith('http')) {
        return src;
      }
    }
    
    return 'https://via.placeholder.com/300x300?text=Prime+Picks';
  }

  /**
   * Detect product category
   */
  private detectCategory(url: string, name: string): string {
    const categoryMap = {
      'Electronics & Gadgets': ['phone', 'laptop', 'headphone', 'speaker', 'camera', 'tablet', 'electronic', 'gadget', 'tech', 'mobile', 'computer', 'tv', 'monitor'],
      'Fashion & Clothing': ['shirt', 'dress', 'shoe', 'bag', 'watch', 'jewelry', 'clothing', 'apparel', 'fashion', 'wear', 'style'],
      'Home & Kitchen': ['furniture', 'decor', 'kitchen', 'bedding', 'storage', 'home', 'appliance', 'cookware', 'utensil', 'dining'],
      'Books & Education': ['book', 'novel', 'guide', 'manual', 'textbook', 'education', 'learning', 'study'],
      'Sports & Fitness': ['fitness', 'gym', 'sport', 'exercise', 'outdoor', 'athletic', 'workout', 'training', 'yoga'],
      'Beauty & Personal Care': ['beauty', 'cosmetic', 'skincare', 'makeup', 'perfume', 'hair', 'personal', 'care', 'hygiene'],
      'Health & Wellness': ['health', 'wellness', 'vitamin', 'supplement', 'medicine', 'medical', 'protein', 'nutrition'],
      'Toys & Games': ['toy', 'game', 'puzzle', 'doll', 'play', 'kids', 'children', 'educational'],
      'Automotive': ['car', 'bike', 'motorcycle', 'automotive', 'vehicle', 'parts', 'accessories', 'motor']
    };
    
    const lowerName = name.toLowerCase();
    const lowerUrl = url.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categoryMap)) {
      if (keywords.some(keyword => lowerName.includes(keyword) || lowerUrl.includes(keyword))) {
        return category;
      }
    }
    
    return 'Electronics & Gadgets'; // Default to a proper category instead of 'general'
  }

  /**
   * Extract rating and review count
   */
  private extractRating($: cheerio.Root): { rating?: number; reviewCount?: number } {
    let rating: number | undefined;
    let reviewCount: number | undefined;
    
    // Try to extract rating
    const ratingSelectors = [
      '.a-icon-alt',
      '.rating',
      '.pdp-rating'
    ];
    
    for (const selector of ratingSelectors) {
      const ratingText = $(selector).first().text().trim();
      const ratingMatch = ratingText.match(/(\d+\.\d+)/);
      if (ratingMatch) {
        rating = parseFloat(ratingMatch[1]);
        break;
      }
    }
    
    // Try to extract review count
    const reviewSelectors = [
      '#acrCustomerReviewText',
      '.review-count',
      '.pdp-review-count'
    ];
    
    for (const selector of reviewSelectors) {
      const reviewText = $(selector).first().text().trim();
      const reviewMatch = reviewText.match(/([\d,]+)/);
      if (reviewMatch) {
        reviewCount = parseInt(reviewMatch[1].replace(/,/g, ''));
        break;
      }
    }
    
    return { rating, reviewCount };
  }

  /**
   * Save product to database
   */
  private async saveProduct(productData: ProductData): Promise<void> {
    try {
      console.log('Save Saving Prime Picks product to database:', {
        name: productData.name,
        price: productData.price,
        category: productData.category
      });

      // Check for duplicates based on telegram_message_id
      const checkExisting = this.db.prepare(
        'SELECT id FROM amazon_products WHERE telegram_message_id = ?'
      );
      const existingProduct = checkExisting.get(productData.telegramMessageId);

      if (existingProduct) {
        console.log('Warning Product already exists, skipping save');
        return;
      }

      // Insert into amazon_products table with all required fields
      const insertProduct = this.db.prepare(`
        INSERT INTO amazon_products (
          name, description, price, original_price, currency,
          image_url, affiliate_url, original_url, category,
          rating, review_count, discount, is_featured,
          source, telegram_message_id, created_at, expires_at,
          affiliate_network, content_type, display_pages
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
      `);

      const result = insertProduct.run(
        productData.name,
        productData.description,
        productData.price, // Already formatted as ₹999
        productData.originalPrice || productData.price, // Already formatted as ₹1299
        productData.currency || 'INR',
        productData.imageUrl,
        productData.affiliateUrl,
        productData.originalUrl,
        productData.category,
        productData.rating?.toString() || '4.5',
        productData.reviewCount?.toString() || '100',
        productData.discount?.toString() || '0',
        0, // is_featured
        productData.source,
        productData.telegramMessageId,
        Math.floor(Date.now() / 1000), // created_at
        Math.floor((Date.now() + 24 * 60 * 60 * 1000) / 1000), // expires_at (24 hours)
        'amazon', // affiliate_network
        'prime-picks', // content_type
        'prime-picks' // display_pages
      );

      console.log(`Success Prime Picks product saved with ID: ${result.lastInsertRowid}`);
      
    } catch (error) {
      console.error('Error Error saving Prime Picks product:', error);
      throw error;
    }
  }

  /**
   * Generate unique link ID for Amazon Associates tracking
   */
  private static generateLinkId(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Get bot status
   */
  getStatus(): { initialized: boolean; channelId?: string; targetPage: string } {
    return {
      initialized: this.isInitialized,
      channelId: CHANNEL_ID,
      targetPage: TARGET_PAGE
    };
  }

  /**
   * Shutdown the bot
   */
  async shutdown(): Promise<void> {
    if (this.bot) {
      console.log('Stop Shutting down Prime Picks bot...');
      await this.bot.stopPolling();
      this.bot = null;
      this.isInitialized = false;
      console.log('Success Prime Picks bot shutdown complete');
    }
  }
}

// Export singleton instance
export const primePicksBot = new PrimePicksBot();

// Enhanced Manager Integration - Export initialization function
export async function initializePrimePicksBot(): Promise<void> {
  try {
    console.log('Launch Initializing Prime Picks Bot with Enhanced Manager...');
    await primePicksBot.initialize();
    console.log('Success Prime Picks Bot initialized successfully');
  } catch (error) {
    console.error('Error Failed to initialize Prime Picks Bot:', error);
    throw error;
  }
}

// Auto-initialize if credentials are available (fallback)
if (BOT_TOKEN && CHANNEL_ID && !process.env.ENHANCED_MANAGER_ACTIVE) {
  primePicksBot.initialize().catch(console.error);
} else if (!BOT_TOKEN || !CHANNEL_ID) {
  console.log('Warning Prime Picks bot not initialized - missing credentials');
}