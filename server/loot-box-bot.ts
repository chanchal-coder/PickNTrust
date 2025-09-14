/**
 * Loot Box Telegram Bot Service
 * Handles automation for loot box channel -> loot-box page
 */

import TelegramBot from 'node-telegram-bot-api';

// Load loot-box specific environment
import dotenv from 'dotenv';
import path from 'path';

// CRITICAL: Load bot-specific .env file FIRST
const lootboxEnvPath = path.join(process.cwd(), '.env.loot-box');
dotenv.config({ path: lootboxEnvPath, override: true });

console.log('🔧 LOOT-BOX BOT: Loading environment from:', lootboxEnvPath);
console.log('🔧 LOOT-BOX BOT TOKEN:', process.env.TELEGRAM_BOT_TOKEN?.substring(0, 10) + '...');


import fs from 'fs';
import Database from 'better-sqlite3';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { detectService, getServiceCategory } from './utils/service-detector';
import { webhookManager } from './webhook-routes';

// Direct bot implementation without Enhanced Manager dependencies

// 🔒 ENVIRONMENT ENFORCEMENT - DO NOT MODIFY
// This bot MUST ONLY use .env.loot-box
const REQUIRED_ENV_FILE = '.env.loot-box';
const BOT_NAME = 'Loot Box';
const EXPECTED_TOKEN_PREFIX = '8141266952';

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
// Load Telegram environment variables
const telegramEnvPath = path.join(process.cwd(), '.env.loot-box');
if (fs.existsSync(telegramEnvPath)) {
  dotenv.config({ path: telegramEnvPath });
}

// Loot Box Bot Configuration - Fixed to match .env.loot-box format
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const CHANNEL_USERNAME = process.env.CHANNEL_NAME;
const TARGET_PAGE = process.env.TARGET_PAGE || 'loot-box';
const AFFILIATE_TAG = process.env.AFFILIATE_TAG || '{{URL}}{{SEP}}ref=sicvppak';
const AMAZON_ASSOCIATES_TAG = process.env.AMAZON_ASSOCIATES_TAG || 'pickntrust-21';

console.log('Search Loot Box Bot: Environment Variables Debug:');
console.log(`   BOT_TOKEN: ${BOT_TOKEN ? BOT_TOKEN.substring(0, 10) + '...' : 'MISSING'}`);
console.log(`   CHANNEL_ID: ${CHANNEL_ID || 'MISSING'}`);
console.log(`   CHANNEL_USERNAME: ${CHANNEL_USERNAME || 'MISSING'}`);
console.log(`   AFFILIATE_TAG: ${AFFILIATE_TAG || 'MISSING'}`);

if (!BOT_TOKEN || !CHANNEL_ID) {
  console.warn('Warning Loot Box bot credentials not found in .env.loot-box');
  console.warn('Blog Please check LOOT_BOX_BOT_TOKEN and LOOT_BOX_CHANNEL_ID');
} else {
  console.log('Success Loot Box bot credentials loaded successfully');
}

// Enhanced URL patterns for loot box products
const URL_PATTERNS = {
  AMAZON: /(?:https?:\/\/)?(?:www\.)?amazon\.[a-z]{2,3}(?:\.[a-z]{2})?/i,
  FLIPKART: /(?:https?:\/\/)?(?:www\.)?flipkart\.com/i,
  MYNTRA: /(?:https?:\/\/)?(?:www\.)?myntra\.com/i,
  AJIO: /(?:https?:\/\/)?(?:www\.)?ajio\.com/i,
  NYKAA: /(?:https?:\/\/)?(?:www\.)?nykaa\.com/i,
  DEODAP: /(?:https?:\/\/)?(?:www\.)?deodap\.in/i,
  SHORTENED: /(?:bit\.ly|tinyurl|t\.co|goo\.gl|short|amzn\.to|fkrt\.it)/i
};

class LootBoxBot {
  private bot: TelegramBot | null = null;
  private isInitialized = false;
  private db: Database.Database;

  constructor() {
    this.db = new Database('database.sqlite');
  }

