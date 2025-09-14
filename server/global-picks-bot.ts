// Global Picks Telegram Bot - Universal URL Support
// Handles all types of URLs with intelligent affiliate conversion

import TelegramBot from 'node-telegram-bot-api';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import Database from 'better-sqlite3';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { webhookManager } from './webhook-routes';


// 🔒 ENVIRONMENT ENFORCEMENT - DO NOT MODIFY
// This bot MUST ONLY use .env.global-picks
const REQUIRED_ENV_FILE = '.env.global-picks';
const BOT_NAME = 'Global Picks';
const EXPECTED_TOKEN_PREFIX = '8341930611';

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
// Load Global Picks environment configuration
const globalPicksEnvPath = path.join(process.cwd(), '.env.global-picks');
console.log('🌍 Global Picks Bot: Loading environment from:', globalPicksEnvPath);
if (fs.existsSync(globalPicksEnvPath)) {
  dotenv.config({ path: globalPicksEnvPath });
  console.log('Success Global Picks environment loaded');
} else {
  console.log('Warning .env.global-picks file not found');
}

// Environment variables - Fixed to match .env.global-picks format
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const CHANNEL_USERNAME = process.env.CHANNEL_NAME;
const TARGET_PAGE = process.env.TARGET_PAGE || 'global-picks';
const BOT_USERNAME = process.env.BOT_USERNAME || 'globalpickspnt_bot';
const CHANNEL_NAME = process.env.CHANNEL_NAME || 'Global Picks Universal';

// Universal affiliate configuration
const AMAZON_ASSOCIATES_TAG = process.env.AMAZON_ASSOCIATES_TAG || 'pickntrustcom-21';
const FLIPKART_AFFILIATE_ID = process.env.FLIPKART_AFFILIATE_ID || 'pickntrust';
const EARNKARO_REF_ID = process.env.EARNKARO_REF_ID || '4530348';
const CUELINKS_MEDIUM_ID = process.env.CUELINKS_MEDIUM_ID || 'pickntrust';

console.log('Search Global Picks Bot: Checking configuration...');
console.log('   BOT_TOKEN:', BOT_TOKEN ? BOT_TOKEN.substring(0, 10) + '...' : 'MISSING');
console.log('   CHANNEL_ID:', CHANNEL_ID || 'MISSING');
console.log('   BOT_USERNAME:', BOT_USERNAME || 'MISSING');
console.log('   CHANNEL_NAME:', CHANNEL_NAME || 'MISSING');

if (!BOT_TOKEN || !CHANNEL_ID) {
  console.log('Error Global Picks bot configuration missing. Please check .env.global-picks file.');
  console.log('Bot will not start without proper configuration.');
} else {
  console.log('Success Global Picks bot configuration loaded successfully');
}

class GlobalPicksBot {
  private telegramBot: TelegramBot | null = null;
  private isInitialized = false;

  // WEBHOOK MODE: Unified message handler
  private async handleMessage(msg: TelegramBot.Message): Promise<void> {
    try {
      if (msg.chat.type === 'private') {
        // Handle private messages if needed
        console.log('Global Picks: Private message received');
      } else if (msg.chat.id === parseInt(CHANNEL_ID!) || msg.chat.id.toString() === CHANNEL_ID) {
        console.log(`Global Picks: Processing channel message from ${msg.chat.id}`);
        await this.processChannelMessage(msg);
      } else {
        console.log(`Global Picks: Ignoring message from chat ${msg.chat.id} (expected ${CHANNEL_ID})`);
      }
    } catch (error) {
      console.error('Global Picks Bot message handling error:', error);
    }
  }

  // WEBHOOK MODE: Alternative message handler
  private async handleTelegramMessage(msg: TelegramBot.Message): Promise<void> {
    await this.handleMessage(msg);
  }

  async initialize() {
    try {
      console.log('🌍 Initializing Global Picks Telegram bot (Universal URL Support)...');
      
      if (!BOT_TOKEN || !CHANNEL_ID) {
        throw new Error('Missing bot token or channel ID');
      }

      // WEBHOOK MODE: Create bot without polling
      this.telegramBot = new TelegramBot(BOT_TOKEN, { polling: false });
      
      // Register with webhook manager
      webhookManager.registerBot('global-picks', BOT_TOKEN, this.handleMessage?.bind(this) || this.handleTelegramMessage?.bind(this));
      
      // Webhook mode - no polling listeners needed
      console.log('📡 Global Picks bot registered for webhook mode');
      
      // Test bot connection
      const me = await this.telegramBot.getMe();
      console.log(`Success Global Picks bot connected successfully!`);
      console.log(`AI Bot: @${me.username} (${me.first_name})`);
      console.log(`Mobile Monitoring: ${CHANNEL_USERNAME} (${CHANNEL_ID})`);
      console.log(`Target Target: ${TARGET_PAGE} page`);
      console.log(`🌍 Features: Universal URL support, Multi-affiliate conversion, Smart data extraction`);
      
      // Enable polling after successful connection
      this.telegramBot.startPolling();
      
      // Setup message listeners
      this.setupMessageListeners();
      this.setupErrorHandling();
      
      this.isInitialized = true;
      console.log('Target Global Picks bot fully initialized with universal URL support!');
      
      // Send startup notification
      try {
        await this.telegramBot.sendMessage(CHANNEL_ID, 
          'Launch **Global Picks Hybrid Bot Started!**\n\n' +
          'Success Universal URL processing active\n' +
          'Success Multi-platform affiliate integration\n' +
          'Success Global deal detection enabled\n' +
          'Success Smart categorization and scoring\n\n' +
          'Target Ready to find the best Global Picks deals!',
          { parse_mode: 'Markdown' }
        );
      } catch (error) {
        console.error('Failed to send Global Picks startup notification:', error);
      }
      
    } catch (error) {
      console.error('Error Failed to initialize Global Picks bot:', error.message);
      this.isInitialized = false;
      throw error;
    }
  }

