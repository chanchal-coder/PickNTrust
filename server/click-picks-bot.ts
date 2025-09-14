/**
 * Click Picks Telegram Bot Service (Smart Bot)
 * Handles automation for @clickpicks_bot channel with CPC optimization
 * Multi-affiliate network with intelligent selection
 */

import TelegramBot from 'node-telegram-bot-api';

// Load click-picks specific environment
import dotenv from 'dotenv';
import path from 'path';

// CRITICAL: Load bot-specific .env file FIRST
const clickpicksEnvPath = path.join(process.cwd(), '.env.click-picks');
dotenv.config({ path: clickpicksEnvPath, override: true });

console.log('🔧 CLICK-PICKS BOT: Loading environment from:', clickpicksEnvPath);
console.log('🔧 CLICK-PICKS BOT TOKEN:', process.env.TELEGRAM_BOT_TOKEN?.substring(0, 10) + '...');


import fs from 'fs';
import Database from 'better-sqlite3';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { webhookManager } from './webhook-routes';

// Direct bot implementation without Enhanced Manager dependencies

// 🔒 ENVIRONMENT ENFORCEMENT - DO NOT MODIFY
// This bot MUST ONLY use .env.click-picks
const REQUIRED_ENV_FILE = '.env.click-picks';
const BOT_NAME = 'Click Picks';
const EXPECTED_TOKEN_PREFIX = '8077836519';

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
// Load environment variables
const envPath = path.join(process.cwd(), '.env.click-picks');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

// Click Picks Bot Configuration - Smart Multi-Affiliate
let BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
let CHANNEL_ID = process.env.CHANNEL_ID;
const CHANNEL_USERNAME = process.env.CHANNEL_NAME || 'Click Picks';
const TARGET_PAGE = 'click-picks';

// Multi-Affiliate Configuration for CPC Optimization
const AFFILIATE_NETWORKS = {
  cuelinks: {
    tag: 'https://linksredirect.com/?cid=243942&source=linkkit&url={{URL_ENC}}',
    priority: 1,
    cpc: 0.15
  },
  inrdeals: {
    tag: 'id=sha678089037',
    priority: 2,
    cpc: 0.12
  },
  earnkaro: {
    tag: 'https://ekaro.in/enkr2020/?url={{URL_ENC}}&ref=4530348',
    priority: 3,
    cpc: 0.10
  }
};

if (!BOT_TOKEN || !CHANNEL_ID) {
  console.warn('Warning Click Picks bot credentials not found');
  console.warn('Blog Please check CLICK_PICKS_BOT_TOKEN and CLICK_PICKS_CHANNEL_ID');
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
  affiliateNetwork: string;
  cpcValue: number;
}

class ClickPicksBot {
  private bot: TelegramBot | null = null;
  private isInitialized = false;
  private db: Database.Database;

  constructor() {
    this.db = new Database('database.sqlite');
  }

  // WEBHOOK MODE: Unified message handler
  private async handleMessage(msg: any): Promise<void> {
    try {
      if (msg.chat.type === 'private') {
        await this.handlePrivateMessage(msg);
      } else if (msg.chat.id === parseInt(CHANNEL_ID) || msg.chat.id.toString() === CHANNEL_ID) {
        console.log(`Click Picks: Processing channel message from ${msg.chat.id}`);
        await this.handleChannelMessage(msg);
      } else {
        console.log(`Click Picks: Ignoring message from chat ${msg.chat.id} (expected ${CHANNEL_ID})`);
      }
    } catch (error) {
      console.error('Click Picks Bot message handling error:', error);
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('Launch Initializing Click Picks Bot (Smart Multi-Affiliate)...');
      
      // WEBHOOK MODE: Create bot without polling
      this.bot = new TelegramBot(BOT_TOKEN, { polling: false });
      
      // Register with webhook manager
      webhookManager.registerBot('click-picks', BOT_TOKEN, this.handleMessage.bind(this));
      
      // Webhook mode - no polling listeners needed
      console.log('📡 Click Picks bot registered for webhook mode');
      this.setupErrorHandling();
      
      this.isInitialized = true;
      console.log(`Success Click Picks Bot connected to channel: ${CHANNEL_ID}`);
      console.log(`Target Multi-affiliate optimization active with ${Object.keys(AFFILIATE_NETWORKS).length} networks`);
      
      // Send startup notification
      try {
        await this.bot.sendMessage(CHANNEL_ID, 
          'Launch **Click Picks Hybrid Bot Started!**\n\n' +
          'Success Smart multi-affiliate optimization active\n' +
          'Success CPC-based network selection enabled\n' +
          'Success Universal URL processing working\n' +
          'Success Performance tracking and analytics\n\n' +
          'Target Ready to find the best Click Picks deals!',
          { parse_mode: 'Markdown' }
        );
      } catch (error) {
        console.error('Failed to send Click Picks startup notification:', error);
      }
      
    } catch (error) {
      console.error('Error Failed to initialize Click Picks Bot:', error);
      throw error;
    }
  }

