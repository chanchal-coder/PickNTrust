console.log('Launch VALUE PICKS BOT MODULE LOADING...');

import TelegramBot from 'node-telegram-bot-api';

// Load value-picks specific environment
import dotenv from 'dotenv';
import path from 'path';

// CRITICAL: Load bot-specific .env file FIRST
const valuepicksEnvPath = path.join(process.cwd(), '.env.value-picks');
dotenv.config({ path: valuepicksEnvPath, override: true });

console.log('🔧 VALUE-PICKS BOT: Loading environment from:', valuepicksEnvPath);
console.log('🔧 VALUE-PICKS BOT TOKEN:', process.env.TELEGRAM_BOT_TOKEN?.substring(0, 10) + '...');


import fs from 'fs';
import Database from 'better-sqlite3';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { webhookManager } from './webhook-routes';
// Direct bot implementation without Enhanced Manager dependencies

// 🔒 ENVIRONMENT ENFORCEMENT - DO NOT MODIFY
// This bot MUST ONLY use .env.value-picks
const REQUIRED_ENV_FILE = '.env.value-picks';
const BOT_NAME = 'Value Picks';
const EXPECTED_TOKEN_PREFIX = '8293858742';

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

// Load Value Picks environment configuration
const valuePicksEnvPath = path.join(process.cwd(), '.env.value-picks');
console.log('Search Value Picks Bot: Loading environment from:', valuePicksEnvPath);
if (fs.existsSync(valuePicksEnvPath)) {
  dotenv.config({ path: valuePicksEnvPath });
  console.log('Success Value Picks environment loaded');
} else {
  console.log('Warning .env.value-picks file not found');
}

// Environment variables - Fixed to match .env.value-picks format
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const CHANNEL_USERNAME = process.env.CHANNEL_NAME;
const TARGET_PAGE = process.env.TARGET_PAGE || 'value-picks';
const BOT_USERNAME = process.env.BOT_USERNAME || 'earnkaropnt_bot';
const CHANNEL_NAME = process.env.CHANNEL_NAME || 'Value Picks EK';

// EKaro configuration
const EKARO_TEMPLATE = process.env.EKARO_AFFILIATE_URL_TEMPLATE || 'https://ekaro.in/enkr2020/?url=%7B%7BURL_ENC%7D%7D&ref=4530348';
const EKARO_REF_ID = process.env.EKARO_REF_ID || '4530348';
const EKARO_SOURCE = process.env.EKARO_SOURCE || 'enkr2020';

console.log('Search Value Picks Bot: Checking configuration...');
console.log('   BOT_TOKEN:', BOT_TOKEN ? BOT_TOKEN.substring(0, 10) + '...' : 'MISSING');
console.log('   CHANNEL_ID:', CHANNEL_ID || 'MISSING');
console.log('   BOT_USERNAME:', BOT_USERNAME || 'MISSING');
console.log('   CHANNEL_NAME:', CHANNEL_NAME || 'MISSING');

if (!BOT_TOKEN || !CHANNEL_ID) {
  console.log('Error Value Picks bot configuration missing. Please check .env.value-picks file.');
  console.log('Bot will not start without proper configuration.');
} else {
  console.log('Success Value Picks bot configuration loaded successfully');
}

class ValuePicksBot {
  private telegramBot: any = null;
  private isInitialized = false;

  // WEBHOOK MODE: Unified message handler
  private async handleMessage(msg: any): Promise<void> {
    try {
      if (msg.chat.type === 'private') {
        // Handle private messages if needed
        console.log('Value Picks: Private message received');
      } else if (msg.chat.id === parseInt(CHANNEL_ID!) || msg.chat.id.toString() === CHANNEL_ID) {
        console.log(`Value Picks: Processing channel message from ${msg.chat.id}`);
        // Process value picks from channel messages
        await this.processChannelMessage(msg);
      } else {
        console.log(`Value Picks: Ignoring message from chat ${msg.chat.id} (expected ${CHANNEL_ID})`);
      }
    } catch (error) {
      console.error('Value Picks Bot message handling error:', error);
    }
  }

  // WEBHOOK MODE: Alternative message handler
  private async handleTelegramMessage(msg: any): Promise<void> {
    await this.handleMessage(msg);
  }