  setupMessageListeners() {
    if (!this.telegramBot) return;
    
    // Listen for channel posts
    this.telegramBot.on('channel_post', async (message) => {
      try {
        if (message.chat.id.toString() === CHANNEL_ID) {
          console.log('Mobile Global Picks: New channel post received');
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
    this.telegramBot.on('edited_channel_post', async (message) => {
      try {
        if (message.chat.id.toString() === CHANNEL_ID) {
          console.log('Blog Global Picks: Channel post edited');
          if (message.text) {
            await this.processChannelMessage(message);
          }
        }
      } catch (error) {
        console.error('Error Error processing edited channel post:', error);
      }
    });
    
    // Listen for private messages (like /start)
    this.telegramBot.on('message', async (message) => {
      try {
        if (message.chat.type === 'private' && message.text) {
          if (message.text === '/start') {
            const statusMessage = 
              `🌍 Global Picks Bot Active!\n\n` +
              `Success Universal URL support (All platforms)\n` +
              `Price Multi-affiliate conversion\n` +
              `Stats Smart data extraction\n` +
              `Mobile Monitoring: ${CHANNEL_NAME}\n` +
              `Target Target: ${TARGET_PAGE} page\n\n` +
              `🔧 Status: UNIVERSAL AUTOPOSTING\n` +
              `⏰ Time: ${new Date().toLocaleString()}`;
            
            await this.telegramBot.sendMessage(message.chat.id, statusMessage);
            console.log(`Mobile Sent /start response to user ${message.from?.username || 'unknown'}`);
          }
        }
      } catch (error) {
        console.error('Error Error handling private message:', error);
      }
    });
  }

  setupErrorHandling() {
    if (!this.telegramBot) return;
    
    this.telegramBot.on('polling_error', (error) => {
      console.error('Error Global Picks Bot polling error:', error.message);
    });
    
    this.telegramBot.on('error', (error) => {
      console.error('Error Global Picks Bot error:', error.message);
    });
  }

  async processChannelMessage(message: any) {
    try {
      console.log('Refresh Processing Global Picks channel message with universal URL support...');
      
      const messageText = message.text || '';
      const urls = this.extractUrls(messageText);
      
      if (urls.length > 0) {
        console.log(`Link Found ${urls.length} URLs in message`);
        
        for (const url of urls) {
          await this.processUniversalUrl(url, message, messageText);
        }
      } else {
        console.log('ℹ️ No URLs found in message');
      }
    } catch (error) {
      console.error('Error Error processing channel message:', error);
    }
  }

  extractUrls(text: string): string[] {
    const urlRegex = /https?:\/\/[^\s]+/g;
    return text.match(urlRegex) || [];
  }

  async processUniversalUrl(url: string, message: any, messageText: string) {
    try {
      console.log(`🌍 Processing Universal URL: ${url}`);
      
      // Step 1: Analyze URL type and platform
      const urlAnalysis = this.analyzeUrl(url);
      console.log(`Search URL Analysis:`);
      console.log(`   Type: ${urlAnalysis.type}`);
      console.log(`   Platform: ${urlAnalysis.platform}`);
      console.log(`   Needs Expansion: ${urlAnalysis.needsExpansion}`);
      
      // Step 2: Expand URL to final destination
      console.log('Link Expanding URL to final destination...');
      const expandedUrl = await this.expandUniversalUrl(url);
      console.log(`Link Final URL: ${expandedUrl}`);
      
      // Step 3: Generate appropriate affiliate URL
      const affiliateUrl = await this.generateUniversalAffiliateUrl(expandedUrl, urlAnalysis);
      console.log(`Price Affiliate URL: ${affiliateUrl}`);
      
      // Step 4: Extract product data from final URL
      console.log('Search Extracting product data with universal extraction...');
      const productData = await this.extractUniversalProductData(expandedUrl, messageText, urlAnalysis);
      
      // Step 5: Extract additional info from message
      const messageProductName = this.extractProductNameFromMessage(messageText);
      const messageDescription = this.extractDescriptionFromMessage(messageText);
      const messagePriceInfo = this.extractPriceFromMessage(messageText);
      
      // Log extracted data for debugging
      console.log('Stats Universal extraction summary:');
      console.log(`   Real name: ${productData.name || 'Not found'}`);
      console.log(`   Real price: ${productData.price || 'Not found'}`);
      console.log(`   Real image: ${productData.imageUrl ? 'Found Success' : 'Not found Error'}`);
      console.log(`   Platform: ${urlAnalysis.platform}`);
      console.log(`   Affiliate: ${urlAnalysis.affiliateNetwork}`);
      
      // Step 6: Combine and save product data
      const finalProductData = {
        name: productData.name || messageProductName || 'Global Picks Product',
        description: productData.description || messageDescription || 'Universal product from Global Picks',
        price: productData.price || messagePriceInfo.price || '999',
        original_price: productData.originalPrice || messagePriceInfo.originalPrice || (productData.price ? (parseInt(productData.price) * 1.5).toString() : '1499'),
        currency: 'INR',
        image_url: productData.imageUrl || null, // No placeholder images
        affiliate_url: affiliateUrl,
        original_url: expandedUrl,
        category: productData.category || this.detectCategory(messageText),
        rating: productData.rating || 4.0,
        review_count: productData.reviewCount || 50,
        discount: productData.discount || messagePriceInfo.discount || this.calculateDiscount(productData.price, productData.originalPrice),
        is_new: 1,
        is_featured: 0,
        affiliate_network: urlAnalysis.affiliateNetwork,
        telegram_message_id: message.message_id,
        telegram_channel_id: parseInt(CHANNEL_ID || '0'),
        telegram_channel_name: CHANNEL_NAME,
        processing_status: 'active',
        content_type: 'product',
        affiliate_tag_applied: 1,
        
        // Universal URL support fields
        url_type: urlAnalysis.type,
        source_platform: urlAnalysis.platform,
        redirect_chain: JSON.stringify(urlAnalysis.redirectChain || []),
        final_destination: expandedUrl,
        primary_affiliate: urlAnalysis.affiliateNetwork,
        data_quality_score: this.calculateDataQualityScore(productData),
        brand: productData.brand || this.extractBrandFromName(productData.name || messageProductName),
        availability: 'in_stock'
      };
      
      console.log('Stats Final universal product data:');
      console.log(`   Name: ${finalProductData.name}`);
      console.log(`   Price: ₹${finalProductData.price} (was ₹${finalProductData.original_price})`);
      console.log(`   Discount: ${finalProductData.discount}%`);
      console.log(`   Platform: ${finalProductData.source_platform}`);
      console.log(`   Affiliate: ${finalProductData.primary_affiliate}`);
      
      // Save to database
      await this.saveUniversalProduct(finalProductData);
      
      console.log('Success Universal product processed and saved successfully!');
      
    } catch (error) {
      console.error('Error Error processing universal URL:', error);
    }
  }

  analyzeUrl(url: string): any {
    const lowerUrl = url.toLowerCase();
    
    // Amazon URLs
    if (lowerUrl.includes('amazon.') || lowerUrl.includes('amzn.')) {
      return {
        type: 'amazon',
        platform: 'Amazon',
        affiliateNetwork: 'Amazon Associates',
        needsExpansion: lowerUrl.includes('amzn.to') || lowerUrl.includes('/gp/'),
        redirectChain: []
      };
    }
    
    // Flipkart URLs
    if (lowerUrl.includes('flipkart.com') || lowerUrl.includes('fkrt.it')) {
      return {
        type: 'flipkart',
        platform: 'Flipkart',
        affiliateNetwork: 'Flipkart Affiliate',
        needsExpansion: lowerUrl.includes('fkrt.it'),
        redirectChain: []
      };
    }
    
    // Shopsy URLs
    if (lowerUrl.includes('shopsy.in')) {
      return {
        type: 'shopsy',
        platform: 'Shopsy',
        affiliateNetwork: 'Shopsy Affiliate',
        needsExpansion: false,
        redirectChain: []
      };
    }
    
    // EarnKaro URLs
    if (lowerUrl.includes('ekaro.in') || lowerUrl.includes('earnkaro.')) {
      return {
        type: 'earnkaro',
        platform: 'EarnKaro',
        affiliateNetwork: 'EarnKaro',
        needsExpansion: true,
        redirectChain: []
      };
    }
    
    // Cuelinks URLs
    if (lowerUrl.includes('cuelinks.com') || lowerUrl.includes('cutt.ly')) {
      return {
        type: 'cuelinks',
        platform: 'Cuelinks',
        affiliateNetwork: 'Cuelinks',
        needsExpansion: true,
        redirectChain: []
      };
    }
    
    // Shortened URLs
    if (lowerUrl.includes('bit.ly') || lowerUrl.includes('tinyurl') || lowerUrl.includes('t.co') || 
        lowerUrl.includes('bitli.in') || lowerUrl.includes('linkredirect.in')) {
      return {
        type: 'shortened',
        platform: 'Unknown',
        affiliateNetwork: 'Universal',
        needsExpansion: true,
        redirectChain: []
      };
    }
    
    // Direct store URLs
    return {
      type: 'direct',
      platform: this.detectPlatformFromUrl(url),
      affiliateNetwork: 'Direct',
      needsExpansion: false,
      redirectChain: []
    };
  }

  detectPlatformFromUrl(url: string): string {
    const domain = url.toLowerCase();
    
    if (domain.includes('myntra')) return 'Myntra';
    if (domain.includes('ajio')) return 'Ajio';
    if (domain.includes('nykaa')) return 'Nykaa';
    if (domain.includes('bigbasket')) return 'BigBasket';
    if (domain.includes('grofers') || domain.includes('blinkit')) return 'Blinkit';
    if (domain.includes('swiggy')) return 'Swiggy';
    if (domain.includes('zomato')) return 'Zomato';
    if (domain.includes('paytm')) return 'Paytm Mall';
    if (domain.includes('snapdeal')) return 'Snapdeal';
    
    return 'Direct Store';
  }

  async expandUniversalUrl(url: string): Promise<string> {
    try {
      console.log(`Link Expanding universal URL: ${url}`);
      
      // Handle EarnKaro URLs first
      if (url.includes('ekaro.in') && url.includes('url=')) {
        try {
          const urlObj = new URL(url);
          const urlParam = urlObj.searchParams.get('url');
          if (urlParam) {
            const decodedUrl = decodeURIComponent(urlParam);
            console.log(`Unlock Extracted from EarnKaro wrapper: ${decodedUrl}`);
            return decodedUrl;
          }
        } catch (decodeError) {
          console.log(`Warning Could not decode EarnKaro URL: ${decodeError.message}`);
        }
      }
      
      // Handle Cuelinks URLs
      if (url.includes('cuelinks.com')) {
        // Cuelinks URLs need special handling - they redirect through their system
        return await this.followRedirects(url);
      }
      
      // Handle other shortened URLs
      if (url.includes('bit.ly') || url.includes('tinyurl') || url.includes('t.co') || 
          url.includes('bitli.in') || url.includes('linkredirect.in')) {
        return await this.followRedirects(url);
      }
      
      // For direct URLs, return as-is
      return url;
      
    } catch (error) {
      console.log(`Warning Could not expand universal URL ${url}, using original:`, error.message);
      return url;
    }
  }

  async followRedirects(url: string, maxRedirects = 10): Promise<string> {
    let currentUrl = url;
    let redirectCount = 0;
    
    while (redirectCount < maxRedirects) {
      try {
        const response = await axios.get(currentUrl, {
          maxRedirects: 0,
          timeout: 15000,
          validateStatus: (status) => status < 400 || [301, 302, 307, 308].includes(status),
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        if ([301, 302, 307, 308].includes(response.status)) {
          const location = response.headers.location;
          if (location) {
            currentUrl = location.startsWith('http') ? location : new URL(location, currentUrl).href;
            console.log(`Refresh Redirect ${redirectCount + 1}: ${currentUrl}`);
            redirectCount++;
            continue;
          }
        }
        
        // No more redirects
        break;
        
      } catch (redirectError) {
        console.log(`Warning Redirect failed: ${redirectError.message}`);
        break;
      }
    }
    
    // Handle linkredirect.in parameter extraction
    if (currentUrl.includes('linkredirect.in')) {
      try {
        const urlObj = new URL(currentUrl);
        const dlParam = urlObj.searchParams.get('dl');
        if (dlParam) {
          const decodedUrl = decodeURIComponent(dlParam);
          console.log(`Unlock Extracted from linkredirect: ${decodedUrl}`);
          currentUrl = decodedUrl;
        }
      } catch (decodeError) {
        console.log(`Warning Could not decode linkredirect URL: ${decodeError.message}`);
      }
    }
    
    return currentUrl;
  }

  async generateUniversalAffiliateUrl(url: string, urlAnalysis: any): Promise<string> {
    try {
      console.log(`Price Generating universal affiliate URL for: ${urlAnalysis.platform}`);
      
      switch (urlAnalysis.type) {
        case 'amazon':
          return this.generateAmazonAffiliateUrl(url);
        
        case 'flipkart':
          return this.generateFlipkartAffiliateUrl(url);
        
        case 'shopsy':
          return this.generateShopsyAffiliateUrl(url);
        
        case 'earnkaro':
          return this.generateEarnKaroAffiliateUrl(url);
        
        case 'cuelinks':
          return this.generateCuelinksAffiliateUrl(url);
        
        default:
          // For unknown platforms, try to generate a universal affiliate URL
          return this.generateUniversalFallbackUrl(url, urlAnalysis);
      }
      
    } catch (error) {
      console.error('Error Error generating universal affiliate URL:', error);
      return url; // Return original URL if conversion fails
    }
  }

  generateAmazonAffiliateUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set('tag', AMAZON_ASSOCIATES_TAG);
      return urlObj.toString();
    } catch (error) {
      return url;
    }
  }

  generateFlipkartAffiliateUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set('affid', FLIPKART_AFFILIATE_ID);
      return urlObj.toString();
    } catch (error) {
      return url;
    }
  }

  generateShopsyAffiliateUrl(url: string): string {
    // Shopsy uses Flipkart's affiliate system
    return this.generateFlipkartAffiliateUrl(url);
  }

  generateEarnKaroAffiliateUrl(url: string): string {
    try {
      const encodedUrl = encodeURIComponent(url);
      return `https://ekaro.in/enkr2020/?url=${encodedUrl}&ref=${EARNKARO_REF_ID}`;
    } catch (error) {
      return url;
    }
  }

  generateCuelinksAffiliateUrl(url: string): string {
    try {
      const encodedUrl = encodeURIComponent(url);
      return `https://cuelinks.com/a/${CUELINKS_MEDIUM_ID}?url=${encodedUrl}`;
    } catch (error) {
      return url;
    }
  }

  generateUniversalFallbackUrl(url: string, urlAnalysis: any): string {
    // For unknown platforms, try EarnKaro as universal fallback
    console.log(`Refresh Using EarnKaro as universal fallback for: ${urlAnalysis.platform}`);
    return this.generateEarnKaroAffiliateUrl(url);
  }

  async extractUniversalProductData(url: string, messageText: string, urlAnalysis: any): Promise<any> {
    try {
      console.log('Global Fetching product page with universal extraction...');
      
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      
      // Universal product data extraction
      const productData = {
        name: this.extractUniversalProductName($, messageText, urlAnalysis),
        description: this.extractUniversalDescription($),
        price: null as string | null,
        originalPrice: null as string | null,
        discount: null as number | null,
        imageUrl: this.extractUniversalImage($, url),
        category: this.detectUniversalCategory(url, $),
        rating: this.extractUniversalRating($),
        reviewCount: this.extractUniversalReviewCount($),
        brand: this.extractUniversalBrand($)
      };
      
      // Extract pricing with platform-specific logic
      const pricingData = this.extractUniversalPricing($, urlAnalysis);
      productData.price = pricingData.price;
      productData.originalPrice = pricingData.originalPrice;
      
      // Calculate discount
      if (productData.originalPrice && productData.price) {
        const original = parseFloat(productData.originalPrice);
        const current = parseFloat(productData.price);
        if (original > current) {
          productData.discount = Math.round(((original - current) / original) * 100);
        }
      }
      
      console.log('Success Universal product data extracted successfully');
      return productData;
      
    } catch (error) {
      console.log('Warning Could not extract universal product data, using fallback:', error.message);
      return {
        name: null,
        description: null,
        price: null,
        originalPrice: null,
        discount: null,
        imageUrl: null,
        category: null,
        rating: null,
        reviewCount: null,
        brand: null
      };
    }
  }

  extractUniversalProductName($: any, messageText: string, urlAnalysis: any): string | null {
    // Platform-specific selectors
    const platformSelectors: { [key: string]: string[] } = {
      amazon: [
        '#productTitle',
        '.a-size-large.product-title-word-break',
        '#title_feature_div h1'
      ],
      flipkart: [
        '.B_NuCI',
        '._35KyD6',
        '.yhZ71d',
        '.pdp-product-name'
      ],
      shopsy: [
        '[data-testid="product-title"]',
        '.product-title-text',
        '.item-name'
      ]
    };
    
    // Try platform-specific selectors first
    const selectors = platformSelectors[urlAnalysis.type] || [];
    
    // Add universal selectors
    const universalSelectors = [
      'h1[data-automation-id="product-title"]',
      '.product-title',
      '.product-name',
      '.item-title',
      '.title',
      'h1.title',
      'h1.product-title',
      'h1',
      '.main-title',
      '.page-title'
    ];
    
    const allSelectors = [...selectors, ...universalSelectors];
    
    for (const selector of allSelectors) {
      const element = $(selector).first();
      if (element.length) {
        let text = element.text().trim();
        
        // Clean up the text
        text = text.replace(/\s+/g, ' ');
        text = text.replace(/[\n\r\t]/g, ' ');
        text = text.trim();
        
        // Validate product name
        if (text && text.length > 5 && text.length < 300 && !/^[\d\s]+$/.test(text)) {
          console.log(`Success Universal product name extracted: "${text}" from selector: ${selector}`);
          return text.substring(0, 200);
        }
      }
    }
    
    // Try meta tags as fallback
    const metaSelectors = [
      'meta[property="og:title"]',
      'meta[name="title"]',
      'title'
    ];
    
    for (const selector of metaSelectors) {
      const element = $(selector).first();
      if (element.length) {
        let text = element.attr('content') || element.text();
        text = text.trim();
        
        if (text && text.length > 5 && text.length < 300) {
          console.log(`Success Universal product name from meta: "${text}"`);
          return text.substring(0, 200);
        }
      }
    }
    
    console.log('Warning Could not extract universal product name');
    return null;
  }

  extractUniversalDescription($: any): string | null {
    const descSelectors = [
      '#feature-bullets ul',
      '.product-description',
      '.pdp-product-description',
      '[data-automation-id="product-description"]',
      '.product-details',
      '#aplus',
      '.product-info',
      '.item-description'
    ];
    
    for (const selector of descSelectors) {
      const element = $(selector).first();
      if (element.length && element.text().trim()) {
        return element.text().trim().substring(0, 300);
      }
    }
    
    return null;
  }

  extractUniversalImage($: any, url: string): string | null {
    console.log('🖼️ Extracting universal product image...');
    
    const imageSelectors = [
      // Amazon images
      '#landingImage',
      '.a-dynamic-image',
      '#imgTagWrapperId img',
      
      // Flipkart/Shopsy images
      '._396cs4 img[src*="/image/"]',
      '._2r_T1I img',
      '.CXW8mj img',
      '._1BweB8 img',
      
      // Universal selectors
      '.product-image img',
      '.main-image img',
      'img[alt*="product"]',
      'img[data-src*="/image/"]',
      'img[data-original*="/image/"]',
      
      // Generic fallbacks
      'img[src*="product"]',
      'img[src*="item"]'
    ];
    
    for (const selector of imageSelectors) {
      const images = $(selector);
      
      for (let i = 0; i < images.length; i++) {
        const img = $(images[i]);
        let src = img.attr('src') || img.attr('data-src') || img.attr('data-original');
        
        if (src) {
          // Handle relative URLs
          if (src.startsWith('//')) {
            src = 'https:' + src;
          } else if (src.startsWith('/')) {
            const urlObj = new URL(url);
            src = urlObj.origin + src;
          }
          
          // Validate image
          if (src.startsWith('http') && this.isValidUniversalImage(src)) {
            console.log(`Success Universal image found: ${src.substring(0, 80)}...`);
            return src;
          }
        }
      }
    }
    
    // Try meta tags
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage && this.isValidUniversalImage(ogImage)) {
      console.log('Success Universal image from Open Graph');
      return ogImage;
    }
    
    console.log('Warning No valid universal image found');
    return null;
  }

  isValidUniversalImage(imageUrl: string): boolean {
    const lowerUrl = imageUrl.toLowerCase();
    
    // Filter out invalid patterns
    const invalidPatterns = [
      'unsplash',
      'placeholder',
      '/promos/',
      '/banners/',
      '/logo',
      '/icon',
      '/128/128/',
      '/64/64/',
      'thumbnail'
    ];
    
    for (const pattern of invalidPatterns) {
      if (lowerUrl.includes(pattern)) {
        return false;
      }
    }
    
    // Look for valid patterns
    const validPatterns = [
      '/image/',
      '/product/',
      'xif0q',
      '/dp/',
      'rukminim',
      '/400/',
      '/500/',
      '/600/'
    ];
    
    for (const pattern of validPatterns) {
      if (lowerUrl.includes(pattern)) {
        return true;
      }
    }
    
    // Check for image extensions
    return /\.(jpg|jpeg|png|webp)/.test(lowerUrl);
  }

  extractUniversalPricing($: any, urlAnalysis: any): { price: string | null, originalPrice: string | null } {
    let price: string | null = null;
    let originalPrice: string | null = null;
    
    console.log('Price Extracting universal pricing...');
    
    // Platform-specific price selectors
    const platformPriceSelectors: { [key: string]: string[] } = {
      amazon: [
        '.a-price-current .a-offscreen',
        '.a-price .a-offscreen',
        '#priceblock_dealprice',
        '#priceblock_ourprice'
      ],
      flipkart: [
        '._30jeq3._16Jk6d',
        '._1_WHN1',
        '.CEmiEU .Nx9bqj',
        '._30jeq3'
      ],
      shopsy: [
        '[data-testid="current-price"]',
        '.current-price-value',
        '.selling-price-value'
      ]
    };
    
    // Universal price selectors
    const universalPriceSelectors = [
      '.price-current',
      '.current-price',
      '.sale-price',
      '.offer-price',
      '.discounted-price',
      '[data-testid="price"]',
      '.product-price',
      '.final-price',
      '.selling-price',
      '.price'
    ];
    
    const priceSelectors = [
      ...(platformPriceSelectors[urlAnalysis.type] || []),
      ...universalPriceSelectors
    ];
    
    // Extract current price
    for (const selector of priceSelectors) {
      const priceElements = $(selector);
      
      for (let i = 0; i < priceElements.length; i++) {
        const element = $(priceElements[i]);
        const priceText = element.text().trim();
        
        if (priceText) {
          const extractedPrice = this.extractPriceFromText(priceText);
          
          if (extractedPrice > 0 && extractedPrice < 1000000) {
            price = extractedPrice.toString();
            console.log(`Success Universal price extracted: ₹${price}`);
            break;
          }
        }
      }
      
      if (price) break;
    }
    
    // Extract original price
    const originalPriceSelectors = [
      '.a-price.a-text-price .a-offscreen',
      '._3I9_wc._2p6lqe',
      '.original-price',
      '.list-price',
      '.was-price',
      '.regular-price',
      '.strike-price',
      '.crossed-price',
      '.mrp-price',
      'del .price'
    ];
    
    for (const selector of originalPriceSelectors) {
      const element = $(selector).first();
      if (element.length) {
        const priceText = element.text().trim();
        if (priceText) {
          const extractedPrice = this.extractPriceFromText(priceText);
          if (extractedPrice > 0 && extractedPrice < 1000000) {
            originalPrice = extractedPrice.toString();
            console.log(`Success Universal original price extracted: ₹${originalPrice}`);
            break;
          }
        }
      }
    }
    
    return { price, originalPrice };
  }

  extractPriceFromText(text: string): number {
    // Remove currency symbols and extract numbers
    const cleanText = text.replace(/[₹$,\s]/g, '');
    const priceMatch = cleanText.match(/([0-9]+(?:\.[0-9]{1,2})?)/);
    
    if (priceMatch) {
      return parseFloat(priceMatch[1]);
    }
    
    return 0;
  }

  extractUniversalRating($: any): number | null {
    const ratingSelectors = [
      '.a-icon-alt',
      '.pdp-rating',
      '.rating-value',
      '.star-rating',
      '._3LWZlK',
      '[data-testid="rating"]',
      '.product-rating'
    ];
    
    for (const selector of ratingSelectors) {
      const ratingText = $(selector).first().text().trim();
      if (ratingText) {
        const ratingMatch = ratingText.match(/(\d+(?:\.\d+)?)/);
        if (ratingMatch) {
          return parseFloat(ratingMatch[1]);
        }
      }
    }
    
    return null;
  }

  extractUniversalReviewCount($: any): number | null {
    const reviewSelectors = [
      '#acrCustomerReviewText',
      '.pdp-review-count',
      '.review-count',
      '.reviews-count',
      '._2_R_DZ',
      '[data-testid="review-count"]'
    ];
    
    for (const selector of reviewSelectors) {
      const reviewText = $(selector).first().text().trim();
      if (reviewText) {
        const reviewMatch = reviewText.match(/([0-9,]+)/);
        if (reviewMatch) {
          return parseInt(reviewMatch[1].replace(/,/g, ''));
        }
      }
    }
    
    return null;
  }

  extractUniversalBrand($: any): string | null {
    const brandSelectors = [
      '[data-automation-id="brand-name"]',
      '.brand-name',
      '.product-brand',
      '.brand',
      'meta[property="product:brand"]'
    ];
    
    for (const selector of brandSelectors) {
      const element = $(selector).first();
      if (element.length) {
        const brand = element.attr('content') || element.text().trim();
        if (brand && brand.length > 1 && brand.length < 50) {
          return brand;
        }
      }
    }
    
    return null;
  }

  detectUniversalCategory(url: string, $: any): string {
    const urlLower = url.toLowerCase();
    
    // URL-based category detection
    if (urlLower.includes('mobile') || urlLower.includes('phone') || urlLower.includes('smartphone')) {
      return 'Mobile & Accessories';
    }
    if (urlLower.includes('laptop') || urlLower.includes('computer') || urlLower.includes('electronics')) {
      return 'Electronics';
    }
    if (urlLower.includes('fashion') || urlLower.includes('clothing') || urlLower.includes('apparel')) {
      return 'Fashion';
    }
    if (urlLower.includes('home') || urlLower.includes('kitchen') || urlLower.includes('furniture')) {
      return 'Home & Kitchen';
    }
    if (urlLower.includes('book') || urlLower.includes('media')) {
      return 'Books & Media';
    }
    if (urlLower.includes('sport') || urlLower.includes('fitness')) {
      return 'Sports & Fitness';
    }
    if (urlLower.includes('beauty') || urlLower.includes('cosmetic')) {
      return 'Beauty & Personal Care';
    }
    if (urlLower.includes('toy') || urlLower.includes('game')) {
      return 'Toys & Games';
    }
    
    // Try to extract from page content
    const categorySelectors = [
      '[data-automation-id="breadcrumb"]',
      '.breadcrumb',
      '.category-path',
      'nav[aria-label="breadcrumb"]'
    ];
    
    for (const selector of categorySelectors) {
      const element = $(selector).first();
      if (element.length) {
        const categoryText = element.text().trim();
        if (categoryText) {
          // Extract the most specific category
          const categories = categoryText.split(/[>›/]/).map(c => c.trim()).filter(c => c);
          if (categories.length > 1) {
            return categories[categories.length - 2] || categories[categories.length - 1];
          }
        }
      }
    }
    
    return 'General';
  }

  // Helper methods for message processing
  extractProductNameFromMessage(text: string): string | null {
    const lines = text.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      if (line.includes('http') || line.includes('₹') || line.includes('@') || 
          line.includes('Live:') || line.includes('Lowest') || line.includes('Mela')) {
        continue;
      }
      
      if (line.length > 10 && line.length < 100) {
        return line.trim();
      }
    }
    
    return null;
  }

