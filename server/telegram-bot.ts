import TelegramBot from 'node-telegram-bot-api';
import { loadEnv } from './config/env-loader.js';
// Ensure environment variables are loaded in any execution context
loadEnv();
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
import { getDatabasePath, getDatabaseOptions } from './config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Admin alert chat configuration (set one of these in env)
// Prefer a private admin chat/channel to avoid spamming public channels
const ALERT_CHAT_ID = process.env.BOT_ALERT_CHAT_ID || process.env.MASTER_ADMIN_CHAT_ID || '';
// Silent mode: when enabled, the bot will NOT send any messages
// back to Telegram (no replies, no channel posts, no admin alerts).
// Set via env: BOT_SILENT=true|1|yes
const BOT_SILENT = ['1', 'true', 'yes'].includes(String(process.env.BOT_SILENT || '').toLowerCase());

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

  // Lightweight status accessor to avoid exposing internals
  public getStatus(): { initialized: boolean; hasToken: boolean; env: string } {
    const hasToken = Boolean(process.env.MASTER_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN);
    const env = process.env.NODE_ENV || 'unknown';
    return { initialized: this.isInitialized, hasToken, env };
  }

  public async initializeBot(): Promise<void> {
    if (this.isInitialized) {
      console.log('🤖 Bot already initialized, skipping...');
      return;
    }

    // Initialize based on presence of a bot token; optional disable via DISABLE_TELEGRAM_BOT
    if (process.env.DISABLE_TELEGRAM_BOT === 'true') {
      console.log('⏸️ Telegram bot disabled via DISABLE_TELEGRAM_BOT flag');
      return;
    }

    const isDev = (process.env.NODE_ENV || 'development') !== 'production';
    const forcePolling = ['1','true','yes'].includes(String(process.env.BOT_POLLING || '').toLowerCase());
    const usePolling = forcePolling || isDev;
    console.log(`🤖 Initializing Telegram bot (${usePolling ? 'polling' : 'webhook-only'} mode)...`);
    
    // Bot configuration - prefer DEV token in development, otherwise master/telelgram token
    const BOT_TOKEN = (isDev && process.env.MASTER_BOT_TOKEN_DEV)
      ? process.env.MASTER_BOT_TOKEN_DEV
      : (process.env.MASTER_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN);
    
    if (!BOT_TOKEN) {
      console.error('❌ MASTER_BOT_TOKEN/TELEGRAM_BOT_TOKEN not found in environment variables');
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

      if (usePolling) {
        // Initialize bot in polling mode for local development
        this.bot = new TelegramBot(BOT_TOKEN, { polling: true });
        console.log('✅ Telegram bot initialized successfully in polling mode');
        // Ensure webhook is cleared so polling receives updates
        try {
          await this.bot.deleteWebHook();
          const info = await this.bot.getWebHookInfo();
          console.log('📊 Webhook cleared for polling', {
            url: (info as any).url,
            pending_update_count: (info as any).pending_update_count,
          });
        } catch (err: any) {
          console.warn('⚠️ Failed to clear webhook for polling:', err?.message || err);
        }
      } else {
        // Initialize bot in webhook mode (no polling) for production
        this.bot = new TelegramBot(BOT_TOKEN, { polling: false, webHook: false });
        console.log('✅ Telegram bot initialized successfully in webhook mode (polling disabled)');
        // Ensure master webhook is configured
        try {
          const baseUrl = process.env.PUBLIC_BASE_URL || 'https://pickntrust.com';
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
      }
      this.isInitialized = true;

      // Setup event handlers
      this.setupEventHandlers();

      // Initialize travel bot
      await travelPicksBot.initialize();

      // Send initialization alert to admin chat if configured
      try {
        if (ALERT_CHAT_ID) {
          const me = await this.bot.getMe();
          const baseUrl = process.env.PUBLIC_BASE_URL || 'https://pickntrust.com';
          const info = await this.bot.getWebHookInfo();
          const msg = `✅ <b>Bot Initialized</b>\n` +
            `• Bot: <code>${me.username}</code> (ID: ${me.id})\n` +
            `• Mode: ${usePolling ? 'polling' : 'webhook-only'}\n` +
            `• Webhook: <code>${(info as any).url || baseUrl}</code>\n` +
            `• Pending: ${(info as any).pending_update_count || 0}\n` +
            `• Env: <code>${process.env.NODE_ENV || 'unknown'}</code>`;
          if (!BOT_SILENT) {
            await this.bot.sendMessage(ALERT_CHAT_ID, msg, { parse_mode: 'HTML' });
          } else {
            console.log('🔕 BOT_SILENT enabled: Skipping init alert');
          }
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
    if (BOT_SILENT) {
      console.log('🔕 BOT_SILENT enabled: Skipping sending channel message');
      return false;
    }
    // Append fallback text for uncertain/missing price (single-item or any message)
    let messageToSend = message;
    try {
      const urls = (message.match(/https?:\/\/[^\s]+/g) || []);
      const basic = extractBasicProductInfo(message, urls);
      const numeric = (v: any) => {
        if (!v) return 0;
        const m = String(v).match(/[\d,]+(?:\.\d+)?/);
        return m ? parseFloat(m[0].replace(/,/g, '')) : 0;
      };
      const hasPrice = numeric(basic.price) > 0;
      const alreadyHasFallback = /See price on website/i.test(messageToSend);
      if (!hasPrice && !alreadyHasFallback) {
        messageToSend = `${messageToSend}\nSee price on website`;
      }
    } catch {}

    console.log(`📤 Sending message to channel ${channelId}...`);
    const result = await currentBot.sendMessage(channelId, messageToSend, {
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
    if (BOT_SILENT) {
      console.log('🔕 BOT_SILENT enabled: Skipping admin notification:', message);
      return false;
    }
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
  },
  '-1003170300695': {
    pageName: 'Trending',
    affiliateTag: '',
    platform: 'multiple',
    platforms: ['cuelinks', 'inrdeals', 'earnkaro'],
    pageSlug: 'trending'
  }
  ,
  // New channels (Apps & AI Apps, Top Picks, Services)
  '-1003414218904': {
    pageName: 'Apps & AI Apps',
    // Reference usernames provided: @pntaiapps
    username: 'pntaiapps',
    active_usernames: ['pntaiapps'],
    affiliateTag: '',
    platform: 'multiple',
    platforms: ['cuelinks', 'inrdeals', 'earnkaro'],
    // Accepts both apps-ai-apps and apps in backend filters
    pageSlug: 'apps-ai-apps'
  },
  '-1003488288404': {
    pageName: 'Top Picks',
    // Reference username: @toppickspnt
    username: 'toppickspnt',
    affiliateTag: '',
    platform: 'multiple',
    platforms: ['cuelinks', 'inrdeals', 'earnkaro'],
    pageSlug: 'top-picks'
  },
  '-1003487271664': {
    pageName: 'Services',
    // Reference usernames provided: @cardsservicespnt
    username: 'cardsservicespnt',
    active_usernames: ['cardsservicespnt'],
    affiliateTag: '',
    platform: 'multiple',
    platforms: ['cuelinks', 'inrdeals', 'earnkaro'],
    pageSlug: 'services'
  }
  ,
  // Travel Picks
  '-1003047967930': {
    pageName: 'Travel Picks',
    // Reference username: @travelpnt
    username: 'travelpnt',
    active_usernames: ['travelpnt'],
    affiliateTag: '',
    platform: 'multiple',
    platforms: ['cuelinks', 'inrdeals', 'earnkaro'],
    pageSlug: 'travel-picks'
  }
  ,
  // New channels (user-provided)
  '-1003334486961': {
    pageName: 'Fresh Picks',
    affiliateTag: '',
    platform: 'multiple',
    platforms: ['cuelinks', 'inrdeals', 'earnkaro'],
    pageSlug: 'fresh-picks'
  },
  '-1003427184585': {
    pageName: "Artist's Corner",
    affiliateTag: '',
    platform: 'multiple',
    platforms: ['cuelinks', 'inrdeals', 'earnkaro'],
    pageSlug: 'artists-corner'
  },
  '-1003324087381': {
    pageName: 'OTT Hub',
    affiliateTag: '',
    platform: 'multiple',
    platforms: ['cuelinks', 'inrdeals', 'earnkaro'],
    pageSlug: 'ott-hub'
  }
};

// Resolve a channelId by pageSlug or pageName
function resolveChannelIdForPage(params: { pageSlug?: string; pageName?: string }): string | null {
  const { pageSlug, pageName } = params || {};
  // Handle common aliases: map top-picks -> prime-picks, etc.
  const slugAliases: Record<string, string> = {
    'top-picks': 'prime-picks',
    'primepicks': 'prime-picks',
  };
  let slugLc = String(pageSlug || '').toLowerCase().trim();
  if (slugLc && slugAliases[slugLc]) slugLc = slugAliases[slugLc];
  const nameLc = String(pageName || '').toLowerCase().trim();
  
  // Overrides: explicit pageSlug -> channelId mapping
  // Enables multiple page slugs to target the same Telegram channel for outbound posts
  const PAGE_CHANNEL_OVERRIDES: Record<string, string> = {
    'fresh-picks': '-1003334486961',
    'artists-corner': '-1003427184585',
    'ott-hub': '-1003324087381'
  };
  if (slugLc && PAGE_CHANNEL_OVERRIDES[slugLc]) return PAGE_CHANNEL_OVERRIDES[slugLc];

  for (const [channelId, cfg] of Object.entries(CHANNEL_CONFIGS)) {
    if (slugLc && String(cfg.pageSlug || '').toLowerCase() === slugLc) return channelId;
    if (nameLc && String(cfg.pageName || '').toLowerCase() === nameLc) return channelId;
  }
  return null;
}

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
async function extractProductInfo(message: string, pageSlug: string = ''): Promise<{
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
    
    const processingResult = await urlProcessingService.processURL(firstUrl, pageSlug || '');
    
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

type ParsedItem = { title: string; url: string };
function parseMultiItemTelegramMessage(text: string): { items: ParsedItem[]; discountLine?: string } {
  const lines = String(text || '').split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  const items: ParsedItem[] = [];
  let discountLine: string | undefined;
  const urlRegex = /(https?:\/\/[^\s]+|(?:bit\.ly|tinyurl\.com|goo\.gl|t\.co|short\.link|amzn\.to|fkrt\.it|myntra\.com\/m|flipkart\.com\/dl|a\.co)[^\s]*)/i;
  const isCodeLine = (l: string) => /(use\s+code|code:)/i.test(l);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isCodeLine(line)) {
      discountLine = line.replace(/`/g, '').trim();
      continue;
    }
    if (urlRegex.test(line)) {
      continue;
    }
    let nextIdx = -1;
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].length === 0) continue;
      nextIdx = j;
      break;
    }
    if (nextIdx === -1) continue;
    const nextLine = lines[nextIdx];
    const urlMatch = nextLine.replace(/`/g, '').match(urlRegex);
    if (!urlMatch) continue;
    const url = urlMatch[0];
    const title = line.replace(/`/g, '').trim();
    if (title && url) {
      items.push({ title, url });
      i = nextIdx;
    }
  }
  return { items, discountLine };
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
      description: ''
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
      const a = parseFloat(matches[1].replace(/,/g, ''));
      const b = parseFloat(matches[2].replace(/,/g, ''));
      // Assign smaller as current price, larger as original price
      if (!isNaN(a) && !isNaN(b)) {
        const small = Math.min(a, b);
        const large = Math.max(a, b);
        price = `₹${small}`;
        originalPrice = `₹${large}`;
      }
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
        // Ensure larger value is originalPrice
        const pNum = parseFloat((price || '').replace(/₹|,/g, ''));
        const oNum = parseFloat(originalPriceValue);
        if (!isNaN(pNum) && !isNaN(oNum)) {
          if (oNum >= pNum) {
            originalPrice = `₹${originalPriceValue}`;
          } else {
            originalPrice = price;
            price = `₹${originalPriceValue}`;
          }
        } else {
          originalPrice = `₹${originalPriceValue}`;
        }
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

  // Pattern 2b: Rs or INR formats
  if (!price) {
    const rsPriceMatch = message.match(/(?:Rs\.?|INR)\s*([\d,]+(?:\.\d+)?)(k?)/i);
    if (rsPriceMatch) {
      let val = rsPriceMatch[1].replace(/,/g, '');
      if (rsPriceMatch[2] && rsPriceMatch[2].toLowerCase() === 'k') val = (parseFloat(val) * 1000).toString();
      price = `₹${val}`;
    }
  }
  if (!originalPrice) {
    const rsOrigMatch = message.match(/(?:MRP|Reg\s*@|Regular|List)\s*:?\s*(?:₹|Rs\.?|INR)?\s*([\d,]+(?:\.\d+)?)(k?)/i);
    if (rsOrigMatch) {
      let val = rsOrigMatch[1].replace(/,/g, '');
      if (rsOrigMatch[2] && rsOrigMatch[2].toLowerCase() === 'k') val = (parseFloat(val) * 1000).toString();
      originalPrice = `₹${val}`;
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
    
    // Only bypass conversion for trending page
    if (config?.pageSlug === 'trending') {
      console.log('🔥 Trending page — bypassing affiliate conversion, preserving original URL');
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
              convertedUrls.push(convertToCuelinks(url));
          }
        } else {
          console.log('⚠️ No platforms configured for multiple, falling back to cuelinks');
          convertedUrls.push(convertToCuelinks(url));
        }
        break;
      default:
        console.log(`⚠️ Unknown platform ${config.platform}, returning original URL`);
        convertedUrls.push(url);
        break;
    }
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

// Detect currency from a text string containing symbols or ISO codes
function detectCurrencyFromText(text?: any): string | null {
  if (!text) return null;
  const s = String(text).toUpperCase();
  if (s.includes('₹') || s.includes('INR') || s.includes(' RS') || s.startsWith('RS')) return 'INR';
  if (s.includes('$') || s.includes('USD')) return 'USD';
  if (s.includes('€') || s.includes('EUR')) return 'EUR';
  if (s.includes('£') || s.includes('GBP')) return 'GBP';
  if (s.includes('¥') || s.includes('JPY')) return 'JPY';
  return null;
}

// Save message to channel_posts table first
async function saveToChannelPosts(msg: any, channelConfig: any, messageText: string, extractedUrls: string[], imageUrl: string | null = null) {
  try {
    // Use the same database path convention as other server modules
    const dbPath = getDatabasePath();
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
    const dbPath = getDatabasePath();
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
    // Prefer the scraper's `name` field for title, fallback to any `title`
    const effectiveTitle = (productData?.name || productData?.title || 'Product from Telegram');
    // Detect currency from provided fields if not explicitly set
    const detectCurrencyFromText = (text?: any): string | null => {
      if (!text) return null;
      const s = String(text).toUpperCase();
      if (s.includes('₹') || s.includes('INR') || s.includes(' RS') || s.startsWith('RS')) return 'INR';
      if (s.includes('$') || s.includes('USD')) return 'USD';
      if (s.includes('€') || s.includes('EUR')) return 'EUR';
      if (s.includes('£') || s.includes('GBP')) return 'GBP';
      if (s.includes('¥') || s.includes('JPY')) return 'JPY';
      return null;
    };
    // Extract numeric price values
    const priceMatch = productData.price?.match(/[\d,]+/);
    const originalPriceMatch = productData.originalPrice?.match(/[\d,]+/);
    
    const numericPrice = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : null;
    const numericOriginalPrice = originalPriceMatch ? parseFloat(originalPriceMatch[0].replace(/,/g, '')) : null;
    
    // Calculate discount if both prices are available
    const discount = (numericOriginalPrice !== null && numericPrice !== null && numericOriginalPrice > numericPrice) 
      ? Math.round(((numericOriginalPrice - numericPrice) / numericOriginalPrice) * 100)
      : null;
    
    // Apply smart categorization for bot/RSS automation
    const categorization = categorizeForAutomation(
      effectiveTitle,
      productData.description || '',
      channelConfig.pageSlug,
      channelConfig.platform
    );
    
    // Ensure displayPages is a normalized array and include smart defaults
    const normalizeSlugLocal = (s: any) => String(s)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let providedPages: string[] = [];
    // Accept pages from productData.displayPages or productData.pages in various formats
    const rawPages: any = (productData as any)?.displayPages ?? (productData as any)?.pages ?? null;
    if (Array.isArray(rawPages)) {
      providedPages = rawPages.map((p: any) => normalizeSlugLocal(p)).filter(Boolean);
    } else if (typeof rawPages === 'string' && rawPages.length) {
      try {
        const parsed = JSON.parse(rawPages);
        if (Array.isArray(parsed)) {
          providedPages = parsed.map((p: any) => normalizeSlugLocal(p)).filter(Boolean);
        } else {
          providedPages = rawPages.split(',').map((s: string) => normalizeSlugLocal(s)).filter(Boolean);
        }
      } catch {
        providedPages = rawPages.split(',').map((s: string) => normalizeSlugLocal(s)).filter(Boolean);
      }
    }

    const basePages = [
      normalizeSlugLocal(channelConfig.pageSlug),
      ...providedPages,
    ];
    const finalPages = Array.from(new Set([
      ...basePages,
    ])).filter(Boolean);
    // Attach to categorization to avoid crashes on spread/join downstream
    (categorization as any).displayPages = finalPages;
    
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
    
    // Determine currency to save
    const currencyToSave = (
      (productData.currency ? String(productData.currency).toUpperCase() : null) ||
      detectCurrencyFromText(productData.price) ||
      detectCurrencyFromText(productData.originalPrice) ||
      'INR'
    );

    // Schema guard: ensure columns used by API filters exist
    try {
      const dbPathForSchema = getDatabasePath();
      const dbForSchema = new Database(dbPathForSchema);
      const tableInfo = dbForSchema.prepare("PRAGMA table_info(unified_content)").all();
      const hasCol = (name: string) => tableInfo.some((c: any) => String(c.name) === name);
      const statements: string[] = [];
      if (!hasCol('status')) statements.push("ALTER TABLE unified_content ADD COLUMN status TEXT DEFAULT 'active'");
      if (!hasCol('visibility')) statements.push("ALTER TABLE unified_content ADD COLUMN visibility TEXT DEFAULT 'public'");
      if (!hasCol('processing_status')) statements.push("ALTER TABLE unified_content ADD COLUMN processing_status TEXT DEFAULT 'completed'");
      if (statements.length) {
        const tx = dbForSchema.transaction((stmts: string[]) => {
          for (const s of stmts) dbForSchema.prepare(s).run();
        });
        tx(statements);
      }
      dbForSchema.close();
    } catch {}

    // Use raw SQL insert matching the actual unified_content table schema
    const insertSQL = `
      INSERT INTO unified_content (
        title, description, price, original_price, image_url, affiliate_url,
        content_type, page_type, category, subcategory, source_type, source_id,
        affiliate_platform, rating, review_count, discount, currency, gender,
        is_active, is_featured, display_order, display_pages,
        has_timer, timer_duration, timer_start_time,
        created_at, updated_at, status, visibility, processing_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      effectiveTitle,
      productData.description || '',
      numericPrice !== null ? numericPrice.toString() : null,
      numericOriginalPrice !== null ? numericOriginalPrice.toString() : null,
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
      currencyToSave,
      null, // gender
      1, // is_active
      categorization.isFeatured ? 1 : 0, // Smart featured detection
      0, // display_order
      JSON.stringify(
        Array.from(new Set(((categorization as any).displayPages || [])
          .map((p: any) => String(p || '')
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9-]+/g, '-')
            .replace(/^-+|-+$/g, '')
          )
        )).filter(Boolean)
      ),
      0, // has_timer
      null, // timer_duration
      null, // timer_start_time
      Math.floor(Date.now() / 1000), // created_at
      Math.floor(Date.now() / 1000), // updated_at
      'active', // status
      'public', // visibility
      'completed', // processing_status
    ];
    
    // Execute raw SQL using the database connection
    // Align DB path with storage/db modules (server/../database.sqlite)
    const dbPath = getDatabasePath();
    const sqliteDb = new Database(dbPath);
    
    const result = sqliteDb.prepare(insertSQL).run(...values);
    sqliteDb.close();
    
    console.log(`✅ Product saved to unified_content for ${channelConfig.pageName}:`, productData.title || 'Product from Telegram');
    console.log(`📊 Product ID: ${result.lastInsertRowid}, Page: ${channelConfig.pageSlug}, Channel Post ID: ${channelPostId}`);
    console.log(`🎯 Auto-categorized as: Featured=${categorization.isFeatured}, Service=${categorization.isService}, AI/App=${categorization.isAIApp}`);
    console.log(`📄 Will appear on pages: ${((categorization as any).displayPages || []).join(', ')}`);
    
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
  
  // Route Travel Picks channel posts to dedicated travel bot
  try {
    const travelStatus = travelPicksBot.getStatus();
    if (chatId === travelStatus.channelId) {
      console.log(`🧳 Routing message ${msg.message_id} from Travel Picks (${chatId}) to travel bot`);
      await travelPicksBot.processMessage(msg);
      return;
    }
  } catch (routeErr) {
    console.warn('⚠️ Travel routing check failed:', (routeErr as any)?.message || routeErr);
  }
  
  // Master bot handles non-travel channels below
  
  let channelConfig = CHANNEL_CONFIGS[chatId];
  
  // Quarantine fallback: route unknown channels into a dedicated hidden page
  if (!channelConfig) {
    const title = (msg.chat?.title || '').trim();
    const titleLc = title.toLowerCase();
    // Title-based routing for public channels where ID is not yet registered
    const TITLE_TO_SLUG: Record<string, string> = {
      'fresh picks': 'fresh-picks',
      'fresh-picks': 'fresh-picks',
      "artist's corner": 'artists-corner',
      'artists corner': 'artists-corner',
      'artists-corner': 'artists-corner',
      'ott hub': 'ott-hub',
      'ott-hub': 'ott-hub'
    };
    const mappedSlug = TITLE_TO_SLUG[titleLc];

    if (mappedSlug) {
      channelConfig = {
        pageName: title || 'Mapped Channel',
        affiliateTag: '',
        platform: 'multiple',
        platforms: ['cuelinks', 'inrdeals', 'earnkaro'],
        pageSlug: mappedSlug
      } as any;
      console.warn(`ℹ️ Unknown channel ${chatId} (${title}). Routing by title to '${mappedSlug}'.`);
    } else {
      channelConfig = {
        pageName: 'Fallback',
        affiliateTag: '',
        platform: 'multiple',
        platforms: ['cuelinks', 'inrdeals', 'earnkaro'],
        pageSlug: 'fallback'
      } as any;
      console.warn(`⚠️ Unknown channel ${chatId} (${title}). Routing to 'fallback' page.`);
      try {
        await notifyAdmin(
          `⚠️ <b>Unknown Channel Routed</b>\n` +
          `• Channel ID: <code>${chatId}</code>\n` +
          `• Title: <code>${title || 'N/A'}</code>\n` +
          `• Routed Page: <code>fallback</code>`
        );
      } catch {}
    }
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

  const multi = parseMultiItemTelegramMessage(messageText);
  if (multi.items && multi.items.length > 1) {
    try {
      for (const it of multi.items) {
        let postMsg = `${it.title}\n${it.url}`;
        try {
          const basic = extractBasicProductInfo(postMsg, [it.url]);
          const numeric = (v: any) => {
            if (!v) return 0;
            const m = String(v).match(/[\d,]+(?:\.\d+)?/);
            return m ? parseFloat(m[0].replace(/,/g, '')) : 0;
          };
          const priceOk = numeric(basic.price) > 0;
          if (!priceOk) {
            postMsg = `${postMsg}\nSee price on website`;
          }
        } catch {}
        await sendTelegramNotification(chatId, postMsg, { disable_web_page_preview: false });
      }
      if (multi.discountLine) {
        await sendTelegramNotification(chatId, multi.discountLine);
      }
      // Don't return here; continue to process and save individual products below
    } catch (multiErr) {
      console.warn('⚠️ Multi-item posting encountered an error, falling back to normal processing:', (multiErr as any)?.message || multiErr);
    }
  }
  
  // Capture URLs present only in Telegram entities (e.g., text_link), and merge into text
  function extractEntityUrls(m: any): string[] {
    const out: string[] = [];
    const collect = (entities: any[], text: string) => {
      if (!entities || !Array.isArray(entities)) return;
      for (const e of entities) {
        try {
          if (e.type === 'text_link' && e.url) {
            out.push(String(e.url));
          } else if (e.type === 'url' && typeof e.offset === 'number' && typeof e.length === 'number' && typeof text === 'string') {
            const urlText = text.substring(e.offset, e.offset + e.length);
            if (urlText) out.push(urlText);
          }
        } catch {}
      }
    };
    collect(m.entities, m.text || '');
    collect(m.caption_entities, m.caption || '');
    return out;
  }
  const entityUrls = extractEntityUrls(msg);
  if (entityUrls.length > 0) {
    messageText = `${messageText}\n${entityUrls.join('\n')}`.trim();
    console.log('🔗 Added entity URLs to message text:', entityUrls);
  }
  
  // Extract product information using URL processing service
  const productInfo = await extractProductInfo(messageText, channelConfig.pageSlug || '');
  
  if (productInfo.urls.length === 0) {
    console.log('⚠️ No URLs found via text parsing');
    if (entityUrls.length === 0) {
      console.log('❌ No URLs found in entities either. Falling back to minimal product save.');
      // Save minimal channel post and product so page still shows the post
      const channelPostId = await saveToChannelPosts(msg, channelConfig, messageText, []);
      if (!channelPostId) {
        console.error('❌ Failed to save message to channel_posts in fallback path, aborting...');
        await notifyAdmin(
          `❌ <b>Channel Post Save Failed (Fallback)</b>\n` +
          `• Channel: <code>${channelConfig.pageName}</code> (${chatId})\n` +
          `• Message ID: <code>${msg.message_id}</code>`
        );
        return;
      }

      // Try to get Telegram photo URL
      const imageUrl = await extractImageUrl(msg);

      // Derive a basic title from the first meaningful line
      const lines = (messageText || '').split('\n').map(l => l.trim()).filter(Boolean);
      const firstLine = lines[0]?.replace(/[✨🎯🔥⚡️🎉💥🚀💰❌✅]/g, '').trim();
      const basicInfo = extractBasicProductInfo(messageText || '', []);
      const fallbackTitle = firstLine && firstLine.length > 10 && !firstLine.startsWith('http')
        ? firstLine
        : (basicInfo.title || 'Product from Telegram');

      try {
        const productId = await saveProductToDatabase({
          name: fallbackTitle,
          title: fallbackTitle,
          description: (messageText || '').substring(0, 300).replace(/https?:\/\/[^\s]+/g, '').replace(/\s{2,}/g, ' ').trim(),
          price: basicInfo.price || null,
          originalPrice: basicInfo.originalPrice || null,
          discount: basicInfo.discount || null,
          imageUrl: imageUrl || '/api/placeholder/300/300',
          urls: [],
          currency: 'INR'
        }, channelConfig, Number(channelPostId));

        await updateChannelPostStatus(Number(channelPostId), true, false);
        console.log(`✅ Fallback product saved for ${channelConfig.pageName} - Channel Post ID: ${channelPostId}, Product ID: ${productId}`);
      } catch (fallbackErr: any) {
        console.error('❌ Fallback save failed:', fallbackErr?.message || fallbackErr);
        await updateChannelPostStatus(Number(channelPostId), false, false, fallbackErr?.message || String(fallbackErr));
      }
      return;
    }
    // Fallback: use entity URLs directly
    productInfo.urls = entityUrls;
    console.log(`🔗 Using ${entityUrls.length} URLs from entities`);
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
      // Use the same project-root database path convention as elsewhere
    const dbPath = getDatabasePath();
      const sqliteDb = new Database(dbPath);

      const updateSQL = `UPDATE channel_posts SET image_url = ? WHERE id = ?`;
      sqliteDb.prepare(updateSQL).run(imageUrl, channelPostId);
      sqliteDb.close();

      console.log(`📸 Image URL saved: ${imageUrl}`);
    }
    
    let productData;

    // If URL processing service provided complete product data, use it
    if (productInfo.productData) {
      // Start with URL processing title
      let enhancedTitle = productInfo.productData.name;

      // Derive a better title from message text for both photo and text-only posts
      if (messageText) {
        const fallbackInfo = extractBasicProductInfo(messageText, productInfo.urls || []);
        const fallbackTitle = (fallbackInfo?.title || '').trim();
        const genericTitles = new Set([
          'Product from Telegram',
          'Product from unknown',
          'Product from amazon.in',
          'Product from amazon.com',
          'Page Not Found',
          'Amazon Product'
        ]);

        // Use fallback title when URL-derived title is generic or too short
        if (
          (!enhancedTitle || enhancedTitle.length < 12 || genericTitles.has(enhancedTitle)) &&
          fallbackTitle && !genericTitles.has(fallbackTitle) && !fallbackTitle.startsWith('http')
        ) {
          enhancedTitle = fallbackTitle;
        }

        // For photo posts, also consider the first meaningful line as title
        if (msg.photo && msg.photo.length > 0) {
          const lines = messageText.split('\n').filter(line => line.trim());
          const firstLine = lines[0]?.replace(/[✨🎯🔥⚡️🎉💥🚀💰❌✅]/g, '').trim();
          if (firstLine && firstLine.length > 10 && !firstLine.startsWith('http') &&
              (!enhancedTitle || enhancedTitle.length < 20 || genericTitles.has(enhancedTitle))) {
            enhancedTitle = firstLine;
          }
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
        // Strip any raw URLs from description to keep link out of body
        description: (productInfo.productData.description || '').replace(/https?:\/\/[^\s]+/g, '').replace(/\s{2,}/g, ' ').trim(),
        imageUrl: finalImageUrl,
        messageId: msg.message_id,
        hasPhoto: !!(msg.photo && msg.photo.length > 0)
      };

      // Reconcile price/original price with message context if scraper is missing or inconsistent
      try {
        const msgLevel = extractBasicProductInfo(messageText, productInfo.urls || []);
        const toNum = (s: any) => {
          if (!s) return null;
          const m = String(s).match(/[\d,]+(?:\.\d+)?/);
          return m ? parseFloat(m[0].replace(/,/g, '')) : null;
        };
        const sp = toNum(productInfo.productData.price);
        const so = toNum(productInfo.productData.originalPrice);
        const mp = toNum(msgLevel.price);
        const mo = toNum(msgLevel.originalPrice);

        // Prefer message-level when scraper failed or clearly wrong
        if ((sp === null || sp <= 0) && mp !== null) {
          productData.price = msgLevel.price;
        }
        if ((so === null || (sp !== null && so !== null && so < sp)) && mo !== null) {
          productData.originalPrice = msgLevel.originalPrice;
        }
      } catch {}
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
        // Strip raw URLs so link appears only in CTA
        description: (enhancedProductInfo.description || '').replace(/https?:\/\/[^\s]+/g, '').replace(/\s{2,}/g, ' ').trim(),
        urls: affiliateUrls,
        imageUrl: imageUrl || '/api/placeholder/300/300',
        messageId: msg.message_id,
        hasPhoto: !!(msg.photo && msg.photo.length > 0),
        // Ensure price data is preserved from basic extraction
        currency:
          (productData?.currency ? String(productData.currency).toUpperCase() : null) ||
          detectCurrencyFromText(enhancedProductInfo.price) ||
          detectCurrencyFromText(enhancedProductInfo.originalPrice) ||
          'INR',
        name: enhancedProductInfo.title || 'Product from Telegram'
      };
    }
    
    // If there are multiple URLs or parsed items, save one product per URL
    const multiItems = (multi.items && multi.items.length > 1)
      ? multi.items.map(it => ({ title: it.title, url: it.url }))
      : [];

    const urlList = productInfo.urls || [];

    if (multiItems.length > 0 || (urlList.length > 1)) {
      const itemsToProcess = multiItems.length > 0
        ? multiItems
        : urlList.map(u => ({ title: null as any, url: u }));

      console.log(`🧩 Processing multi-item save: count=${itemsToProcess.length}`);

      for (let idx = 0; idx < itemsToProcess.length; idx++) {
        const item = itemsToProcess[idx];
        const singleText = item.title ? `${item.title}\n${item.url}` : `${item.url}`;
        let singleInfo: any;
        try {
          singleInfo = await extractProductInfo(singleText, channelConfig.pageSlug || '');
        } catch (e) {
          console.warn('⚠️ extractProductInfo failed for single item, falling back:', (e as any)?.message || e);
          singleInfo = { urls: [item.url] };
        }

        // Reuse Telegram image for all items when available
        const singleImageUrl = imageUrl || '/api/placeholder/300/300';

        let singleProductData: any;
        if (singleInfo && singleInfo.productData) {
          // Prefer processed product data
          let enhancedTitle = singleInfo.productData.name || (item.title || productData.title);
          // Handle generic titles
          const genericTitles = new Set([
            'Product from Telegram',
            'Product from unknown',
            'Page Not Found',
            'Amazon Product'
          ]);
          if (!enhancedTitle || enhancedTitle.length < 12 || genericTitles.has(enhancedTitle)) {
            enhancedTitle = item.title || productData.title || enhancedTitle || 'Product from Telegram';
          }

          singleProductData = {
            ...singleInfo.productData,
            title: enhancedTitle,
            description: (singleInfo.productData.description || '').replace(/https?:\/\/[^\s]+/g, '').replace(/\s{2,}/g, ' ').trim(),
            imageUrl: singleInfo.productData.imageUrl || singleImageUrl,
            urls: convertUrls([item.url], channelConfig),
            messageId: msg.message_id,
            hasPhoto: !!(msg.photo && msg.photo.length > 0),
            name: enhancedTitle
          };

          // Reconcile with full message context for prices if missing/invalid
          try {
            const msgLevel = extractBasicProductInfo(messageText, [item.url]);
            const toNum = (s: any) => {
              if (!s) return null;
              const m = String(s).match(/[\d,]+(?:\.\d+)?/);
              return m ? parseFloat(m[0].replace(/,/g, '')) : null;
            };
            const sp = toNum(singleInfo.productData.price);
            const so = toNum(singleInfo.productData.originalPrice);
            const mp = toNum(msgLevel.price);
            const mo = toNum(msgLevel.originalPrice);
            if ((sp === null || sp <= 0) && mp !== null) {
              singleProductData.price = msgLevel.price;
            }
            if ((so === null || (sp !== null && so !== null && so < sp)) && mo !== null) {
              singleProductData.originalPrice = msgLevel.originalPrice;
            }
          } catch {}
        } else {
          // Fallback build from single URL
          const fallbackInfo = extractBasicProductInfo(singleText, [item.url]);
          singleProductData = {
            title: (item.title || fallbackInfo.title || productData.title || 'Product from Telegram'),
            price: fallbackInfo.price || productData.price || null,
            originalPrice: fallbackInfo.originalPrice || productData.originalPrice || null,
            discount: fallbackInfo.discount || productData.discount || null,
            description: (fallbackInfo.description || productData.description || '').replace(/https?:\/\/[^\s]+/g, '').replace(/\s{2,}/g, ' ').trim(),
            urls: convertUrls([item.url], channelConfig),
            imageUrl: singleImageUrl,
            messageId: msg.message_id,
            hasPhoto: !!(msg.photo && msg.photo.length > 0),
            currency:
              (productData?.currency ? String(productData.currency).toUpperCase() : null) ||
              detectCurrencyFromText(fallbackInfo.price) ||
              detectCurrencyFromText(fallbackInfo.originalPrice) ||
              'INR',
            name: (item.title || fallbackInfo.title || productData.title || 'Product from Telegram')
          };
        }

        console.log('📦 Saving single item product:', {
          idx,
          title: singleProductData.title,
          url: (singleProductData.urls && singleProductData.urls[0]) || item.url,
          hasPhoto: singleProductData.hasPhoto
        });

        try {
          await saveProductToDatabase(singleProductData, channelConfig, Number(channelPostId), singleInfo);
        } catch (saveErr) {
          console.error('❌ Failed to save single item product:', (saveErr as any)?.message || saveErr);
        }
      }

      await updateChannelPostStatus(Number(channelPostId), true, false);
      return;
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
    
    // Save to unified_content database for single-URL messages
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
export { bot, sendTelegramNotification, TelegramBotManager, CHANNEL_CONFIGS, resolveChannelIdForPage };