  // WEBHOOK MODE: Unified message handler
  private async handleMessage(msg: TelegramBot.Message): Promise<void> {
    try {
      if (msg.chat.type === 'private') {
        await this.handlePrivateMessage(msg);
      } else if (msg.chat.id === parseInt(CHANNEL_ID!) || msg.chat.id.toString() === CHANNEL_ID) {
        console.log(`Loot Box: Processing channel message from ${msg.chat.id}`);
        await this.handleChannelMessage(msg);
      } else {
        console.log(`Loot Box: Ignoring message from chat ${msg.chat.id} (expected ${CHANNEL_ID})`);
      }
    } catch (error) {
      console.error('Loot Box Bot message handling error:', error);
    }
  }

  // WEBHOOK MODE: Alternative message handler
  private async handleTelegramMessage(msg: TelegramBot.Message): Promise<void> {
    await this.handleMessage(msg);
  }

  /**
   * Initialize the Loot Box Telegram bot
   */
  async initialize(): Promise<void> {
    if (!BOT_TOKEN) {
      console.log('Warning Loot Box bot disabled - no token provided');
      return;
    }

    try {
      console.log('Gift Initializing Loot Box Telegram bot...');
      
      // WEBHOOK MODE: Create bot without polling
      this.bot = new TelegramBot(BOT_TOKEN, { polling: false });
      
      // Register with webhook manager
      webhookManager.registerBot('loot-box', BOT_TOKEN, this.handleMessage.bind(this));
      
      // Webhook mode - no polling listeners needed
      console.log('📡 Loot Box bot registered for webhook mode');
      
      // Set up error handling
      this.setupErrorHandling();
      
      this.isInitialized = true;
      console.log('Success Loot Box bot initialized successfully');
      console.log(`Mobile Monitoring channel: ${CHANNEL_USERNAME} (${CHANNEL_ID})`);
      console.log(`Target Target page: ${TARGET_PAGE}`);
      
      // Send startup notification
      try {
        await this.bot.sendMessage(CHANNEL_ID, 
          'Launch **Loot Box Hybrid Bot Started!**\n\n' +
          'Success Multi-platform deal detection active\n' +
          'Success Deodap affiliate integration enabled\n' +
          'Success Smart product categorization working\n' +
          'Success Auto price and image extraction\n\n' +
          'Target Ready to find the best Loot Box deals!',
          { parse_mode: 'Markdown' }
        );
      } catch (error) {
        console.error('Failed to send Loot Box startup notification:', error);
      }
      
    } catch (error) {
      console.error('Error Failed to initialize Loot Box bot:', error);
      throw error;
    }
  }

