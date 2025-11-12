import TelegramBot from 'node-telegram-bot-api';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { urlProcessingService } from './url-processing-service.js';
import { categorizeForAutomation, shouldAutoCategorize } from './enhanced-smart-categorization.js';
import { getDatabasePath, getDatabaseOptions } from './config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Travel Picks Bot Configuration
const TRAVEL_BOT_CONFIG = {
  botToken: '7998139680:AAGVKECApmHNi4LMp2wR3UdVFfYgkT1HwZo',
  botUsername: 'travelpicks_bot',
  channelId: '-1003047967930',
  channelName: 'Travel Picks',
  tableName: 'travel_products'
};

// Travel category mapping
const TRAVEL_CATEGORIES = {
  'flight': 'flights',
  'flights': 'flights',
  'hotel': 'hotels',
  'hotels': 'hotels',
  'tour': 'tours',
  'tours': 'tours',
  'package': 'packages',
  'packages': 'packages',
  'cruise': 'cruises',
  'cruises': 'cruises',
  'bus': 'bus',
  'train': 'train',
  'car': 'car-rental',
  'rental': 'car-rental'
};

// Travel affiliate templates
const TRAVEL_AFFILIATE_TEMPLATES = {
  'makemytrip.com': 'utm_source=pickntrust&utm_campaign=travel',
  'booking.com': 'aid=1234567',
  'redbus.in': 'utm_source=pickntrust',
  'irctc.co.in': 'utm_source=pickntrust',
  'goibibo.com': 'utm_source=pickntrust',
  'cleartrip.com': 'utm_source=pickntrust',
  'yatra.com': 'utm_source=pickntrust'
};

class TravelPicksBot {
  private bot: TelegramBot | null = null;
  private db: Database.Database;
  private isInitialized: boolean = false;

  constructor() {
    // Initialize database using centralized resolver to ensure consistency in prod
    const dbPath = getDatabasePath();
    try {
      if (process.env.LOG_DB_PATH === 'true') {
        console.log('🧳 Travel bot DB path:', dbPath);
      }
      this.db = new Database(dbPath, getDatabaseOptions());
      // Ensure WAL mode for better concurrency; falls back silently if unsupported
      try { this.db.pragma('journal_mode = WAL'); } catch {}
    } catch (err) {
      console.error('❌ Failed to open travel database at', dbPath, err);
      throw err;
    }
    
    // Ensure travel_products table exists
    this.initializeDatabase();
  }

  private initializeDatabase(): void {
    try {
      // Defensive migration: ensure required columns exist on travel_categories
      try {
        const cols = this.db.prepare(`PRAGMA table_info(travel_categories)`).all();
        const hasTable = Array.isArray(cols) && cols.length > 0;
        const hasSortOrder = hasTable && cols.some((c: any) => String(c.name).toLowerCase() === 'sort_order');
        if (hasTable && !hasSortOrder) {
          this.db.exec(`ALTER TABLE travel_categories ADD COLUMN sort_order INTEGER DEFAULT 0`);
          console.log('🧳 Added missing column travel_categories.sort_order');
        }
      } catch (migErr) {
        console.warn('⚠️ Could not run defensive migration for travel_categories:', migErr);
      }

      // Create travel_products table if it doesn't exist
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS travel_products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          price TEXT,
          original_price TEXT,
          currency TEXT DEFAULT 'INR',
          image_url TEXT,
          affiliate_url TEXT,
          category TEXT NOT NULL,
          rating REAL DEFAULT 0,
          review_count INTEGER DEFAULT 0,
          discount TEXT,
          is_featured BOOLEAN DEFAULT 0,
          affiliate_network TEXT,
          telegram_message_id INTEGER,
          telegram_channel_id TEXT,
          click_count INTEGER DEFAULT 0,
          conversion_count INTEGER DEFAULT 0,
          processing_status TEXT DEFAULT 'active',
          expires_at INTEGER,
          created_at INTEGER DEFAULT (strftime('%s', 'now')),
          updated_at INTEGER DEFAULT (strftime('%s', 'now')),
          has_limited_offer BOOLEAN DEFAULT 0,
          limited_offer_text TEXT
        )
      `);

      // Create travel_categories table for category management
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS travel_categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          slug TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          icon TEXT,
          description TEXT,
          is_active BOOLEAN DEFAULT 1,
          sort_order INTEGER DEFAULT 0,
          created_at INTEGER DEFAULT (strftime('%s', 'now'))
        )
      `);

