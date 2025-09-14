/**
 * Cue Picks Telegram Bot Service
 * Handles automation for @cuelinkspnt channel -> cue-picks page
 * Features: Universal URL support, Cuelinks affiliate conversion, auto data/image fetching
 */

import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { db } from './db';
import { products } from '../shared/sqlite-schema';
import { eq } from 'drizzle-orm';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { detectService, getServiceCategory } from './utils/service-detector';

// Load Cue Picks environment variables
const cuePicksEnvPath = path.join(process.cwd(), '.env.cue-picks');
if (fs.existsSync(cuePicksEnvPath)) {
  dotenv.config({ path: cuePicksEnvPath });
}

// Bot Configuration
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN_CUE_PICKS;
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID_CUE_PICKS;
const CHANNEL_USERNAME = process.env.TELEGRAM_CHANNEL_CUE_PICKS;
const TARGET_PAGE = process.env.CUE_PICKS_TARGET_PAGE || 'cue-picks';
const BOT_USERNAME = process.env.CUE_PICKS_BOT_USERNAME || 'cuelinkspnt_bot';
const CHANNEL_NAME = process.env.CUE_PICKS_CHANNEL_NAME || 'Cuelinks PNT';

// Cuelinks Configuration
const CUELINKS_TEMPLATE = process.env.CUELINKS_AFFILIATE_URL_TEMPLATE || 'https://linksredirect.com/?cid=243942&source=linkkit&url=%7B%7BURL_ENC%7D%7D';
const CUELINKS_CID = process.env.CUELINKS_CID || '243942';
const CUELINKS_SOURCE = process.env.CUELINKS_SOURCE || 'linkkit';

if (!BOT_TOKEN || !CHANNEL_ID) {
  console.warn('Warning Cue Picks bot credentials not found in .env.cue-picks');
  console.warn('Blog Please check TELEGRAM_BOT_TOKEN_CUE_PICKS and TELEGRAM_CHANNEL_ID_CUE_PICKS');
  console.warn('🔧 Bot will be disabled until credentials are provided');
}

interface ProductData {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
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

// Import the proper drizzle insert type
import type { InsertProduct } from '../shared/sqlite-schema';

class CuePicksBot {
  private bot: TelegramBot | null = null;
  private isInitialized = false;

  /**
   * Initialize the Cue Picks Telegram bot
   */
  async initialize(): Promise<void> {
    if (!BOT_TOKEN || !CHANNEL_ID) {
      console.warn('Warning Cue Picks bot disabled - no credentials provided');
      console.warn('Blog Add credentials to .env.cue-picks to enable Cue Picks automation');
      return;
    }

    try {
      console.log('Link Initializing Cue Picks Telegram bot...');
      console.log(`Mobile Bot Token: ${BOT_TOKEN.substring(0, 10)}...`);
      console.log(`📺 Channel ID: ${CHANNEL_ID}`);
      console.log(`Target Target Page: ${TARGET_PAGE}`);
      
      // Use simple polling like Prime Picks (WORKING)
      this.bot = new TelegramBot(BOT_TOKEN, { polling: true });
      
      console.log('Search Testing Cue Picks bot connection...');
      
      // Test bot connection
      try {
        const botInfo = await this.bot.getMe();
        console.log('Success Cue Picks bot connected successfully!');
        console.log(`AI Bot: @${botInfo.username} (${botInfo.first_name})`);
        console.log(`Mobile Monitoring: ${CHANNEL_USERNAME} (${CHANNEL_ID})`);
        console.log(`Target Target: ${TARGET_PAGE} page`);
        console.log(`Link Features: Universal URL support, Cuelinks conversion, Auto data/image fetch`);
      } catch (error) {
        console.error('Error Cue Picks bot connection failed:', error);
        throw error;
      }
      
      this.setupMessageListeners();
      this.setupErrorHandling();
      
      this.isInitialized = true;
      console.log('Target Cue Picks bot fully initialized and ready for messages!');
      
      // Send startup notification
      try {
        await this.bot.sendMessage(CHANNEL_ID, 
          'Launch **Cue Picks Hybrid Bot Started!**\n\n' +
          'Success Universal URL processing active\n' +
          'Success Cuelinks affiliate conversion enabled\n' +
          'Success Auto data and image extraction\n' +
          'Success Smart category detection active\n\n' +
          'Target Ready to find the best Cue Picks deals!',
          { parse_mode: 'Markdown' }
        );
      } catch (error) {
        console.error('Failed to send Cue Picks startup notification:', error);
      }
      
    } catch (error) {
      console.error('Error Failed to initialize Cue Picks bot:', error);
      console.error('🔧 Please check bot token and channel permissions');
      throw error;
    }
  }

  /**
   * Set up message listeners for channel posts and private messages
   */
  private setupMessageListeners(): void {
    if (!this.bot) return;

    // Listen for channel posts
    this.bot.on('channel_post', async (msg) => {
      try {
        // Only process messages from our target channel
        if (msg.chat.id.toString() !== CHANNEL_ID) {
          return;
        }

        console.log('Mobile New message in Cue Picks channel:', {
          messageId: msg.message_id,
          text: msg.text?.substring(0, 100) + '...',
          hasPhoto: !!msg.photo,
          date: new Date(msg.date * 1000).toISOString()
        });

        await this.processChannelMessage(msg);
        
      } catch (error) {
        console.error('Error Error processing Cue Picks channel message:', error);
      }
    });

    // Listen for private messages (admin commands)
    this.bot.on('message', async (msg) => {
      try {
        // Skip channel posts (handled above)
        if (msg.chat.type === 'channel') return;
        
        // Handle private messages
        if (msg.chat.type === 'private' && msg.text === '/start') {
          await this.bot!.sendMessage(msg.chat.id, 
            `Link Cue Picks Bot Active!\n\n` +
            `Success Universal URL support enabled\n` +
            `Link Cuelinks affiliate conversion ready\n` +
            `Stats Auto data/image extraction active\n` +
            `Mobile Monitoring: ${CHANNEL_NAME}\n` +
            `Target Target: ${TARGET_PAGE} page`
          );
        }
      } catch (error) {
        console.error('Error Error handling Cue Picks private message:', error);
      }
    });
  }

