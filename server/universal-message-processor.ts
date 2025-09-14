/**
 * Universal Telegram Message Processor
 * Ensures all 8 bots can process messages from their channels
 */

import TelegramBot from 'node-telegram-bot-api';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import path from 'path';

interface BotConfig {
  name: string;
  envFile: string;
  tableName: string;
  channelName: string;
}

class UniversalMessageProcessor {
  private bots = new Map<string, TelegramBot>();
  private db: Database.Database;
  
  private botConfigs: BotConfig[] = [
    { name: 'Prime Picks', envFile: '.env.prime-picks', tableName: 'amazon_products', channelName: 'Prime Picks' },
    { name: 'Cue Picks', envFile: '.env.cue-picks', tableName: 'cuelinks_products', channelName: 'Cue Picks' },
    { name: 'Value Picks', envFile: '.env.value-picks', tableName: 'value_picks_products', channelName: 'Value Picks' },
    { name: 'Travel Picks', envFile: '.env.travel-picks', tableName: 'travel_products', channelName: 'Travel Picks' },
    { name: 'Click Picks', envFile: '.env.click-picks', tableName: 'click_picks_products', channelName: 'Click Picks' },
    { name: 'Global Picks', envFile: '.env.global-picks', tableName: 'global_picks_products', channelName: 'Global Picks' },
    { name: 'DealsHub', envFile: '.env.dealshub', tableName: 'deals_hub_products', channelName: 'DealsHub' },
    { name: 'Loot Box', envFile: '.env.loot-box', tableName: 'lootbox_products', channelName: 'Loot Box' }
  ];

  constructor() {
    this.db = new Database('./database.sqlite');
  }

  /**
   * Initialize all bot message processors
   */
  async initializeAllBots(): Promise<void> {
    console.log('🚀 Initializing Universal Message Processor for all 8 bots...');
    
    for (const config of this.botConfigs) {
      try {
        await this.initializeBot(config);
      } catch (error) {
        console.error(`❌ Failed to initialize ${config.name}: ${error.message}`);
      }
    }
    
    console.log(`✅ Universal Message Processor initialized for ${this.bots.size}/8 bots`);
  }

  /**
   * Initialize individual bot
   */
  private async initializeBot(config: BotConfig): Promise<void> {
    // Load environment variables for this bot
    const envPath = path.join(process.cwd(), config.envFile);
    const envConfig = dotenv.config({ path: envPath });
    
    if (envConfig.error) {
      throw new Error(`Environment file not found: ${config.envFile}`);
    }
    
    const botToken = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
    const channelId = process.env.CHANNEL_ID || process.env.TELEGRAM_CHANNEL_ID;
    
    if (!botToken || !channelId) {
      throw new Error(`Missing bot token or channel ID in ${config.envFile}`);
    }
    
    // Create bot instance
    const bot = new TelegramBot(botToken, { polling: true });
    
    // Set up message listener
    bot.on('message', async (msg) => {
      try {
        await this.processMessage(msg, config);
      } catch (error) {
        console.error(`❌ Error processing message for ${config.name}: ${error.message}`);
      }
    });
    
    // Handle errors
    bot.on('error', (error) => {
      console.error(`❌ ${config.name} bot error: ${error.message}`);
    });
    
    this.bots.set(config.name, bot);
    console.log(`✅ ${config.name} message processor initialized`);
  }

  /**
   * Process incoming message
   */
  private async processMessage(msg: any, config: BotConfig): Promise<void> {
    const text = msg.text || msg.caption || '';
    
    // Check if message contains URLs
    const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/g;
    const urls = text.match(urlRegex);
    
    if (!urls || urls.length === 0) {
      return; // No URLs to process
    }
    
    console.log(`📱 ${config.name}: Processing message with ${urls.length} URL(s)`);
    
    for (const url of urls) {
      try {
        await this.saveProductFromUrl(url, config);
      } catch (error) {
        console.error(`❌ Failed to save product from URL: ${error.message}`);
      }
    }
  }

  /**
   * Save product from URL to database
   */
  private async saveProductFromUrl(url: string, config: BotConfig): Promise<void> {
    // Extract basic product information
    const productData = {
      name: `Product from ${config.channelName}`,
      description: `Product posted in ${config.channelName} channel`,
      price: 'See website',
      currency: 'INR',
      image_url: '/assets/default-product.jpg',
      affiliate_url: url,
      category: 'General',
      rating: '4.0',
      review_count: 0,
      discount: 0,
      is_featured: 0,
      source: 'telegram',
      processing_status: 'active',
      created_at: Math.floor(Date.now() / 1000),
      expires_at: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000) // 30 days
    };
    
    // Build INSERT query
    const columns = Object.keys(productData).join(', ');
    const placeholders = Object.keys(productData).map(() => '?').join(', ');
    const values = Object.values(productData);
    
    const insertQuery = `INSERT INTO ${config.tableName} (${columns}) VALUES (${placeholders})`;
    
    try {
      const stmt = this.db.prepare(insertQuery);
      const result = stmt.run(...values);
      
      console.log(`✅ ${config.name}: Saved product to ${config.tableName} (ID: ${result.lastInsertRowid})`);
    } catch (error) {
      console.error(`❌ Database error for ${config.name}: ${error.message}`);
    }
  }

  /**
   * Get bot status
   */
  getStatus(): { totalBots: number; activeBots: number; botNames: string[] } {
    return {
      totalBots: this.botConfigs.length,
      activeBots: this.bots.size,
      botNames: Array.from(this.bots.keys())
    };
  }

  /**
   * Shutdown all bots
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Universal Message Processor...');
    
    for (const [name, bot] of this.bots) {
      try {
        await bot.stopPolling();
        console.log(`✅ ${name} bot stopped`);
      } catch (error) {
        console.error(`❌ Error stopping ${name} bot: ${error.message}`);
      }
    }
    
    this.bots.clear();
    this.db.close();
    console.log('✅ Universal Message Processor shutdown complete');
  }
}

export const universalMessageProcessor = new UniversalMessageProcessor();
export { UniversalMessageProcessor };
export default universalMessageProcessor;