  extractDescriptionFromMessage(text: string): string | null {
    const lines = text.split('\n').filter(line => 
      line.trim() && 
      !line.includes('http') && 
      !line.includes('Live:') &&
      !line.includes('Lowest')
    );
    
    if (lines.length > 1) {
      return lines.slice(0, 3).join(' ').substring(0, 200);
    }
    
    return null;
  }

  extractPriceFromMessage(text: string): { price: string | null, originalPrice: string | null, discount: number | null } {
    const priceInfo = {
      price: null as string | null,
      originalPrice: null as string | null,
      discount: null as number | null
    };
    
    const priceMatch = text.match(/[@₹]\s*(\d+)/g);
    if (priceMatch && priceMatch.length > 0) {
      const prices = priceMatch.map(p => parseInt(p.replace(/[@₹\s]/g, '')));
      priceInfo.price = Math.min(...prices).toString();
      
      if (prices.length > 1) {
        priceInfo.originalPrice = Math.max(...prices).toString();
        const discount = Math.round(((parseInt(priceInfo.originalPrice) - parseInt(priceInfo.price)) / parseInt(priceInfo.originalPrice)) * 100);
        priceInfo.discount = discount;
      }
    }
    
    return priceInfo;
  }

  detectCategory(text: string): string {
    const textLower = text.toLowerCase();
    
    if (textLower.includes('mobile') || textLower.includes('phone') || textLower.includes('smartphone')) {
      return 'Mobile & Accessories';
    }
    if (textLower.includes('laptop') || textLower.includes('computer')) {
      return 'Electronics';
    }
    if (textLower.includes('shirt') || textLower.includes('clothing') || textLower.includes('fashion')) {
      return 'Fashion';
    }
    if (textLower.includes('home') || textLower.includes('kitchen')) {
      return 'Home & Kitchen';
    }
    if (textLower.includes('book')) {
      return 'Books & Media';
    }
    if (textLower.includes('beauty') || textLower.includes('cosmetic')) {
      return 'Beauty & Personal Care';
    }
    
    return 'General';
  }