  // Removed complex polling retry - using simple polling like Prime Picks

  /**
   * Set up error handling for the bot
   */
  private setupErrorHandling(): void {
    if (!this.bot) return;

    this.bot.on('polling_error', (error) => {
      console.error('Alert Cue Picks bot polling error:', error);
    });

    this.bot.on('webhook_error', (error) => {
      console.error('Alert Cue Picks bot webhook error:', error.message);
    });
  }

  /**
   * Process channel message and extract URLs
   */
  private async processChannelMessage(message: TelegramBot.Message): Promise<void> {
    const messageText = message.text || message.caption || '';
    
    if (!messageText) {
      console.log('⏭️ Skipping Cue Picks message without text content');
      return;
    }

    // Extract all URLs from message (supports any URL format)
    const urls = this.extractUrls(messageText);
    
    if (urls.length === 0) {
      console.log('⏭️ No URLs found in Cue Picks message');
      return;
    }

    console.log(`Search Found ${urls.length} URLs to process:`, urls);

    // Process each URL
    for (const url of urls) {
      try {
        await this.processProductUrl(url, message, messageText);
      } catch (error) {
        console.error(`Error Failed to process Cue Picks URL ${url}:`, error);
        // Continue with other URLs even if one fails
      }
    }
  }

  /**
   * Extract URLs from message text (supports any URL format)
   */
  private extractUrls(text: string): string[] {
    // Enhanced URL regex to catch various formats including shortened URLs
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*)/g;
    const matches = text.match(urlRegex) || [];
    
    return matches.map(url => {
      // Clean up URL (remove trailing punctuation)
      url = url.replace(/[.,;!?]$/, '');
      
      // Add protocol if missing
      if (!url.startsWith('http')) {
        url = 'https://' + url;
      }
      
      return url;
    });
  }

  /**
   * Process a product URL and add to database
   */
  private async processProductUrl(url: string, message: TelegramBot.Message, messageText: string): Promise<void> {
    console.log(`Link Processing Cue Picks URL: ${url}`);
    
    try {
      // Step 1: Expand shortened URLs
      const expandedUrl = await this.expandUrl(url);
      console.log(`Link Expanded URL: ${expandedUrl}`);
      
      // Step 2: Convert to Cuelinks affiliate URL
      const cuelinksUrl = this.convertToCuelinksUrl(expandedUrl);
      console.log(`Link Cuelinks URL: ${cuelinksUrl}`);
      
      // Step 3: Extract product data
      const productData = await this.extractProductData(expandedUrl, message, messageText, cuelinksUrl);
      
      if (productData) {
        // Step 4: Save to database
        await this.saveProduct(productData, message);
        console.log(`Success Cue Picks product saved: ${productData.name}`);
      } else {
        console.log('Warning Could not extract product data from Cue Picks URL');
      }
      
    } catch (error) {
      console.error(`Error Error processing Cue Picks URL ${url}:`, error);
      throw error;
    }
  }

  /**
   * Expand shortened URLs to get the final destination
   */
  private async expandUrl(url: string): Promise<string> {
    try {
      const response = await axios.head(url, {
        maxRedirects: 10, // Follow up to 10 redirects
        timeout: 10000,
        validateStatus: () => true // Accept any status code
      });
      
      // Get the final URL after all redirects
      const finalUrl = response.request.res.responseUrl || url;
      return finalUrl;
    } catch (error) {
      console.warn(`Warning Could not expand URL ${url}:`, error.message);
      return url; // Return original URL if expansion fails
    }
  }

  /**
   * Convert any URL to Cuelinks affiliate URL
   */
  private convertToCuelinksUrl(url: string): string {
    try {
      // Encode the URL for the Cuelinks template
      const encodedUrl = encodeURIComponent(url);
      
      // Replace the template placeholder with the encoded URL
      const cuelinksUrl = CUELINKS_TEMPLATE.replace('%7B%7BURL_ENC%7D%7D', encodedUrl);
      
      return cuelinksUrl;
    } catch (error) {
      console.error('Error Error converting to Cuelinks URL:', error);
      return url; // Return original URL if conversion fails
    }
  }

