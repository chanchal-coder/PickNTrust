import TelegramBot from 'node-telegram-bot-api';
// import { CHANNEL_CONFIGS } from './config/channels.js'; // This file doesn't exist - using inline config
// import { convertUrls } from './services/affiliate-service.js'; // This file doesn't exist - using inline function
// import { extractProductInfo } from './services/url-processing-service.js'; // This file doesn't exist - using inline function
// import { saveProductToDatabase } from './services/database-service.js'; // This file doesn't exist - using inline function
// import { extractImageUrl } from './services/image-service.js'; // This file doesn't exist - using inline function
import { urlProcessingService } from './url-processing-service.js';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { categorizeForAutomation, shouldAutoCategorize } from './enhanced-smart-categorization.js';
import { travelPicksBot } from './travel-picks-bot.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Admin alert chat configuration (set one of these in env)
// Prefer a private admin chat/channel to avoid spamming public channels
const ALERT_CHAT_ID = process.env.BOT_ALERT_CHAT_ID || process.env.MASTER_ADMIN_CHAT_ID || '';

// Singleton pattern to prevent multiple bot instances
class TelegramBotManager {
  private static instance: TelegramBotManager | null = null;
  private bot: TelegramBot | null = null;
  private isInitialized: boolean = false;

  private constructor() {}

  public static getInstance(): TelegramBotManager {
    if (!TelegramBotManager.instance) {
      TelegramBotManager.instance = new TelegramBotManager();
    }
    return TelegramBotManager.instance;
  }

  public async processChannelPost(msg: any): Promise<void> {
    return processMessage(msg);
  }

  public async processMessage(msg: any): Promise<void> {
    return processMessage(msg);
  }

  public getBot(): TelegramBot | null {
    return this.bot;
  }

  public async initializeBot(): Promise<void> {
    if (this.isInitialized) {
      console.log('🤖 Bot already initialized, skipping...');
      return;
    }

    // Check if we should enable Telegram bot (disable in development if network issues)
    const ENABLE_TELEGRAM_BOT = process.env.ENABLE_TELEGRAM_BOT === 'true' || process.env.NODE_ENV === 'production';

    if (!ENABLE_TELEGRAM_BOT) {
      console.log('🤖 Telegram bot disabled in development mode');
      console.log('   To enable: set ENABLE_TELEGRAM_BOT=true in environment');
      return;
    }

    console.log('🤖 Initializing Telegram bot (webhook-only mode)...');
    
    // Bot configuration - ONLY MASTER BOT TOKEN (no default fallback)
    const BOT_TOKEN = process.env.MASTER_BOT_TOKEN;
    
    if (!BOT_TOKEN) {
      console.error('❌ MASTER_BOT_TOKEN not found in environment variables');
      return;
    }

    try {
      // Stop any existing bot instance
      if (this.bot) {
        console.log('🛑 Stopping existing bot instance...');
        try {
          await this.bot.stopPolling();
        } catch (error) {
          console.log('⚠️ Error stopping polling (may not be running):', error.message);
        }
        this.bot = null;
      }

      // Initialize bot in webhook mode (no polling)
      this.bot = new TelegramBot(BOT_TOKEN, { 
        polling: false,
        webHook: false
      });
      
      console.log('✅ Telegram bot initialized successfully in webhook mode (polling disabled)');
      this.isInitialized = true;

      // Ensure master webhook is configured
      try {
        const baseUrl = process.env.PUBLIC_BASE_URL || 'https://www.pickntrust.com';
        const webhookUrl = `${baseUrl}/webhook/master/${BOT_TOKEN}`;
        console.log(`🔗 Ensuring webhook is set: ${webhookUrl}`);

        // Clear any existing webhook to avoid conflicts
        await this.bot.deleteWebHook();

        // Set webhook to master endpoint
        await this.bot.setWebHook(webhookUrl, {
          allowed_updates: ['message', 'channel_post', 'edited_channel_post']
        });

        // Verify webhook status
        const info = await this.bot.getWebHookInfo();
        console.log('📊 Webhook info', {
          url: (info as any).url,
          pending_update_count: (info as any).pending_update_count,
          has_custom_certificate: (info as any).has_custom_certificate,
          max_connections: (info as any).max_connections,
        });
      } catch (err: any) {
        console.warn('⚠️ Failed to configure master webhook:', err?.message || err);
      }

      // Setup event handlers
      this.setupEventHandlers();

      // Initialize travel bot
      await travelPicksBot.initialize();

      // Send initialization alert to admin chat if configured
      try {
        if (ALERT_CHAT_ID) {
          const me = await this.bot.getMe();
          const baseUrl = process.env.PUBLIC_BASE_URL || 'https://www.pickntrust.com';
          const info = await this.bot.getWebHookInfo();
          const msg = `✅ <b>Bot Initialized</b>\n` +
            `• Bot: <code>${me.username}</code> (ID: ${me.id})\n` +
            `• Mode: webhook-only\n` +
            `• Webhook: <code>${(info as any).url || baseUrl}</code>\n` +
            `• Pending: ${(info as any).pending_update_count || 0}\n` +
            `• Env: <code>${process.env.NODE_ENV || 'unknown'}</code>`;
          await this.bot.sendMessage(ALERT_CHAT_ID, msg, { parse_mode: 'HTML' });
        } else {
          console.log('ℹ️ No ALERT_CHAT_ID configured; skipping init alert');
        }
      } catch (alertErr) {
        console.warn('⚠️ Failed to send initialization alert:', (alertErr as any)?.message || alertErr);
      }

      // Setup graceful shutdown
      this.setupGracefulShutdown();
      
    } catch (error) {
      console.error('❌ Failed to initialize Telegram bot:', error);
      this.isInitialized = false;
    }
  }

