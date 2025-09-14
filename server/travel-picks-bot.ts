/**
 * Enhanced Travel Picks Bot - Smart Travel Category Detection
 * Automatically categorizes travel products based on URL patterns and content
 */

import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';
import axios from 'axios';
import * as cheerio from 'cheerio';

import { webhookManager } from './webhook-routes';
// Load Travel Picks environment variables
const travelPicksEnvPath = path.join(process.cwd(), '.env.travel-picks');
if (fs.existsSync(travelPicksEnvPath)) {
  dotenv.config({ path: travelPicksEnvPath });
}

// Bot Configuration
const BOT_TOKEN = process.env.TRAVEL_PICKS_BOT_TOKEN;
const CHANNEL_ID = process.env.TRAVEL_PICKS_CHANNEL_ID;
const CHANNEL_USERNAME = process.env.TRAVEL_PICKS_CHANNEL_USERNAME;
const TARGET_PAGE = process.env.TRAVEL_PICKS_TARGET_PAGE || 'travel-picks';
const BOT_USERNAME = process.env.TRAVEL_PICKS_BOT_USERNAME || 'travelpickspnt_bot';
const CHANNEL_NAME = process.env.TRAVEL_PICKS_CHANNEL_NAME || 'Travel Picks PNT';

if (!BOT_TOKEN || !CHANNEL_ID) {
  console.warn('Warning Travel Picks bot credentials not found');
  console.warn('Blog Please check TRAVEL_PICKS_BOT_TOKEN and TRAVEL_PICKS_CHANNEL_ID');
}

interface TravelProduct {
  name: string;
  description: string;
  price: string;
  originalPrice?: string;
  currency: string;
  imageUrl: string;
  affiliateUrl: string;
  originalUrl: string;
  category: string;
  subcategory: string;
  travelType: string;
  partner?: string;
  validTill?: string;
  route?: string;
  duration?: string;
  rating?: number;
  reviewCount?: number;
  source: string;
  telegramMessageId: number;
  telegramChannelId: number;
}

// Travel category detection patterns
const TRAVEL_PATTERNS = {
  flights: {
    domains: ['makemytrip.com', 'goibibo.com', 'cleartrip.com', 'yatra.com', 'ixigo.com', 'spicejet.com', 'indigo.com', 'airindia.com'],
    keywords: ['flight', 'flights', 'airline', 'air', 'domestic', 'international', 'booking'],
    urlPatterns: ['/flights', '/flight', '/air-tickets', '/airline']
  },
  hotels: {
    domains: ['booking.com', 'agoda.com', 'hotels.com', 'oyo.com', 'treebo.com', 'fabhotels.com', 'goibibo.com/hotels'],
    keywords: ['hotel', 'hotels', 'accommodation', 'stay', 'resort', 'lodge', 'guest house'],
    urlPatterns: ['/hotels', '/hotel', '/accommodation', '/stay']
  },
  packages: {
    domains: ['makemytrip.com/holidays', 'thomascook.in', 'kesari.in', 'veenaworld.com', 'coxandkings.com'],
    keywords: ['package', 'packages', 'holiday', 'tour package', 'vacation', 'honeymoon'],
    urlPatterns: ['/holidays', '/packages', '/tour-packages', '/vacation']
  },
  tours: {
    domains: ['thrillophilia.com', 'viator.com', 'getyourguide.com', 'klook.com', 'headout.com'],
    keywords: ['tour', 'tours', 'sightseeing', 'activity', 'experience', 'adventure'],
    urlPatterns: ['/tours', '/activities', '/experiences', '/sightseeing']
  },
  bus: {
    domains: ['redbus.in', 'abhibus.com', 'ticketgoose.com', 'paytm.com/bus', 'makemytrip.com/bus'],
    keywords: ['bus', 'volvo', 'sleeper', 'ac bus', 'non-ac'],
    urlPatterns: ['/bus', '/bus-tickets', '/bus-booking']
  },
  train: {
    domains: ['irctc.co.in', 'confirmtkt.com', 'railyatri.in', 'ixigo.com/trains', 'paytm.com/trains'],
    keywords: ['train', 'railway', 'irctc', 'tatkal', 'sleeper', 'ac'],
    urlPatterns: ['/trains', '/train-tickets', '/railway']
  },
  'car-rental': {
    domains: ['zoomcar.com', 'carzonrent.com', 'avis.co.in', 'hertz.co.in', 'savaari.com', 'drivezy.com'],
    keywords: ['car rental', 'cab', 'taxi', 'self drive', 'chauffeur'],
    urlPatterns: ['/car-rental', '/cabs', '/taxi', '/self-drive']
  },
  cruises: {
    domains: ['cruise.co.in', 'angriyacruises.com', 'jaleshcruises.com', 'cordelia-cruises.com'],
    keywords: ['cruise', 'ship', 'ferry', 'yacht', 'boat'],
    urlPatterns: ['/cruise', '/cruises', '/ferry', '/boat']
  },
  tickets: {
    domains: ['bookmyshow.com', 'paytm.com/events', 'insider.in', 'townscript.com', 'explara.com'],
    keywords: ['tickets', 'event', 'concert', 'movie', 'show', 'entertainment'],
    urlPatterns: ['/events', '/tickets', '/shows', '/movies']
  }
};

