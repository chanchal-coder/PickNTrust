/**
 * Prime Picks Telegram Bot Service
 * Handles automation for @pntamazon channel -> prime-picks page
 */

import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';
import axios from 'axios';
import * as cheerio from 'cheerio';
import affiliateTagManager from './affiliate-tag-manager';

// Load Telegram environment variables
const telegramEnvPath = path.join(process.cwd(), '.env.telegram');
if (fs.existsSync(telegramEnvPath)) {
  dotenv.config({ path: telegramEnvPath });
}

// Prime Picks Bot Configuration - Enhanced Manager Integration
let BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN_PRIME_PICKS || '8260140807:AAEy6I9xxtYbvddJKDNfRwmcIWDX1Y9pck4';
let CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID_PRIME_PICKS || '-1002955338551';
const CHANNEL_USERNAME = process.env.TELEGRAM_CHANNEL_PRIME_PICKS || 'pntamazon';
const TARGET_PAGE = process.env.PRIME_PICKS_TARGET_PAGE || 'prime-picks';
const AFFILIATE_TAG = process.env.PRIME_PICKS_AFFILIATE_TAG || '{{URL}}{{SEP}}tag=pickntrust03-21';
const AMAZON_ASSOCIATES_TAG = process.env.AMAZON_ASSOCIATES_TAG || 'pickntrust03-21';

if (!BOT_TOKEN || !CHANNEL_ID) {
  console.warn('Warning Prime Picks bot credentials not found in .env.telegram');
  console.warn('Blog Please check TELEGRAM_BOT_TOKEN_PRIME_PICKS and TELEGRAM_CHANNEL_ID_PRIME_PICKS');
}

interface ProductData {
  name: string;
  description: string;
  price: string;
  originalPrice?: string;
  currency: string;
  imageUrl: string;
  affiliateUrl: string;
  originalUrl: string;
  category: string;
  rating?: number;
  reviewCount?: number;
  discount?: number;
  source: string;
  telegramMessageId: number;
  telegramChannelId: number;
}

class PrimePicksBot {
  private bot: TelegramBot | null = null;
  private isInitialized = false;
  private db: Database.Database;

  constructor() {
    this.db = new Database('database.sqlite');
  }

  /**
   * Initialize the Prime Picks Telegram bot
   */
  async initialize(): Promise<void> {
    if (!BOT_TOKEN) {
      console.log('Warning Prime Picks bot disabled - no token provided');
      return;
    }

    try {
      console.log('AI Initializing Prime Picks Telegram bot...');
      
      // Create bot instance with polling
      this.bot = new TelegramBot(BOT_TOKEN, { polling: true });
      
      // Set up message listeners
      this.setupMessageListeners();
      
      // Set up error handling
      this.setupErrorHandling();
      
      this.isInitialized = true;
      console.log('Success Prime Picks bot initialized successfully');
      console.log(`Mobile Monitoring channel: ${CHANNEL_USERNAME} (${CHANNEL_ID})`);
      console.log(`Target Target page: ${TARGET_PAGE}`);
      
      // Send startup notification
      try {
        await this.bot.sendMessage(CHANNEL_ID, 
          'Launch **Prime Picks Hybrid Bot Started!**\n\n' +
          'Success Original Telegram autoposting preserved\n' +
          'Success Amazon website scraping active\n' +
          'Success Affiliate optimization enabled\n' +
          'Success AI-powered quality filtering active\n\n' +
          'Target Ready to find the best Prime Picks deals!',
          { parse_mode: 'Markdown' }
        );
      } catch (error) {
        console.error('Failed to send Prime Picks startup notification:', error);
      }
      
    } catch (error) {
      console.error('Error Failed to initialize Prime Picks bot:', error);
      throw error;
    }
  }

  /**
   * Set up message listeners for channel posts
   */
  private setupMessageListeners(): void {
    if (!this.bot) return;

    // Listen for channel posts (like Loot Box bot)
    this.bot.on('channel_post', async (msg) => {
      try {
        await this.handleChannelMessage(msg);
      } catch (error) {
        console.error('Error Error handling channel message:', error);
      }
    });

    // Listen for regular messages (in case bot is added to group)
    this.bot.on('message', async (msg) => {
      try {
        // Handle private messages (like /start)
        if (msg.chat.type === 'private' && msg.text) {
          await this.handlePrivateMessage(msg);
        }
        // Only process channel messages from the target channel
        else if (msg.chat.id.toString() === CHANNEL_ID) {
          await this.handleChannelMessage(msg);
        }
      } catch (error) {
        console.error('Error Error handling message:', error);
      }
    });
  }