  private setupEventHandlers(): void {
    if (!this.bot) return;

    // Handle channel posts (messages sent to channels)
    this.bot.on('channel_post', (msg) => {
      console.log('📨 Received channel post:', {
        chatId: Number(msg.chat.id),
        chatTitle: msg.chat.title,
        messageId: Number(msg.message_id),
        text: msg.text?.substring(0, 100) + '...'
      });
      processMessage(msg);
    });

    // Handle regular messages (for testing in private chats)
    this.bot.on('message', (msg) => {
      console.log('📩 Received message:', {
        chatId: Number(msg.chat.id),
        chatTitle: msg.chat.title || 'Private Chat',
        messageId: Number(msg.message_id),
        text: msg.text?.substring(0, 100) + '...'
      });
      processMessage(msg);
    });

    // Error handling
    this.bot.on('error', (error) => {
      console.error('Telegram bot error:', error);
    });

    console.log('✅ Event handlers set up successfully');
     console.log('Monitoring channels: [Channel configs will be loaded after initialization]');
   }

  private setupGracefulShutdown(): void {
    const cleanup = async () => {
      // Stop travel bot first
      await travelPicksBot.stop();
      
      if (this.bot) {
        console.log('🛑 Shutting down Telegram bot...');
        try {
          await this.bot.stopPolling();
          console.log('✅ Bot stopped successfully');
        } catch (error) {
          console.error('❌ Error stopping bot:', error);
        }
        this.bot = null;
        this.isInitialized = false;
      }
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('exit', cleanup);
  }

  public async stopBot(): Promise<void> {
    // Stop travel bot first
    await travelPicksBot.stop();
    
    if (this.bot) {
      console.log('🛑 Stopping bot...');
      await this.bot.stopPolling();
      this.bot = null;
      this.isInitialized = false;
    }
  }
}

// Initialize singleton instance
const botManager = TelegramBotManager.getInstance();

// Initialize bot (guarded so failures never impact website/server startup)
try {
  await botManager.initializeBot();
} catch (err) {
  console.error('⚠️ Bot initialization encountered an error but will not affect website:', err);
}

// Get bot instance
const bot = botManager.getBot();

// Function to send notifications/posts to Telegram channels
const sendTelegramNotification = async (channelId: string, message: string, options: any = {}) => {
  const currentBot = botManager.getBot();
  if (!currentBot) {
    console.error('❌ Bot not initialized');
    return false;
  }

  try {
    console.log(`📤 Sending message to channel ${channelId}...`);
    const result = await currentBot.sendMessage(channelId, message, {
      parse_mode: 'HTML',
      disable_web_page_preview: false,
      ...options
    });
    console.log(`✅ Message sent successfully to ${channelId}:`, result.message_id);
    return result;
  } catch (error) {
    console.error(`❌ Failed to send message to ${channelId}:`, error);
    return false;
  }
};

// Internal helper to send admin alerts safely
async function notifyAdmin(message: string, options: any = {}) {
  try {
    if (!ALERT_CHAT_ID) {
      console.log('ℹ️ ALERT_CHAT_ID not set; admin alert:', message);
      return false;
    }
    const currentBot = botManager.getBot();
    if (!currentBot) {
      console.error('❌ Bot not initialized; cannot send admin alert');
      return false;
    }
    await currentBot.sendMessage(ALERT_CHAT_ID, message, { parse_mode: 'HTML', ...options });
    return true;
  } catch (err) {
    console.warn('⚠️ Failed to send admin alert:', (err as any)?.message || err);
    return false;
  }
}

// Channel mappings with their respective configurations
const CHANNEL_CONFIGS = {
  '-1002955338551': {
    pageName: 'Prime Picks',
    affiliateTag: 'tag=pickntrust03-21',
    platform: 'amazon',
    pageSlug: 'prime-picks'
  },
  '-1002982344997': {
    pageName: 'Cue Picks',
    affiliateTag: 'https://linksredirect.com/?cid=243942&source=linkkit&url=%7B%7BURL_ENC%7D%7D',
    platform: 'cuelinks',
    pageSlug: 'cue-picks'
  },
  '-1003017626269': {
    pageName: 'Value Picks',
    affiliateTag: '', // Will be handled by earnkaro
    platform: 'earnkaro',
    pageSlug: 'value-picks'
  },
  '-1002981205504': {
    pageName: 'Click Picks',
    affiliateTag: '',
    platform: 'multiple',
    platforms: ['cuelinks', 'inrdeals', 'earnkaro'],
    pageSlug: 'click-picks'
  },
  '-1002902496654': {
    pageName: 'Global Picks',
    affiliateTag: '',
    platform: 'multiple',
    platforms: ['cuelinks', 'inrdeals', 'earnkaro'],
    pageSlug: 'global-picks'
  },
  '-1003047967930': {
    pageName: 'Travel Picks',
    affiliateTag: '',
    platform: 'multiple',
    platforms: ['cuelinks', 'inrdeals', 'earnkaro'],
    pageSlug: 'travel-picks'
  },
  '-1003029983162': {
    pageName: 'Deals Hub',
    affiliateTag: 'id=sha678089037',
    platform: 'inrdeals',
    pageSlug: 'deals-hub'
  },
  '-1002991047787': {
    pageName: 'Loot Box',
    affiliateTag: '{{URL}}{{SEP}}ref=sicvppak',
    platform: 'deodap',
    pageSlug: 'loot-box'
  }
};

// Enhanced URL detection regex patterns
const URL_PATTERNS = {
  amazon: /(?:https?:\/\/)?(?:www\.)?amazon\.(?:in|com)\/[^\s]+/gi,
  flipkart: /(?:https?:\/\/)?(?:www\.)?flipkart\.com\/[^\s]+/gi,
  myntra: /(?:https?:\/\/)?(?:www\.)?myntra\.com\/[^\s]+/gi,
  // Comprehensive URL pattern that catches all types
  general: /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\/[^\s]*/gi,
  // Shortened URL patterns
  shortened: /(?:https?:\/\/)?(?:bit\.ly|tinyurl\.com|goo\.gl|t\.co|short\.link|amzn\.to|fkrt\.it|myntra\.com\/m|flipkart\.com\/dl|a\.co)\/[^\s]+/gi,
  // Affiliate URL patterns (to detect existing affiliate links)
  affiliate: /(?:tag=|ref=|affiliate|partner|cid=|source=linkkit|linksredirect\.com|inrdeals\.com|earnkaro\.com)/gi
};

// Enhanced URL conversion functions with affiliate detection and replacement
function isAffiliateUrl(url: string): boolean {
  return URL_PATTERNS.affiliate.test(url);
}

function cleanAffiliateUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    
    // Remove common affiliate parameters
    const affiliateParams = ['tag', 'ref', 'affiliate', 'partner', 'cid', 'source', 'utm_source', 'utm_medium', 'utm_campaign'];
    affiliateParams.forEach(param => urlObj.searchParams.delete(param));
    
