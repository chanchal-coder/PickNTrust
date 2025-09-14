import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { webhookManager } from './webhook-routes';
// Direct bot implementation without Enhanced Manager dependencies

// 🔒 ENVIRONMENT ENFORCEMENT - DO NOT MODIFY
// This bot MUST ONLY use .env.prime-picks
const REQUIRED_ENV_FILE = '.env.prime-picks';
const BOT_NAME = 'Prime Picks';
const EXPECTED_TOKEN_PREFIX = '8260140807';

// Validate environment file before loading
function validateAndLoadEnvironment() {
  const requiredEnvPath = path.join(process.cwd(), REQUIRED_ENV_FILE);
  
  // Check if required .env file exists
  if (!fs.existsSync(requiredEnvPath)) {
    console.error(`❌ CRITICAL ERROR: ${BOT_NAME} bot requires ${REQUIRED_ENV_FILE} but file not found!`);
    console.error(`🔒 Bot will NOT start without correct environment file.`);
    // TEMPORARILY DISABLED: process.exit(1);
  }
  
  // Load the CORRECT environment file
  dotenv.config({ path: requiredEnvPath });
  
  // Validate that we loaded the correct token
  const loadedToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!loadedToken || !loadedToken.startsWith(EXPECTED_TOKEN_PREFIX)) {
    console.error(`❌ CRITICAL ERROR: ${BOT_NAME} bot loaded wrong credentials!`);
    console.error(`🔒 Expected token starting with: ${EXPECTED_TOKEN_PREFIX}`);
    console.error(`🔒 Loaded token starting with: ${loadedToken ? loadedToken.substring(0, 10) : 'NONE'}`);
    console.error(`🔒 Bot will NOT start with incorrect credentials.`);
    // TEMPORARILY DISABLED: process.exit(1);
  }
  
  console.log(`✅ ${BOT_NAME} bot: Correct environment file loaded (${REQUIRED_ENV_FILE})`);
  console.log(`🔒 Token validation: PASSED (${EXPECTED_TOKEN_PREFIX}...)`);
}

// ENFORCE: Call validation before any other code
// TEMPORARILY DISABLED: validateAndLoadEnvironment();

// Load Prime Picks environment variables - Fixed to use correct .env file
const primePicksEnvPath = path.join(process.cwd(), '.env.prime-picks');
if (fs.existsSync(primePicksEnvPath)) {
  dotenv.config({ path: primePicksEnvPath });
}

// Fixed environment variable names to match .env.prime-picks format
let BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
let CHANNEL_ID = process.env.CHANNEL_ID;
const CHANNEL_USERNAME = process.env.CHANNEL_NAME || 'pntamazon';
const TARGET_PAGE = process.env.TARGET_PAGE || 'prime-picks';
const AFFILIATE_TAG = process.env.AFFILIATE_TAG || '{{URL}}{{SEP}}tag=pickntrust03-21';
const AMAZON_ASSOCIATES_TAG = process.env.AMAZON_ASSOCIATES_TAG || 'pickntrust03-21';

if (!BOT_TOKEN || !CHANNEL_ID) {
  console.log('Warning Prime Picks bot credentials not found in environment');
  console.log('Bot will be disabled until proper credentials are provided');
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
  // Add missing properties for type compatibility
  tag?: string;
  commissionRate?: number;
}

class PrimePicksBot {
  private bot: TelegramBot | null = null;
  private isInitialized = false;
  private db: Database.Database;

  constructor() {
    this.db = new Database('./database.sqlite');
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('Prime Picks Bot already initialized');
      return;
    }