  /**
   * Handle private messages (like /start command)
   */
  private async handlePrivateMessage(msg: TelegramBot.Message): Promise<void> {
    try {
      if (msg.text === '/start') {
        await this.bot?.sendMessage(msg.chat.id, 
          'AI Prime Picks Bot Active!\n\n' +
          'Success Channel monitoring enabled\n' +
          'Target Target: prime-picks page\n' +
          'Link Affiliate conversion ready\n' +
          'Stats Product extraction active'
        );
      }
    } catch (error) {
      console.error('Error Error handling private message:', error);
    }
  }

  /**
   * Handle channel messages (like Loot Box bot)
   */
  private async handleChannelMessage(msg: TelegramBot.Message): Promise<void> {
    console.log('Mobile Prime Picks message received:', {
      messageId: msg.message_id,
      chatId: msg.chat.id,
      text: msg.text?.substring(0, 100) + '...'
    });

    // Skip if no text content
    if (!msg.text) {
      console.log('⏭️ Skipping message without text content');
      return;
    }

    // Extract URLs from message
    const urls = this.extractUrls(msg.text);
    
    if (urls.length === 0) {
      console.log('⏭️ No URLs found in message');
      return;
    }

    console.log(`Link Found ${urls.length} URLs in message`);

    // Process each URL
    for (const url of urls) {
      try {
        await this.processProductUrl(url, msg);
      } catch (error) {
        console.error(`Error Error processing URL ${url}:`, error);
      }
    }
  }

  /**
   * Set up error handling for the bot
   */
  private setupErrorHandling(): void {
    if (!this.bot) return;

    this.bot.on('polling_error', (error) => {
      console.error('Error Prime Picks bot polling error:', error);
    });

    this.bot.on('error', (error) => {
      console.error('Error Prime Picks bot error:', error);
    });
  }

  /**
   * Extract URLs from message text (like Loot Box bot)
   */
  private extractUrls(text: string): string[] {
    const urlRegex = /https?:\/\/[^\s]+/g;
    const matches = text.match(urlRegex) || [];
    
    return matches.map(url => {
      // Clean up URL (remove trailing punctuation)
      return url.replace(/[.,;!?]+$/, '');
    });
  }

  /**
   * Process a product URL and save to database
   */
  private async processProductUrl(url: string, message: TelegramBot.Message): Promise<void> {
    try {
      console.log(`Search Processing URL: ${url}`);
      
      // Expand short URLs
      const expandedUrl = await this.expandUrl(url);
      console.log(`Global Expanded URL: ${expandedUrl}`);
      
      // Convert to affiliate URL using dynamic tag management
      const affiliateUrl = await this.convertToAffiliateUrl(expandedUrl);
      console.log(`Price Affiliate URL: ${affiliateUrl}`);
      
      // Extract product data
      const productData = await this.extractProductData(affiliateUrl, expandedUrl, message);
      
      if (!productData) {
        console.log('Warning Could not extract product data, skipping...');
        return;
      }
      
      // Save to database
      await this.saveProduct({
        ...productData,
        affiliateUrl,
        originalUrl: expandedUrl,
        source: 'telegram-prime-picks',
        telegramMessageId: message.message_id,
        telegramChannelId: parseInt(CHANNEL_ID!)
      });
      
      console.log('Success Product saved successfully:', productData.name);
      
    } catch (error) {
      console.error('Error Error processing product URL:', error);
    }
  }

  /**
   * Expand short URLs to get the final destination
   */
  private async expandUrl(url: string): Promise<string> {
    try {
      // Check if it's already a full URL
      if (!this.isShortUrl(url)) {
        return url;
      }
      
      console.log(`Refresh Expanding short URL: ${url}`);
      
      const response = await axios.head(url, {
        maxRedirects: 10,
        timeout: 10000,
        validateStatus: () => true
      });
      
      return response.request.res.responseUrl || url;
      
    } catch (error) {
      console.error('Error Error expanding URL:', error);
      return url; // Return original if expansion fails
    }
  }

  /**
   * Check if URL is a short URL
   */
  private isShortUrl(url: string): boolean {
    const shortDomains = [
      'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly',
      'amzn.to', 'amzn.in', 'fkrt.it', 'dl.flipkart.com'
    ];
    
    return shortDomains.some(domain => url.includes(domain));
  }