    // Handle specific affiliate URL patterns
    if (url.includes('linksredirect.com') || url.includes('inrdeals.com') || url.includes('earnkaro.com')) {
      // Extract the original URL from affiliate wrapper
      const originalUrl = urlObj.searchParams.get('url');
      if (originalUrl) {
        return decodeURIComponent(originalUrl);
      }
    }
    
    return urlObj.toString();
  } catch {
    // If URL parsing fails, try basic cleaning
    return url.split('?')[0];
  }
}

function convertToAmazonAffiliate(url: string, tag: string): string {
  try {
    const cleanUrl = cleanAffiliateUrl(url);
    const urlObj = new URL(cleanUrl);
    
    // Add the affiliate tag
    urlObj.searchParams.set('tag', 'pickntrust03-21');
    urlObj.searchParams.set('linkCode', 'as2');
    urlObj.searchParams.set('camp', '1789');
    urlObj.searchParams.set('creative', '9325');
    
    return urlObj.toString();
  } catch (error) {
    // Fallback for malformed URLs
    const baseUrl = url.split('?')[0];
    return `${baseUrl}?tag=pickntrust03-21&linkCode=as2&camp=1789&creative=9325`;
  }
}

function convertToCuelinks(url: string): string {
  const cleanUrl = cleanAffiliateUrl(url);
  const encodedUrl = encodeURIComponent(cleanUrl);
  return `https://linksredirect.com/?cid=243942&source=linkkit&url=${encodedUrl}`;
}

function convertToInrdeals(url: string, tag?: string): string {
  const cleanUrl = cleanAffiliateUrl(url);
  const baseUrl = 'https://inrdeals.com/redirect';
  if (tag) {
    return `${baseUrl}?url=${encodeURIComponent(cleanUrl)}&${tag}`;
  }
  return `${baseUrl}?url=${encodeURIComponent(cleanUrl)}`;
}

function convertToDeodap(url: string, tag: string): string {
  const cleanUrl = cleanAffiliateUrl(url);
  return `${cleanUrl}${cleanUrl.includes('?') ? '&' : '?'}${tag.replace('{{URL}}{{SEP}}', '')}`;
}

function convertToEarnkaro(url: string): string {
  const cleanUrl = cleanAffiliateUrl(url);
  const encodedUrl = encodeURIComponent(cleanUrl);
  return `https://earnkaro.com/api/redirect?url=${encodedUrl}`;
}

// Extract product information from message using URL processing service
async function extractProductInfo(message: string): Promise<{
  title?: string;
  price?: string;
  originalPrice?: string;
  discount?: string;
  description?: string;
  urls: string[];
  productData?: any;
}> {
  // Enhanced URL extraction - check for all types of URLs
  let urls: string[] = [];
  
  // First, extract all general URLs
  const generalUrls = message.match(URL_PATTERNS.general) || [];
  
  // Then, specifically look for shortened URLs
  const shortenedUrls = message.match(URL_PATTERNS.shortened) || [];
  
  // Combine and deduplicate URLs
  urls = [...new Set([...generalUrls, ...shortenedUrls])];
  
  // Clean URLs (remove extra characters that might be captured)
  urls = urls.map(url => {
    // Ensure URL has protocol
    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }
    // Remove trailing punctuation
    return url.replace(/[.,;!?]+$/, '');
  });
  
  if (urls.length === 0) {
    return { urls: [] };
  }

  try {
    // Use URL processing service for the first URL found
    const firstUrl = urls[0];
    console.log(`🔍 Processing URL with URL processing service: ${firstUrl}`);
    
    const processingResult = await urlProcessingService.processURL(firstUrl);
    
    if (processingResult.success && processingResult.productCard) {
      const productCard = processingResult.productCard;
      
      return {
        title: productCard.name,
        price: productCard.price,
        originalPrice: productCard.originalPrice,
        description: productCard.description,
        urls: urls,
        productData: productCard
      };
    } else {
      console.log(`⚠️ URL processing failed, falling back to basic extraction: ${processingResult.error}`);
      // Fallback to basic extraction
      return extractBasicProductInfo(message, urls);
    }
  } catch (error) {
    console.error(`❌ Error in URL processing service:`, error);
    // Fallback to basic extraction
    return extractBasicProductInfo(message, urls);
  }
}

