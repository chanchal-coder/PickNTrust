/**
 * Enhanced Prime Picks Telegram Bot Service with Robust Error Handling
 * Handles automation for @pntamazon channel -> prime-picks page
 * Features: Auto-retry, fallback polling, health monitoring, emergency recovery
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
import fetch from 'node-fetch';
import https from 'https';

// Load Telegram environment variables
const telegramEnvPath = path.join(process.cwd(), '.env.telegram');
if (fs.existsSync(telegramEnvPath)) {
  dotenv.config({ path: telegramEnvPath });
}

// Enhanced Bot Configuration
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN_PRIME_PICKS;
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID_PRIME_PICKS;
const CHANNEL_USERNAME = process.env.TELEGRAM_CHANNEL_PRIME_PICKS;
const TARGET_PAGE = process.env.PRIME_PICKS_TARGET_PAGE || 'prime-picks';
const AFFILIATE_TAG = process.env.PRIME_PICKS_AFFILIATE_TAG || 'ref=primepicks';
const AMAZON_ASSOCIATES_TAG = process.env.AMAZON_ASSOCIATES_TAG || 'pickntrust03-21';

// Enhanced Configuration
const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 seconds
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
const FALLBACK_POLLING_INTERVAL = 10000; // 10 seconds
const CONNECTION_TIMEOUT = 30000; // 30 seconds

interface BotHealth {
  isConnected: boolean;
  lastMessageTime: number;
  errorCount: number;
  lastError?: string;
  retryCount: number;
  mode: 'webhook' | 'polling' | 'fallback';
}

class EnhancedPrimePicksBot {
  private bot: TelegramBot | null = null;
  private isInitialized = false;
  private health: BotHealth = {
    isConnected: false,
    lastMessageTime: 0,
    errorCount: 0,
    retryCount: 0,
    mode: 'polling'
  };
  private healthCheckTimer?: NodeJS.Timeout;
  private fallbackTimer?: NodeJS.Timeout;
  private lastProcessedMessageId = 0;

  /**
   * Initialize the Enhanced Prime Picks Telegram bot with robust error handling
   */
  async initialize(): Promise<void> {
    if (!BOT_TOKEN) {
      console.log('Warning Prime Picks bot disabled - no token provided');
      return;
    }

    console.log('Launch Initializing Enhanced Prime Picks Telegram bot...');
    await this.initializeWithRetry();
  }

  /**
   * Initialize bot with automatic retry mechanism
   */
  private async initializeWithRetry(attempt = 1): Promise<void> {
    try {
      console.log(`Refresh Bot initialization attempt ${attempt}/${MAX_RETRIES}`);
      
      // Create custom request function using node-fetch (works with Telegram API)
      const customRequest = async (url: string, options: any = {}) => {
        try {
          const response = await fetch(url, {
            method: options.method || 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept': 'application/json',
              'Connection': 'close',
              ...options.headers
            },
            body: options.body,
            timeout: CONNECTION_TIMEOUT,
            agent: new https.Agent({
              keepAlive: false,
              timeout: CONNECTION_TIMEOUT
            })
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          return response;
        } catch (error) {
          console.error('Alert Custom request failed:', error.message);
          throw error;
        }
      };

      // Create bot instance with enhanced options
      this.bot = new TelegramBot(BOT_TOKEN!, {
        polling: {
          interval: 1000,
          autoStart: true,
          params: {
            timeout: 10,
            allowed_updates: ['channel_post', 'message']
          }
        },
        request: customRequest as any
      });
      
      // Set up enhanced message listeners
      this.setupEnhancedMessageListeners();
      
      // Set up comprehensive error handling
      this.setupEnhancedErrorHandling();
      
      // Test bot connection
      await this.testBotConnection();
      
      this.isInitialized = true;
      this.health.isConnected = true;
      this.health.retryCount = 0;
      
      console.log('Success Enhanced Prime Picks bot initialized successfully');
      console.log(`Mobile Monitoring channel: ${CHANNEL_USERNAME} (${CHANNEL_ID})`);
      console.log(`Target Target page: ${TARGET_PAGE}`);
      console.log('🛡️ Enhanced features: Auto-retry, Health monitoring, Fallback polling');
      
      // Start health monitoring
      this.startHealthMonitoring();
      
    } catch (error) {
      console.error(`Error Bot initialization attempt ${attempt} failed:`, error);
      this.health.errorCount++;
      this.health.lastError = error instanceof Error ? error.message : String(error);
      
      if (attempt < MAX_RETRIES) {
        console.log(`⏳ Retrying in ${RETRY_DELAY/1000} seconds...`);
        await this.delay(RETRY_DELAY);
        await this.initializeWithRetry(attempt + 1);
      } else {
        console.error('💥 All bot initialization attempts failed. Starting fallback mode...');
        this.startFallbackMode();
      }
    }
  }

  /**
   * Test bot connection to Telegram API
   */
  private async testBotConnection(): Promise<void> {
    if (!this.bot) throw new Error('Bot not initialized');
    
    console.log('🧪 Testing bot connection...');
    const me = await this.bot.getMe();
    console.log(`Success Bot connected: @${me.username} (${me.first_name})`);
    
    // Test channel access
    try {
      const chat = await this.bot.getChat(CHANNEL_ID!);
      console.log(`Success Channel access confirmed: ${chat.title}`);
    } catch (error) {
      console.warn('Warning Channel access test failed:', error);
    }
  }

  /**
   * Set up enhanced message listeners with better error handling
   */
  private setupEnhancedMessageListeners(): void {
    if (!this.bot) return;

    // Enhanced channel post listener
    this.bot.on('channel_post', async (msg) => {
      try {
        // Update health status
        this.health.lastMessageTime = Date.now();
        this.health.isConnected = true;
        
        // Only process messages from our target channel
        if (msg.chat.id.toString() !== CHANNEL_ID) {
          return;
        }

        // Prevent duplicate processing
        if (msg.message_id <= this.lastProcessedMessageId) {
          console.log(`⏭️ Skipping already processed message ${msg.message_id}`);
          return;
        }
        
        this.lastProcessedMessageId = msg.message_id;

        console.log('Mobile New message in Prime Picks channel:', {
          messageId: msg.message_id,
          text: msg.text?.substring(0, 100) + '...',
          hasPhoto: !!msg.photo,
          date: new Date(msg.date * 1000).toISOString()
        });

        await this.processChannelMessageWithRetry(msg);
        
      } catch (error) {
        console.error('Error Error processing channel message:', error);
        this.health.errorCount++;
        this.health.lastError = error instanceof Error ? error.message : String(error);
        
        // Try to recover from error
        await this.handleMessageProcessingError(error, msg);
      }
    });

    // Enhanced regular message listener
    this.bot.on('message', async (msg) => {
      try {
        // Skip channel posts (handled above)
        if (msg.chat.type === 'channel') return;
        
        // Health check and admin commands
        if (msg.chat.type === 'private') {
          await this.handlePrivateMessage(msg);
        }
      } catch (error) {
        console.error('Error Error handling private message:', error);
      }
    });
  }

  /**
   * Handle private messages (admin commands, health checks)
   */
  private async handlePrivateMessage(msg: any): Promise<void> {
    if (!this.bot) return;
    
    const text = msg.text?.toLowerCase() || '';
    
    if (text === '/start') {
      await this.bot.sendMessage(msg.chat.id, 
        'AI Enhanced Prime Picks Bot Active!\n\n' +
        'Success Channel monitoring enabled\n' +
        'Target Target: prime-picks page\n' +
        'Link Affiliate conversion ready\n' +
        'Stats Product extraction active\n' +
        '🛡️ Enhanced error handling\n' +
        'Refresh Auto-retry mechanisms\n\n' +
        'Commands:\n' +
        '/health - Check bot health\n' +
        '/stats - View processing stats\n' +
        '/retry - Force retry connection'
      );
    } else if (text === '/health') {
      await this.sendHealthReport(msg.chat.id);
    } else if (text === '/stats') {
      await this.sendStatsReport(msg.chat.id);
    } else if (text === '/retry') {
      await this.bot.sendMessage(msg.chat.id, 'Refresh Forcing bot reconnection...');
      await this.forceReconnect();
    }
  }

  /**
   * Process channel message with retry mechanism
   */
  private async processChannelMessageWithRetry(msg: any, attempt = 1): Promise<void> {
    try {
      await this.processChannelMessage(msg);
      console.log(`Success Message ${msg.message_id} processed successfully`);
    } catch (error) {
      console.error(`Error Message processing attempt ${attempt} failed:`, error);
      
      if (attempt < MAX_RETRIES) {
        console.log(`⏳ Retrying message processing in ${RETRY_DELAY/1000} seconds...`);
        await this.delay(RETRY_DELAY);
        await this.processChannelMessageWithRetry(msg, attempt + 1);
      } else {
        console.error(`💥 Failed to process message ${msg.message_id} after ${MAX_RETRIES} attempts`);
        // Store failed message for manual processing
        await this.storeFailedMessage(msg, error);
      }
    }
  }

  /**
   * Process channel message (core logic)
   */
  private async processChannelMessage(msg: any): Promise<void> {
    const messageText = msg.text || msg.caption || '';
    
    if (!messageText) {
      console.log('⏭️ Skipping message without text content');
      return;
    }

    // Extract URLs from message
    const urls = this.extractUrls(messageText);
    
    if (urls.length === 0) {
      console.log('⏭️ No URLs found in message');
      return;
    }

    console.log(`Search Found ${urls.length} URLs to process:`, urls);

    // Process each URL
    for (const url of urls) {
      try {
        await this.processProductUrl(url, msg, messageText);
      } catch (error) {
        console.error(`Error Failed to process URL ${url}:`, error);
        // Continue with other URLs even if one fails
      }
    }
  }

  /**
   * Extract URLs from message text
   */
  private extractUrls(text: string): string[] {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = text.match(urlRegex) || [];
    return matches.map(url => url.replace(/[.,;!?]$/, '')); // Remove trailing punctuation
  }

  /**
   * Process a product URL and add to database
   */
  private async processProductUrl(url: string, msg: any, messageText: string): Promise<void> {
    console.log(`Link Processing URL: ${url}`);
    
    // Expand short URLs
    const expandedUrl = await this.expandUrl(url);
    console.log(`Link Expanded URL: ${expandedUrl}`);
    
    // Detect category
    const category = this.detectCategory(messageText);
    
    // Extract product data
    const productData = await this.extractProductData(expandedUrl, messageText, msg);
    
    if (productData) {
      // Add to database
      await this.addProductToDatabase(productData);
      console.log(`Success Product added: ${productData.name}`);
    } else {
      console.log('Warning Could not extract product data from URL');
    }
  }

  /**
   * Expand shortened URLs
   */
  private async expandUrl(url: string): Promise<string> {
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

  /**
   * Detect product category from message text
   */
  private detectCategory(text: string): string {
    const categoryMap = {
      'Electronics & Gadgets': ['phone', 'mobile', 'laptop', 'computer', 'tablet', 'headphone', 'earphone', 'speaker', 'camera', 'tv', 'television', 'smartwatch', 'fitness', 'tracker', 'electronics', 'gadget', 'tech', 'gaming', 'console'],
      'Fashion & Clothing': ['shirt', 'tshirt', 't-shirt', 'jeans', 'dress', 'shoes', 'sneakers', 'jacket', 'hoodie', 'fashion', 'clothing', 'apparel', 'wear', 'style', 'outfit'],
      'Home & Kitchen': ['kitchen', 'home', 'furniture', 'decor', 'appliance', 'cookware', 'utensil', 'bedding', 'mattress', 'pillow', 'curtain', 'lamp', 'table', 'chair'],
      'Health & Beauty': ['skincare', 'makeup', 'cosmetic', 'beauty', 'health', 'supplement', 'vitamin', 'cream', 'lotion', 'shampoo', 'conditioner', 'perfume'],
      'Sports & Fitness': ['gym', 'fitness', 'exercise', 'workout', 'sports', 'yoga', 'running', 'cycling', 'swimming', 'equipment', 'dumbbell', 'treadmill'],
      'Books & Media': ['book', 'novel', 'magazine', 'ebook', 'audiobook', 'music', 'movie', 'dvd', 'cd', 'media', 'entertainment'],
      'Toys & Games': ['toy', 'game', 'puzzle', 'board game', 'video game', 'kids', 'children', 'baby', 'infant', 'toddler'],
      'Automotive': ['car', 'bike', 'motorcycle', 'automotive', 'vehicle', 'tire', 'battery', 'oil', 'parts', 'accessories']
    };

    const lowerText = text.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categoryMap)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return category;
      }
    }
    
    return 'Electronics & Gadgets'; // Default category
  }

  /**
   * Extract product data from URL
   */
  private async extractProductData(url: string, messageText: string, msg: any): Promise<any> {
    try {
      // Basic product data extraction
      const productData = {
        name: this.extractProductName(messageText) || 'Product from Telegram',
        description: this.extractDescription(messageText) || 'Product shared via Telegram',
        price: this.extractPrice(messageText) || '999',
        original_price: this.extractOriginalPrice(messageText),
        currency: 'INR',
        image_url: await this.extractImageUrl(url, msg),
        affiliate_url: this.applyAffiliateTag(url),
        category: this.detectCategory(messageText),
        rating: this.extractRating(messageText) || '4.0',
        review_count: this.extractReviewCount(messageText) || 100,
        discount: this.extractDiscount(messageText),
        is_new: 1,
        is_featured: 1,
        display_pages: JSON.stringify([TARGET_PAGE]),
        source: 'telegram',
        telegram_message_id: msg.message_id,
        telegram_channel_id: msg.chat.id,
        created_at: Math.floor(Date.now() / 1000)
      };
      
      return productData;
    } catch (error) {
      console.error('Error Error extracting product data:', error);
      return null;
    }
  }

  /**
   * Extract product name from message text
   */
  private extractProductName(text: string): string | null {
    // Look for product names in various formats
    const patterns = [
      /(?:Hot|Price|⭐|Target|🛒)\s*([^\n]{10,100})/,
      /^([^\n]{10,100})/,
      /([A-Z][^\n]{10,100})/
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim().replace(/[HotPrice⭐Target🛒]/g, '').trim();
      }
    }
    
    return null;
  }

  /**
   * Extract description from message text
   */
  private extractDescription(text: string): string | null {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length > 1) {
      return lines.slice(1, 3).join(' ').trim();
    }
    return null;
  }

  /**
   * Extract price from message text
   */
  private extractPrice(text: string): string | null {
    const pricePatterns = [
      /₹\s*(\d+(?:,\d+)*)/,
      /Price[:\s]*₹\s*(\d+(?:,\d+)*)/i,
      /Rs\.?\s*(\d+(?:,\d+)*)/i
    ];
    
    for (const pattern of pricePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].replace(/,/g, '');
      }
    }
    
    return null;
  }

  /**
   * Extract original price from message text
   */
  private extractOriginalPrice(text: string): string | null {
    const patterns = [
      /was\s*₹\s*(\d+(?:,\d+)*)/i,
      /\(was\s*₹\s*(\d+(?:,\d+)*)\)/i,
      /MRP[:\s]*₹\s*(\d+(?:,\d+)*)/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].replace(/,/g, '');
      }
    }
    
    return null;
  }

  /**
   * Extract discount percentage from message text
   */
  private extractDiscount(text: string): number | null {
    const discountPattern = /(\d+)%\s*(?:off|discount)/i;
    const match = text.match(discountPattern);
    return match ? parseInt(match[1]) : null;
  }

  /**
   * Extract rating from message text
   */
  private extractRating(text: string): string | null {
    const ratingPattern = /(?:rating|rated)[:\s]*(\d+(?:\.\d+)?)/i;
    const match = text.match(ratingPattern);
    return match ? match[1] : null;
  }

  /**
   * Extract review count from message text
   */
  private extractReviewCount(text: string): number | null {
    const reviewPatterns = [
      /(\d+(?:,\d+)*)\s*reviews?/i,
      /\((\d+(?:,\d+)*)\s*reviews?\)/i
    ];
    
    for (const pattern of reviewPatterns) {
      const match = text.match(pattern);
      if (match) {
        return parseInt(match[1].replace(/,/g, ''));
      }
    }
    
    return null;
  }

  /**
   * Extract image URL from message or fetch from product URL
   */
  private async extractImageUrl(url: string, msg: any): Promise<string> {
    // If message has photo, use it
    if (msg.photo && msg.photo.length > 0) {
      const photo = msg.photo[msg.photo.length - 1]; // Get highest resolution
      try {
        const fileLink = await this.bot!.getFileLink(photo.file_id);
        return fileLink;
      } catch (error) {
        console.warn('Warning Could not get photo from message:', error);
      }
    }
    
    // Fallback to default image
    return 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&q=80';
  }

  /**
   * Apply affiliate tag to URL
   */
  private applyAffiliateTag(url: string): string {
    if (url.includes('amazon.')) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}tag=${AMAZON_ASSOCIATES_TAG}`;
    }
    return url;
  }

  /**
   * Add product to database
   */
  private async addProductToDatabase(productData: any): Promise<void> {
    try {
      const result = await db.insert(products).values(productData);
      console.log(`Success Product added to database with ID: ${result.lastInsertRowid}`);
    } catch (error) {
      console.error('Error Error adding product to database:', error);
      throw error;
    }
  }

  /**
   * Set up enhanced error handling
   */
  private setupEnhancedErrorHandling(): void {
    if (!this.bot) return;

    this.bot.on('polling_error', async (error) => {
      console.error('Alert Polling error:', error);
      this.health.errorCount++;
      this.health.lastError = error.message;
      this.health.isConnected = false;
      
      await this.handlePollingError(error);
    });

    this.bot.on('webhook_error', async (error) => {
      console.error('Alert Webhook error:', error);
      this.health.errorCount++;
      this.health.lastError = error.message;
      
      await this.handleWebhookError(error);
    });

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      console.error('Alert Uncaught exception in bot:', error);
      this.health.errorCount++;
      this.health.lastError = error.message;
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Alert Unhandled rejection in bot:', reason);
      this.health.errorCount++;
      this.health.lastError = String(reason);
    });
  }

  /**
   * Handle polling errors with automatic recovery
   */
  private async handlePollingError(error: any): Promise<void> {
    console.log('Refresh Attempting to recover from polling error...');
    
    // Stop current polling
    if (this.bot) {
      try {
        await this.bot.stopPolling();
      } catch (e) {
        console.warn('Warning Error stopping polling:', e);
      }
    }
    
    // Wait before retry
    await this.delay(RETRY_DELAY);
    
    // Reinitialize bot
    await this.initializeWithRetry();
  }

  /**
   * Handle webhook errors
   */
  private async handleWebhookError(error: any): Promise<void> {
    console.log('Refresh Switching from webhook to polling mode...');
    this.health.mode = 'polling';
    
    // Reinitialize with polling
    await this.initializeWithRetry();
  }

  /**
   * Handle message processing errors
   */
  private async handleMessageProcessingError(error: any, msg: any): Promise<void> {
    console.log(`Refresh Handling message processing error for message ${msg.message_id}`);
    
    // Store failed message for later retry
    await this.storeFailedMessage(msg, error);
    
    // If too many errors, restart bot
    if (this.health.errorCount > 10) {
      console.log('Alert Too many errors, restarting bot...');
      await this.forceReconnect();
    }
  }

  /**
   * Store failed message for manual processing
   */
  private async storeFailedMessage(msg: any, error: any): Promise<void> {
    try {
      const failedMessage = {
        message_id: msg.message_id,
        chat_id: msg.chat.id,
        text: msg.text || msg.caption || '',
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
        processed: false
      };
      
      // Store in a simple JSON file for now
      const failedMessagesPath = path.join(process.cwd(), 'failed-messages.json');
      let failedMessages = [];
      
      if (fs.existsSync(failedMessagesPath)) {
        const data = fs.readFileSync(failedMessagesPath, 'utf8');
        failedMessages = JSON.parse(data);
      }
      
      failedMessages.push(failedMessage);
      fs.writeFileSync(failedMessagesPath, JSON.stringify(failedMessages, null, 2));
      
      console.log(`Blog Failed message stored for manual processing: ${msg.message_id}`);
    } catch (error) {
      console.error('Error Error storing failed message:', error);
    }
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthCheck();
    }, HEALTH_CHECK_INTERVAL);
    
    console.log('🏥 Health monitoring started');
  }

  /**
   * Perform health check
   */
  private async performHealthCheck(): Promise<void> {
    try {
      if (!this.bot) {
        this.health.isConnected = false;
        return;
      }
      
      // Test bot connection
      await this.bot.getMe();
      
      // Check if we've received messages recently
      const timeSinceLastMessage = Date.now() - this.health.lastMessageTime;
      const isStale = timeSinceLastMessage > 300000; // 5 minutes
      
      if (isStale && this.health.lastMessageTime > 0) {
        console.log('Warning No messages received recently, connection might be stale');
        this.health.isConnected = false;
      } else {
        this.health.isConnected = true;
      }
      
      // Log health status
      console.log('🏥 Health check:', {
        connected: this.health.isConnected,
        errors: this.health.errorCount,
        lastMessage: this.health.lastMessageTime ? new Date(this.health.lastMessageTime).toISOString() : 'Never',
        mode: this.health.mode
      });
      
    } catch (error) {
      console.error('Error Health check failed:', error);
      this.health.isConnected = false;
      this.health.errorCount++;
      this.health.lastError = error instanceof Error ? error.message : String(error);
      
      // Try to reconnect if health check fails
      await this.forceReconnect();
    }
  }

  /**
   * Start fallback mode with periodic polling
   */
  private startFallbackMode(): void {
    console.log('Alert Starting fallback mode - periodic manual polling');
    this.health.mode = 'fallback';
    
    this.fallbackTimer = setInterval(async () => {
      await this.performFallbackPolling();
    }, FALLBACK_POLLING_INTERVAL);
  }

  /**
   * Perform fallback polling by checking for new messages
   */
  private async performFallbackPolling(): Promise<void> {
    try {
      console.log('Refresh Performing fallback polling...');
      
      // Try to reinitialize bot
      await this.initializeWithRetry();
      
      if (this.isInitialized) {
        console.log('Success Bot reconnected, stopping fallback mode');
        if (this.fallbackTimer) {
          clearInterval(this.fallbackTimer);
          this.fallbackTimer = undefined;
        }
        this.health.mode = 'polling';
      }
    } catch (error) {
      console.error('Error Fallback polling failed:', error);
    }
  }

  /**
   * Force reconnect the bot
   */
  public async forceReconnect(): Promise<void> {
    console.log('Refresh Force reconnecting bot...');
    
    // Stop current bot
    if (this.bot) {
      try {
        await this.bot.stopPolling();
        this.bot.removeAllListeners();
      } catch (error) {
        console.warn('Warning Error stopping bot:', error);
      }
    }
    
    // Clear timers
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    if (this.fallbackTimer) {
      clearInterval(this.fallbackTimer);
    }
    
    // Reset state
    this.bot = null;
    this.isInitialized = false;
    this.health.retryCount++;
    
    // Reinitialize
    await this.delay(2000);
    await this.initializeWithRetry();
  }

  /**
   * Send health report to admin
   */
  private async sendHealthReport(chatId: number): Promise<void> {
    if (!this.bot) return;
    
    const report = `🏥 Bot Health Report\n\n` +
      `Link Connected: ${this.health.isConnected ? 'Success' : 'Error'}\n` +
      `Stats Error Count: ${this.health.errorCount}\n` +
      `Refresh Retry Count: ${this.health.retryCount}\n` +
      `Mobile Mode: ${this.health.mode}\n` +
      `⏰ Last Message: ${this.health.lastMessageTime ? new Date(this.health.lastMessageTime).toLocaleString() : 'Never'}\n` +
      `Error Last Error: ${this.health.lastError || 'None'}\n` +
      `🆔 Last Processed: ${this.lastProcessedMessageId}`;
    
    await this.bot.sendMessage(chatId, report);
  }

  /**
   * Send stats report to admin
   */
  private async sendStatsReport(chatId: number): Promise<void> {
    if (!this.bot) return;
    
    try {
      // Get product count from database
      const result = await db.select().from(products).where(eq(products.source, 'telegram'));
      const telegramProducts = result.length;
      
      const stats = `Stats Bot Statistics\n\n` +
        `🛒 Products Added: ${telegramProducts}\n` +
        `Mobile Channel: ${CHANNEL_USERNAME}\n` +
        `Target Target Page: ${TARGET_PAGE}\n` +
        `Refresh Uptime: ${Math.floor((Date.now() - (this.health.lastMessageTime || Date.now())) / 1000 / 60)} minutes\n` +
        `🏥 Health: ${this.health.isConnected ? 'Good' : 'Poor'}`;
      
      await this.bot.sendMessage(chatId, stats);
    } catch (error) {
      await this.bot.sendMessage(chatId, 'Error Error generating stats report');
    }
  }

  /**
   * Utility function to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get bot health status
   */
  public getHealth(): BotHealth {
    return { ...this.health };
  }

  /**
   * Check if bot is healthy
   */
  public isHealthy(): boolean {
    return this.health.isConnected && this.health.errorCount < 5;
  }

  /**
   * Cleanup resources
   */
  public async cleanup(): Promise<void> {
    console.log('Cleanup Cleaning up Enhanced Prime Picks bot...');
    
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    
    if (this.fallbackTimer) {
      clearInterval(this.fallbackTimer);
    }
    
    if (this.bot) {
      try {
        await this.bot.stopPolling();
        this.bot.removeAllListeners();
      } catch (error) {
        console.warn('Warning Error during cleanup:', error);
      }
    }
    
    this.isInitialized = false;
    this.health.isConnected = false;
  }
}

// Export singleton instance
export const enhancedPrimePicksBot = new EnhancedPrimePicksBot();

// Auto-initialize if credentials are available
if (BOT_TOKEN && CHANNEL_ID) {
  console.log('Launch Enhanced Prime Picks Telegram automation ready');
} else {
  console.log('Warning Enhanced Prime Picks automation disabled - missing credentials');
}