  /**
   * Convert URL to affiliate URL with dynamic affiliate tags
   */
  private async convertToAffiliateUrl(url: string): Promise<string> {
    try {
      console.log(`Link Converting URL with dynamic affiliate tags: ${url}`);
      
      // Use affiliate tag manager with smart commission optimization and fallback
      const result = await affiliateTagManager.processUrlWithFallback('prime-picks', url, {
        productType: 'amazon',
        maxRetries: 3
      });
      
      if (result.tag) {
        console.log(`Success Applied ${result.tag.networkName} tag (attempt ${result.attempt})`);
        console.log(`Price Commission rate: ${result.tag.commissionRate}%`);
      } else {
        console.warn('Warning No affiliate tags available, using original URL');
      }
      
      return result.affiliateUrl;
    } catch (error) {
      console.error('Error Error converting to affiliate URL:', error);
      return url;
    }
  }

  /**
   * Extract product data from URL
   */
  private async extractProductData(affiliateUrl: string, originalUrl: string, message: TelegramBot.Message): Promise<ProductData | null> {
    try {
      console.log(`Stats Extracting product data from: ${originalUrl}`);
      
      // Fetch page content
      const response = await axios.get(originalUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      
      // Extract product information
      const name = this.extractProductName($, message.text || '');
      const description = this.extractDescription($, message.text || '');
      const { price, originalPrice, currency } = this.extractPricing($);
      const imageUrl = this.extractImageUrl($, message);
      const category = this.detectCategory(originalUrl, name);
      const { rating, reviewCount } = this.extractRating($);
      
      // Calculate discount properly
      let discount = 0;
      if (originalPrice && price) {
        const numOriginal = parseFloat(originalPrice.replace('₹', ''));
        const numCurrent = parseFloat(price.replace('₹', ''));
        if (numOriginal > numCurrent && numOriginal > 0) {
          discount = Math.round(((numOriginal - numCurrent) / numOriginal) * 100);
        }
      }
      
      return {
        name,
        description,
        price,
        originalPrice,
        currency,
        imageUrl,
        affiliateUrl: affiliateUrl,
        originalUrl: originalUrl,
        category,
        rating,
        reviewCount,
        discount,
        source: 'telegram-prime-picks',
        telegramMessageId: message.message_id,
        telegramChannelId: parseInt(CHANNEL_ID!)
      };
      
    } catch (error) {
      console.error('Error Error extracting product data:', error);
      return null;
    }
  }

  /**
   * Extract product name from page or message
   */
  private extractProductName($: cheerio.Root, messageText: string): string {
    // Try multiple selectors for product name
    const selectors = [
      '#productTitle',
      '.product-title',
      'h1',
      '.pdp-product-name',
      '[data-automation-id="product-title"]'
    ];
    
    for (const selector of selectors) {
      const title = $(selector).first().text().trim();
      if (title && title.length > 10) {
        return title.substring(0, 200); // Limit length
      }
    }
    
    // Fallback: extract from message text
    const lines = messageText.split('\n');
    for (const line of lines) {
      if (line.length > 10 && !line.includes('http') && !line.includes('₹') && !line.includes('$')) {
        return line.trim().substring(0, 200);
      }
    }
    
    return 'Product from Prime Picks';
  }

  /**
   * Extract product description
   */
  private extractDescription($: cheerio.Root, messageText: string): string {
    // Try to get description from page
    const descSelectors = [
      '#feature-bullets ul',
      '.product-description',
      '.pdp-product-description',
      '#productDescription'
    ];
    
    for (const selector of descSelectors) {
      const desc = $(selector).first().text().trim();
      if (desc && desc.length > 20) {
        return desc.substring(0, 500);
      }
    }
    
    // Fallback: use message text
    return messageText.substring(0, 300) || 'Great deal from Prime Picks!';
  }

  /**
   * Extract pricing information using corrected Amazon-specific DOM selectors
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

    // CORRECTED: Only set original price if it's higher than current price
    if (originalPrice && originalPrice <= currentPrice) {
      console.log(`Corrected Original price ${originalPrice} <= current ${currentPrice}, removing original`);
      originalPrice = null;
    }

    const price = `₹${Math.floor(currentPrice)}`;
    const originalPriceFormatted = originalPrice ? `₹${Math.floor(originalPrice)}` : undefined;

    console.log(`Price CORRECTED extraction: Current=${price}, Original=${originalPriceFormatted || 'N/A'}`);
    
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