// Fallback basic extraction method
function extractBasicProductInfo(message: string, urls: string[]): {
  title?: string;
  price?: string;
  originalPrice?: string;
  discount?: string;
  description?: string;
  urls: string[];
} {
  // Handle URL-only posts by attempting to extract product info from URL
  if (message.trim().startsWith('http') && message.trim().split('\n').length === 1) {
    const url = message.trim();
    let title = 'Product from Telegram';
    
    // Try to extract product info from URL patterns
    if (url.includes('amazon.in') || url.includes('amzn.to')) {
      // Extract from Amazon URL patterns
      const dpMatch = url.match(/\/dp\/([A-Z0-9]+)/);
      const keywordMatch = url.match(/keywords=([^&]+)/);
      
      if (keywordMatch) {
        title = decodeURIComponent(keywordMatch[1]).replace(/[+_-]/g, ' ').trim();
      } else if (dpMatch) {
        title = `Amazon Product ${dpMatch[1]}`;
      } else {
        title = 'Amazon Product';
      }
    } else if (url.includes('flipkart.com') || url.includes('fkrt.cc')) {
      title = 'Flipkart Product';
    } else if (url.includes('myntra.com')) {
      title = 'Myntra Product';
    } else if (url.includes('nykaa.com')) {
      title = 'Nykaa Product';
    }
    
    return {
      title,
      urls: urls,
      description: `Product available at: ${url}`
    };
  }

  // Enhanced title extraction logic for posts with content
  const lines = message.split('\n').filter(line => line.trim());
  let title: string | undefined;
  
  // Step 1: Look for product-specific patterns first
  // Pattern 1: Lines that contain product keywords and are descriptive
  const productKeywords = ['headphones', 'mouse', 'watch', 'laptop', 'phone', 'smartphone', 'tablet', 'camera', 'speaker', 'earbuds', 'charger', 'cable', 'adapter', 'keyboard', 'monitor', 'tv', 'television', 'gaming', 'wireless', 'bluetooth', 'smart', 'premium', 'pro', 'max', 'mini', 'ultra', 'edition', 'series', 'model'];
  
  for (const line of lines) {
    const cleanLine = line.replace(/[✨🎯🔥⚡️🎉💥🚀💰❌✅]/g, '').trim();
    
    // Skip lines that are clearly not product names
    if (cleanLine.startsWith('http') || 
        cleanLine.includes('Deal @') || 
        cleanLine.includes('Reg @') || 
        cleanLine.includes('Price:') || 
        cleanLine.includes('MRP') ||
        cleanLine.includes('₹') ||
        cleanLine.includes('%') ||
        cleanLine.toLowerCase().includes('off') ||
        cleanLine.toLowerCase().includes('discount') ||
        cleanLine.toLowerCase().includes('save') ||
        cleanLine.toLowerCase().includes('limited') ||
        cleanLine.toLowerCase().includes('flash sale') ||
        cleanLine.length < 8) {
      continue;
    }
    
    // Check if line contains product keywords or looks like a product name
    const lowerLine = cleanLine.toLowerCase();
    const hasProductKeyword = productKeywords.some(keyword => lowerLine.includes(keyword));
    const looksLikeProductName = cleanLine.length > 15 && cleanLine.length < 100 && 
                                /[a-zA-Z]/.test(cleanLine) && 
                                !cleanLine.match(/^[🔥🎉💥⚡️✨🎯🚀💰❌✅\s]+$/);
    
    if (hasProductKeyword || looksLikeProductName) {
      title = cleanLine;
      break;
    }
  }
  
  // Step 2: If no product-specific title found, use improved fallback logic
  if (!title) {
    // Look for the longest meaningful line that's not promotional text
    const meaningfulLines = lines
      .map(line => line.replace(/[✨🎯🔥⚡️🎉💥🚀💰❌✅]/g, '').trim())
      .filter(line => 
        !line.startsWith('http') && 
        line.length > 8 && 
        line.length < 100 &&
        !line.includes('Deal @') &&
        !line.includes('Reg @') &&
        !line.includes('Price:') &&
        !line.includes('MRP') &&
        !line.includes('₹') &&
        !line.includes('%') &&
        !line.toLowerCase().includes('off') &&
        !line.toLowerCase().includes('discount') &&
        !line.toLowerCase().includes('save') &&
        !line.toLowerCase().includes('limited') &&
        !line.toLowerCase().includes('flash sale') &&
        /[a-zA-Z]/.test(line)
      );
    
    if (meaningfulLines.length > 0) {
      // Prefer longer, more descriptive lines
      title = meaningfulLines.reduce((longest, current) => 
        current.length > longest.length ? current : longest
      );
    }
  }
  
  // Step 3: Final fallback - use first line if nothing else works
  if (!title && lines.length > 0) {
    title = lines[0].replace(/[✨🎯🔥⚡️🎉💥🚀💰❌✅]/g, '').trim();
    
    // If first line is still not good, try second line
    if (title.length < 8 || title.startsWith('http') || title.includes('₹')) {
      title = lines[1]?.replace(/[✨🎯🔥⚡️🎉💥🚀💰❌✅]/g, '').trim() || 'Product from Telegram';
    }
  }
  
  // Ensure we have a title
  if (!title || title.length < 3) {
    title = 'Product from Telegram';
  }

  // Enhanced price extraction - look for multiple patterns
  let price: string | undefined;
  let originalPrice: string | undefined;
  let discount: string | undefined;
  
  // Pattern 1: Multiple ₹ symbols in sequence (₹X ₹Y format)
  const multipleRupeeMatches = message.match(/₹([\d,]+(?:\.\d+)?)\s*₹([\d,]+(?:\.\d+)?)/g);
  if (multipleRupeeMatches) {
    const matches = multipleRupeeMatches[0].match(/₹([\d,]+(?:\.\d+)?)\s*₹([\d,]+(?:\.\d+)?)/);
    if (matches) {
      price = `₹${matches[1]}`;
      originalPrice = `₹${matches[2]}`;
    }
  }
  
  // Pattern 2: Single ₹ symbols (take first two if available)
  if (!price) {
    const rupeeMatches = message.match(/₹([\d,]+(?:\.\d+)?)(k?)/gi);
    if (rupeeMatches && rupeeMatches.length >= 2) {
      // Extract price and handle 'k' suffix
      const firstMatch = rupeeMatches[0].match(/₹([\d,]+(?:\.\d+)?)(k?)/i);
      const secondMatch = rupeeMatches[1].match(/₹([\d,]+(?:\.\d+)?)(k?)/i);
      
      if (firstMatch) {
        let priceValue = firstMatch[1].replace(/,/g, '');
        if (firstMatch[2] && firstMatch[2].toLowerCase() === 'k') {
          priceValue = (parseFloat(priceValue) * 1000).toString();
        }
        price = `₹${priceValue}`;
      }
      
      if (secondMatch) {
        let originalPriceValue = secondMatch[1].replace(/,/g, '');
        if (secondMatch[2] && secondMatch[2].toLowerCase() === 'k') {
          originalPriceValue = (parseFloat(originalPriceValue) * 1000).toString();
        }
        originalPrice = `₹${originalPriceValue}`;
      }
    } else if (rupeeMatches && rupeeMatches.length === 1) {
      const singleMatch = rupeeMatches[0].match(/₹([\d,]+(?:\.\d+)?)(k?)/i);
      if (singleMatch) {
        let priceValue = singleMatch[1].replace(/,/g, '');
        if (singleMatch[2] && singleMatch[2].toLowerCase() === 'k') {
          priceValue = (parseFloat(priceValue) * 1000).toString();
        }
        price = `₹${priceValue}`;
      }
    }
  }
  
  // Pattern 3: Deal @ price format with 'k' suffix handling
  const dealMatch = message.match(/Deal\s*@\s*₹?([\d,]+(?:\.\d+)?)(k?)/i);
  if (dealMatch && !price) {
    let dealPrice = dealMatch[1].replace(/,/g, '');
    if (dealMatch[2] && dealMatch[2].toLowerCase() === 'k') {
      dealPrice = (parseFloat(dealPrice) * 1000).toString();
    }
    price = `₹${dealPrice}`;
  }
  
  // Pattern 4: Reg @ price format (for original price) with improved 'k' handling
  const regMatch = message.match(/Reg\s*@\s*₹?([\d,]+(?:\.\d+)?)(k?)/i);
  if (regMatch) {
    let regPrice = regMatch[1].replace(/,/g, '');
    // Handle 'k' suffix (thousands)
    if (regMatch[2] && regMatch[2].toLowerCase() === 'k') {
      regPrice = (parseFloat(regPrice) * 1000).toString();
    }
    if (!originalPrice) {
      originalPrice = `₹${regPrice}`;
    } else if (!price) {
      price = `₹${regPrice}`;
    }
  }
  
  // Pattern 5: Price: format with 'k' suffix handling
  const priceColonMatch = message.match(/Price:\s*₹?([\d,]+(?:\.\d+)?)(k?)/i);
  if (priceColonMatch && !price) {
    let priceValue = priceColonMatch[1].replace(/,/g, '');
    if (priceColonMatch[2] && priceColonMatch[2].toLowerCase() === 'k') {
      priceValue = (parseFloat(priceValue) * 1000).toString();
    }
    price = `₹${priceValue}`;
  }
  
  // Pattern 6: MRP format with 'k' suffix handling
  const mrpMatch = message.match(/MRP\s*:?\s*₹?([\d,]+(?:\.\d+)?)(k?)/i);
  if (mrpMatch && !originalPrice) {
    let mrpPrice = mrpMatch[1].replace(/,/g, '');
    if (mrpMatch[2] && mrpMatch[2].toLowerCase() === 'k') {
      mrpPrice = (parseFloat(mrpPrice) * 1000).toString();
    }
    originalPrice = `₹${mrpPrice}`;
  }
  
  // Pattern 7: Discount percentage - enhanced patterns
  const discountPercentMatch = message.match(/(\d+)%\s*(?:off|discount|save|savings)/i);
  if (discountPercentMatch) {
    discount = `${discountPercentMatch[1]}%`;
  }
  
  // Pattern 8: Additional discount patterns
  if (!discount) {
    const saveMatch = message.match(/save\s*₹?([\d,]+)/i);
    if (saveMatch && price && originalPrice) {
      const savedAmount = parseFloat(saveMatch[1].replace(/,/g, ''));
      const originalPriceNum = parseFloat(originalPrice.replace(/₹|,/g, ''));
      if (originalPriceNum > 0) {
        const discountPercent = Math.round((savedAmount / originalPriceNum) * 100);
        discount = `${discountPercent}%`;
      }
    }
  }
  
  // Calculate discount if we have both prices but no explicit discount
  if (price && originalPrice && !discount) {
    try {
      const priceNum = parseFloat(price.replace(/₹|,/g, ''));
      const originalPriceNum = parseFloat(originalPrice.replace(/₹|,/g, ''));
      
      if (originalPriceNum > priceNum && originalPriceNum > 0) {
        const discountPercent = Math.round(((originalPriceNum - priceNum) / originalPriceNum) * 100);
        if (discountPercent > 0 && discountPercent <= 100) {
          discount = `${discountPercent}%`;
        }
      }
    } catch (error) {
      console.log('Error calculating discount:', error);
    }
  }
  
  // Log extracted price information for debugging
  console.log(`💰 Price extraction results:`, {
    price,
    originalPrice,
    discount,
    messagePreview: message.substring(0, 100)
  });
  
  // Extract description (lines that don't contain URLs, excluding price lines)
  const description = lines
    .filter(line => 
      !URL_PATTERNS.general.test(line) && 
      !line.includes('Deal @') && 
      !line.includes('Reg @') &&
      !line.includes('Price:') &&
      !line.includes('MRP') &&
      !line.match(/\d+%\s*(?:off|discount)/i) &&
      line !== title
    )
    .slice(0, 3) // Take up to 3 lines
    .join(' ')
    .substring(0, 200)
    .trim();
  
  return {
    title,
    price,
    originalPrice,
    discount,
    description: description || message.substring(0, 200).replace(/https?:\/\/[^\s]+/g, '').trim(),
    urls
  };
}