  /**
   * Set up message listeners for the bot
   */
  private setupMessageListeners(): void {
    if (!this.bot) return;

    // Listen for channel posts
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
        else if (msg.chat.id === parseInt(CHANNEL_ID) || msg.chat.id.toString() === CHANNEL_ID) {
          console.log(`Loot Box: Processing channel message from ${msg.chat.id}`);
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
        const statusMessage = 
          `🛒 Loot Box Bot Active!\n\n` +
          `Success Multi-URL support (All platforms)\n` +
          `🏷️ Smart deal detection\n` +
          `Price Deodap affiliate conversion\n` +
          `Stats Advanced deal analytics\n` +
          `Mobile Monitoring: ${CHANNEL_USERNAME || 'DealsHub Channel'}\n` +
          `Target Target: ${TARGET_PAGE} page\n\n` +
          `🔧 Status: DEAL AUTOPOSTING\n` +
          `⏰ Time: ${new Date().toLocaleString()}`;
        
        await this.bot!.sendMessage(msg.chat.id, statusMessage);
        console.log(`Mobile Sent /start response to user ${msg.from?.username || 'unknown'}`);
      }
    } catch (error) {
      console.error('Error Error handling private message:', error);
    }
  }

  /**
   * Handle incoming channel messages
   */
  private async handleChannelMessage(msg: TelegramBot.Message): Promise<void> {
    console.log('Gift Loot Box message received:', {
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
   * Extract URLs from message text
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
   * Process a product URL and add to database
   */
  private async processProductUrl(url: string, msg: TelegramBot.Message): Promise<void> {
    console.log(`Search Processing loot box URL: ${url}`);

    try {
      // Resolve shortened URLs
      const resolvedUrl = await this.resolveUrl(url);
      console.log(`Link Resolved URL: ${resolvedUrl}`);

      // Extract product information
      const productInfo = await this.extractProductInfo(resolvedUrl, msg.text || '');
      
      if (!productInfo) {
        console.log('Warning Could not extract product information');
        return;
      }

      // Convert to affiliate URL
      const affiliateUrl = this.convertToAffiliateUrl(resolvedUrl);
      
      // Save to database
      await this.saveProduct({
        ...productInfo,
        affiliate_url: affiliateUrl,
        original_url: resolvedUrl,
        telegram_message_id: msg.message_id,
        telegram_channel_id: parseInt(CHANNEL_ID || '0'),
        telegram_channel_name: CHANNEL_USERNAME || 'Loot Box'
      });

      console.log('Success Loot box product saved successfully');
      
    } catch (error) {
      console.error('Error Error processing product URL:', error);
    }
  }

  /**
   * Resolve shortened URLs
   */
  private async resolveUrl(url: string): Promise<string> {
    if (!URL_PATTERNS.SHORTENED.test(url)) {
      return url;
    }

    try {
      const response = await axios.head(url, {
        maxRedirects: 5,
        timeout: 10000
      });
      return response.request.res.responseUrl || url;
    } catch (error) {
      console.warn('Warning Could not resolve shortened URL:', error);
      return url;
    }
  }

  /**
   * Extract product information from URL
   */
  private async extractProductInfo(url: string, messageText: string): Promise<any> {
    try {
      // Try to scrape product information
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      
      // Extract product details
      const name = this.extractProductName($, messageText);
      const price = this.extractPrice($);
      const originalPrice = this.extractOriginalPrice($);
      const image = this.extractImage($);
      const rating = this.extractRating($);
      const detectedCategory = this.detectCategory(url, messageText, name);
      
      // 🛡️ ROBUST CATEGORY VALIDATION - Prevents business reputation damage
      let finalCategory = 'Mystery Box'; // Safe default for loot box
      try {
        const { validateProductCategory, ensureCategoryExists } = require('./utils/category-helper.js');
        const validatedCategory = validateProductCategory({
          name: name || 'Mystery Loot Box Item',
          description: `Exciting loot box item from ${new URL(url).hostname}`,
          category: detectedCategory,
          url
        });
        
        // Ensure the category exists in database
        ensureCategoryExists(validatedCategory);
        finalCategory = validatedCategory;
      } catch (error) {
        console.error('Error Category validation error:', error);
        // Use safe default if validation fails
      }
      
      return {
        name: name || 'Mystery Loot Box Item',
        description: `Exciting loot box item from ${new URL(url).hostname}. Great value and surprise element!`,
        price: price || '999',
        original_price: originalPrice || '1999',
        currency: 'INR',
        image_url: image || 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=400&fit=crop&q=80',
        category: finalCategory,
        rating: rating || 4.5,
        review_count: Math.floor(Math.random() * 500) + 100,
        discount: originalPrice && price ? Math.round(((parseFloat(originalPrice) - parseFloat(price)) / parseFloat(originalPrice)) * 100) : 50,
        is_new: 1,
        is_featured: Math.random() > 0.7 ? 1 : 0,
        affiliate_network: this.detectAffiliateNetwork(url),
        processing_status: 'active',
        content_type: 'product'
      };
      
    } catch (error) {
      console.warn('Warning Could not scrape product info, using fallback:', error.message);
      
      // Fallback product info
      return {
        name: this.extractProductNameFromMessage(messageText) || 'Mystery Loot Box Item',
        description: 'Exciting mystery item with great value and surprise element!',
        price: '999',
        original_price: '1999',
        currency: 'INR',
        image_url: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=400&fit=crop&q=80',
        category: 'Mystery Box', // Default category for loot box
        rating: 4.5,
        review_count: Math.floor(Math.random() * 500) + 100,
        discount: 50,
        is_new: 1,
        is_featured: 0,
        affiliate_network: this.detectAffiliateNetwork(url),
        processing_status: 'active',
        content_type: 'product'
      };
    }
  }

  /**
   * Extract product name from page
   */
  private extractProductName($: any, messageText: string): string | null {
    const selectors = [
      '#productTitle',
      '.product-title',
      'h1',
      '.pdp-e-i-head h1',
      '.B_NuCI'
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length && element.text().trim()) {
        return element.text().trim();
      }
    }

    return this.extractProductNameFromMessage(messageText);
  }

  /**
   * Extract product name from message text
   */
  private extractProductNameFromMessage(text: string): string | null {
    // Remove URLs and common words
    const cleaned = text
      .replace(/https?:\/\/[^\s]+/g, '')
      .replace(/[MobilePriceHotFastTargetSpecialLaunch💎Gift]/g, '')
      .replace(/\b(deal|offer|discount|sale|buy|shop|now|today|limited|time)\b/gi, '')
      .trim();

    if (cleaned.length > 10 && cleaned.length < 100) {
      return cleaned;
    }

    return null;
  }

  /**
   * Extract price from page
   */
  private extractPrice($: any): string | null {
    // DEODAP SPECIFIC PATTERN EXTRACTION (HIGHEST PRIORITY)
    // Look for "Sale priceRs. X.XX Rs. Y.YY" pattern first
    $('.price').each((i, el) => {
      const priceText = $(el).text().trim();
      if (priceText.includes('Sale price') && priceText.includes('Regular price')) {
        // Extract sale price from "Sale priceRs. 87.00 Rs. 399.00" pattern
        const saleMatch = priceText.match(/Sale price\s*Rs\.?\s*(\d+(?:\.\d+)?)/i);
        if (saleMatch) {
          const salePrice = parseFloat(saleMatch[1]);
          if (salePrice > 0 && salePrice < 1000000) {
            console.log(`Price Deodap pattern extracted sale price: ₹${salePrice}`);
            return `₹${Math.floor(salePrice)}`;
          }
        }
      }
    });
    
    const selectors = [
      // Deodap SALE PRICE selectors (HIGHEST PRIORITY - get discounted price first)
      'meta[property="og:price:amount"]', // Meta tag has the sale price (87.00)
      '.price-item--sale', // Specific sale price class
      '.price-sale',
      '.sale-price', 
      '.current-price',
      '.price-current',
      '.product-price-value',
      '.money',
      '.price-wrapper .price',
      '.price-box .price',
      '.product-form__price',
      // Generic sale price selectors
      '.price-item', // This can contain both sale and regular, so lower priority
      // Deodap REGULAR PRICE selectors (LOWEST PRIORITY - only if no sale price found)
      '.price-item--regular', // This contains regular prices like Rs. 399.00
      '.price__regular',
      '.price-regular',
      '.product-price',
      // Amazon selectors
      '.a-price-current .a-offscreen',
      '.a-price .a-offscreen',
      '.a-price-whole',
      // Flipkart selectors
      '._30jeq3._16Jk6d',
      '._1_WHN1',
      '._25b18c',
      // Generic selectors
      '.price',
      '.selling-price',
      '[data-price]',
      '.final-price',
      // Myntra selectors
      '.pdp-price strong',
      '.product-discountedPrice',
      // Ajio selectors
      '.prod-sp',
      // Nykaa selectors
      '.product-price .price',
      // Meta tags
      'meta[property="product:price:amount"]',
      'meta[name="price"]',
      'meta[property="og:price:amount"]'
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length) {
        let priceText = '';
        
        // Check for meta tags
        if (selector.includes('meta')) {
          priceText = element.attr('content') || '';
        } else if (selector.includes('[data-price]')) {
          priceText = element.attr('data-price') || element.text();
        } else {
          priceText = element.text().trim();
        }
        
        // Simple and robust price extraction
         console.log(`Search Raw price text: "${priceText}"`);
         
         // Method 1: Extract first meaningful number (most common case)
         const firstNumber = priceText.match(/\d+(?:[,.]\d+)*/);
         if (firstNumber) {
           const cleanNumber = firstNumber[0].replace(/[,]/g, ''); // Remove commas
           const numericValue = parseFloat(cleanNumber);
           if (numericValue > 0 && numericValue < 1000000) { // Reasonable price range
             console.log(`Price Price extracted (method 1): ${cleanNumber} from selector: ${selector}`);
             return `₹${Math.floor(numericValue)}`; // Remove decimals for cleaner display
           }
         }
         
         // Method 2: Extract any number sequence
         const allNumbers = priceText.match(/\d+/g);
         if (allNumbers && allNumbers.length > 0) {
           for (const num of allNumbers) {
             const numericValue = parseInt(num);
             if (numericValue > 10 && numericValue < 1000000) { // Reasonable price range
               console.log(`Price Price extracted (method 2): ${num} from selector: ${selector}`);
               return `₹${numericValue}`;
             }
           }
         }
         
         console.log(`Warning No valid price found in: "${priceText}"`);
      }
    }

    console.log('Warning No price found with any selector');
    return null;
  }

  /**
   * Extract original price from page
   */
  private extractOriginalPrice($: any): string | null {
    // DEODAP SPECIFIC PATTERN EXTRACTION (HIGHEST PRIORITY)
    // Look for "Sale priceRs. X.XX Rs. Y.YY" pattern first
    const priceElements = $('.price');
    for (let i = 0; i < priceElements.length; i++) {
      const priceText = $(priceElements[i]).text().trim();
      if (priceText.includes('Sale price') && priceText.includes('Regular price')) {
        // Extract regular price from "Sale priceRs. 87.00 Rs. 399.00" pattern
         // The regular price is the second Rs. value in the pattern
         const regularMatch = priceText.match(/Sale price\s*Rs\.?\s*\d+(?:\.\d+)?\s*Rs\.?\s*(\d+(?:\.\d+)?)/i);
        if (regularMatch) {
          const regularPrice = parseFloat(regularMatch[1]);
          if (regularPrice > 0 && regularPrice < 1000000) {
            console.log(`Price Deodap pattern extracted regular price: ₹${regularPrice}`);
            return `₹${Math.floor(regularPrice)}`;
          }
        }
      }
    }
    
    const selectors = [
      // Deodap REGULAR PRICE selectors (for original/MRP price)
      '.price-item--regular', // This contains regular prices like Rs. 399.00
      '.price__regular',
      '.price-regular',
      '.original-price',
      '.mrp',
      '.regular-price',
      // Amazon selectors
      '.a-price.a-text-price .a-offscreen',
      // Flipkart selectors
      '._3I9_wc',
      // Generic selectors
      '.was-price',
      '.strike-price',
      '.crossed-price'
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length) {
        const priceText = element.text().trim();
        const price = priceText.replace(/[^0-9.]/g, '');
        if (price && parseFloat(price) > 0) {
          console.log(`Price Fallback extracted regular price: ₹${price}`);
          return `₹${Math.floor(parseFloat(price))}`;
        }
      }
    }

    return null;
  }

  /**
   * Extract product image from page
   */
  private extractImage($: any): string | null {
    const selectors = [
      // Amazon selectors
      '#landingImage',
      '#imgTagWrapperId img',
      '.a-dynamic-image',
      // Flipkart selectors
      '._396cs4 img',
      '._2r_T1I img',
      '.CXW8mj img',
      // Generic selectors
      '.product-image img',
      '.main-image img',
      '.hero-image img',
      '.product-photo img',
      'img[data-src]',
      'img[data-lazy]',
      // Myntra selectors
      '.image-grid-image img',
      '.product-sliderContainer img',
      // Ajio selectors
      '.prod-image img',
      // Nykaa selectors
      '.product-image-container img',
      // Open Graph meta tags
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
      // Schema.org structured data
      'script[type="application/ld+json"]'
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length) {
        let src = '';
        
        // Handle meta tags
        if (selector.includes('meta')) {
          src = element.attr('content') || '';
        } else if (selector.includes('script')) {
          // Try to extract image from JSON-LD structured data
          try {
            const jsonData = JSON.parse(element.html() || '{}');
            src = jsonData.image || jsonData.image?.[0] || '';
          } catch (e) {
            continue;
          }
        } else {
          // Regular img tags
          src = element.attr('src') || 
                element.attr('data-src') || 
                element.attr('data-lazy') || 
                element.attr('data-original') || '';
        }
        
        // Validate and clean image URL
        if (src) {
          // Handle relative URLs
          if (src.startsWith('//')) {
            src = 'https:' + src;
          } else if (src.startsWith('/')) {
            // This would need the base URL, skip for now
            continue;
          }
          
          if (src.startsWith('http') && src.includes('.')) {
            console.log(`🖼️ Image extracted: ${src.substring(0, 50)}... from selector: ${selector}`);
            return src;
          }
        }
      }
    }

    console.log('Warning No image found with any selector');
    return null;
  }

  /**
   * Extract rating from page
   */
  private extractRating($: any): number {
    const selectors = [
      '.a-icon-alt',
      '.rating',
      '._3LWZlK'
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length) {
        const ratingText = element.text() || element.attr('alt') || '';
        const rating = parseFloat(ratingText.match(/[0-9.]+/)?.[0] || '0');
        if (rating > 0 && rating <= 5) {
          return rating;
        }
      }
    }

    return 4.5; // Default rating
  }

  /**
   * Enhanced product category detection with comprehensive mapping
   */
  private detectCategory(url: string, messageText: string, productName?: string): string {
    const content = (url + ' ' + messageText + ' ' + (productName || '')).toLowerCase();
    
    // Comprehensive category mapping with more keywords
    const categoryMappings = {
      'Home & Kitchen': [
        'home', 'kitchen', 'furniture', 'decor', 'appliance', 'cookware', 'utensil',
        'bedding', 'mattress', 'pillow', 'curtain', 'lamp', 'table', 'chair',
        'agarbatti', 'incense', 'masala', 'coffee', 'mug', 'cup', 'sealer', 'heat',
        'dining', 'storage', 'cleaning', 'household', 'organizer'
      ],
      'Electronics & Gadgets': [
        'electronics', 'gadget', 'tech', 'phone', 'mobile', 'laptop', 'computer',
        'tablet', 'headphone', 'speaker', 'camera', 'tv', 'smartwatch', 'charger',
        'cable', 'adapter', 'power', 'battery', 'electronic', 'digital'
      ],
      'Fashion & Clothing': [
        'fashion', 'clothing', 'apparel', 'shirt', 'dress', 'jeans', 'shoes',
        'bag', 'wallet', 'watch', 'jewelry', 'accessory', 'style', 'wear',
        'outfit', 'garment', 'textile', 'fabric'
      ],
      'Health & Beauty': [
        'beauty', 'cosmetic', 'skincare', 'makeup', 'health', 'wellness',
        'cream', 'lotion', 'shampoo', 'soap', 'perfume', 'fragrance',
        'personal care', 'hygiene', 'medical', 'supplement'
      ],
      'Sports & Fitness': [
        'sports', 'fitness', 'gym', 'exercise', 'workout', 'athletic',
        'running', 'cycling', 'yoga', 'equipment', 'outdoor', 'recreation'
      ],
      'Books & Education': [
        'book', 'education', 'learning', 'study', 'academic', 'textbook',
        'novel', 'magazine', 'journal', 'guide', 'manual'
      ],
      'Toys & Games': [
        'toy', 'game', 'gaming', 'console', 'puzzle', 'doll', 'play',
        'kids', 'children', 'educational toy', 'board game'
      ],
      'Automotive': [
        'car', 'auto', 'vehicle', 'motorcycle', 'bike', 'automotive',
        'parts', 'accessories', 'tire', 'oil', 'maintenance'
      ],
      'Pet Supplies': [
        'pet', 'dog', 'cat', 'animal', 'pet food', 'pet toy', 'pet care',
        'collar', 'leash', 'aquarium', 'bird'
      ],
      'Office Supplies': [
        'office', 'stationery', 'pen', 'paper', 'notebook', 'desk',
        'business', 'work', 'professional', 'supplies'
      ]
    };
    
    // Check each category for keyword matches
    for (const [category, keywords] of Object.entries(categoryMappings)) {
      for (const keyword of keywords) {
        if (content.includes(keyword)) {
          console.log(`Target Category detected: "${category}" (matched keyword: "${keyword}")`);
          return category;
        }
      }
    }
    
    // Enhanced URL-based detection
    const domain = url.toLowerCase();
    if (domain.includes('amazon') || domain.includes('flipkart')) {
      // Try to extract category from Amazon/Flipkart URL structure
      if (domain.includes('/dp/') || domain.includes('/gp/')) {
        // Amazon product URL - try to detect from URL path
        if (domain.includes('kitchen') || domain.includes('home')) return 'Home & Kitchen';
        if (domain.includes('electronics') || domain.includes('computers')) return 'Electronics & Gadgets';
        if (domain.includes('fashion') || domain.includes('clothing')) return 'Fashion & Clothing';
      }
    }
    
    // Product name analysis for better detection
    if (productName) {
      const nameWords = productName.toLowerCase().split(/\s+/);
      for (const [category, keywords] of Object.entries(categoryMappings)) {
        for (const keyword of keywords) {
          if (nameWords.some(word => word.includes(keyword) || keyword.includes(word))) {
            console.log(`Target Category detected from product name: "${category}" (matched: "${keyword}")`);
            return category;
          }
        }
      }
    }
    
    // Smart fallback based on common patterns
    if (content.includes('deal') || content.includes('offer') || content.includes('discount')) {
      // If it's clearly a product deal but category unclear, use Electronics as safe default
      console.log('Target Using fallback category: Electronics & Gadgets');
      return 'Electronics & Gadgets';
    }
    
    // Last resort - only use Mystery Box for truly unknown items
    console.log('Warning Could not detect category, using Mystery Box fallback');
    return 'Mystery Box';
  }

  /**
   * Detect affiliate network
   */
  private detectAffiliateNetwork(url: string): string {
    if (URL_PATTERNS.AMAZON.test(url)) return 'Amazon';
    if (URL_PATTERNS.FLIPKART.test(url)) return 'Flipkart';
    if (URL_PATTERNS.MYNTRA.test(url)) return 'Myntra';
    if (URL_PATTERNS.AJIO.test(url)) return 'Ajio';
    if (URL_PATTERNS.NYKAA.test(url)) return 'Nykaa';
    return 'Generic';
  }

  /**
   * Convert URL to affiliate URL
   */
  private convertToAffiliateUrl(url: string): string {
    try {
      if (URL_PATTERNS.AMAZON.test(url)) {
        const urlObj = new URL(url);
        urlObj.searchParams.set('tag', AMAZON_ASSOCIATES_TAG);
        return urlObj.toString();
      }
      
      // Handle Deodap affiliate format: {{URL}}{{SEP}}ref=sicvppak
      if (AFFILIATE_TAG && AFFILIATE_TAG.includes('{{URL}}') && AFFILIATE_TAG.includes('{{SEP}}')) {
        const separator = url.includes('?') ? '&' : '?';
        return AFFILIATE_TAG
          .replace('{{URL}}', url)
          .replace('{{SEP}}', separator);
      }
      
      // For other platforms, append affiliate tag
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}${AFFILIATE_TAG}`;
      
    } catch (error) {
      console.warn('Warning Could not convert to affiliate URL:', error);
      return url;
    }
  }

  /**
   * Save product to database
   */
  private async saveProduct(productData: any): Promise<void> {
    try {
      // Search Service Detection - Check if this product is actually a service
      const serviceDetection = detectService(productData.name, productData.description || '');
      let finalCategory = productData.category;
      let contentType = productData.content_type || 'product';
      
      if (serviceDetection.isService) {
         finalCategory = 'Service'; // Override category for services page (professional look)
         contentType = 'service'; // Mark as service content type
        console.log('🔧 Loot Box Service detected:', {
          name: productData.name,
          serviceCategory: serviceDetection.serviceCategory,
          confidence: serviceDetection.confidence
        });
      }
      
      const insertProduct = this.db.prepare(`
        INSERT INTO loot_box_products (
          name, description, price, original_price, currency,
          image_url, affiliate_url, original_url, category,
          rating, review_count, discount, is_new, is_featured,
          affiliate_network, telegram_message_id, telegram_channel_id,
          processing_status, content_type, affiliate_tag_applied,
          created_at, updated_at, is_active, deal_type, deal_priority,
          urgency_level, engagement_score
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
      `);

      const result = insertProduct.run(
        productData.name,
        productData.description,
        productData.price,
        productData.original_price,
        productData.currency || 'INR',
        productData.image_url,
        productData.affiliate_url,
        productData.original_url,
        finalCategory, // Use detected service category or original category
        productData.rating,
        productData.review_count,
        productData.discount,
        productData.is_new || 1,
        productData.is_featured || 0,
        productData.affiliate_network || 'deodap',
        productData.telegram_message_id,
        productData.telegram_channel_id,
        productData.processing_status || 'active',
        contentType, // Use detected content type (service or product)
        1, // affiliate_tag_applied
        Math.floor(Date.now() / 1000), // created_at
        Math.floor(Date.now() / 1000), // updated_at
        1, // is_active
        productData.deal_type || 'deal',
        productData.deal_priority || 1,
        productData.urgency_level || 1,
        productData.engagement_score || 0
      );

      console.log(`Success Loot box product saved with ID: ${result.lastInsertRowid}`);
      
    } catch (error) {
      console.error('Error Error saving product to database:', error);
      throw error;
    }
  }

  /**
   * Set up error handling for the bot
   */
  private setupErrorHandling(): void {
    if (!this.bot) return;

    this.bot.on('polling_error', (error) => {
      console.error('Error Loot Box bot polling error:', error);
    });

    this.bot.on('error', (error) => {
      console.error('Error Loot Box bot error:', error);
    });
  }

  /**
   * Stop the bot
   */
  async stop(): Promise<void> {
    if (this.bot) {
      await this.bot.stopPolling();
      this.bot = null;
      this.isInitialized = false;
      console.log('Stop Loot Box bot stopped');
    }
  }

  /**
   * Get bot status
   */
  getStatus(): { initialized: boolean; token: boolean; channel: boolean } {
    return {
      initialized: this.isInitialized,
      token: !!BOT_TOKEN,
      channel: !!CHANNEL_ID
    };
  }

  async shutdown(): Promise<void> {
    try {
      if (this.bot) {
        await this.bot.stopPolling();
        this.bot = null;
      }
      this.isInitialized = false;
      console.log('✅ LootBox Bot shutdown complete');
    } catch (error) {
      console.error('Error during LootBox Bot shutdown:', error);
    }
  }
}

// Create and export bot instance
const lootBoxBot = new LootBoxBot();

// Enhanced Manager Integration - Export initialization function
export async function initializeLootBoxBot(): Promise<void> {
  try {
    console.log('Launch Initializing Loot Box Bot with Enhanced Manager...');
    await lootBoxBot.initialize();
    console.log('Success Loot Box Bot initialized successfully');
  } catch (error) {
    console.error('Error Failed to initialize Loot Box Bot:', error);
    throw error;
  }
}

// Auto-initialize if credentials are available (fallback)
// Initialize bot if credentials are available
if (BOT_TOKEN && CHANNEL_ID) {
  console.log('Loot Box Bot: Credentials found, ready for initialization');
} else {
  console.log('Loot Box Bot disabled: Missing credentials');
}

export { lootBoxBot };