      // Insert default travel categories if they don't exist
      const defaultCategories = [
        { slug: 'flights', name: 'Flights', icon: 'fas fa-plane', description: 'Flight booking and deals' },
        { slug: 'hotels', name: 'Hotels', icon: 'fas fa-bed', description: 'Hotel booking and deals' },
        { slug: 'tours', name: 'Tours', icon: 'fas fa-map-marked-alt', description: 'Tour packages and experiences' },
        { slug: 'packages', name: 'Packages', icon: 'fas fa-suitcase', description: 'Complete travel packages' },
        { slug: 'cruises', name: 'Cruises', icon: 'fas fa-ship', description: 'Cruise deals and packages' },
        { slug: 'bus', name: 'Bus', icon: 'fas fa-bus', description: 'Bus booking and deals' },
        { slug: 'train', name: 'Train', icon: 'fas fa-train', description: 'Train booking and deals' },
        { slug: 'car-rental', name: 'Car Rental', icon: 'fas fa-car', description: 'Car rental deals' }
      ];

      const insertCategory = this.db.prepare(`
        INSERT OR IGNORE INTO travel_categories (slug, name, icon, description, sort_order)
        VALUES (?, ?, ?, ?, ?)
      `);

      defaultCategories.forEach((category, index) => {
        insertCategory.run(category.slug, category.name, category.icon, category.description, index);
      });