// Enhanced URL conversion based on platform with affiliate detection
function convertUrls(urls: string[], config: any): string[] {
  const convertedUrls: string[] = [];
  
  for (const url of urls) {
    console.log(`🔄 Converting URL: ${url}`);
    
    // Loot Box requirement: do NOT convert links, keep exactly as posted
    // Only bypass conversion for loot-box page
    if (config?.pageSlug === 'loot-box') {
      console.log('🎁 Loot Box page detected — bypassing affiliate conversion, preserving original URL');
      convertedUrls.push(url);
      continue;
    }

    // Check if URL is already an affiliate URL
    if (isAffiliateUrl(url)) {
      console.log(`🔍 Detected affiliate URL, cleaning and converting to user's affiliate`);
    }
    
    switch (config.platform) {
      case 'amazon':
        convertedUrls.push(convertToAmazonAffiliate(url, config.affiliateTag));
        break;
      case 'cuelinks':
        convertedUrls.push(convertToCuelinks(url));
        break;
      case 'inrdeals':
        convertedUrls.push(convertToInrdeals(url, config.affiliateTag));
        break;
      case 'earnkaro':
        convertedUrls.push(convertToEarnkaro(url));
        break;
      case 'deodap':
        convertedUrls.push(convertToDeodap(url, config.affiliateTag));
        break;
      case 'multiple':
        // For multiple platforms, try to detect the best platform for each URL
        if (config.platforms && Array.isArray(config.platforms) && config.platforms.length > 0) {
          // Use the first platform in the list as primary
          const primaryPlatform = config.platforms[0];
          console.log(`🔄 Using primary platform: ${primaryPlatform} for multiple platform config`);
          switch (primaryPlatform) {
            case 'cuelinks':
              convertedUrls.push(convertToCuelinks(url));
              break;
            case 'inrdeals':
              convertedUrls.push(convertToInrdeals(url));
              break;
            case 'earnkaro':
              convertedUrls.push(convertToEarnkaro(url));
              break;
            default:
              console.log(`⚠️ Unknown primary platform ${primaryPlatform}, falling back to cuelinks`);
              convertedUrls.push(convertToCuelinks(url)); // Default fallback
          }
        } else {
          console.log(`⚠️ No platforms array found in config, defaulting to cuelinks`);
          convertedUrls.push(convertToCuelinks(url)); // Default to cuelinks
        }
        break;
      default:
        // Even for unknown platforms, try to convert through cuelinks
        convertedUrls.push(convertToCuelinks(url));
    }
    
    console.log(`✅ Converted to: ${convertedUrls[convertedUrls.length - 1]}`);
  }
  
  return convertedUrls;
}