  /**
   * Extract product data from URL with auto data/image fetching
   */
  private async extractProductData(url: string, message: TelegramBot.Message, messageText: string, cuelinksUrl: string): Promise<ProductData | null> {
    try {
      console.log('Stats Extracting product data from:', url);
      
      // Fetch page content
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      
      // Extract product information
      const name = this.extractProductName($, messageText, url);
      const description = this.extractDescription($, messageText);
      const pricing = this.extractPricing($);
      const imageUrl = await this.extractImageUrl($, message);
      const detectedCategory = this.detectCategory(url, name);
      
      // 🛡️ ROBUST CATEGORY VALIDATION - Prevents business reputation damage
      let category = 'Electronics & Gadgets'; // Safe default
      try {
        const { validateProductCategory, ensureCategoryExists } = require('./utils/category-helper.js');
        const validatedCategory = validateProductCategory({
          name,
          description,
          category: detectedCategory,
          url
        });
        
        // Ensure the category exists in database
        ensureCategoryExists(validatedCategory);
        category = validatedCategory;
      } catch (error) {
        console.error('Error Category validation error:', error);
        // Use safe default if validation fails
      }
      
      const rating = this.extractRating($);
      
      console.log('Search Pricing extraction results:', {
        price: pricing.price,
        originalPrice: pricing.originalPrice,
        currency: pricing.currency
      });
      
      // Use extracted price from website with enhanced fallbacks
      let finalPrice = pricing.price;
      let finalOriginalPrice = pricing.originalPrice;
      
      // Enhanced fallback: If no original price found, try to estimate from common discount patterns
      if (!finalOriginalPrice && finalPrice > 0) {
        // Check if message contains discount percentage
        const discountMatch = messageText.match(/(\d+)%\s*(?:off|discount|save)/i);
        if (discountMatch) {
          const discountPercent = parseInt(discountMatch[1]);
          if (discountPercent > 0 && discountPercent < 90) {
            finalOriginalPrice = Math.round(finalPrice / (1 - discountPercent / 100));
            console.log(`Tip Estimated original price from ${discountPercent}% discount: ₹${finalOriginalPrice}`);
          }
        }
        
        // Check for common discount keywords and estimate
        const commonDiscounts = {
          'flat 50': 50, 'flat 40': 40, 'flat 30': 30, 'flat 25': 25, 'flat 20': 20,
          'upto 50': 40, 'upto 40': 30, 'upto 30': 25, 'save big': 30, 'mega sale': 35
        };
        
        for (const [keyword, estimatedDiscount] of Object.entries(commonDiscounts)) {
          if (messageText.toLowerCase().includes(keyword)) {
            finalOriginalPrice = Math.round(finalPrice / (1 - estimatedDiscount / 100));
            console.log(`Tip Estimated original price from keyword '${keyword}': ₹${finalOriginalPrice}`);
            break;
          }
        }
      }
      
      // If no price found from scraping, try message text only
      if (finalPrice === 0) {
        const messagePrice = this.extractPriceFromMessage(messageText);
        if (messagePrice && messagePrice > 0) {
          finalPrice = messagePrice;
          console.log(`Price Using price from message: ₹${finalPrice}`);
        } else {
          console.log(`Warning No price found - product will be created without price`);
          finalPrice = 0; // Keep as 0 if no price found
        }
      } else {
        console.log(`Price Using extracted price from website: ₹${finalPrice}`);
      }
      
      const productData: ProductData = {
        name,
        description,
        price: finalPrice,
        originalPrice: finalOriginalPrice,
        currency: pricing.currency,
        imageUrl,
        affiliateUrl: cuelinksUrl, // Use Cuelinks affiliate URL
        originalUrl: url,
        category,
        rating: rating.rating,
        reviewCount: rating.reviewCount,
        discount: finalOriginalPrice && finalPrice ? 
          Math.round(((finalOriginalPrice - finalPrice) / finalOriginalPrice) * 100) : undefined,
        source: 'cue-picks-telegram',
        telegramMessageId: message.message_id,
        telegramChannelId: parseInt(CHANNEL_ID!)
      };
      
      return productData;
      
    } catch (error) {
      console.error('Error Error extracting Cue Picks product data:', error);
      
      // Enhanced fallback: Create product from URL analysis and message text
      const urlBasedName = this.extractNameFromUrl(url);
      const messageBasedName = this.extractProductNameFromMessage(messageText);
      const finalName = messageBasedName || urlBasedName || 'Product from Cuelinks';
      
      const messageBasedPrice = this.extractPriceFromMessage(messageText);
      const urlBasedCategory = this.detectCategoryFromUrl(url);
      
      console.log(`Warning Using fallback data extraction for: ${url}`);
      console.log(`Blog Extracted name: ${finalName}`);
      console.log(`Price Extracted price: ${messageBasedPrice || 'Not found'}`);
      
      // Strict price validation for fallback too
      if (!messageBasedPrice || messageBasedPrice <= 0) {
        console.log('Error Fallback failed: No valid price in message text either');
        console.log('🚫 Skipping product creation to maintain pricing accuracy');
        return null; // Don't create product without valid price
      }
      
      return {
        name: finalName,
        description: this.extractDescriptionFromMessage(messageText) || `Product available via Cuelinks. Original URL: ${url}`,
        price: messageBasedPrice, // Only use if valid price found
        currency: 'INR',
        imageUrl: await this.extractImageFromMessage(message) || this.getDefaultImageForCategory(urlBasedCategory),
        affiliateUrl: cuelinksUrl,
        originalUrl: url,
        category: urlBasedCategory,
        rating: 4.2,
        reviewCount: 150,
        source: 'cue-picks-telegram',
        telegramMessageId: message.message_id,
        telegramChannelId: parseInt(CHANNEL_ID!)
      };
    }
  }