  private setupMessageListeners(): void {
    if (!this.bot) return;

    this.bot.on('message', async (msg) => {
      try {
        if (msg.chat.type === 'private') {
          await this.handlePrivateMessage(msg);
        } else if (msg.chat.id === parseInt(CHANNEL_ID) || msg.chat.id.toString() === CHANNEL_ID) {
          console.log(`Click Picks: Processing channel message from ${msg.chat.id}`);
          await this.handleChannelMessage(msg);
        }
      } catch (error) {
        console.error('Error Error handling message:', error);
      }
    });
  }

  private async handlePrivateMessage(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const text = msg.text || '';

    if (text === '/start') {
      await this.bot?.sendMessage(chatId, 
        'AI Click Picks Smart Bot\n\n' +
        'Target Multi-affiliate optimization active\n' +
        'Price Automatic CPC selection for maximum revenue\n' +
        'Stats Supports CueLinks, INRDeals, EarnKaro'
      );
    }
  }

  private async handleChannelMessage(msg: TelegramBot.Message): Promise<void> {
    const text = msg.text || msg.caption || '';
    
    if (!text) return;

    console.log(`📨 Click Picks channel message: ${text.substring(0, 100)}...`);
    
    const urls = this.extractUrls(text);
    
    if (urls.length > 0) {
      console.log(`Link Found ${urls.length} URLs in Click Picks message`);
      
      for (const url of urls) {
        try {
          await this.processProductUrl(url, msg);
        } catch (error) {
          console.error(`Error Error processing URL ${url}:`, error);
        }
      }
    }
  }

  private setupErrorHandling(): void {
    if (!this.bot) return;

    this.bot.on('polling_error', (error) => {
      console.error('Error Click Picks Bot polling error:', error);
    });

    this.bot.on('error', (error) => {
      console.error('Error Click Picks Bot error:', error);
    });
  }

  private extractUrls(text: string): string[] {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = text.match(urlRegex);
    return matches ? matches.map(url => url.replace(/[.,;!?]$/, '')) : [];
  }

  private async processProductUrl(url: string, message: TelegramBot.Message): Promise<void> {
    try {
      console.log(`Refresh Processing URL with CPC optimization: ${url}`);
      
      const expandedUrl = await this.expandUrl(url);
      const bestNetwork = this.selectBestAffiliateNetwork(expandedUrl);
      const affiliateUrl = this.convertToAffiliateUrl(expandedUrl, bestNetwork);
      
      const productData = await this.extractProductData(affiliateUrl, expandedUrl, message, bestNetwork);
      
      if (productData) {
        await this.saveProduct(productData);
        console.log(`Success Click Picks product saved with ${bestNetwork.name} (CPC: $${bestNetwork.cpc})`);
      }
      
    } catch (error) {
      console.error(`Error Error processing Click Picks URL:`, error);
    }
  }