// Extract image from message
async function extractImageUrl(msg: any): Promise<string | null> {
  if (msg.photo && msg.photo.length > 0) {
    // Get the highest resolution photo
    const photo = msg.photo[msg.photo.length - 1];
    try {
      const fileLink = await bot.getFileLink(photo.file_id);
      return fileLink;
    } catch (error) {
      console.error('Error getting photo link:', error);
    }
  }
  return null;
}

// Save message to channel_posts table first
async function saveToChannelPosts(msg: any, channelConfig: any, messageText: string, extractedUrls: string[], imageUrl: string | null = null) {
  try {
    // Use the same database path convention as other server modules
    const dbPath = path.join(__dirname, '..', 'database.sqlite');
    const sqliteDb = new Database(dbPath);
    
    // Updated SQL to match actual table schema
    const insertSQL = `
      INSERT INTO channel_posts (
        channel_id, channel_name, website_page, message_id, original_text, 
        processed_text, extracted_urls, is_processed, is_posted, 
        telegram_timestamp, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const now = Math.floor(Date.now() / 1000);
    const values = [
      msg.chat.id.toString(),
      channelConfig.pageName,
      channelConfig.pageSlug || 'prime-picks',
      msg.message_id,
      messageText,
      messageText, // processed_text same as original for now
      JSON.stringify(extractedUrls),
      0, // is_processed - will be updated after successful processing
      0, // is_posted
      msg.date || now, // telegram_timestamp
      now
    ];
    
    const result = sqliteDb.prepare(insertSQL).run(...values);
    sqliteDb.close();
    
    console.log(`📝 Message saved to channel_posts with ID: ${result.lastInsertRowid}`);
    return result.lastInsertRowid;
    
  } catch (error) {
    console.error(`❌ Error saving to channel_posts:`, error);
    return null;
  }
}

// Update channel_posts record after processing
async function updateChannelPostStatus(channelPostId: number, isProcessed: boolean, isPosted: boolean, error?: string) {
  try {
    // Use the project root database file like other services
    const dbPath = path.join(__dirname, '..', 'database.sqlite');
    const sqliteDb = new Database(dbPath);
    
    const updateSQL = `
      UPDATE channel_posts 
      SET is_processed = ?, is_posted = ?, processed_at = ?, processing_error = ?
      WHERE id = ?
    `;
    
    const now = Math.floor(Date.now() / 1000);
    const values = [
      isProcessed ? 1 : 0,
      isPosted ? 1 : 0,
      isProcessed ? now : null,
      error || null,
      channelPostId
    ];
    
    sqliteDb.prepare(updateSQL).run(...values);
    sqliteDb.close();
    
    console.log(`📊 Updated channel_posts ID ${channelPostId}: processed=${isProcessed}, posted=${isPosted}`);
    
  } catch (error) {
    console.error(`❌ Error updating channel_posts status:`, error);
  }
}

// Save product to database
async function saveProductToDatabase(productData: any, channelConfig: any, channelPostId?: number, productInfo?: any) {
  try {
    // Extract numeric price values
    const priceMatch = productData.price?.match(/[\d,]+/);
    const originalPriceMatch = productData.originalPrice?.match(/[\d,]+/);
    
    const numericPrice = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : 0;
    const numericOriginalPrice = originalPriceMatch ? parseFloat(originalPriceMatch[0].replace(/,/g, '')) : null;
    
    // Calculate discount if both prices are available
    const discount = (numericOriginalPrice && numericPrice && numericOriginalPrice > numericPrice) 
      ? Math.round(((numericOriginalPrice - numericPrice) / numericOriginalPrice) * 100)
      : null;
    
    // Apply smart categorization for bot/RSS automation
    const categorization = categorizeForAutomation(
      productData.title || 'Product from Telegram',
      productData.description || '',
      channelConfig.pageSlug,
      channelConfig.platform
    );
    
    console.log(`🤖 Smart categorization result:`, {
      title: productData.title,
      channel: channelConfig.pageSlug,
      isFeatured: categorization.isFeatured,
      isService: categorization.isService,
      isAIApp: categorization.isAIApp,
      category: categorization.category,
      confidence: categorization.confidence
    });
    
    // Determine affiliate URL with conversion based on channel/platform
    const sourceUrls = (productData.urls && productData.urls.length > 0) ? productData.urls : (productInfo?.urls || []);
    const convertedAffiliateUrls = convertUrls(sourceUrls, channelConfig);
    const affiliateUrlToSave = convertedAffiliateUrls[0] || (sourceUrls[0] || '');
    
    // Use raw SQL insert matching the actual unified_content table schema
    const insertSQL = `
      INSERT INTO unified_content (
        title, description, price, original_price, image_url, affiliate_url,
        content_type, page_type, category, subcategory, source_type, source_id,
        affiliate_platform, rating, review_count, discount, currency, gender,
        is_active, is_featured, display_order, display_pages,
        has_timer, timer_duration, timer_start_time,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      productData.title || 'Product from Telegram',
      productData.description || '',
      numericPrice.toString(),
      numericOriginalPrice?.toString() || null,
      productData.imageUrl || 'https://via.placeholder.com/300x300?text=Product',
      affiliateUrlToSave,
      'product',
      channelConfig.pageSlug,
      categorization.category, // Use smart categorization result
      null, // subcategory
      'telegram', // source_type
      channelPostId?.toString() || channelConfig.pageSlug, // Use channel_posts ID as source_id
      channelConfig.platform, // affiliate_platform reflects channel/platform (e.g., deodap)
      '4.0',
      100,
      discount,
      'INR',
      null, // gender
      1, // is_active
      categorization.isFeatured ? 1 : 0, // Smart featured detection
      0, // display_order
      JSON.stringify(Array.from(new Set([channelConfig.pageSlug, ...categorization.displayPages]))), // Ensure channel page appears
      0, // has_timer
      null, // timer_duration
      null, // timer_start_time
      Math.floor(Date.now() / 1000), // created_at
      Math.floor(Date.now() / 1000), // updated_at
    ];
    
    // Execute raw SQL using the database connection
    // Align DB path with storage/db modules (server/../database.sqlite)
    const dbPath = path.join(__dirname, '..', 'database.sqlite');
    const sqliteDb = new Database(dbPath);
    
    const result = sqliteDb.prepare(insertSQL).run(...values);
    sqliteDb.close();
    
    console.log(`✅ Product saved to unified_content for ${channelConfig.pageName}:`, productData.title || 'Product from Telegram');
    console.log(`📊 Product ID: ${result.lastInsertRowid}, Page: ${channelConfig.pageSlug}, Channel Post ID: ${channelPostId}`);
    console.log(`🎯 Auto-categorized as: Featured=${categorization.isFeatured}, Service=${categorization.isService}, AI/App=${categorization.isAIApp}`);
    console.log(`📄 Will appear on pages: ${categorization.displayPages.join(', ')}`);
    
    return result.lastInsertRowid;
    
  } catch (error) {
    console.error(`❌ Error saving product to database:`, error);
    console.error('Error details:', error.message);
    throw error;
  }
}

