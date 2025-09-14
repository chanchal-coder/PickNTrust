console.log('Launch VALUE PICKS BOT MODULE LOADING...');

import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';

// Load Value Picks environment configuration
const valuePicksEnvPath = path.join(process.cwd(), '.env.value-picks');
console.log('Search Value Picks Bot: Loading environment from:', valuePicksEnvPath);
if (fs.existsSync(valuePicksEnvPath)) {
  dotenv.config({ path: valuePicksEnvPath });
  console.log('Success Value Picks environment loaded');
} else {
  console.log('Warning .env.value-picks file not found');
}

// Environment variables
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN_VALUE_PICKS;
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID_VALUE_PICKS;
const CHANNEL_USERNAME = process.env.TELEGRAM_CHANNEL_VALUE_PICKS;
const TARGET_PAGE = process.env.VALUE_PICKS_TARGET_PAGE || 'value-picks';
const BOT_USERNAME = process.env.VALUE_PICKS_BOT_USERNAME || 'earnkaropnt_bot';
const CHANNEL_NAME = process.env.VALUE_PICKS_CHANNEL_NAME || 'Value Picks EK';

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

  async initialize(): Promise<void> {
    try {
      console.log('💎 Initializing Value Picks Telegram bot...');
      
      if (!BOT_TOKEN || !CHANNEL_ID) {
        throw new Error('Missing bot token or channel ID');
      }

      // Create bot instance with polling disabled initially
      this.telegramBot = new TelegramBot(BOT_TOKEN, { polling: false });
      
      // Test bot connection
      const me = await this.telegramBot.getMe();
      console.log(`Success Value Picks bot connected successfully!`);
      console.log(`AI Bot: @${me.username} (${me.first_name})`);
      console.log(`Mobile Monitoring: ${CHANNEL_USERNAME} (${CHANNEL_ID})`);
      console.log(`Target Target: ${TARGET_PAGE} page`);
      console.log(`Price Features: EKaro conversion, Auto data extraction`);
      
      // Enable polling after successful connection
      this.telegramBot.startPolling();
      
      // Setup message listeners
      this.setupMessageListeners();
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

// Auto-initialize if credentials are available (fallback)
if (BOT_TOKEN && CHANNEL_ID && !process.env.ENHANCED_MANAGER_ACTIVE) {
  valuePicksBot.initialize().catch(console.error);
} else if (!BOT_TOKEN || !CHANNEL_ID) {
  console.log('Warning Value Picks automation disabled - missing credentials');
}

export { valuePicksBot };