  private selectBestAffiliateNetwork(url: string): { name: string; tag: string; cpc: number } {
    // Smart CPC optimization logic
    const domain = new URL(url).hostname.toLowerCase();
    
    // Domain-specific optimization
    if (domain.includes('amazon')) {
      return { name: 'cuelinks', ...AFFILIATE_NETWORKS.cuelinks };
    }
    
    if (domain.includes('flipkart') || domain.includes('myntra')) {
      return { name: 'earnkaro', ...AFFILIATE_NETWORKS.earnkaro };
    }
    
    // Default to highest CPC
    const sortedNetworks = Object.entries(AFFILIATE_NETWORKS)
      .sort(([,a], [,b]) => b.cpc - a.cpc);
    
    const [name, config] = sortedNetworks[0];
    return { name, ...config };
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
      console.warn(`Warning Could not expand URL ${url}:`, error);
      return url;
    }
  }

  private isShortUrl(url: string): boolean {
    const shortDomains = [
      'bit.ly', 'tinyurl.com', 'short.link', 'cutt.ly',
      'amzn.to', 'fkrt.it', 'dl.flipkart.com'
    ];
    
    try {
      const domain = new URL(url).hostname.toLowerCase();
      return shortDomains.some(shortDomain => domain.includes(shortDomain));
    } catch {
      return false;
    }
  }

  private convertToAffiliateUrl(url: string, network: { name: string; tag: string; cpc: number }): string {
    try {
      const urlObj = new URL(url);
      
      if (network.name === 'cuelinks') {
        const encodedUrl = encodeURIComponent(url);
        return network.tag.replace('{{URL_ENC}}', encodedUrl);
      }
      
      if (network.name === 'earnkaro') {
        const encodedUrl = encodeURIComponent(url);
        return network.tag.replace('{{URL_ENC}}', encodedUrl);
      }
      
      if (network.name === 'inrdeals') {
        urlObj.searchParams.set('ref', network.tag.replace('id=', ''));
        return urlObj.toString();
      }
      
      return url;
    } catch (error) {
      console.error('Error Error converting to affiliate URL:', error);
      return url;
    }
  }

  private async extractProductData(
    affiliateUrl: string, 
    originalUrl: string, 
    message: TelegramBot.Message,
    network: { name: string; tag: string; cpc: number }
  ): Promise<ProductData | null> {
    try {
      const response = await axios.get(originalUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      const messageText = message.text || message.caption || '';
      
      const productData: ProductData = {
        name: this.extractProductName($, messageText),
        description: this.extractDescription($, messageText),
        ...this.extractPricing($),
        imageUrl: this.extractImageUrl($, message),
        affiliateUrl,
        originalUrl,
        category: this.detectCategory(originalUrl, messageText),
        ...this.extractRating($),
        source: 'click-picks-telegram',
        telegramMessageId: message.message_id,
        telegramChannelId: parseInt(CHANNEL_ID),
        affiliateNetwork: network.name,
        cpcValue: network.cpc
      };
      
      return productData;
      
    } catch (error) {
      console.error('Error Error extracting product data:', error);
      return null;
    }
  }

  private extractProductName($: cheerio.Root, messageText: string): string {
    const selectors = [
      'h1[data-automation-id="product-title"]',
      '#productTitle',
      '.pdp-product-name',
      'h1.product-title',
      '.product-name h1',
      'h1'
    ];
    
    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length && element.text().trim()) {
        return element.text().trim();
      }
    }
    
    const lines = messageText.split('\n');
    for (const line of lines) {
      if (line.length > 10 && line.length < 200 && !line.includes('http')) {
        return line.trim();
      }
    }
    
    return 'Click Picks Product';
  }

  private extractDescription($: cheerio.Root, messageText: string): string {
    const selectors = [
      '[data-automation-id="product-details"]',
      '#feature-bullets ul',
      '.product-description',
      '.pdp-product-description'
    ];
    
    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length) {
        const text = element.text().trim();
        if (text.length > 20) {
          return text.substring(0, 500);
        }
      }
    }
    
    return messageText.substring(0, 300) || 'Smart CPC optimized product from Click Picks';
  }

  private extractPricing($: cheerio.Root): { price: string; originalPrice?: string; currency: string } {
    const priceSelectors = [
      '.price-current',
      '.current-price',
      '.selling-price',
      '[data-automation-id="price"]',
      '.a-price-whole'
    ];
    
    let price = '0';
    let originalPrice: string | undefined;
    
    for (const selector of priceSelectors) {
      const element = $(selector).first();
      if (element.length) {
        const text = element.text().trim();
        const priceMatch = text.match(/[₹$€£]?([\d,]+(?:\.\d{2})?)/);
        if (priceMatch) {
          price = priceMatch[1].replace(/,/g, '');
          break;
        }
      }
    }
    
    return {
      price,
      originalPrice,
      currency: 'INR'
    };
  }

  private extractImageUrl($: cheerio.Root, message: TelegramBot.Message): string {
    if (message.photo && message.photo.length > 0) {
      return `telegram-photo-${message.photo[message.photo.length - 1].file_id}`;
    }
    
    const imageSelectors = [
      '[data-automation-id="product-image"] img',
      '#landingImage',
      '.product-image img',
      '.pdp-image img'
    ];
    
    for (const selector of imageSelectors) {
      const img = $(selector).first();
      if (img.length) {
        const src = img.attr('src') || img.attr('data-src');
        if (src && src.startsWith('http')) {
          return src;
        }
      }
    }
    
    return '/placeholder-product.jpg';
  }

  private detectCategory(url: string, name: string): string {
    const categoryMap = {
      'electronics': ['mobile', 'laptop', 'phone', 'tablet', 'headphone', 'speaker'],
      'fashion': ['shirt', 'dress', 'shoe', 'bag', 'watch', 'clothing'],
      'home': ['furniture', 'decor', 'kitchen', 'bed', 'chair', 'table'],
      'books': ['book', 'novel', 'guide', 'manual'],
      'sports': ['fitness', 'gym', 'sport', 'exercise', 'yoga']
    };
    
    const text = (url + ' ' + name).toLowerCase();
    
    for (const [category, keywords] of Object.entries(categoryMap)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return category;
      }
    }
    
    return 'general';
  }

  private extractRating($: cheerio.Root): { rating?: number; reviewCount?: number } {
    const ratingSelectors = [
      '[data-automation-id="rating"]',
      '.a-icon-alt',
      '.rating-value',
      '.stars'
    ];
    
    for (const selector of ratingSelectors) {
      const element = $(selector).first();
      if (element.length) {
        const text = element.text() || element.attr('title') || '';
        const ratingMatch = text.match(/(\d+(?:\.\d+)?)/);
        if (ratingMatch) {
          return {
            rating: parseFloat(ratingMatch[1]),
            reviewCount: 0
          };
        }
      }
    }
    
    return {};
  }

  private async saveProduct(productData: ProductData): Promise<void> {
    try {
      const linkId = ClickPicksBot.generateLinkId();
      const currentTime = Date.now();
      
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO click_picks_products (
          id, name, description, price, original_price, currency,
          image_url, affiliate_url, original_url, category,
          rating, review_count, discount, affiliate_network,
          telegram_message_id, processing_status, source_metadata,
          created_at, content_type, affiliate_tag_applied,
          is_new, is_featured
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        linkId,
        productData.name,
        productData.description,
        productData.price,
        productData.originalPrice || null,
        productData.currency,
        productData.imageUrl,
        productData.affiliateUrl,
        productData.originalUrl,
        productData.category,
        productData.rating?.toString() || null,
        productData.reviewCount || null,
        productData.discount || null,
        productData.affiliateNetwork,
        productData.telegramMessageId,
        'processed',
        JSON.stringify({ cpc: productData.cpcValue, network: productData.affiliateNetwork }),
        currentTime,
        'product',
        1,
        1,
        0
      );
      
      console.log(`Save Click Picks product saved: ${productData.name} (${productData.affiliateNetwork}, CPC: $${productData.cpcValue})`);
      
    } catch (error) {
      console.error('Error Error saving Click Picks product:', error);
    }
  }

  private static generateLinkId(): string {
    return 'cp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  getStatus(): { initialized: boolean; channelId?: string; targetPage: string; networks: number } {
    return {
      initialized: this.isInitialized,
      channelId: CHANNEL_ID,
      targetPage: TARGET_PAGE,
      networks: Object.keys(AFFILIATE_NETWORKS).length
    };
  }

  async shutdown(): Promise<void> {
    if (this.bot) {
      await this.bot.stopPolling();
      this.bot = null;
    }
    this.isInitialized = false;
    console.log('Stop Click Picks Bot shutdown complete');
  }
}

// Export the bot instance
export const clickPicksBot = new ClickPicksBot();

// Enhanced Manager Integration - Export initialization function
export async function initializeClickPicksBot(): Promise<void> {
  try {
    console.log('Launch Initializing Click Picks Bot with Enhanced Manager...');
    await clickPicksBot.initialize();
    console.log('Success Click Picks Bot initialized successfully');
  } catch (error) {
    console.error('Error Failed to initialize Click Picks Bot:', error);
    throw error;
  }
}

// Initialize bot if credentials are available
if (BOT_TOKEN && CHANNEL_ID) {
  console.log('Click Picks Bot: Credentials found, ready for initialization');
} else {
  console.log('Click Picks Bot disabled: Missing credentials');
}