  /**
   * Extract product name from page content or message
   */
  private extractProductName($: cheerio.Root, messageText: string, url: string): string {
    // Try various selectors for product name
    const selectors = [
      'h1[data-automation-id="product-title"]', // Amazon
      '.pdp-product-name', // Flipkart
      'h1.product-title',
      '.product-name',
      'h1',
      'title'
    ];
    
    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length && element.text().trim()) {
        return element.text().trim().substring(0, 200);
      }
    }
    
    // Fallback to message text or URL
    return this.extractProductNameFromMessage(messageText) || 
           this.extractNameFromUrl(url) || 
           'Product from Cuelinks';
  }

  /**
   * Extract product name from message text
   */
  private extractProductNameFromMessage(text: string): string | null {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length > 0) {
      // Use first non-empty line as product name
      return lines[0].trim().replace(/[HotPrice⭐Target🛒]/g, '').trim().substring(0, 200);
    }
    return null;
  }

  /**
   * Extract name from URL with enhanced parsing
   */
  private extractNameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      
      // Extract meaningful part from URL path
      const parts = pathname.split('/').filter(part => part && part.length > 2);
      
      if (parts.length > 0) {
        // Get the most descriptive part (usually the longest or last meaningful part)
        let bestPart = parts[parts.length - 1];
        
        // If last part is too short, try to find a longer, more descriptive part
        for (const part of parts.reverse()) {
          if (part.length > bestPart.length && part.length > 10) {
            bestPart = part;
            break;
          }
        }
        
        // Clean up the extracted name
        return bestPart
          .replace(/[-_]/g, ' ') // Replace hyphens and underscores with spaces
          .replace(/\.[^.]*$/, '') // Remove file extension
          .replace(/\b\w/g, l => l.toUpperCase()) // Title case
          .replace(/\s+/g, ' ') // Clean multiple spaces
          .trim()
          .substring(0, 150); // Reasonable length limit
      }
      
      // Fallback to domain name
      return urlObj.hostname.replace('www.', '').replace('.com', '').replace('.in', '') + ' Product';
      
    } catch (error) {
      console.warn('Warning Could not extract name from URL:', url);
      return 'Product from Cuelinks';
    }
  }

  /**
   * Get default image for category
   */
  private getDefaultImageForCategory(category: string): string {
    const categoryImages = {
      'Electronics & Gadgets': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&q=80',
      'Fashion & Clothing': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80',
      'Home & Kitchen': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80',
      'Health & Beauty': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80',
      'Sports & Fitness': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80',
      'Books & Media': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&q=80',
      'Automotive': 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&q=80',
      'Toys & Games': 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400&q=80'
    };
    
    return categoryImages[category] || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&q=80';
  }

  /**
   * Get default price for category when price extraction fails
   */
  private getDefaultPriceForCategory(category: string): number {
    const defaultPrices = {
      'electronics': 89999, // TVs, phones, laptops (realistic for OLED TVs, premium phones)
      'fashion': 1299,      // Clothing, accessories
      'home': 2999,        // Furniture, decor
      'books': 399,        // Books, magazines
      'sports': 1999,      // Sports equipment
      'beauty': 899,       // Cosmetics, skincare
      'general': 1499      // General products
    };
    
    return defaultPrices[category] || defaultPrices['general'];
  }

  /**
   * Extract description from page or message
   */
  private extractDescription($: cheerio.Root, messageText: string): string {
    // Try meta description first
    const metaDesc = $('meta[name="description"]').attr('content');
    if (metaDesc && metaDesc.trim()) {
      return metaDesc.trim().substring(0, 500);
    }
    
    // Try product description selectors
    const descSelectors = [
      '.product-description',
      '.pdp-product-description',
      '[data-automation-id="product-overview"]',
      '.product-details'
    ];
    
    for (const selector of descSelectors) {
      const element = $(selector).first();
      if (element.length && element.text().trim()) {
        return element.text().trim().substring(0, 500);
      }
    }
    
    // Fallback to message text
    return this.extractDescriptionFromMessage(messageText) || 'Product available via Cuelinks';
  }

  /**
   * Extract description from message text
   */
  private extractDescriptionFromMessage(text: string): string | null {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length > 1) {
      return lines.slice(1, 3).join(' ').trim().substring(0, 500);
    }
    return null;
  }

  /**
   * Extract pricing information
   */
  private extractPricing($: cheerio.Root): { price: number; originalPrice?: number; currency: string } {
    // Comprehensive price selectors for various e-commerce sites
    const priceSelectors = [
      // Amazon selectors
      '.a-price-whole',
      '.a-price .a-offscreen',
      '.a-price-range .a-price .a-offscreen',
      '#priceblock_dealprice',
      '#priceblock_ourprice',
      '.a-price.a-text-price.a-size-medium.apexPriceToPay .a-offscreen',
      
      // Flipkart selectors
      '.pdp-price',
      '._30jeq3._16Jk6d',
      '._30jeq3',
      '.CEmiEU .Nx9bqj',
      
      // Samsung specific selectors
      '.pd-price-current',
      '.price-display',
      '.price-value',
      '.product-price-value',
      '.price-amount',
      '.current-price-value',
      '[data-price-value]',
      '.price-container .price',
      
      // LG and other brand selectors
      '.price-current',
      '.product-price',
      '.final-price',
      '.regular-price',
      '.amount',
      '[class*="price"]',
      '[id*="price"]',
      
      // Generic e-commerce selectors
      '.current-price',
      '.sale-price',
      '.selling-price',
      '.price-now',
      '.offer-price',
      '.discounted-price',
      '[data-price]',
      '[data-testid="price"]',
      '.price',
      '.cost',
      '.amount-value',
      
      // JSON-LD structured data
      'script[type="application/ld+json"]'
    ];
    
    let price = 0; // Start with 0, will be set properly
    let originalPrice: number | undefined;
    
    // Try to extract price with enhanced logic
    for (const selector of priceSelectors) {
      const priceElement = $(selector).first();
      if (priceElement.length) {
        let priceText = priceElement.text().trim();
        
        // If no text, try data attributes
        if (!priceText) {
          priceText = priceElement.attr('data-price') || priceElement.attr('content') || '';
        }
        
        if (priceText) {
          const extractedPrice = this.extractPriceFromText(priceText);
          if (extractedPrice > 0) {
            price = extractedPrice;
            console.log(`Success Price extracted: ₹${price} from selector: ${selector}`);
            break;
          }
        }
      }
    }
    
    // If no price found from selectors, try meta tags and structured data
    if (price === 0) {
      // Try meta tags first
      const metaSelectors = [
        'meta[property="product:price:amount"]',
        'meta[property="og:price:amount"]',
        'meta[name="price"]',
        'meta[itemprop="price"]'
      ];
      
      for (const selector of metaSelectors) {
        const element = $(selector).first();
        if (element.length) {
          const metaPrice = this.extractPriceFromText(element.attr('content') || '');
          if (metaPrice > 0) {
            price = metaPrice;
            console.log(`Success Price from meta tag: ₹${price}`);
            break;
          }
        }
      }
      
      // Try JSON-LD structured data
      if (price === 0) {
        $('script[type="application/ld+json"]').each((_, element) => {
          try {
            const jsonText = $(element).html();
            if (jsonText) {
              const jsonData = JSON.parse(jsonText);
              
              // Handle different JSON-LD structures
              const extractPriceFromJson = (obj: any): number => {
                if (obj.offers) {
                  if (Array.isArray(obj.offers)) {
                    for (const offer of obj.offers) {
                      if (offer.price || offer.priceSpecification?.price) {
                        const priceValue = offer.price || offer.priceSpecification.price;
                        const extractedPrice = this.extractPriceFromText(priceValue.toString());
                        if (extractedPrice > 0) return extractedPrice;
                      }
                    }
                  } else if (obj.offers.price || obj.offers.priceSpecification?.price) {
                    const priceValue = obj.offers.price || obj.offers.priceSpecification.price;
                    const extractedPrice = this.extractPriceFromText(priceValue.toString());
                    if (extractedPrice > 0) return extractedPrice;
                  }
                }
                if (obj.price) {
                  const extractedPrice = this.extractPriceFromText(obj.price.toString());
                  if (extractedPrice > 0) return extractedPrice;
                }
                return 0;
              };
              
              if (Array.isArray(jsonData)) {
                for (const item of jsonData) {
                  const extractedPrice = extractPriceFromJson(item);
                  if (extractedPrice > 0) {
                    price = extractedPrice;
                    console.log(`Success Price from JSON-LD array: ₹${price}`);
                    return false; // Break out of each loop
                  }
                }
              } else {
                const extractedPrice = extractPriceFromJson(jsonData);
                if (extractedPrice > 0) {
                  price = extractedPrice;
                  console.log(`Success Price from JSON-LD: ₹${price}`);
                  return false; // Break out of each loop
                }
              }
            }
          } catch (e) {
            // Ignore JSON parse errors
          }
        });
      }
    }
    
    // Enhanced original price selectors with comprehensive coverage
    const originalPriceSelectors = [
      // Amazon original price selectors
      '.a-price.a-text-price .a-offscreen',
      '.a-price.a-text-price.a-size-base .a-offscreen',
      '.a-price.a-text-price.a-size-small .a-offscreen',
      '.a-price.a-text-price.a-size-medium .a-offscreen',
      '#listPriceValue',
      '.a-price-was .a-offscreen',
      '.a-price-list .a-offscreen',
      
      // Flipkart original price selectors
      '.pdp-mrp',
      '._3I9_wc._2p6lqe',
      '._3I9_wc',
      '.CEmiEU ._3auQ3N',
      '._16Jk6d',
      '.CEmiEU .yRaY8j',
      '._3tbKJL',
      
      // Myntra original price
      '.pdp-mrp',
      '.price-mrp',
      '.product-discountedPrice',
      
      // Ajio original price
      '.prod-sp',
      '.price-mrp',
      
      // Nykaa original price
      '.css-1d0jf8e',
      '.price-mrp',
      
      // Samsung, LG, OnePlus official stores
      '.price-was',
      '.price-before',
      '.original-price',
      '.strike-price',
      '.crossed-price',
      '.price-strikethrough',
      
      // Generic e-commerce original price selectors
      '.price-original',
      '.was-price',
      '.regular-price',
      '.list-price',
      '.mrp',
      '.old-price',
      '.crossed-price',
      '.strike-through',
      '.strikethrough',
      '.price-before-discount',
      '.original-amount',
      '.before-price',
      '.previous-price',
      '.retail-price',
      '.msrp',
      '[data-original-price]',
      '[data-was-price]',
      '[data-list-price]',
      '[data-mrp]',
      '.price del',
      '.price s',
      'del.price',
      's.price',
      
      // CSS class patterns for strikethrough prices
      '[class*="strike"]',
      '[class*="cross"]',
      '[class*="was"]',
      '[class*="original"]',
      '[class*="mrp"]',
      '[class*="list-price"]'
    ];
    
    console.log('Search Searching for original price with', originalPriceSelectors.length, 'selectors');
    
    for (const selector of originalPriceSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`Target Found ${elements.length} elements for selector: ${selector}`);
        
        elements.each((index, element) => {
          const originalPriceText = $(element).text().trim();
          console.log(`   Element ${index + 1}: "${originalPriceText}"`);
          
          if (originalPriceText) {
            const extractedOriginalPrice = this.extractPriceFromText(originalPriceText);
            console.log(`   Extracted price: ₹${extractedOriginalPrice}`);
            
            if (extractedOriginalPrice > price) {
              originalPrice = extractedOriginalPrice;
              console.log(`Success Original price found: ₹${originalPrice} from selector: ${selector}`);
              return false; // Break out of each loop
            }
          }
        });
        
        if (originalPrice) break;
      }
    }
    
    if (!originalPrice) {
      console.log('Warning No original price found from any selector');
    }
    
    // If still no price found, return 0 (will be handled by fallback logic)
    if (price === 0) {
      console.log('Warning No price found from any selector or meta tag');
    }
    
    return {
      price: price > 0 ? price : 0, // Return 0 if no valid price found
      originalPrice,
      currency: 'INR' // Default to INR, can be enhanced to detect currency
    };
  }

  /**
   * Extract price from text with enhanced accuracy
   */
  private extractPriceFromText(text: string): number {
    if (!text || typeof text !== 'string') return 0;
    
    // Enhanced price extraction patterns
    const pricePatterns = [
      // Indian Rupee patterns
      /₹\s*([0-9,]+(?:\.[0-9]{1,2})?)/g,
      /Rs\.?\s*([0-9,]+(?:\.[0-9]{1,2})?)/gi,
      /INR\s*([0-9,]+(?:\.[0-9]{1,2})?)/gi,
      
      // Dollar patterns
      /\$\s*([0-9,]+(?:\.[0-9]{1,2})?)/g,
      /USD\s*([0-9,]+(?:\.[0-9]{1,2})?)/gi,
      
      // Price with labels
      /Price[:\s]*₹?\s*([0-9,]+(?:\.[0-9]{1,2})?)/gi,
      /Cost[:\s]*₹?\s*([0-9,]+(?:\.[0-9]{1,2})?)/gi,
      /Amount[:\s]*₹?\s*([0-9,]+(?:\.[0-9]{1,2})?)/gi,
      
      // Generic number patterns (as fallback)
      /([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:₹|Rs|INR|\$|USD)?/g,
      
      // Price with decimal points
      /([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/g
    ];
    
    for (const pattern of pricePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        // Clean the matched price string
        const cleanPrice = match[1].replace(/,/g, '').trim();
        const price = parseFloat(cleanPrice);
        
        // Validate price range with minimum threshold to avoid extraction errors
        if (!isNaN(price) && price >= 50 && price <= 1000000) {
          console.log(`Price Price extracted: ₹${price} from text: "${text.substring(0, 50)}..."`); 
          return Math.round(price); // Round to nearest rupee
        } else if (!isNaN(price) && price > 0 && price < 50) {
          console.log(`Warning Price too low (₹${price}), likely extraction error - ignoring`);
        }
      }
    }
    
    console.log(`Warning No valid price found in text: "${text.substring(0, 50)}..."`);
    return 0;
  }

  /**
   * Extract price from message text
   */
  private extractPriceFromMessage(text: string): number | null {
    const pricePatterns = [
      /₹\s*(\d+(?:,\d+)*)/,
      /Price[:\s]*₹\s*(\d+(?:,\d+)*)/i,
      /Rs\.?\s*(\d+(?:,\d+)*)/i,
      /\$(\d+(?:,\d+)*)/,
      /(\d+(?:,\d+)*)\s*₹/
    ];
    
    for (const pattern of pricePatterns) {
      const match = text.match(pattern);
      if (match) {
        return parseInt(match[1].replace(/,/g, ''));
      }
    }
    
    return null;
  }

  /**
   * Extract image URL from page or message
   */
  private async extractImageUrl($: cheerio.Root, message: TelegramBot.Message): Promise<string> {
    // Try product image selectors
    const imageSelectors = [
      '#landingImage', // Amazon
      '.pdp-image img', // Flipkart
      '.product-image img',
      '.main-image img',
      'img[data-automation-id="product-image"]',
      'meta[property="og:image"]'
    ];
    
    for (const selector of imageSelectors) {
      const element = $(selector).first();
      let imageUrl = '';
      
      if (selector.includes('meta')) {
        imageUrl = element.attr('content') || '';
      } else {
        imageUrl = element.attr('src') || element.attr('data-src') || '';
      }
      
      if (imageUrl && this.isValidImageUrl(imageUrl)) {
        // Convert relative URLs to absolute
        if (imageUrl.startsWith('//')) {
          imageUrl = 'https:' + imageUrl;
        } else if (imageUrl.startsWith('/')) {
          // Would need base URL to convert, skip for now
          continue;
        }
        return imageUrl;
      }
    }
    
    // Fallback to message photo or default image
    try {
      const messageImageUrl = await this.extractImageFromMessage(message);
      return messageImageUrl || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&q=80';
    } catch (error) {
      return 'https://images.unsplash.com/photo-1560472354-b43ff0c44a43?w=400&q=80';
    }
  }

  /**
   * Extract image from Telegram message
   */
  private async extractImageFromMessage(message: TelegramBot.Message): Promise<string | null> {
    if (message.photo && message.photo.length > 0 && this.bot) {
      try {
        const photo = message.photo[message.photo.length - 1]; // Get highest resolution
        const fileLink = await this.bot.getFileLink(photo.file_id);
        return fileLink;
      } catch (error) {
        console.warn('Warning Could not get photo from Cue Picks message:', error);
      }
    }
    return null;
  }

  /**
   * Check if URL is a valid image URL
   */
  private isValidImageUrl(url: string): boolean {
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url) || 
           url.includes('image') || 
           url.includes('img') ||
           url.includes('photo');
  }

  /**
   * Detect product category from URL and name
   */
  private detectCategory(url: string, name: string): string {
    const categoryMap = {
      'electronics': ['electronics', 'mobile', 'phone', 'laptop', 'computer', 'gadget', 'tech', 'camera', 'headphone', 'speaker', 'tv', 'television', 'oled', 'led', 'smart', 'samsung', 'lg', 'sony', 'apple', 'iphone', 'macbook', 'ipad'],
      'fashion': ['fashion', 'clothing', 'shirt', 'dress', 'shoes', 'apparel', 'wear', 'style', 'tshirt', 't-shirt', 'jeans', 'jacket'],
      'home': ['home', 'kitchen', 'furniture', 'decor', 'appliance', 'cookware', 'pressure', 'cooker', 'stand', 'rack'],
      'beauty': ['health', 'beauty', 'skincare', 'makeup', 'cosmetic', 'wellness'],
      'sports': ['sports', 'fitness', 'gym', 'exercise', 'workout', 'athletic'],
      'books': ['book', 'media', 'entertainment', 'music', 'movie'],
      'automotive': ['car', 'auto', 'vehicle', 'bike', 'motorcycle'],
      'toys': ['toy', 'game', 'kids', 'children', 'baby']
    };

    const searchText = (url + ' ' + name).toLowerCase();
    
    for (const [category, keywords] of Object.entries(categoryMap)) {
      if (keywords.some(keyword => searchText.includes(keyword))) {
        return category;
      }
    }
    
    return 'general'; // Default category
  }

  /**
   * Detect category from URL with enhanced detection
   */
  private detectCategoryFromUrl(url: string): string {
    const urlLower = url.toLowerCase();
    
    // Electronics
    if (urlLower.includes('laptop') || urlLower.includes('computer') || urlLower.includes('acer') || 
        urlLower.includes('dell') || urlLower.includes('hp') || urlLower.includes('lenovo') ||
        urlLower.includes('electronics') || urlLower.includes('mobile') || urlLower.includes('phone') ||
        urlLower.includes('tablet') || urlLower.includes('gadget') || urlLower.includes('tech') ||
        urlLower.includes('camera') || urlLower.includes('headphone') || urlLower.includes('speaker') ||
        urlLower.includes('processor') || urlLower.includes('intel') || urlLower.includes('amd') ||
        urlLower.includes('nvidia') || urlLower.includes('geforce') || urlLower.includes('rtx') ||
        urlLower.includes('tv') || urlLower.includes('television') || urlLower.includes('oled') ||
        urlLower.includes('samsung') || urlLower.includes('lg') || urlLower.includes('sony') ||
        urlLower.includes('apple') || urlLower.includes('iphone') || urlLower.includes('macbook')) {
      return 'electronics';
    }
    
    // Fashion
    if (urlLower.includes('fashion') || urlLower.includes('clothing') || urlLower.includes('shirt') ||
        urlLower.includes('dress') || urlLower.includes('shoes') || urlLower.includes('apparel') ||
        urlLower.includes('wear') || urlLower.includes('style') || urlLower.includes('jeans') ||
        urlLower.includes('jacket') || urlLower.includes('sneakers')) {
      return 'fashion';
    }
    
    // Home
    if (urlLower.includes('home') || urlLower.includes('kitchen') || urlLower.includes('furniture') ||
        urlLower.includes('decor') || urlLower.includes('appliance') || urlLower.includes('cookware') ||
        urlLower.includes('mattress') || urlLower.includes('sofa') || urlLower.includes('chair') ||
        urlLower.includes('pressure') || urlLower.includes('cooker') || urlLower.includes('stand')) {
      return 'home';
    }
    
    // Beauty
    if (urlLower.includes('health') || urlLower.includes('beauty') || urlLower.includes('skincare') ||
        urlLower.includes('makeup') || urlLower.includes('cosmetic') || urlLower.includes('wellness') ||
        urlLower.includes('supplement') || urlLower.includes('vitamin')) {
      return 'beauty';
    }
    
    // Sports
    if (urlLower.includes('sports') || urlLower.includes('fitness') || urlLower.includes('gym') ||
        urlLower.includes('exercise') || urlLower.includes('workout') || urlLower.includes('athletic') ||
        urlLower.includes('running') || urlLower.includes('yoga')) {
      return 'sports';
    }
    
    // Books
    if (urlLower.includes('book') || urlLower.includes('media') || urlLower.includes('entertainment') ||
        urlLower.includes('music') || urlLower.includes('movie') || urlLower.includes('dvd') ||
        urlLower.includes('kindle') || urlLower.includes('ebook')) {
      return 'books';
    }
    
    // Automotive
    if (urlLower.includes('car') || urlLower.includes('auto') || urlLower.includes('vehicle') ||
        urlLower.includes('bike') || urlLower.includes('motorcycle') || urlLower.includes('automotive') ||
        urlLower.includes('parts') || urlLower.includes('accessories')) {
      return 'automotive';
    }
    
    // Toys
    if (urlLower.includes('toy') || urlLower.includes('game') || urlLower.includes('kids') ||
        urlLower.includes('children') || urlLower.includes('baby') || urlLower.includes('play') ||
        urlLower.includes('puzzle') || urlLower.includes('doll')) {
      return 'toys';
    }
    
    // Default based on common e-commerce sites
    if (urlLower.includes('amazon') || urlLower.includes('flipkart')) {
      return 'electronics'; // Most common category
    }
    
    return 'general';
  }

  /**
   * Extract rating and review information
   */
  private extractRating($: cheerio.Root): { rating?: number; reviewCount?: number } {
    let rating: number | undefined;
    let reviewCount: number | undefined;
    
    // Try rating selectors
    const ratingSelectors = [
      '.a-icon-alt', // Amazon
      '.pdp-rating', // Flipkart
      '.rating-value',
      '.star-rating'
    ];
    
    for (const selector of ratingSelectors) {
      const ratingText = $(selector).first().text().trim();
      if (ratingText) {
        const ratingMatch = ratingText.match(/(\d+(?:\.\d+)?)/);
        if (ratingMatch) {
          rating = parseFloat(ratingMatch[1]);
          break;
        }
      }
    }
    
    // Try review count selectors
    const reviewSelectors = [
      '#acrCustomerReviewText', // Amazon
      '.pdp-review-count', // Flipkart
      '.review-count',
      '.reviews-count'
    ];
    
    for (const selector of reviewSelectors) {
      const reviewText = $(selector).first().text().trim();
      if (reviewText) {
        const reviewMatch = reviewText.match(/(\d+(?:,\d+)*)/);
        if (reviewMatch) {
          reviewCount = parseInt(reviewMatch[1].replace(/,/g, ''));
          break;
        }
      }
    }
    
    return {
      rating: rating || 4.0, // Default rating
      reviewCount: reviewCount || 100 // Default review count
    };
  }

  /**
   * Save product to database
   */
  private async saveProduct(productData: ProductData, message: TelegramBot.Message): Promise<void> {
    try {
      console.log('Save Saving Cue Picks product with pricing:', {
        name: productData.name,
        price: productData.price,
        originalPrice: productData.originalPrice,
        discount: productData.discount
      });
      
      // Search Service Detection - Check if this product is actually a service
      const serviceDetection = detectService(productData.name, productData.description);
      let finalCategory = productData.category;
      let isService = false;
      
      if (serviceDetection.isService) {
        finalCategory = 'Service'; // Override category for services page (professional look)
        isService = true;
        console.log('🔧 Service detected:', {
          name: productData.name,
          serviceCategory: serviceDetection.serviceCategory,
          confidence: serviceDetection.confidence
        });
      }
      
      // Map ProductData to drizzle InsertProduct type with correct field names
      const dbProductData: InsertProduct = {
        name: productData.name,
        description: productData.description,
        price: productData.price, // Keep as number - schema expects numeric type
        original_price: productData.originalPrice || null, // Use snake_case for database field
        currency: productData.currency,
        image_url: productData.imageUrl, // Use snake_case for database field
        affiliate_url: productData.affiliateUrl, // Use snake_case for database field
        category: finalCategory, // Use detected service category or original category
        rating: productData.rating || 0, // Keep as number - schema expects numeric type
        review_count: productData.reviewCount || 0, // Use snake_case for database field
        discount: productData.discount || null,
        source: productData.source,
        is_new: false, // Default to false - only set to true for genuinely new products
        is_featured: false, // Default to false - only set to true for genuinely featured products
        is_service: isService ? 1 : 0, // Mark as service if detected
        display_pages: JSON.stringify([TARGET_PAGE]), // Use snake_case for database field
        created_at: Math.floor(Date.now() / 1000), // Use unix timestamp
        expires_at: Math.floor((Date.now() + 24 * 60 * 60 * 1000) / 1000), // Use snake_case and unix timestamp
        telegram_message_id: message.message_id // Use snake_case for database field
        // Note: telegram_channel_id field doesn't exist in products schema
      };
      
      // Use direct SQL INSERT to save to cuelinks_products table
      const Database = require('better-sqlite3');
      const sqliteDb = new Database('./database.sqlite');
      
      const stmt = sqliteDb.prepare(`
        INSERT INTO cuelinks_products (
          name, description, price, original_price, currency,
          image_url, affiliate_url, original_url, category,
          rating, review_count, discount, is_featured,
          source, telegram_message_id, processing_status,
          created_at, content_type, affiliate_network
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        productData.name,
        productData.description,
        productData.price,
        productData.originalPrice || null,
        productData.currency,
        productData.imageUrl,
        productData.affiliateUrl,
        productData.originalUrl,
        finalCategory,
        productData.rating || 4.0,
        productData.reviewCount || 0,
        productData.discount || null,
        isService ? 1 : 0,
        'cue-picks-bot',
        message.message_id,
        'active',
        Math.floor(Date.now() / 1000),
        isService ? 'service' : 'product',
        'cuelinks'
      );
      
      sqliteDb.close();
      console.log('Success Cue Picks product saved to cuelinks_products table');
      
    } catch (error) {
      console.error('Error Error saving Cue Picks product:', error);
      throw error;
    }
  }

  /**
   * Get bot status
   */
  getStatus(): { initialized: boolean; channelId?: string; targetPage: string; features: string[] } {
    return {
      initialized: this.isInitialized,
      channelId: CHANNEL_ID,
      targetPage: TARGET_PAGE,
      features: [
        'Universal URL Support',
        'Shortened URL Expansion', 
        'Cuelinks Affiliate Conversion',
        'Auto Data Extraction',
        'Auto Image Fetching',
        '24-hour Cookie Expiry'
      ]
    };
  }

  /**
   * Shutdown the bot
   */
  async shutdown(): Promise<void> {
    if (this.bot) {
      await this.bot.stopPolling();
      this.bot = null;
      this.isInitialized = false;
      console.log('Link Cue Picks bot shut down');
    }
  }
}

// Export singleton instance
export const cuePicksBot = new CuePicksBot();

// Enhanced Manager Integration - Export initialization function
export async function initializeCuePicksBot(): Promise<void> {
  try {
    console.log('Launch Initializing Cue Picks Bot with Enhanced Manager...');
    await cuePicksBot.initialize();
    console.log('Success Cue Picks Bot initialized successfully');
  } catch (error) {
    console.error('Error Failed to initialize Cue Picks Bot:', error);
    throw error;
  }
}

// Note: Initialization is handled by TelegramManager to prevent conflicts
if (BOT_TOKEN && CHANNEL_ID) {
  console.log('Link Cue Picks Telegram automation ready');
} else {
  console.log('Warning Cue Picks automation disabled - missing credentials');
}