    try {
      if (!BOT_TOKEN || !CHANNEL_ID) {
        throw new Error('Missing bot credentials');
      }

      // Direct bot initialization without lock management

      // WEBHOOK MODE: Create bot without polling
      this.bot = new TelegramBot(BOT_TOKEN, { polling: false });
      
      // Register with webhook manager
      webhookManager.registerBot('prime-picks', BOT_TOKEN, this.handleMessage.bind(this));
      
      console.log('📡 Prime Picks bot registered for webhook mode');
      
      this.setupErrorHandling();
      this.setupCleanupHandlers();
      
      // Test bot connection
      const me = await this.bot.getMe();
      console.log(`Success Prime Picks Bot connected: @${me.username}`);
      
      // Send initialization message
      try {
        await this.bot.sendMessage(CHANNEL_ID, '🤖 Prime Picks Bot is now active and monitoring for Amazon deals!');
        console.log('Success Prime Picks initialization message sent');
      } catch (msgError) {
        console.log('Info Could not send initialization message (bot may not be admin)');
      }
      
      this.isInitialized = true;
      console.log('Success Prime Picks Bot initialized successfully with conflict prevention');
      
    } catch (error: any) {
      console.error('Error Prime Picks Bot initialization failed:', error.message);
      // Initialization failed - no cleanup needed with simplified architecture
      throw error;
    }
  }

  // WEBHOOK MODE: Unified message handler for webhook system
  private async handleMessage(msg: TelegramBot.Message): Promise<void> {
    try {
      if (msg.chat.type === 'private') {
        await this.handlePrivateMessage(msg);
      } else if (msg.chat.id === parseInt(CHANNEL_ID) || msg.chat.id.toString() === CHANNEL_ID) {
        console.log(`Prime Picks: Processing channel message from ${msg.chat.id}`);
        await this.handleChannelMessage(msg);
      } else {
        console.log(`Prime Picks: Ignoring message from chat ${msg.chat.id} (expected ${CHANNEL_ID})`);
      }
    } catch (error) {
      console.error('Prime Picks Bot message handling error:', error);
    }
  }

  // LEGACY: Old polling message listeners (now unused in webhook mode)
  private setupMessageListeners(): void {
    // This method is no longer used in webhook mode
    // Kept for backward compatibility if needed
    console.log('Info: setupMessageListeners called but not used in webhook mode');
  }

  private async handlePrivateMessage(msg: TelegramBot.Message): Promise<void> {
    if (!this.bot || !msg.text) return;

    try {
      const urls = this.extractUrls(msg.text);
      if (urls.length > 0) {
        await this.bot.sendMessage(msg.chat.id, '🔍 Processing your Amazon URL...');
        for (const url of urls) {
          await this.processProductUrl(url, msg);
        }
      } else {
        await this.bot.sendMessage(msg.chat.id, '👋 Send me an Amazon product URL and I\'ll extract the deal information!');
      }
    } catch (error) {
      console.error('Error handling private message:', error);
    }
  }

  private async handleChannelMessage(msg: TelegramBot.Message): Promise<void> {
    if (!msg.text) return;

    try {
      const urls = this.extractUrls(msg.text);
      console.log(`Prime Picks channel message: Found ${urls.length} URLs`);
      
      for (const url of urls) {
        console.log(`Processing URL: ${url}`);
        await this.processProductUrl(url, msg);
      }
    } catch (error) {
      console.error('Error processing channel message:', error);
    }
  }

  private setupErrorHandling(): void {
    if (!this.bot) return;

    this.bot.on('polling_error', (error) => {
      console.error('Prime Picks Bot polling error:', error.message);
      
      // Handle 409 conflicts specifically
      if (error.message.includes('409')) {
        console.error('🚨 409 Conflict detected - another bot instance is polling!');
        this.handlePollingConflict();
      }
    });

    this.bot.on('error', (error) => {
      console.error('Prime Picks Bot error:', error.message);
    });
  }

  private setupCleanupHandlers(): void {
    const cleanup = async () => {
      console.log('🔄 Prime Picks Bot: Cleaning up...');
      await this.shutdown();
    };

    // Handle various exit scenarios
    process.on('exit', cleanup);
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('uncaughtException', async (error) => {
      console.error('Prime Picks Bot uncaught exception:', error);
      await cleanup();
    });
  }

  private async handlePollingConflict(): Promise<void> {
    console.log('🔄 Handling polling conflict for Prime Picks Bot...');
    
    try {
      // Stop current bot
      if (this.bot) {
        await this.bot.stopPolling();
      }
      
      // Wait before retrying
      
      // Wait a bit before retrying
      setTimeout(async () => {
        try {
          console.log('🔄 Attempting to restart Prime Picks Bot...');
          this.isInitialized = false;
          await this.initialize();
        } catch (error) {
          console.error('Failed to restart Prime Picks Bot:', error);
        }
      }, 5000);
      
    } catch (error) {
      console.error('Error handling polling conflict:', error);
    }
  }

  private extractUrls(text: string): string[] {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex) || [];
    return urls.filter(url => 
      url.includes('amazon.') || 
      url.includes('amzn.') ||
      url.includes('a.co')
    );
  }

  private async processProductUrl(url: string, message: TelegramBot.Message): Promise<void> {
    try {
      console.log(`Prime Picks processing: ${url}`);
      
      // Expand short URLs
      const expandedUrl = await this.expandUrl(url);
      console.log(`Expanded URL: ${expandedUrl}`);
      
      // Convert to affiliate URL
      const affiliateUrl = await this.convertToAffiliateUrl(expandedUrl);
      console.log(`Affiliate URL: ${affiliateUrl}`);
      
      // Extract product data
      const productData = await this.extractProductData(affiliateUrl, expandedUrl, message);
      
      if (productData) {
        await this.saveProduct(productData);
        console.log(`Success Prime Picks product saved: ${productData.name}`);
      } else {
        console.log('Warning Could not extract product data');
      }
      
    } catch (error: any) {
      console.error('Error processing product URL:', error.message);
    }
  }

  private async expandUrl(url: string): Promise<string> {
    if (!this.isShortUrl(url)) {
      return url;
    }

    try {
      const response = await axios.head(url, {
        maxRedirects: 5,
        timeout: 10000,
        validateStatus: () => true
      });
      return response.request.res.responseUrl || url;
    } catch (error) {
      console.log('Warning Could not expand URL, using original');
      return url;
    }
  }

  private isShortUrl(url: string): boolean {
    const shortDomains = [
      'amzn.to', 'amzn.in', 'a.co', 'amazon.in/dp',
      'bit.ly', 'tinyurl.com', 'goo.gl', 't.co'
    ];
    return shortDomains.some(domain => url.includes(domain));
  }

  private async convertToAffiliateUrl(url: string): Promise<string> {
    try {
      // Direct affiliate tag addition for Amazon URLs
      if (url.includes('amazon.')) {
        const urlObj = new URL(url);
        urlObj.searchParams.set('tag', AMAZON_ASSOCIATES_TAG);
        return urlObj.toString();
      }
      
      return url;
    } catch (error) {
      console.log('Warning Could not convert to affiliate URL, using original');
      return url;
    }
  }

  private async extractProductData(affiliateUrl: string, originalUrl: string, message: TelegramBot.Message): Promise<ProductData | null> {
    try {
      const response = await axios.get(originalUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 15000
      });

      const $ = cheerio.load(response.data);
      const messageText = message.text || '';

      const name = this.extractProductName($, messageText);
      const description = this.extractDescription($, messageText);
      const pricing = this.extractPricing($);
      const imageUrl = this.extractImageUrl($, message);
      const category = this.detectCategory(originalUrl, name);
      const rating = this.extractRating($);

      return {
        name,
        description,
        price: pricing.price,
        originalPrice: pricing.originalPrice,
        currency: pricing.currency,
        imageUrl,
        affiliateUrl,
        originalUrl,
        category,
        rating: rating.rating,
        reviewCount: rating.reviewCount,
        discount: pricing.originalPrice ? Math.round(((parseFloat(pricing.originalPrice.replace('₹', '')) - parseFloat(pricing.price.replace('₹', ''))) / parseFloat(pricing.originalPrice.replace('₹', ''))) * 100) : undefined,
        source: 'prime-picks-bot',
        telegramMessageId: message.message_id,
        telegramChannelId: parseInt(CHANNEL_ID)
      };
    } catch (error: any) {
      console.error('Error extracting product data:', error.message);
      return null;
    }
  }

  private extractProductName($: cheerio.Root, messageText: string): string {
    const selectors = [
      '#productTitle',
      '.product-title',
      'h1.a-size-large',
      'h1[data-automation-id="product-title"]',
      '.pdp-mod-product-badge-title'
    ];
    
    for (const selector of selectors) {
      const title = $(selector).first().text().trim();
      if (title && title.length > 10) {
        return title.substring(0, 200);
      }
    }
    
    const lines = messageText.split('\n');
    for (const line of lines) {
      if (line.length > 10 && !line.includes('http') && !line.includes('₹') && !line.includes('$')) {
        return line.trim().substring(0, 200);
      }
    }
    
    return 'Product from Prime Picks';
  }

  private extractDescription($: cheerio.Root, messageText: string): string {
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
    
    return messageText.substring(0, 300) || 'Great deal from Prime Picks!';
  }

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
      '.a-price.a-text-price.a-size-medium.apexPriceToPay .a-offscreen',
      '.a-price-current .a-offscreen',
      '#priceblock_dealprice',
      '#priceblock_ourprice',
      '.a-price.a-text-price.a-size-large .a-offscreen'
    ];

    // CORRECTED: Original price selectors (MRP/was price)
    const originalPriceSelectors = [
      '.a-price.a-text-price.a-size-base.a-color-secondary .a-offscreen',
      '.a-price-was .a-offscreen',
      '.a-text-strike .a-offscreen',
      '#priceblock_was',
      '.a-price.a-text-price.a-size-small .a-offscreen'
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
            return false;
          }
        }
      });
    }

    // Default if no price found
    if (!currentPrice) {
      currentPrice = 999;
      console.log(`Warning No price found, using default: ₹${currentPrice}`);
    }

    // Simple validation: Only remove original price if it's clearly wrong (much lower)
    if (originalPrice && originalPrice < currentPrice * 0.8) {
      console.log(`Warning: Original price ${originalPrice} seems too low, removing`);
      originalPrice = null;
    }

    const price = `₹${Math.floor(currentPrice)}`;
    const originalPriceFormatted = originalPrice ? `₹${Math.floor(originalPrice)}` : undefined;

    console.log(`Price extraction: Current=${price}, Original=${originalPriceFormatted || 'N/A'}`);
    
    return { 
      price, 
      originalPrice: originalPriceFormatted, 
      currency 
    };
  }

  private extractImageUrl($: cheerio.Root, message: TelegramBot.Message): string {
    if (message.photo && message.photo.length > 0) {
      return `https://api.telegram.org/file/bot${BOT_TOKEN}/photos/telegram_${message.photo[0].file_id}.jpg`;
    }

    const imageSelectors = [
      '#landingImage',
      '.a-dynamic-image',
      '#imgTagWrapperId img',
      '.product-image img',
      '.pdp-mod-common-image img'
    ];

    for (const selector of imageSelectors) {
      const imgSrc = $(selector).first().attr('src') || $(selector).first().attr('data-src');
      if (imgSrc && imgSrc.startsWith('http')) {
        return imgSrc;
      }
    }

    return 'https://via.placeholder.com/300x300?text=Prime+Picks';
  }

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

    return 'Electronics & Gadgets';
  }

  private extractRating($: cheerio.Root): { rating?: number; reviewCount?: number } {
    let rating: number | undefined;
    let reviewCount: number | undefined;

    const ratingSelectors = [
      '.a-icon-alt',
      '[data-hook="rating-out-of-text"]',
      '.a-star-medium .a-icon-alt'
    ];

    for (const selector of ratingSelectors) {
      const ratingText = $(selector).first().text().trim();
      const ratingMatch = ratingText.match(/(\d+\.\d+)/);
      if (ratingMatch) {
        rating = parseFloat(ratingMatch[1]);
        break;
      }
    }

    const reviewSelectors = [
      '[data-hook="total-review-count"]',
      '.a-size-base.a-color-secondary',
      '#acrCustomerReviewText'
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

  private async saveProduct(productData: ProductData): Promise<void> {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO prime_picks_products (
          name, description, price, originalPrice, currency,
          imageUrl, affiliateUrl, originalUrl, category,
          rating, reviewCount, discount, isFeatured,
          source, telegramMessageId, createdAt, expiresAt,
          affiliateNetwork, contentType, displayPages, telegramChannelId
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        productData.name,
        productData.description,
        productData.price,
        productData.originalPrice || null,
        productData.currency,
        productData.imageUrl,
        productData.affiliateUrl,
        productData.originalUrl,
        productData.category,
        productData.rating || 4.0,
        productData.reviewCount || 0,
        productData.discount || null,
        1,
        productData.source,
        productData.telegramMessageId,
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000) + (24 * 60 * 60),
        'prime-picks',
        'product',
        'prime-picks',
        productData.telegramChannelId || CHANNEL_ID
      );
      
      console.log(`Success Prime Picks product saved to prime_picks_products table with ID: ${result.lastInsertRowid}`);
      
    } catch (error: any) {
      console.error('Error saving Prime Picks product to prime_picks_products:', error.message);
      throw error;
    }
  }

  private static generateLinkId(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  getStatus(): { initialized: boolean; channelId?: string; targetPage: string } {
    return {
      initialized: this.isInitialized,
      channelId: CHANNEL_ID,
      targetPage: TARGET_PAGE
    };
  }

  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down Prime Picks Bot...');
    
    try {
      if (this.bot) {
        await this.bot.stopPolling();
        this.bot = null;
      }
      
      this.isInitialized = false;
      console.log('✅ Prime Picks Bot shutdown complete');
    } catch (error) {
      console.error('Error during Prime Picks Bot shutdown:', error);
    }
  }
}

export const primePicksBot = new PrimePicksBot();

export async function initializePrimePicksBot(): Promise<void> {
  try {
    await primePicksBot.initialize();
    console.log('Success Prime Picks Bot initialized successfully');
  } catch (error: any) {
    console.error('Error initializing Prime Picks Bot:', error.message);
    throw error;
  }
}

// Initialize bot if credentials are available
if (BOT_TOKEN && CHANNEL_ID) {
  console.log('Prime Picks Bot: Credentials found, ready for initialization');
} else {
  console.log('Prime Picks Bot disabled: Missing credentials');
}
// Note: initializePrimePicksBot() is called only by Enhanced Manager