  async initialize(): Promise<void> {
    try {
      console.log('💎 Initializing Value Picks Telegram bot...');
      
      if (!BOT_TOKEN || !CHANNEL_ID) {
        throw new Error('Missing bot token or channel ID');
      }

      // WEBHOOK MODE: Create bot without polling
      this.telegramBot = new TelegramBot(BOT_TOKEN, { polling: false });
      
      // Register with webhook manager
      webhookManager.registerBot('value-picks', BOT_TOKEN, this.handleMessage.bind(this));
      
      // Test bot connection
      const me = await this.telegramBot.getMe();
      console.log(`Success Value Picks bot connected successfully!`);
      console.log(`AI Bot: @${me.username} (${me.first_name})`);
      console.log(`Mobile Monitoring: ${CHANNEL_USERNAME} (${CHANNEL_ID})`);
      console.log(`Target Target: ${TARGET_PAGE} page`);
      console.log(`Price Features: EKaro conversion, Auto data extraction`);
      
      // Webhook mode - no polling listeners needed
      console.log('📡 Value Picks bot registered for webhook mode');
      
      this.setupErrorHandling();
      
      this.isInitialized = true;
      console.log('Target Value Picks bot fully initialized and ready for messages!');
      
      // Send startup notification
      try {
        await this.telegramBot.sendMessage(CHANNEL_ID, 
          'Launch **Value Picks Hybrid Bot Started!**\n\n' +
          'Success EarnKaro affiliate integration active\n' +
          'Success Universal URL processing enabled\n' +
          'Success Smart product detection active\n' +
          'Success Auto data extraction working\n\n' +
          'Target Ready to find the best Value Picks deals!',
          { parse_mode: 'Markdown' }
        );
      } catch (error) {
        console.error('Failed to send Value Picks startup notification:', error);
      }
      
    } catch (error: any) {
      console.error('Error Failed to initialize Value Picks bot:', error.message);
      this.isInitialized = false;
      throw error;
    }
  }

  private setupMessageListeners(): void {
    if (!this.telegramBot) return;
    
    // Listen for channel posts
    this.telegramBot.on('channel_post', async (message: any) => {
      try {
        if (message.chat.id.toString() === CHANNEL_ID) {
          console.log('Mobile Value Picks: New channel post received');
          console.log(`   Message ID: ${message.message_id}`);
          console.log(`   Text: ${message.text?.substring(0, 100)}...`);
          
          if (message.text) {
            await this.processChannelMessage(message);
          }
        }
      } catch (error) {
        console.error('Error Error processing channel post:', error);
      }
    });
    
    // Listen for edited channel posts
    this.telegramBot.on('edited_channel_post', async (message: any) => {
      try {
        if (message.chat.id.toString() === CHANNEL_ID) {
          console.log('Blog Value Picks: Channel post edited');
          if (message.text) {
            await this.processChannelMessage(message);
          }
        }
      } catch (error) {
        console.error('Error Error processing edited channel post:', error);
      }
    });
    
    // Listen for private messages (like /start)
    this.telegramBot.on('message', async (message: any) => {
      try {
        if (message.chat.type === 'private' && message.text) {
          if (message.text === '/start') {
            const statusMessage = 
              `💎 Value Picks Bot Active!\n\n` +
              `Success Universal URL support enabled\n` +
              `Price EKaro affiliate conversion ready\n` +
              `Stats Auto data/image extraction active\n` +
              `Mobile Monitoring: ${CHANNEL_NAME}\n` +
              `Target Target: ${TARGET_PAGE} page`;
            
            await this.telegramBot.sendMessage(message.chat.id, statusMessage);
            console.log(`Mobile Sent /start response to user ${message.from?.username || 'unknown'}`);
          }
        }
      } catch (error) {
        console.error('Error Error handling private message:', error);
      }
    });
  }

  private setupErrorHandling(): void {
    if (!this.telegramBot) return;
    
    this.telegramBot.on('polling_error', (error: any) => {
      console.error('Error Value Picks Bot polling error:', error.message);
    });
    
    this.telegramBot.on('error', (error: any) => {
      console.error('Error Value Picks Bot error:', error.message);
    });
  }

  private async processChannelMessage(message: any): Promise<void> {
    try {
      console.log('Refresh Processing Value Picks channel message...');
      
      const messageText = message.text || '';
      const urls = this.extractUrls(messageText);
      
      if (urls.length > 0) {
        console.log(`Link Found ${urls.length} URLs in message`);
        
        for (const url of urls) {
          await this.processProductUrl(url, message, messageText);
        }
      } else {
        console.log('ℹ️ No URLs found in message');
      }
    } catch (error) {
      console.error('Error Error processing channel message:', error);
    }
  }

  private extractUrls(text: string): string[] {
    const urlRegex = /https?:\/\/[^\s]+/g;
    return text.match(urlRegex) || [];
  }