class EnhancedTravelPicksBot {
  private bot: TelegramBot | null = null;
  private isInitialized = false;
  private db: Database.Database;

  constructor() {
    this.db = new Database(path.join(process.cwd(), 'database.sqlite'));
    this.initializeDatabase();
  }

  // WEBHOOK MODE: Unified message handler
  private async handleMessage(msg: TelegramBot.Message): Promise<void> {
    try {
      if (msg.chat.type === 'private') {
        await this.handlePrivateMessage(msg);
      } else if (msg.chat.id === parseInt(CHANNEL_ID!) || msg.chat.id.toString() === CHANNEL_ID) {
        console.log(`Enhanced Travel Picks: Processing channel message from ${msg.chat.id}`);
        await this.handleChannelMessage(msg);
      } else {
        console.log(`Enhanced Travel Picks: Ignoring message from chat ${msg.chat.id} (expected ${CHANNEL_ID})`);
      }
    } catch (error) {
      console.error('Enhanced Travel Picks Bot message handling error:', error);
    }
  }

  // WEBHOOK MODE: Alternative message handler
  private async handleTelegramMessage(msg: TelegramBot.Message): Promise<void> {
    await this.handleMessage(msg);
  }

  private initializeDatabase() {
    // Create travel_deals table if not exists
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS travel_deals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price TEXT NOT NULL,
        originalPrice TEXT,
        currency TEXT DEFAULT 'INR',
        imageUrl TEXT,
        affiliateUrl TEXT NOT NULL,
        originalUrl TEXT,
        category TEXT DEFAULT 'travel',
        subcategory TEXT,
        travelType TEXT,
        partner TEXT,
        validTill TEXT,
        route TEXT,
        duration TEXT,
        rating REAL,
        reviewCount INTEGER,
        source TEXT DEFAULT 'telegram_travel_bot',
        telegramMessageId INTEGER,
        telegramChannelId INTEGER,
        processingStatus TEXT DEFAULT 'active',
        createdAt INTEGER DEFAULT (strftime('%s', 'now')),
        updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);
  }

  async initialize(): Promise<void> {
    if (this.isInitialized || !BOT_TOKEN || !CHANNEL_ID) {
      return;
    }

    try {
      this.bot = new TelegramBot(BOT_TOKEN, { polling: false });
      // Register with webhook manager
      webhookManager.registerBot('travel-picks', BOT_TOKEN, this.handleMessage.bind(this));
      
      console.log('Launch Travel Picks Bot initializing...');
      console.log(`   Bot: ${BOT_USERNAME}`);
      console.log(`   Channel: ${CHANNEL_NAME} (${CHANNEL_ID})`);
      console.log(`   Target: ${TARGET_PAGE} page`);
      console.log('📡 Travel Picks bot registered for webhook mode');
      
      // Webhook mode - no polling listeners needed
      this.setupErrorHandling();
      
      this.isInitialized = true;
      console.log('Success Enhanced Travel Picks Bot initialized successfully');
      
    } catch (error) {
      console.error('Error Failed to initialize Enhanced Travel Picks Bot:', error);
      throw error;
    }
  }

  private setupMessageListeners(): void {
    if (!this.bot) return;

    // Handle channel posts
    this.bot.on('channel_post', async (msg) => {
      if (msg.chat.id === parseInt(CHANNEL_ID) || msg.chat.id.toString() === CHANNEL_ID) {
          console.log(`Enhanced Travel Picks: Processing channel message from ${msg.chat.id}`);
        await this.handleChannelMessage(msg);
      }
    });

    // Handle private messages
    this.bot.on('message', async (msg) => {
      if (msg.chat.type === 'private') {
        await this.handlePrivateMessage(msg);
      }
    });
  }

  private async handleChannelMessage(msg: TelegramBot.Message): Promise<void> {
    console.log('Flight Travel Picks message received:', {
      messageId: msg.message_id,
      chatId: msg.chat.id,
      text: msg.text?.substring(0, 100) + '...'
    });

    if (!msg.text) {
      console.log('⏭️ Skipping message without text content');
      return;
    }

    const urls = this.extractUrls(msg.text);
    
    if (urls.length === 0) {
      console.log('⏭️ No URLs found in travel message');
      return;
    }

    console.log(`Link Found ${urls.length} URLs in travel message`);

    for (const url of urls) {
      try {
        await this.processProductUrl(url, msg);
      } catch (error) {
        console.error(`Error Error processing travel URL ${url}:`, error);
      }
    }
  }

  private async handlePrivateMessage(msg: TelegramBot.Message): Promise<void> {
    if (msg.text === '/start') {
      const welcomeMessage = 
        `🌍 Welcome to ${CHANNEL_NAME}!\n\n` +
        `Flight Smart travel deal detection\n` +
        `Hotel Automatic categorization\n` +
        `Target Best travel prices\n` +
        `Mobile Monitoring: ${CHANNEL_NAME}\n` +
        `Target Target: ${TARGET_PAGE} page\n\n` +
        `🔧 Status: TRAVEL AUTOPOSTING\n` +
        `⏰ Time: ${new Date().toLocaleString()}`;
        
      await this.bot?.sendMessage(msg.chat.id, welcomeMessage);
      console.log(`Mobile Sent /start response to user ${msg.from?.username || 'unknown'}`);
    }
  }

  private extractUrls(text: string): string[] {
    const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
    return text.match(urlRegex) || [];
  }

  private async processProductUrl(url: string, message: TelegramBot.Message): Promise<void> {
    try {
      console.log(`Search Processing travel URL: ${url}`);
      
      // Expand short URLs
      const expandedUrl = await this.expandUrl(url);
      console.log(`Global Expanded URL: ${expandedUrl}`);
      
      // Detect travel category
      const travelCategory = this.detectTravelCategory(expandedUrl, message.text || '');
      console.log(`Target Detected category: ${travelCategory}`);
      
      // Convert to affiliate URL
      const affiliateUrl = await this.convertToAffiliateUrl(expandedUrl, travelCategory);
      console.log(`Price Affiliate URL: ${affiliateUrl}`);
      
      // Extract product data
      const productData = await this.extractProductData(affiliateUrl, expandedUrl, message, travelCategory);
      
      if (!productData) {
        console.log('Warning Could not extract travel product data, skipping...');
        return;
      }
      
      // Save to database
      await this.saveProduct({
        ...productData,
        affiliateUrl,
        originalUrl: expandedUrl,
        travelType: travelCategory,
        subcategory: travelCategory,
        source: 'telegram-travel-picks',
        telegramMessageId: message.message_id,
        telegramChannelId: parseInt(CHANNEL_ID!)
      });
      
      console.log('Success Travel product saved successfully:', productData.name);
      
    } catch (error) {
      console.error('Error Error processing travel product URL:', error);
    }
  }

  private async expandUrl(url: string): Promise<string> {
    try {
      if (this.isShortUrl(url)) {
        const response = await axios.head(url, {
          maxRedirects: 5,
          timeout: 10000,
          validateStatus: () => true
        });
        return response.request.res.responseUrl || url;
      }
      return url;
    } catch (error) {
      console.warn('Could not expand URL, using original:', url);
      return url;
    }
  }

  private isShortUrl(url: string): boolean {
    const shortDomains = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'short.link', 'cutt.ly'];
    return shortDomains.some(domain => url.includes(domain));
  }

  private detectTravelCategory(url: string, messageText: string): string {
    const urlLower = url.toLowerCase();
    const textLower = messageText.toLowerCase();
    
    // Check each travel category
    for (const [category, patterns] of Object.entries(TRAVEL_PATTERNS)) {
      // Check domain patterns
      if (patterns.domains.some(domain => urlLower.includes(domain))) {
        return category;
      }
      
      // Check URL path patterns
      if (patterns.urlPatterns.some(pattern => urlLower.includes(pattern))) {
        return category;
      }
      
      // Check keywords in message text
      if (patterns.keywords.some(keyword => textLower.includes(keyword))) {
        return category;
      }
    }
    
    // Default fallback based on common travel keywords
    if (textLower.includes('flight') || textLower.includes('airline')) return 'flights';
    if (textLower.includes('hotel') || textLower.includes('stay')) return 'hotels';
    if (textLower.includes('package') || textLower.includes('holiday')) return 'packages';
    if (textLower.includes('tour') || textLower.includes('sightseeing')) return 'tours';
    if (textLower.includes('bus')) return 'bus';
    if (textLower.includes('train') || textLower.includes('railway')) return 'train';
    if (textLower.includes('cab') || textLower.includes('taxi')) return 'car-rental';
    if (textLower.includes('cruise') || textLower.includes('ship')) return 'cruises';
    if (textLower.includes('ticket') || textLower.includes('event')) return 'tickets';
    
    return 'packages'; // Default to packages for general travel
  }

  private async convertToAffiliateUrl(url: string, category: string): Promise<string> {
    // Implement affiliate conversion based on travel category
    // This is a simplified version - you can enhance based on your affiliate networks
    
    const affiliateTags = {
      flights: process.env.TRAVEL_FLIGHTS_AFFILIATE_TAG || 'flights_ref=travelpnt',
      hotels: process.env.TRAVEL_HOTELS_AFFILIATE_TAG || 'hotels_ref=travelpnt',
      packages: process.env.TRAVEL_PACKAGES_AFFILIATE_TAG || 'packages_ref=travelpnt',
      tours: process.env.TRAVEL_TOURS_AFFILIATE_TAG || 'tours_ref=travelpnt',
      bus: process.env.TRAVEL_BUS_AFFILIATE_TAG || 'bus_ref=travelpnt',
      train: process.env.TRAVEL_TRAIN_AFFILIATE_TAG || 'train_ref=travelpnt',
      'car-rental': process.env.TRAVEL_CAR_AFFILIATE_TAG || 'car_ref=travelpnt',
      cruises: process.env.TRAVEL_CRUISE_AFFILIATE_TAG || 'cruise_ref=travelpnt',
      tickets: process.env.TRAVEL_TICKETS_AFFILIATE_TAG || 'tickets_ref=travelpnt'
    };
    
    const tag = affiliateTags[category as keyof typeof affiliateTags] || 'ref=travelpnt';
    
    // Add affiliate tag to URL
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${tag}`;
  }

  private async extractProductData(affiliateUrl: string, originalUrl: string, message: TelegramBot.Message, category: string): Promise<TravelProduct | null> {
    try {
      // Try to scrape product data
      const response = await axios.get(originalUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      
      // Extract basic product information
      const name = this.extractProductName($, message.text || '', category);
      const description = this.extractDescription($, message.text || '', category);
      const pricing = this.extractPricing($, category);
      const imageUrl = this.extractImageUrl($, originalUrl);
      const additionalInfo = this.extractTravelSpecificInfo($, category);
      
      return {
        name,
        description,
        price: pricing.price,
        originalPrice: pricing.originalPrice,
        currency: pricing.currency,
        imageUrl,
        affiliateUrl,
        originalUrl,
        category: 'travel',
        subcategory: category,
        travelType: category,
        ...additionalInfo,
        source: 'telegram-travel-picks',
        telegramMessageId: message.message_id,
        telegramChannelId: parseInt(CHANNEL_ID!)
      };
      
    } catch (error) {
      console.warn('Could not scrape travel product data, using fallback:', error);
      
      // Fallback to message-based extraction
      return this.extractFromMessage(message.text || '', affiliateUrl, originalUrl, category);
    }
  }

  private extractProductName($: cheerio.Root, messageText: string, category: string): string {
    // Try various selectors for travel product names
    const selectors = [
      'h1',
      '.product-title',
      '.hotel-name',
      '.flight-title',
      '.package-name',
      '.tour-title',
      'title'
    ];
    
    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length && element.text().trim()) {
        return element.text().trim();
      }
    }
    
    // Fallback to message text
    const lines = messageText.split('\n');
    const firstLine = lines[0]?.trim();
    if (firstLine && firstLine.length > 10) {
      return firstLine;
    }
    
    return `${category.charAt(0).toUpperCase() + category.slice(1)} Deal - ${new Date().toLocaleDateString()}`;
  }

  private extractDescription($: cheerio.Root, messageText: string, category: string): string {
    // Try to extract description from various sources
    const descSelectors = ['.description', '.details', '.summary', '.overview'];
    
    for (const selector of descSelectors) {
      const element = $(selector).first();
      if (element.length && element.text().trim()) {
        return element.text().trim().substring(0, 500);
      }
    }
    
    // Use message text as description
    return messageText.substring(0, 500) || `Amazing ${category} deal with great savings!`;
  }

  private extractPricing($: cheerio.Root, category: string): { price: string; originalPrice?: string; currency: string } {
    // Try to extract pricing information
    const priceSelectors = ['.price', '.cost', '.amount', '.fare', '.rate'];
    
    for (const selector of priceSelectors) {
      const element = $(selector).first();
      if (element.length && element.text().trim()) {
        const priceText = element.text().trim();
        const priceMatch = priceText.match(/[₹$€£]?([\d,]+)/g);
        if (priceMatch && priceMatch.length > 0) {
          return {
            price: priceMatch[0].replace(/[₹$€£,]/g, ''),
            originalPrice: priceMatch[1]?.replace(/[₹$€£,]/g, ''),
            currency: 'INR'
          };
        }
      }
    }
    
    // Default pricing based on category
    const defaultPrices = {
      flights: '5000',
      hotels: '3000',
      packages: '15000',
      tours: '2000',
      bus: '500',
      train: '800',
      'car-rental': '2500',
      cruises: '25000',
      tickets: '1000'
    };
    
    return {
      price: defaultPrices[category as keyof typeof defaultPrices] || '1000',
      currency: 'INR'
    };
  }

  private extractImageUrl($: cheerio.Root, originalUrl: string): string {
    // Try to extract product image
    const imgSelectors = [
      'meta[property="og:image"]',
      '.product-image img',
      '.main-image img',
      '.hero-image img',
      'img[alt*="product"]',
      'img[alt*="hotel"]',
      'img[alt*="flight"]'
    ];
    
    for (const selector of imgSelectors) {
      const element = $(selector).first();
      let imgUrl = element.attr('content') || element.attr('src');
      
      if (imgUrl) {
        // Convert relative URLs to absolute
        if (imgUrl.startsWith('/')) {
          const baseUrl = new URL(originalUrl).origin;
          imgUrl = baseUrl + imgUrl;
        }
        
        if (imgUrl.startsWith('http')) {
          return imgUrl;
        }
      }
    }
    
    // Default travel images based on category
    const defaultImages = {
      flights: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400',
      hotels: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
      packages: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400',
      tours: 'https://images.unsplash.com/photo-1539650116574-75c0c6d73c6e?w=400',
      bus: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400',
      train: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=400',
      'car-rental': 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400',
      cruises: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=400',
      tickets: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400'
    };
    
    return 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400'; // Default travel image
  }

  private extractTravelSpecificInfo($: cheerio.Root, category: string): Partial<TravelProduct> {
    const info: Partial<TravelProduct> = {};
    
    // Extract category-specific information
    switch (category) {
      case 'flights':
        info.route = $('.route, .sector, .from-to').first().text().trim() || undefined;
        info.duration = $('.duration, .flight-time').first().text().trim() || undefined;
        break;
      case 'hotels':
        info.partner = $('.hotel-chain, .brand').first().text().trim() || undefined;
        break;
      case 'packages':
        info.duration = $('.duration, .days').first().text().trim() || undefined;
        info.partner = $('.operator, .provider').first().text().trim() || undefined;
        break;
    }
    
    // Extract validity
    const validitySelectors = ['.validity', '.valid-till', '.expires', '.offer-ends'];
    for (const selector of validitySelectors) {
      const element = $(selector).first();
      if (element.length && element.text().trim()) {
        info.validTill = element.text().trim();
        break;
      }
    }
    
    return info;
  }

  private extractFromMessage(messageText: string, affiliateUrl: string, originalUrl: string, category: string): TravelProduct {
    const lines = messageText.split('\n').filter(line => line.trim());
    const firstLine = lines[0]?.trim() || `${category} Deal`;
    
    // Try to extract price from message
    const priceMatch = messageText.match(/[₹$€£]?([\d,]+)/g);
    const price = priceMatch ? priceMatch[0].replace(/[₹$€£,]/g, '') : '1000';
    
    return {
      name: firstLine,
      description: messageText.substring(0, 500) || `Great ${category} deal with amazing savings!`,
      price,
      currency: 'INR',
      imageUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400',
      affiliateUrl,
      originalUrl,
      category: 'travel',
      subcategory: category,
      travelType: category,
      source: 'telegram-travel-picks',
      telegramMessageId: 0,
      telegramChannelId: parseInt(CHANNEL_ID!)
    };
  }

  private async saveProduct(productData: TravelProduct): Promise<void> {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO travel_deals (
          name, description, price, originalPrice, currency, imageUrl,
          affiliateUrl, originalUrl, category, subcategory, travelType,
          partner, validTill, route, duration, rating, reviewCount,
          source, telegramMessageId, telegramChannelId, processingStatus
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        productData.subcategory,
        productData.travelType,
        productData.partner || null,
        productData.validTill || null,
        productData.route || null,
        productData.duration || null,
        productData.rating || null,
        productData.reviewCount || null,
        productData.source,
        productData.telegramMessageId,
        productData.telegramChannelId,
        'active'
      );
      
      console.log(`Save Travel product saved with ID: ${result.lastInsertRowid}`);
      console.log(`Stats Category: ${productData.travelType}`);
      console.log(`Price Price: ₹${productData.price}`);
      console.log(`Mobile Travel product will appear on /${TARGET_PAGE} page`);
      
    } catch (error) {
      console.error('Error Error saving travel product:', error);
      throw error;
    }
  }

  private setupErrorHandling(): void {
    if (!this.bot) return;

    this.bot.on('polling_error', (error) => {
      console.error('Error Travel Picks Bot polling error:', error.message);
    });

    this.bot.on('error', (error) => {
      console.error('Error Travel Picks Bot error:', error.message);
    });
  }

  async shutdown(): Promise<void> {
    if (this.bot && this.isInitialized) {
      console.log('Stop Shutting down Enhanced Travel Picks Bot...');
      await this.bot.stopPolling();
      this.bot = null;
      this.isInitialized = false;
      console.log('Success Enhanced Travel Picks Bot shutdown complete');
    }
    
    if (this.db) {
      this.db.close();
    }
  }

  getStatus(): { initialized: boolean; channelId?: string; targetPage: string } {
    return {
      initialized: this.isInitialized,
      channelId: CHANNEL_ID,
      targetPage: TARGET_PAGE
    };
  }
}

// Create and export bot instance
const travelPicksBot = new EnhancedTravelPicksBot();

// Export functions for compatibility
export async function initializeTravelPicksBot(): Promise<void> {
  try {
    console.log('Launch Initializing Travel Picks Bot...');
    await travelPicksBot.initialize();
    console.log('Success Travel Picks Bot initialized successfully');
  } catch (error) {
    console.error('Error Failed to initialize Travel Picks Bot:', error);
    throw error;
  }
}

// Auto-initialize if credentials are available
if (BOT_TOKEN && CHANNEL_ID) {
  initializeTravelPicksBot().catch(console.error);
} else if (!BOT_TOKEN || !CHANNEL_ID) {
  console.log('Warning Travel Picks bot not initialized - missing credentials');
}

// Add start method for compatibility with existing code
interface TravelPicksBotWithStart extends EnhancedTravelPicksBot {
  start(): Promise<EnhancedTravelPicksBot>;
}

(travelPicksBot as any).start = async () => {
  await travelPicksBot.initialize();
  return travelPicksBot;
};

export { travelPicksBot as travelPicksBot };