// Message processing function
async function processMessage(msg) {
  console.log('🔄 processMessage called with:', {
    messageId: msg.message_id,
    chatId: msg.chat?.id,
    chatTitle: msg.chat?.title,
    hasText: !!msg.text,
    hasCaption: !!msg.caption,
    hasPhoto: !!msg.photo
  });
  
  const chatId = msg.chat.id.toString();
  
  // Check if this is a travel channel message
  if (chatId === '-1003047967930') {
    console.log('🧳 Routing message to Travel Picks bot');
    await travelPicksBot.processMessage(msg);
    return;
  }
  
  const channelConfig = CHANNEL_CONFIGS[chatId];
  
  if (!channelConfig) {
    console.log(`❌ Message from unmonitored channel: ${chatId}`);
    return;
  }
  
  console.log(`✅ Processing message from ${channelConfig.pageName} (${chatId})`);
  
  // Enhanced message text extraction for photo messages
  let messageText = '';
  
  // For photo messages, combine caption and any text
  if (msg.photo && msg.photo.length > 0) {
    console.log('📸 Processing photo message');
    messageText = msg.caption || '';
    
    // If there's also text in the message, combine them
    if (msg.text) {
      messageText = messageText ? `${messageText}\n${msg.text}` : msg.text;
    }
  } else {
    // For regular text messages
    messageText = msg.text || msg.caption || '';
  }
  
  console.log(`📝 Message text for processing: ${messageText.substring(0, 200)}...`);
  
  // Extract product information using URL processing service
  const productInfo = await extractProductInfo(messageText);
  
  if (productInfo.urls.length === 0) {
    console.log('⚠️ No URLs found in message, skipping...');
    return;
  }
  
  console.log(`🔗 Found ${productInfo.urls.length} URLs, proceeding to save...`);
  
  // Save message to channel_posts table first
  const channelPostId = await saveToChannelPosts(msg, channelConfig, messageText, productInfo.urls);
  
  if (!channelPostId) {
    console.error('❌ Failed to save message to channel_posts, aborting...');
    await notifyAdmin(
      `❌ <b>Channel Post Save Failed</b>\n` +
      `• Channel: <code>${channelConfig.pageName}</code> (${chatId})\n` +
      `• Message ID: <code>${msg.message_id}</code>`
    );
    return;
  }
  
  console.log(`✅ Message saved to channel_posts with ID: ${channelPostId}`);

  try {
    // Extract image
    const imageUrl = await extractImageUrl(msg);
    
    // Update the channel_posts record with the image URL if found
    if (imageUrl && channelPostId) {
      const dbPath = path.join(__dirname, '..', '..', '..', 'database.sqlite');
      const sqliteDb = new Database(dbPath);
      
      const updateSQL = `UPDATE channel_posts SET image_url = ? WHERE id = ?`;
      sqliteDb.prepare(updateSQL).run(imageUrl, channelPostId);
      sqliteDb.close();
      
      console.log(`📸 Image URL saved: ${imageUrl}`);
    }
    
    let productData;
    
    // If URL processing service provided complete product data, use it
    if (productInfo.productData) {
      // For photo messages, enhance title with message text if URL processing didn't get a good title
      let enhancedTitle = productInfo.productData.name;
      
      if (msg.photo && msg.photo.length > 0 && messageText) {
        // Extract a better title from the message text for photo posts
        const lines = messageText.split('\n').filter(line => line.trim());
        const firstLine = lines[0]?.replace(/[✨🎯🔥⚡️🎉💥🚀💰❌✅]/g, '').trim();
        
        // Use message text title if it's more descriptive than URL-extracted title
        if (firstLine && firstLine.length > 10 && !firstLine.startsWith('http') && 
            (!enhancedTitle || enhancedTitle.length < 20 || enhancedTitle === 'Product from Telegram')) {
          enhancedTitle = firstLine;
        }
      }
      
      // Prioritize product image from URL processing service over Telegram photo
      let finalImageUrl = productInfo.productData.imageUrl;
      
      // Only use Telegram image if no product image was found from URL processing
      if (!finalImageUrl || finalImageUrl.includes('placeholder') || finalImageUrl.includes('via.placeholder')) {
        finalImageUrl = imageUrl || '/api/placeholder/300/300';
      }
      
      console.log(`📸 Image URL decision: Product=${productInfo.productData.imageUrl}, Telegram=${imageUrl}, Final=${finalImageUrl}`);
      
      productData = {
        ...productInfo.productData,
        title: enhancedTitle,
        imageUrl: finalImageUrl,
        messageId: msg.message_id,
        hasPhoto: !!(msg.photo && msg.photo.length > 0)
      };
    } else {
      // Fallback: Convert URLs to affiliate links and use basic product info
      const affiliateUrls = convertUrls(productInfo.urls || [], channelConfig);
      
      // For photo messages, enhance the extracted info
      let enhancedProductInfo = { ...productInfo };
      
      if (msg.photo && msg.photo.length > 0) {
        console.log('📸 Enhancing product info for photo message');
        
        // Add URL to title if available and title is generic
        if (productInfo.urls && productInfo.urls.length > 0 && 
            (!productInfo.title || productInfo.title === 'Product from Telegram' || productInfo.title.length < 15)) {
          try {
            const urlDomain = new URL(productInfo.urls[0]).hostname.replace('www.', '');
            enhancedProductInfo.title = `${productInfo.title || 'Product'} - ${urlDomain}`;
          } catch (error) {
            console.error('Error parsing URL for domain:', error);
            enhancedProductInfo.title = productInfo.title || 'Product from Telegram';
          }
        }
      }
      
      productData = {
        title: enhancedProductInfo.title || 'Product from Telegram',
        price: enhancedProductInfo.price || null,
        originalPrice: enhancedProductInfo.originalPrice || null,
        discount: enhancedProductInfo.discount || null,
        description: enhancedProductInfo.description || '',
        urls: affiliateUrls,
        imageUrl: imageUrl || '/api/placeholder/300/300',
        messageId: msg.message_id,
        hasPhoto: !!(msg.photo && msg.photo.length > 0),
        // Ensure price data is preserved from basic extraction
        currency: 'INR',
        name: enhancedProductInfo.title || 'Product from Telegram'
      };
    }
    
    // Log enhanced product data for debugging
    console.log('📦 Enhanced product data:', {
      title: productData.title,
      price: productData.price,
      originalPrice: productData.originalPrice,
      discount: productData.discount,
      hasPhoto: productData.hasPhoto,
      urlCount: productData.urls?.length || 0
    });
    
    // Save to unified_content database
    const productId = await saveProductToDatabase(productData, channelConfig, Number(channelPostId), productInfo);
    
    // Update channel_posts status to processed
    await updateChannelPostStatus(Number(channelPostId), true, false);
    
    console.log(`✅ Product processed and saved for ${channelConfig.pageName} - Channel Post ID: ${channelPostId}, Product ID: ${productId}`);
    
  } catch (error) {
    console.error(`❌ Error processing message:`, error);
    
    // Update channel_posts status to show processing error
    await updateChannelPostStatus(Number(channelPostId), false, false, error.message);

    // Notify admin about processing/upload failure
    await notifyAdmin(
      `❌ <b>Processing Failed</b>\n` +
      `• Channel: <code>${channelConfig.pageName}</code> (${chatId})\n` +
      `• Message ID: <code>${msg.message_id}</code>\n` +
      `• Error: <code>${error.message || 'unknown error'}</code>`
    );
  }
}

// Export the bot, functions, and TelegramBotManager
export { bot, sendTelegramNotification, TelegramBotManager };