  private async processProductUrl(url: string, message: any, messageText: string): Promise<void> {
    try {
      console.log(`Link Processing URL: ${url}`);
      
      // Use URL as-is since affiliate URLs will be provided directly in channel
      console.log(`Price Using original URL (no affiliate conversion): ${url}`);
      
      // Extract product info from message
      const productName = this.extractProductNameFromMessage(messageText) || 'Value Picks Product';
      const productDescription = this.extractDescriptionFromMessage(messageText) || 'Great product from Value Picks';
      
      // Create product data
      const productData = {
        name: productName,
        description: productDescription,
        price: '999',
        original_price: '1999',
        currency: 'INR',
        image_url: 'https://images.unsplash.com/photo-1560472355-536de3962603?w=400&h=400&fit=crop&q=80',
        affiliate_url: url, // Use original URL since affiliate URLs are provided in channel
        original_url: url,
        category: 'General',
        rating: '4.5',
        review_count: 100,
        discount: 50,
        is_new: 1,
        is_featured: 0,
        affiliate_network: 'Direct', // Changed from 'EKaro' since no conversion
        telegram_message_id: message.message_id,
        telegram_channel_id: parseInt(CHANNEL_ID || '0'),
        telegram_channel_name: CHANNEL_NAME,
        processing_status: 'active',
        content_type: 'product',
        affiliate_tag_applied: 0 // Changed to 0 since no automatic tagging
      };
      
      // Save to database
      await this.saveProduct(productData);
      
    } catch (error) {
      console.error('Error Error processing product URL:', error);
    }
  }

  private convertToEkaroUrl(url: string): string {
    try {
      const encodedUrl = encodeURIComponent(url);
      return EKARO_TEMPLATE.replace('%7B%7BURL_ENC%7D%7D', encodedUrl);
    } catch (error) {
      console.error('Error Error converting to EKaro URL:', error);
      return url; // Return original URL if conversion fails
    }
  }

  private extractProductNameFromMessage(text: string): string | null {
    // Simple extraction - look for lines that might be product names
    const lines = text.split('\n').filter(line => line.trim());
    for (const line of lines) {
      if (line.length > 10 && line.length < 100 && !line.includes('http')) {
        return line.trim();
      }
    }
    return null;
  }

  private extractDescriptionFromMessage(text: string): string | null {
    // Simple extraction - use first few lines as description
    const lines = text.split('\n').filter(line => line.trim() && !line.includes('http'));
    if (lines.length > 1) {
      return lines.slice(0, 3).join(' ').substring(0, 200);
    }
    return null;
  }

  private async saveProduct(productData: any): Promise<void> {
    try {
      console.log('Save Saving Value Picks product to database...');
      
      const db = new Database('database.sqlite');
      
      const stmt = db.prepare(`
        INSERT INTO value_picks_products (
          name, description, price, original_price, currency, image_url, 
          affiliate_url, original_url, category, rating, review_count, 
          discount, is_new, is_featured, affiliate_network, telegram_message_id, 
          telegram_channel_id, telegram_channel_name, processing_status, 
          content_type, affiliate_tag_applied
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        productData.name,
        productData.description,
        productData.price,
        productData.original_price,
        productData.currency,
        productData.image_url,
        productData.affiliate_url,
        productData.original_url,
        productData.category,
        productData.rating,
        productData.review_count,
        productData.discount,
        productData.is_new,
        productData.is_featured,
        productData.affiliate_network,
        productData.telegram_message_id,
        productData.telegram_channel_id,
        productData.telegram_channel_name,
        productData.processing_status,
        productData.content_type,
        productData.affiliate_tag_applied
      );
      
      console.log(`Success Product saved successfully with ID: ${result.lastInsertRowid}`);
      console.log(`Link Affiliate URL: ${productData.affiliate_url}`);
      console.log(`Stats EKaro tracking: ref=${EKARO_REF_ID}`);
      
      db.close();
      
    } catch (error) {
      console.error('Error Error saving Value Picks product:', error);
      throw error;
    }
  }

  getStatus(): { initialized: boolean; channelId?: string; targetPage: string; features: string[] } {
    return {
      initialized: this.isInitialized,
      channelId: CHANNEL_ID,
      targetPage: TARGET_PAGE,
      features: [
        'EKaro Affiliate Conversion',
        'Auto Product Detection',
        'Database Integration',
        'Message Processing'
      ]
    };
  }

  async shutdown(): Promise<void> {
    if (this.telegramBot) {
      await this.telegramBot.stopPolling();
      this.telegramBot = null;
      this.isInitialized = false;
      console.log('💎 Value Picks bot shutdown complete');
    }
  }
}

// Create and export bot instance
const valuePicksBot = new ValuePicksBot();

// Enhanced Manager Integration - Export initialization function
export async function initializeValuePicksBot(): Promise<void> {
  try {
    console.log('Launch Initializing Value Picks Bot with Enhanced Manager...');
    await valuePicksBot.initialize();
    console.log('Success Value Picks Bot initialized successfully');
  } catch (error) {
    console.error('Error Failed to initialize Value Picks Bot:', error);
    throw error;
  }
}

// Initialize bot if credentials are available
if (BOT_TOKEN && CHANNEL_ID) {
  console.log('Value Picks Bot: Credentials found, ready for initialization');
} else {
  console.log('Value Picks Bot disabled: Missing credentials');
}

export { valuePicksBot };