      console.log('✅ Travel database initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing travel database:', error);
    }
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('🧳 Travel Picks bot already initialized');
      return;
    }

    try {
      console.log('🧳 Initializing Travel Picks bot...');
      const isDev = (process.env.NODE_ENV || 'development') !== 'production';
      const forcePolling = ['1','true','yes'].includes(String(process.env.TRAVEL_BOT_POLLING || '').toLowerCase());
      const usePolling = forcePolling || isDev;

      // Choose dev token if present to avoid conflicts
      const token = (isDev && process.env.TRAVEL_PICKS_BOT_TOKEN_DEV)
        ? process.env.TRAVEL_PICKS_BOT_TOKEN_DEV
        : TRAVEL_BOT_CONFIG.botToken;
      // Initialize bot
      this.bot = new TelegramBot(token, { polling: usePolling });

      if (usePolling) {
        try {
          await this.bot.deleteWebHook();
          const info = await this.bot.getWebHookInfo();
          console.log('🧳 Travel bot running in polling mode; webhook cleared', {
            url: (info as any).url,
            pending_update_count: (info as any).pending_update_count,
          });
        } catch (err: any) {
          console.warn('⚠️ Failed to clear Travel Picks webhook:', err?.message || err);
        }
      } else {
        // Configure webhook to master endpoint in production
        try {
          const baseUrl = process.env.PUBLIC_BASE_URL || 'https://pickntrust.com';
          const webhookUrl = `${baseUrl}/webhook/master/${TRAVEL_BOT_CONFIG.botToken}`;

          await this.bot.deleteWebHook();
          await this.bot.setWebHook(webhookUrl, {
            allowed_updates: ['message', 'channel_post', 'edited_channel_post']
          });

          const info = await this.bot.getWebHookInfo();
          console.log('🧳 Travel bot webhook info', {
            url: (info as any).url,
            pending_update_count: (info as any).pending_update_count,
            has_custom_certificate: (info as any).has_custom_certificate,
            max_connections: (info as any).max_connections,
          });
        } catch (err: any) {
          console.warn('⚠️ Failed to configure Travel Picks webhook:', err?.message || err);
        }
      }

      // Set up message handlers
      this.setupMessageHandlers();

      // Set up error handlers
      this.setupErrorHandlers();

      this.isInitialized = true;
      console.log('✅ Travel Picks bot initialized successfully');
      console.log(`📺 Monitoring channel: ${TRAVEL_BOT_CONFIG.channelName} (${TRAVEL_BOT_CONFIG.channelId})`);

    } catch (error) {
      console.error('❌ Failed to initialize Travel Picks bot:', error);
      this.isInitialized = false;
    }
  }

  private setupMessageHandlers(): void {
    if (!this.bot) return;

    // Handle channel posts
    this.bot.on('channel_post', async (msg) => {
      if (msg.chat.id.toString() === TRAVEL_BOT_CONFIG.channelId) {
        await this.handleMessage(msg);
      }
    });

    // Handle edited channel posts
    this.bot.on('edited_channel_post', async (msg) => {
      if (msg.chat.id.toString() === TRAVEL_BOT_CONFIG.channelId) {
        await this.handleMessage(msg);
      }
    });
  }

  private setupErrorHandlers(): void {
    if (!this.bot) return;

    this.bot.on('polling_error', (error) => {
      console.error('🧳 Travel Picks bot polling error:', error);
    });

    this.bot.on('error', (error) => {
      console.error('🧳 Travel Picks bot error:', error);
    });
  }

  public async processMessage(msg: any): Promise<void> {
    return this.handleMessage(msg);
  }

  private async handleMessage(msg: any): Promise<void> {
    try {
      console.log('🧳 Processing travel message:', msg.message_id);

      // Extract text from message
      const text = msg.text || msg.caption || '';
      if (!text) {
        console.log('⚠️ No text found in message');
        return;
      }

      // Extract URLs from message
      const urls = this.extractUrls(text);
      if (urls.length === 0) {
        console.log('⚠️ No URLs found in message');
        return;
      }

      // Process each URL
      for (const url of urls) {
        await this.processUrl(url, text, msg);
      }

    } catch (error) {
      console.error('❌ Error processing travel message:', error);
    }
  }

  private extractUrls(text: string): string[] {
    const urlRegex = /https?:\/\/[^\s]+/g;
    return text.match(urlRegex) || [];
  }

  private async processUrl(url: string, messageText: string, msg: any): Promise<void> {
    try {
      // Process URL to get product information via processing pipeline
      const result = await urlProcessingService.processURL(url, 'travel-picks');

      if (!result?.success || !result.productCard) {
        console.log('⚠️ Could not extract product info from URL — using fallback save');

        // Fallback: still save a minimal product so the page shows the post
        const category = this.detectTravelCategory(url, messageText);
        const affiliateUrlFallback = this.applyAffiliateTemplate(url);
        const priceInfo = this.extractPriceInfo(messageText);

        await this.saveToDatabase({
          name: this.extractTitleFromMessage(messageText) || new URL(url).hostname,
          description: messageText.substring(0, 500),
          price: priceInfo.price,
          original_price: priceInfo.originalPrice,
          currency: 'INR',
          image_url: null,
          affiliate_url: affiliateUrlFallback,
          category,
          rating: 0,
          review_count: 0,
          discount: priceInfo.discount,
          is_featured: this.isFeaturedDeal(messageText),
          affiliate_network: this.getAffiliateNetwork(url),
          telegram_message_id: msg.message_id,
          telegram_channel_id: msg.chat.id.toString(),
          processing_status: 'active'
        });

        console.log('✅ Saved minimal travel product via fallback');
        return;
      }

      const product = result.productCard;

      // Detect travel category from URL and text
      const category = this.detectTravelCategory(url, messageText);

      // Apply travel affiliate template (fallback)
      const affiliateUrlFallback = this.applyAffiliateTemplate(url);

      // Extract price information from message text
      const priceInfo = this.extractPriceInfo(messageText);

      // Save to database
      await this.saveToDatabase({
        name: product.name || this.extractTitleFromMessage(messageText),
        description: product.description || messageText.substring(0, 500),
        price: priceInfo.price ?? product.price,
        original_price: priceInfo.originalPrice ?? product.originalPrice,
        currency: product.currency || 'INR',
        image_url: product.imageUrl,
        affiliate_url: product.affiliateUrl || affiliateUrlFallback,
        category: category || product.category,
        rating: Number(product.rating) || 0,
        review_count: product.reviewCount || 0,
        discount: priceInfo.discount ?? (product.discount ? String(product.discount) : undefined),
        is_featured: this.isFeaturedDeal(messageText),
        affiliate_network: product.affiliateNetwork || this.getAffiliateNetwork(url),
        telegram_message_id: msg.message_id,
        telegram_channel_id: msg.chat.id.toString(),
        processing_status: 'active'
      });

      console.log('✅ Travel product saved successfully');

    } catch (error) {
      console.error('❌ Error processing travel URL:', error);
    }
  }

  private detectTravelCategory(url: string, text: string): string {
    // Check URL for category hints
    const urlLower = url.toLowerCase();
    const textLower = text.toLowerCase();

    // Check for specific travel sites and their categories
    if (urlLower.includes('flight') || textLower.includes('flight')) return 'flights';
    if (urlLower.includes('hotel') || textLower.includes('hotel')) return 'hotels';
    if (urlLower.includes('tour') || textLower.includes('tour')) return 'tours';
    if (urlLower.includes('package') || textLower.includes('package')) return 'packages';
    if (urlLower.includes('cruise') || textLower.includes('cruise')) return 'cruises';
    if (urlLower.includes('bus') || textLower.includes('bus')) return 'bus';
    if (urlLower.includes('train') || textLower.includes('train')) return 'train';
    if (urlLower.includes('car') || urlLower.includes('rental') || textLower.includes('car rental')) return 'car-rental';

    // Default to packages for general travel deals
    return 'packages';
  }

  private applyAffiliateTemplate(url: string): string {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace('www.', '');
      
      const template = TRAVEL_AFFILIATE_TEMPLATES[domain];
      if (template) {
        // Add affiliate parameters
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}${template}`;
      }
      
      return url;
    } catch (error) {
      console.error('Error applying affiliate template:', error);
      return url;
    }
  }

  private extractPriceInfo(text: string): { price?: string; originalPrice?: string; discount?: string } {
    const priceRegex = /₹[\d,]+/g;
    const prices = text.match(priceRegex) || [];
    
    const discountRegex = /(\d+)%\s*off/i;
    const discountMatch = text.match(discountRegex);
    
    return {
      price: prices[0],
      originalPrice: prices[1],
      discount: discountMatch ? `${discountMatch[1]}% OFF` : undefined
    };
  }

  private extractTitleFromMessage(text: string): string {
    // Extract first line or first 100 characters as title
    const firstLine = text.split('\n')[0];
    return firstLine.length > 100 ? firstLine.substring(0, 100) + '...' : firstLine;
  }

  private isFeaturedDeal(text: string): boolean {
    const featuredKeywords = ['featured', 'exclusive', 'limited', 'special', 'premium'];
    const textLower = text.toLowerCase();
    return featuredKeywords.some(keyword => textLower.includes(keyword));
  }

  private getAffiliateNetwork(url: string): string {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace('www.', '');
      
      const networkMap: { [key: string]: string } = {
        'makemytrip.com': 'MakeMyTrip',
        'booking.com': 'Booking.com',
        'redbus.in': 'RedBus',
        'irctc.co.in': 'IRCTC',
        'goibibo.com': 'Goibibo',
        'cleartrip.com': 'Cleartrip',
        'yatra.com': 'Yatra'
      };
      
      return networkMap[domain] || 'Direct';
    } catch (error) {
      return 'Direct';
    }
  }

  private async saveToDatabase(productData: any): Promise<void> {
    try {
      const insertQuery = this.db.prepare(`
        INSERT INTO travel_products (
          name, description, price, original_price, currency, image_url, affiliate_url,
          category, rating, review_count, discount, is_featured, affiliate_network,
          telegram_message_id, telegram_channel_id, processing_status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertQuery.run(
        productData.name,
        productData.description,
        productData.price,
        productData.original_price,
        productData.currency,
        productData.image_url,
        productData.affiliate_url,
        productData.category,
        productData.rating,
        productData.review_count,
        productData.discount,
        productData.is_featured ? 1 : 0,
        productData.affiliate_network,
        productData.telegram_message_id,
        productData.telegram_channel_id,
        productData.processing_status,
        Math.floor(Date.now() / 1000)
      );

      console.log(`✅ Saved travel product: ${productData.name} (${productData.category})`);

      // Also insert into unified_content so Travel Picks page shows items
      try {
      // Ensure posts render on the correct Travel Picks page
      // Use the canonical client slug `travel-picks` instead of generic `travel`
      const displayPagesArr = ['travel-picks', productData.category]
        .filter((v) => v && v.length > 0);
        const tags = JSON.stringify({
          source: 'travel-bot',
          affiliate_network: productData.affiliate_network,
          telegram_message_id: productData.telegram_message_id,
          telegram_channel_id: productData.telegram_channel_id
        });

        const ucInsert = this.db.prepare(`
          INSERT INTO unified_content (
            title, description, price, original_price, currency,
            image_url, affiliate_url, content_type, page_type,
            category, subcategory, tags, is_active, is_featured,
            display_pages, status, visibility, processing_status,
            created_at, updated_at
          ) VALUES (
            ?, ?, ?, ?, ?,
            ?, ?, 'travel', 'travel-picks',
            ?, NULL, ?, 1, ?,
            ?, 'published', 'public', 'active',
            datetime('now'), datetime('now')
          )
        `);

        ucInsert.run(
          productData.name,
          productData.description,
          productData.price,
          productData.original_price,
          productData.currency,
          productData.image_url,
          productData.affiliate_url,
          productData.category,
          tags,
          productData.is_featured ? 1 : 0,
          JSON.stringify(displayPagesArr)
        );

        console.log('🧳 Mirrored travel product into unified_content for Travel Picks page');
      } catch (mirrorErr) {
        console.warn('⚠️ Could not mirror travel product into unified_content:', (mirrorErr as any)?.message || mirrorErr);
      }
    } catch (error) {
      console.error('❌ Error saving to database:', error);
    }
  }

  public async stop(): Promise<void> {
    if (this.bot) {
      try {
        // No need to stop polling since it's disabled
        console.log('🧳 Travel Picks bot stopped');
      } catch (error) {
        console.error('❌ Error stopping Travel Picks bot:', error);
      }
    }
    
    if (this.db) {
      this.db.close();
    }
    
    this.isInitialized = false;
  }

  public getStatus(): { isInitialized: boolean; channelId: string; channelName: string } {
    return {
      isInitialized: this.isInitialized,
      channelId: TRAVEL_BOT_CONFIG.channelId,
      channelName: TRAVEL_BOT_CONFIG.channelName
    };
  }
}

// Export singleton instance
export const travelPicksBot = new TravelPicksBot();

// Auto-initialize if not in test environment
if (process.env.NODE_ENV !== 'test') {
  travelPicksBot.initialize().catch(console.error);
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🧳 Shutting down Travel Picks bot...');
  await travelPicksBot.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🧳 Shutting down Travel Picks bot...');
  await travelPicksBot.stop();
  process.exit(0);
});