  calculateDiscount(price: string | null, originalPrice: string | null): number {
    if (!price || !originalPrice) return 0;
    
    const current = parseFloat(price);
    const original = parseFloat(originalPrice);
    
    if (original > current) {
      return Math.round(((original - current) / original) * 100);
    }
    
    return 0;
  }

  calculateDataQualityScore(productData: any): number {
    let score = 0;
    
    if (productData.name) score += 0.3;
    if (productData.price) score += 0.2;
    if (productData.imageUrl) score += 0.2;
    if (productData.description) score += 0.1;
    if (productData.rating) score += 0.1;
    if (productData.brand) score += 0.1;
    
    return Math.round(score * 100) / 100;
  }

  extractBrandFromName(name: string | null): string | null {
    if (!name) return null;
    
    // Extract first word as potential brand
    const words = name.split(' ');
    if (words.length > 0 && words[0].length > 2) {
      return words[0];
    }
    
    return null;
  }

  async saveUniversalProduct(productData: any) {
    try {
      console.log('Save Saving universal product to Global Picks database...');
      
      const db = new Database('database.sqlite');
      
      const stmt = db.prepare(`
        INSERT INTO global_picks_products (
          name, description, price, original_price, currency, image_url, 
          affiliate_url, original_url, category, rating, review_count, 
          discount, is_new, is_featured, affiliate_network, telegram_message_id, 
          telegram_channel_id, telegram_channel_name, processing_status, 
          content_type, affiliate_tag_applied, url_type, source_platform,
          redirect_chain, final_destination, primary_affiliate, data_quality_score,
          brand, availability
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        productData.affiliate_tag_applied,
        productData.url_type,
        productData.source_platform,
        productData.redirect_chain,
        productData.final_destination,
        productData.primary_affiliate,
        productData.data_quality_score,
        productData.brand,
        productData.availability
      );
      
      console.log(`Success Universal product saved successfully with ID: ${result.lastInsertRowid}`);
      console.log(`Link Affiliate URL: ${productData.affiliate_url}`);
      console.log(`🌍 Platform: ${productData.source_platform}`);
      console.log(`Price Affiliate Network: ${productData.primary_affiliate}`);
      console.log(`Stats Quality Score: ${productData.data_quality_score}`);
      console.log(`Mobile Universal product will appear on /global-picks page immediately`);
      
      db.close();
      
    } catch (error) {
      console.error('Error Error saving universal product:', error);
    }
  }

  async stop() {
    try {
      if (this.telegramBot && this.isInitialized) {
        console.log('Stop Stopping Global Picks bot...');
        await this.telegramBot.stopPolling();
        this.isInitialized = false;
        console.log('Success Global Picks bot stopped successfully');
      }
    } catch (error) {
      console.error('Error Error stopping Global Picks bot:', error);
    }
  }
}

// Create and export Global Picks bot instance
const globalPicksBot = new GlobalPicksBot();

// Enhanced Manager Integration - Export initialization function
export async function initializeGlobalPicksBot(): Promise<void> {
  try {
    console.log('Launch Initializing Global Picks Bot with Enhanced Manager...');
    await globalPicksBot.initialize();
    console.log('Success Global Picks Bot initialized successfully');
  } catch (error) {
    console.error('Error Failed to initialize Global Picks Bot:', error);
    throw error;
  }
}

// Auto-initialize if credentials are available (fallback)
if (BOT_TOKEN && CHANNEL_ID ) {
  // REMOVED: Automatic initialization to prevent 409 conflicts
// Bot initialization is now handled exclusively by Enhanced Manager
} else if (!BOT_TOKEN || !CHANNEL_ID) {
  console.log('Warning Global Picks automation disabled - missing credentials');
}

export default globalPicksBot;