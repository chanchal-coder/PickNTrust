// Travel Picks Hybrid Bot - Combines Telegram monitoring, website scraping, and manual curation
import TelegramBot from 'node-telegram-bot-api';
import { sqliteDb } from './db.js';
import { detectTravelSubcategoryEnhanced, getTravelIcon } from './utils/travel-category-detector.js';
import { optimizeTravelUrl, getTravelCommissionComparison } from './utils/travel-affiliate-optimizer.js';
import { travelWebsiteScraper, type ScrapedDeal } from './utils/travel-website-scraper.js';
import * as cheerio from 'cheerio';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Load configuration
const configPath = path.join(process.cwd(), 'travel-picks-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

interface TravelDeal {
  id?: string;
  name: string;
  description: string;
  price: string;
  originalPrice?: string;
  currency: string;
  imageUrl?: string;
  affiliateUrl: string;
  category: string;
  subcategory: string;
  partner?: string;
  route?: string;
  validTill?: string;
  source: 'telegram' | 'scraping' | 'manual' | 'ai';
  confidence: number;
  commission?: number;
}

class TravelPicksBot {
  private bot: TelegramBot;
  private isRunning = false;
  private scrapingInterval: NodeJS.Timeout | null = null;
  private monitoredChannels: Set<string> = new Set();
  private processedDeals: Set<string> = new Set();
  private lastScrapingTime = 0;

  constructor() {
    this.bot = new TelegramBot(config.botToken, { polling: true });
    this.setupEventHandlers();
    this.initializeMonitoredChannels();
  }

  private setupEventHandlers() {
    // Handle incoming messages from monitored channels
    this.bot.on('channel_post', async (msg) => {
      if (this.isRunning && msg.chat && this.monitoredChannels.has(msg.chat.id.toString())) {
        await this.processTelegramMessage(msg);
      }
    });

    // Handle commands
    this.bot.onText(/\/start/, (msg) => {
      this.bot.sendMessage(msg.chat.id, 'Launch Travel Picks Hybrid Bot Started!\n\n' +
        'Success Telegram Monitoring: Active\n' +
        'Success Website Scraping: Active\n' +
        'Success Manual Curation: Ready\n' +
        'Success AI Detection: Enabled\n\n' +
        'Use /help for available commands.');
    });

    this.bot.onText(/\/help/, (msg) => {
      const helpText = `
AI **Travel Picks Hybrid Bot Commands:**

**Control:**
/start - Start the bot
/stop - Stop monitoring
/status - Check bot status
/stats - View performance stats

**Configuration:**
/auto_on - Enable auto mode
/auto_off - Disable auto mode
/min_commission <rate> - Set minimum commission
/max_deals <number> - Set daily deal limit

**Sources:**
/add_channel <@channel> - Monitor new channel
/remove_channel <@channel> - Stop monitoring
/list_channels - Show monitored channels
/scrape_now - Manual scraping trigger

**Analytics:**
/earnings - Today's potential earnings
/best_sources - Top performing sources
/recent_deals - Latest processed deals
      `;
      this.bot.sendMessage(msg.chat.id, helpText, { parse_mode: 'Markdown' });
    });

    this.bot.onText(/\/status/, (msg) => {
      const status = `
Stats **Bot Status:**

Refresh Running: ${this.isRunning ? 'Success Active' : 'Error Stopped'}
Mobile Monitored Channels: ${this.monitoredChannels.size}
Global Website Scraping: ${config.features.websiteScraping ? 'Success Enabled' : 'Error Disabled'}
AI Auto Mode: ${config.settings.autoMode ? 'Success On' : 'Error Off'}
📈 Processed Today: ${this.processedDeals.size}
⏰ Last Scraping: ${new Date(this.lastScrapingTime).toLocaleTimeString()}
      `;
      this.bot.sendMessage(msg.chat.id, status, { parse_mode: 'Markdown' });
    });

    this.bot.onText(/\/stats/, async (msg) => {
      const stats = await this.getPerformanceStats();
      this.bot.sendMessage(msg.chat.id, stats, { parse_mode: 'Markdown' });
    });
  }

  private initializeMonitoredChannels() {
    // Add configured channels to monitoring list
    config.sources.telegramChannels.forEach((channel: string) => {
      // Convert channel username to ID (would need actual implementation)
      // For now, we'll use the channel names as identifiers
      this.monitoredChannels.add(channel);
    });
  }

  public async start() {
    console.log('Launch Starting Travel Picks Hybrid Bot...');
    this.isRunning = true;

    // Start website scraping if enabled
    if (config.features.websiteScraping) {
      this.startWebsiteScraping();
    }

    // Send startup notification
    try {
      await this.bot.sendMessage(config.channelId, 
        'Launch **Travel Picks Hybrid Bot Started!**\n\n' +
        'Success Monitoring ' + this.monitoredChannels.size + ' Telegram channels\n' +
        'Success Scraping ' + config.sources.websites.length + ' travel websites\n' +
        'Success AI-powered deal detection enabled\n' +
        'Success Affiliate optimization active\n\n' +
        'Target Ready to find the best travel deals!',
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      console.error('Failed to send startup notification:', error);
    }

    console.log('Success Travel Picks Bot is now running!');
  }

  public async stop() {
    console.log('Stop Stopping Travel Picks Bot...');
    this.isRunning = false;

    if (this.scrapingInterval) {
      clearInterval(this.scrapingInterval);
      this.scrapingInterval = null;
    }

    try {
      await this.bot.sendMessage(config.channelId, 'Stop Travel Picks Bot stopped.');
    } catch (error) {
      console.error('Failed to send stop notification:', error);
    }

    console.log('Success Travel Picks Bot stopped.');
  }

  private async processTelegramMessage(msg: any) {
    try {
      const messageText = msg.text || msg.caption || '';
      if (!messageText) return;

      console.log('Mobile Processing Telegram message:', messageText.substring(0, 100));

      // Extract URLs from message
      const urls = this.extractUrls(messageText);
      if (urls.length === 0) return;

      // Detect travel category
      const detection = detectTravelSubcategoryEnhanced(
        messageText,
        urls[0],
        '',
        '',
        msg.chat?.title || ''
      );

      if (detection.confidence < 0.3) {
        console.log('Error Low confidence travel detection, skipping');
        return;
      }

      // Create travel deal object
      const deal: TravelDeal = {
        name: this.extractDealName(messageText),
        description: messageText,
        price: this.extractPrice(messageText),
        currency: 'INR',
        affiliateUrl: urls[0],
        category: 'Travel',
        subcategory: detection.subcategory,
        partner: detection.partner,
        route: detection.route,
        source: 'telegram',
        confidence: detection.confidence
      };

      // Process and optimize the deal
      await this.processDeal(deal);

    } catch (error) {
      console.error('Error processing Telegram message:', error);
    }
  }

  private startWebsiteScraping() {
    console.log('Global Starting website scraping...');
    
    this.scrapingInterval = setInterval(async () => {
      if (!this.isRunning) return;

      console.log('Search Starting scraping cycle...');
      this.lastScrapingTime = Date.now();

      for (const website of config.sources.websites) {
        try {
          await this.scrapeWebsite(website);
          // Add delay between websites to avoid being blocked
          await this.delay(5000);
        } catch (error) {
          console.error(`Error scraping ${website}:`, error);
        }
      }

      console.log('Success Scraping cycle completed');
    }, config.settings.scrapingInterval * 1000);
  }

  private async scrapeWebsite(website: string) {
    console.log(`Search Scraping ${website}...`);

    try {
      // Use the dedicated travel website scraper
      const scrapedDeals = await travelWebsiteScraper.scrapeWebsite(website);
      
      // Convert scraped deals to our TravelDeal format and process them
      for (const scrapedDeal of scrapedDeals) {
        const deal: TravelDeal = {
          name: scrapedDeal.name,
          description: scrapedDeal.description,
          price: scrapedDeal.price,
          originalPrice: scrapedDeal.originalPrice,
          currency: scrapedDeal.currency,
          imageUrl: scrapedDeal.imageUrl,
          affiliateUrl: scrapedDeal.dealUrl,
          category: scrapedDeal.category,
          subcategory: scrapedDeal.subcategory,
          partner: scrapedDeal.partner,
          route: scrapedDeal.route,
          validTill: scrapedDeal.validTill,
          source: 'scraping',
          confidence: scrapedDeal.confidence
        };
        
        await this.processDeal(deal);
      }

      console.log(`Success Found ${scrapedDeals.length} deals from ${website}`);
    } catch (error) {
      console.error(`Error Failed to scrape ${website}:`, error.message);
    }
  }



  private async processDeal(deal: TravelDeal) {
    try {
      // Check for duplicates
      const dealHash = this.generateDealHash(deal);
      if (this.processedDeals.has(dealHash)) {
        console.log('Warning Duplicate deal detected, skipping');
        return;
      }

      // Optimize affiliate URL
      deal.affiliateUrl = await this.optimizeAffiliateUrl(deal.affiliateUrl, deal.subcategory);

      // Calculate commission
      deal.commission = this.calculateCommission(deal);

      // Check quality threshold
      if (deal.confidence < config.settings.qualityThreshold) {
        console.log('Error Deal below quality threshold, skipping');
        return;
      }

      // Save to database
      await this.saveDealToDatabase(deal);

      // Post to channel if auto mode is enabled
      if (config.settings.autoMode) {
        await this.postDealToChannel(deal);
      }

      // Mark as processed
      this.processedDeals.add(dealHash);

      console.log('Success Deal processed successfully:', deal.name);
    } catch (error) {
      console.error('Error processing deal:', error);
    }
  }

  private async optimizeAffiliateUrl(url: string, subcategory: string): Promise<string> {
    try {
      // Extract deal value from price for better optimization
      const dealValue = this.extractDealValue(url);
      
      // Use the affiliate optimizer to get the best URL
      const optimization = optimizeTravelUrl(url, subcategory, dealValue);
      
      console.log(`Price Optimized for ${optimization.selectedPartner} (${optimization.commissionRate}% = ₹${optimization.estimatedCommission})`);
      
      return optimization.optimizedUrl;
    } catch (error) {
      console.error('Error optimizing affiliate URL:', error);
      return url;
    }
  }

  private extractDealValue(url: string): number {
    // Try to extract deal value from URL parameters or use a default
    const urlObj = new URL(url);
    const priceParam = urlObj.searchParams.get('price') || urlObj.searchParams.get('amount');
    
    if (priceParam) {
      const value = parseFloat(priceParam.replace(/[^0-9.]/g, ''));
      return isNaN(value) ? 5000 : value; // Default to 5000 if can't parse
    }
    
    return 5000; // Default deal value
  }

  private calculateCommission(deal: TravelDeal): number {
    const price = parseFloat(deal.price.replace(/[^0-9.]/g, '')) || 0;
    const commissionRate = 0.04; // 4% default
    return Math.round(price * commissionRate);
  }

  private async saveDealToDatabase(deal: TravelDeal) {
    try {
      const result = sqliteDb.prepare(`
        INSERT INTO travel_products (
          name, description, price, original_price, currency, image_url, affiliate_url,
          category, subcategory, rating, review_count, discount, is_featured,
          created_at, processing_status, source
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        deal.name,
        deal.description,
        deal.price,
        deal.originalPrice || deal.price,
        deal.currency,
        deal.imageUrl || '',
        deal.affiliateUrl,
        deal.category,
        deal.subcategory,
        4.0, // Default rating
        100, // Default review count
        0, // Default discount
        0, // Not featured by default
        Math.floor(Date.now() / 1000), // Created at timestamp
        'active', // Processing status
        'travel_picks_bot' // Source
      );

      console.log('Save Deal saved to database with ID:', result.lastInsertRowid);
    } catch (error) {
      console.error('Error Failed to save deal to database:', error);
    }
  }

  private async postDealToChannel(deal: TravelDeal) {
    try {
      const icon = getTravelIcon(deal.subcategory);
      const message = `${icon} **${deal.name}**\n\n` +
        `Price **Price:** ${deal.price} ${deal.currency}\n` +
        (deal.route ? `🛣️ **Route:** ${deal.route}\n` : '') +
        (deal.partner ? `🏢 **Partner:** ${deal.partner}\n` : '') +
        `Stats **Category:** ${deal.subcategory}\n` +
        (deal.commission ? `💵 **Potential Earning:** ₹${deal.commission}\n` : '') +
        `Link **Book Now:** ${deal.affiliateUrl}\n\n` +
        `AI *Auto-detected by Travel Picks Bot*`;

      await this.bot.sendMessage(config.channelId, message, { 
        parse_mode: 'Markdown',
        disable_web_page_preview: false
      });

      console.log('📤 Deal posted to channel');
    } catch (error) {
      console.error('Error Failed to post deal to channel:', error);
    }
  }

  private generateDealHash(deal: TravelDeal): string {
    return `${deal.name}_${deal.price}_${deal.subcategory}`.toLowerCase().replace(/\s+/g, '_');
  }

  private extractUrls(text: string): string[] {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
  }

  private extractDealName(text: string): string {
    // Extract deal name from message text
    const lines = text.split('\n');
    const firstLine = lines[0].trim();
    
    // Remove common prefixes and clean up
    return firstLine
      .replace(/^(deal|offer|sale|discount)\s*:?\s*/i, '')
      .replace(/[Hot💥FastSpecialCelebration🎊]/g, '')
      .trim()
      .substring(0, 100);
  }

  private extractPrice(text: string): string {
    // Extract price from message text
    const priceRegex = /₹\s*([0-9,]+)|INR\s*([0-9,]+)|Rs\.?\s*([0-9,]+)/i;
    const match = text.match(priceRegex);
    
    if (match) {
      const price = match[1] || match[2] || match[3];
      return `₹${price}`;
    }
    
    return '₹0';
  }

  private async getPerformanceStats(): Promise<string> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const stats = sqliteDb.prepare(`
        SELECT 
          COUNT(*) as total_deals,
          subcategory,
          AVG(CAST(REPLACE(REPLACE(price, '₹', ''), ',', '') AS INTEGER)) as avg_price
        FROM products 
        WHERE category = 'Travel' 
        AND DATE(created_at) = ?
        GROUP BY subcategory
      `).all(today);

      let statsText = `Stats **Today's Performance:**\n\n`;
      let totalDeals = 0;
      let totalValue = 0;

      for (const stat of stats) {
        const icon = getTravelIcon(stat.subcategory);
        statsText += `${icon} **${stat.subcategory}:** ${stat.total_deals} deals (Avg: ₹${Math.round(stat.avg_price)})\n`;
        totalDeals += stat.total_deals;
        totalValue += stat.total_deals * stat.avg_price;
      }

      statsText += `\n📈 **Total:** ${totalDeals} deals\n`;
      statsText += `Price **Total Value:** ₹${Math.round(totalValue).toLocaleString()}\n`;
      statsText += `💵 **Potential Earnings:** ₹${Math.round(totalValue * 0.04).toLocaleString()}\n`;

      return statsText;
    } catch (error) {
      console.error('Error getting performance stats:', error);
      return 'Error Failed to get performance stats';
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export the bot instance
export const travelPicksBot = new TravelPicksBot();

// Auto-start if this file is run directly (ES module compatible)
if (import.meta.url === `file://${process.argv[1]}`) {
  travelPicksBot.start().catch(console.error);
}