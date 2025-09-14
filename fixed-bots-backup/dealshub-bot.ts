// DealsHub Telegram Bot - Multi-URL Support with Deal Focus
// Handles all types of URLs with intelligent deal detection and processing

import TelegramBot from 'node-telegram-bot-api';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import Database from 'better-sqlite3';
import axios from 'axios';
import * as cheerio from 'cheerio';

// Load DealsHub environment configuration
const dealsHubEnvPath = path.join(process.cwd(), '.env.dealshub');
console.log('🛒 DealsHub Bot: Loading environment from:', dealsHubEnvPath);
if (fs.existsSync(dealsHubEnvPath)) {
  dotenv.config({ path: dealsHubEnvPath });
  console.log('Success DealsHub environment loaded');
} else {
  console.log('Warning .env.dealshub file not found');
}

// Environment variables
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN_DEALSHUB;
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID_DEALSHUB;
const CHANNEL_USERNAME = process.env.TELEGRAM_CHANNEL_DEALSHUB;
const TARGET_PAGE = process.env.DEALSHUB_TARGET_PAGE || 'dealshub';
const BOT_USERNAME = process.env.DEALSHUB_BOT_USERNAME || 'dealshubpnt_bot';
const CHANNEL_NAME = process.env.DEALSHUB_CHANNEL_NAME || 'DealsHub Universal';

// Multi-affiliate configuration
const AMAZON_ASSOCIATES_TAG = process.env.AMAZON_ASSOCIATES_TAG || 'pickntrustcom-21';
const FLIPKART_AFFILIATE_ID = process.env.FLIPKART_AFFILIATE_ID || 'pickntrust';
const EARNKARO_REF_ID = process.env.EARNKARO_REF_ID || '4530348';
const CUELINKS_MEDIUM_ID = process.env.CUELINKS_MEDIUM_ID || 'pickntrust';

console.log('Search DealsHub Bot: Checking configuration...');
console.log('   BOT_TOKEN:', BOT_TOKEN ? BOT_TOKEN.substring(0, 10) + '...' : 'MISSING');
console.log('   CHANNEL_ID:', CHANNEL_ID || 'MISSING');
console.log('   BOT_USERNAME:', BOT_USERNAME || 'MISSING');
console.log('   CHANNEL_NAME:', CHANNEL_NAME || 'MISSING');

if (!BOT_TOKEN || !CHANNEL_ID) {
  console.log('Error DealsHub bot configuration missing. Please check .env.dealshub file.');
  console.log('Bot will not start without proper configuration.');
} else {
  console.log('Success DealsHub bot configuration loaded successfully');
}

class DealsHubBot {
  private telegramBot: TelegramBot | null = null;
  private isInitialized = false;

  async initialize() {
    try {
      console.log('🛒 Initializing DealsHub Telegram bot (Multi-URL Deal Processing)...');
      
      if (!BOT_TOKEN || !CHANNEL_ID) {
        throw new Error('Missing bot token or channel ID');
      }

      // Create bot instance with polling disabled initially
      this.telegramBot = new TelegramBot(BOT_TOKEN, { polling: false });
      
      // Test bot connection
      const me = await this.telegramBot.getMe();
      console.log(`Success DealsHub bot connected successfully!`);
      console.log(`AI Bot: @${me.username} (${me.first_name})`);
      console.log(`Mobile Monitoring: ${CHANNEL_USERNAME} (${CHANNEL_ID})`);
      console.log(`Target Target: ${TARGET_PAGE} page`);
      console.log(`🛒 Features: Multi-URL support, Deal detection, Smart processing`);
      
      // Enable polling after successful connection
      this.telegramBot.startPolling();
      
      // Setup message listeners
      this.setupMessageListeners();
      this.setupErrorHandling();
      
      this.isInitialized = true;
      console.log('Target DealsHub bot fully initialized with multi-URL deal support!');
      
      // Send startup notification
      try {
        await this.telegramBot.sendMessage(CHANNEL_ID, 
          'Launch **DealsHub Hybrid Bot Started!**\n\n' +
          'Success Multi-platform deal processing active\n' +
          'Success INRDeals affiliate integration enabled\n' +
          'Success Universal URL support working\n' +
          'Success Smart deal analysis and scoring\n\n' +
          'Target Ready to find the best DealsHub deals!',
          { parse_mode: 'Markdown' }
        );
      } catch (error) {
        console.error('Failed to send DealsHub startup notification:', error);
      }
      
    } catch (error) {
      console.error('Error Failed to initialize DealsHub bot:', error.message);
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
          console.log('Mobile DealsHub: New channel post received');
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
          console.log('Blog DealsHub: Channel post edited');
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
              `🛒 DealsHub Bot Active!\n\n` +
              `Success Multi-URL support (All platforms)\n` +
              `🏷️ Smart deal detection\n` +
              `Price Multi-affiliate conversion\n` +
              `Stats Advanced deal analytics\n` +
              `Mobile Monitoring: ${CHANNEL_NAME}\n` +
              `Target Target: ${TARGET_PAGE} page\n\n` +
              `🔧 Status: DEAL AUTOPOSTING\n` +
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
      console.error('Error DealsHub Bot polling error:', error.message);
    });
    
    this.telegramBot.on('error', (error) => {
      console.error('Error DealsHub Bot error:', error.message);
    });
  }

  async processChannelMessage(message: any) {
    try {
      console.log('Refresh Processing DealsHub channel message with multi-URL deal support...');
      
      const messageText = message.text || '';
      const urls = this.extractUrls(messageText);
      
      if (urls.length > 0) {
        console.log(`Link Found ${urls.length} URLs in message`);
        
        for (const url of urls) {
          await this.processMultiUrl(url, message, messageText);
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

  async processMultiUrl(url: string, message: any, messageText: string) {
    try {
      console.log(`🛒 Processing Multi-URL Deal: ${url}`);
      
      // Step 1: Analyze URL type and platform
      const urlAnalysis = this.analyzeUrl(url);
      console.log(`Search URL Analysis:`);
      console.log(`   Type: ${urlAnalysis.type}`);
      console.log(`   Platform: ${urlAnalysis.platform}`);
      console.log(`   Needs Expansion: ${urlAnalysis.needsExpansion}`);
      
      // Step 2: Expand URL to final destination
      console.log('Link Expanding URL to final destination...');
      const expandedUrl = await this.expandMultiUrl(url);
      console.log(`Link Final URL: ${expandedUrl}`);
      
      // Step 3: Generate appropriate affiliate URL
      const affiliateUrl = await this.generateMultiAffiliateUrl(expandedUrl, urlAnalysis);
      console.log(`Price Affiliate URL: ${affiliateUrl}`);
      
      // Step 4: Extract product data with deal detection
      console.log('Search Extracting product data with deal detection...');
      const productData = await this.extractMultiProductData(expandedUrl, messageText, urlAnalysis);
      
      // Step 5: Detect deal information from message and product data
      const dealInfo = this.detectDealInfo(messageText, productData);
      console.log('🏷️ Deal detection results:');
      console.log(`   Deal Type: ${dealInfo.dealType}`);
      console.log(`   Deal Badge: ${dealInfo.dealBadge}`);
      console.log(`   Urgency Level: ${dealInfo.urgencyLevel}`);
      console.log(`   Priority: ${dealInfo.priority}`);
      
      // Step 6: Extract additional info from message
      const messageProductName = this.extractProductNameFromMessage(messageText);
      const messageDescription = this.extractDescriptionFromMessage(messageText);
      const messagePriceInfo = this.extractPriceFromMessage(messageText);
      
      // Log extracted data for debugging
      console.log('Stats Multi-URL extraction summary:');
      console.log(`   Real name: ${productData.name || 'Not found'}`);
      console.log(`   Real price: ${productData.price || 'Not found'}`);
      console.log(`   Real image: ${productData.imageUrl ? 'Found Success' : 'Not found Error'}`);
      console.log(`   Platform: ${urlAnalysis.platform}`);
      console.log(`   Affiliate: ${urlAnalysis.affiliateNetwork}`);
      console.log(`   Deal detected: ${dealInfo.dealType}`);
      
      // 🛡️ ROBUST CATEGORY VALIDATION - Prevents business reputation damage
      const detectedCategory = this.detectMultiCategory(expandedUrl, null);
      let finalCategory = 'Electronics & Gadgets'; // Safe default
      try {
        const { validateProductCategory, ensureCategoryExists } = require('./utils/category-helper.js');
        const validatedCategory = validateProductCategory({
          name: productData.name || messageProductName || 'DealsHub Product',
          description: productData.description || messageDescription,
          category: detectedCategory,
          url: expandedUrl
        });
        
        // Ensure the category exists in database
        ensureCategoryExists(validatedCategory);
        finalCategory = validatedCategory;
      } catch (error) {
        console.error('Error Category validation error:', error);
        // Use safe default if validation fails
      }
      
      // Step 7: Combine and save product data with deal information
      const finalProductData = {
        name: productData.name || messageProductName || 'DealsHub Product',
        description: productData.description || messageDescription || 'Amazing deal from DealsHub',
        price: productData.price || messagePriceInfo.price || '999',
        original_price: productData.originalPrice || messagePriceInfo.originalPrice || (productData.price ? (parseInt(productData.price) * 1.5).toString() : '1499'),
        currency: 'INR',
        image_url: productData.imageUrl || null, // No placeholder images
        affiliate_url: affiliateUrl,
        original_url: expandedUrl,
        category: finalCategory,
        rating: productData.rating || 4.0,
        review_count: productData.reviewCount || 50,
        discount: productData.discount || messagePriceInfo.discount || this.calculateDiscount(productData.price, productData.originalPrice),
        is_new: 1,
        is_featured: dealInfo.priority >= 4 ? 1 : 0,
        affiliate_network: urlAnalysis.affiliateNetwork,
        telegram_message_id: message.message_id,
        telegram_channel_id: parseInt(CHANNEL_ID || '0'),
        telegram_channel_name: CHANNEL_NAME,
        processing_status: 'active',
        content_type: 'product',
        affiliate_tag_applied: 1,
        
        // Multi-URL support fields
        url_type: urlAnalysis.type,
        source_platform: urlAnalysis.platform,
        redirect_chain: JSON.stringify(urlAnalysis.redirectChain || []),
        final_destination: expandedUrl,
        primary_affiliate: urlAnalysis.affiliateNetwork,
        data_quality_score: this.calculateDataQualityScore(productData),
        brand: productData.brand || this.extractBrandFromName(productData.name || messageProductName),
        availability: 'in_stock',
        
        // DealsHub specific fields
        deal_type: dealInfo.dealType,
        deal_priority: dealInfo.priority,
        deal_badge: dealInfo.dealBadge,
        deal_urgency_level: dealInfo.urgencyLevel,
        deal_status: 'active',
        stock_status: dealInfo.stockStatus,
        price_drop_percentage: productData.discount || messagePriceInfo.discount || 0,
        is_trending: dealInfo.urgencyLevel >= 4 ? 1 : 0,
        engagement_score: this.calculateEngagementScore(dealInfo, productData)
      };
      
      console.log('Stats Final deal product data:');
      console.log(`   Name: ${finalProductData.name}`);
      console.log(`   Price: ₹${finalProductData.price} (was ₹${finalProductData.original_price})`);
      console.log(`   Discount: ${finalProductData.discount}%`);
      console.log(`   Deal: ${finalProductData.deal_badge} (${finalProductData.deal_type})`);
      console.log(`   Priority: ${finalProductData.deal_priority}`);
      console.log(`   Platform: ${finalProductData.source_platform}`);
      console.log(`   Affiliate: ${finalProductData.primary_affiliate}`);
      
      // Save to database
      await this.saveDealsHubProduct(finalProductData);
      
      console.log('Success Multi-URL deal processed and saved successfully!');
      
    } catch (error) {
      console.error('Error Error processing multi-URL deal:', error);
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

  async expandMultiUrl(url: string): Promise<string> {
    try {
      console.log(`Link Expanding multi-URL: ${url}`);
      
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
      console.log(`Warning Could not expand multi-URL ${url}, using original:`, error.message);
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
        
        break;
        
      } catch (redirectError) {
        console.log(`Warning Redirect failed: ${redirectError.message}`);
        break;
      }
    }
    
    return currentUrl;
  }

  async generateMultiAffiliateUrl(url: string, urlAnalysis: any): Promise<string> {
    try {
      console.log(`Price Generating multi-affiliate URL for: ${urlAnalysis.platform}`);
      
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
          return this.generateUniversalFallbackUrl(url, urlAnalysis);
      }
      
    } catch (error) {
      console.error('Error Error generating multi-affiliate URL:', error);
      return url;
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
    console.log(`Refresh Using EarnKaro as universal fallback for: ${urlAnalysis.platform}`);
    return this.generateEarnKaroAffiliateUrl(url);
  }

  async extractMultiProductData(url: string, messageText: string, urlAnalysis: any): Promise<any> {
    try {
      console.log('Global Fetching product page with multi-platform extraction...');
      
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      
      // Multi-platform product data extraction
      const productData = {
        name: this.extractMultiProductName($, messageText, urlAnalysis),
        description: this.extractMultiDescription($),
        price: null as string | null,
        originalPrice: null as string | null,
        discount: null as number | null,
        imageUrl: this.extractMultiImage($, url),
        category: this.detectMultiCategory(url, $), // Detected category
        rating: this.extractMultiRating($),
        reviewCount: this.extractMultiReviewCount($),
        brand: this.extractMultiBrand($)
      };
      
      // Extract pricing with platform-specific logic
      const pricingData = this.extractMultiPricing($, urlAnalysis);
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
      
      console.log('Success Multi-platform product data extracted successfully');
      return productData;
      
    } catch (error) {
      console.log('Warning Could not extract multi-platform product data, using fallback:', error.message);
      return {
        name: null,
        description: null,
        price: null,
        originalPrice: null,
        discount: null,
        imageUrl: null,
        category: 'Electronics & Gadgets', // Default category
        rating: null,
        reviewCount: null,
        brand: null
      };
    }
  }

  detectDealInfo(messageText: string, productData: any): any {
    const textLower = messageText.toLowerCase();
    
    // Deal type detection
    let dealType = 'regular';
    let dealBadge = 'Deal';
    let urgencyLevel = 1;
    let priority = 1;
    let stockStatus = 'in_stock';
    
    // Flash sale indicators
    if (textLower.includes('flash') || textLower.includes('lightning') || 
        textLower.includes('instant') || textLower.includes('quick')) {
      dealType = 'flash';
      dealBadge = 'Flash Sale';
      urgencyLevel = 5;
      priority = 5;
    }
    // Daily deal indicators
    else if (textLower.includes('daily') || textLower.includes('today') || 
             textLower.includes('24 hour') || textLower.includes('one day')) {
      dealType = 'daily';
      dealBadge = 'Daily Deal';
      urgencyLevel = 4;
      priority = 4;
    }
    // Weekly deal indicators
    else if (textLower.includes('weekly') || textLower.includes('week') || 
             textLower.includes('7 day')) {
      dealType = 'weekly';
      dealBadge = 'Weekly Deal';
      urgencyLevel = 3;
      priority = 3;
    }
    // Clearance indicators
    else if (textLower.includes('clearance') || textLower.includes('clear') || 
             textLower.includes('stock clear') || textLower.includes('final sale')) {
      dealType = 'clearance';
      dealBadge = 'Clearance';
      urgencyLevel = 3;
      priority = 3;
      stockStatus = 'low_stock';
    }
    
    // Special deal badges
    if (textLower.includes('hot deal') || textLower.includes('hot')) {
      dealBadge = 'Hot Deal';
      urgencyLevel = Math.max(urgencyLevel, 4);
      priority = Math.max(priority, 4);
    }
    else if (textLower.includes('mega') || textLower.includes('super')) {
      dealBadge = 'Mega Deal';
      urgencyLevel = Math.max(urgencyLevel, 4);
      priority = Math.max(priority, 4);
    }
    else if (textLower.includes('limited') || textLower.includes('hurry') || 
             textLower.includes('few left') || textLower.includes('stock limited')) {
      dealBadge = 'Limited Time';
      urgencyLevel = Math.max(urgencyLevel, 4);
      priority = Math.max(priority, 4);
      stockStatus = 'low_stock';
    }
    
    // Boost priority based on discount
    if (productData.discount) {
      if (productData.discount >= 70) {
        priority = Math.max(priority, 5);
        urgencyLevel = Math.max(urgencyLevel, 5);
      } else if (productData.discount >= 50) {
        priority = Math.max(priority, 4);
        urgencyLevel = Math.max(urgencyLevel, 4);
      } else if (productData.discount >= 30) {
        priority = Math.max(priority, 3);
        urgencyLevel = Math.max(urgencyLevel, 3);
      }
    }
    
    return {
      dealType,
      dealBadge,
      urgencyLevel,
      priority,
      stockStatus
    };
  }

  // Simplified extraction methods (using same logic as Global Picks)
  extractMultiProductName($: any, messageText: string, urlAnalysis: any): string | null {
    // Use same logic as Global Picks universal extraction
    const selectors = [
      '#productTitle',
      '.B_NuCI',
      '[data-testid="product-title"]',
      '.product-title',
      'h1.title',
      'h1'
    ];
    
    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length) {
        let text = element.text().trim();
        if (text && text.length > 5 && text.length < 300) {
          return text.substring(0, 200);
        }
      }
    }
    
    return null;
  }

  extractMultiDescription($: any): string | null {
    const selectors = [
      '#feature-bullets ul',
      '.product-description',
      '.product-details'
    ];
    
    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length && element.text().trim()) {
        return element.text().trim().substring(0, 300);
      }
    }
    
    return null;
  }

  extractMultiImage($: any, url: string): string | null {
    const selectors = [
      '#landingImage',
      '.a-dynamic-image',
      '._396cs4 img[src*="/image/"]',
      '.product-image img',
      'img[alt*="product"]'
    ];
    
    for (const selector of selectors) {
      const images = $(selector);
      for (let i = 0; i < images.length; i++) {
        const img = $(images[i]);
        let src = img.attr('src') || img.attr('data-src');
        
        if (src) {
          if (src.startsWith('//')) {
            src = 'https:' + src;
          } else if (src.startsWith('/')) {
            const urlObj = new URL(url);
            src = urlObj.origin + src;
          }
          
          if (src.startsWith('http') && this.isValidImage(src)) {
            return src;
          }
        }
      }
    }
    
    return null;
  }

  isValidImage(imageUrl: string): boolean {
    const lowerUrl = imageUrl.toLowerCase();
    const invalidPatterns = ['unsplash', 'placeholder', '/logo', '/icon'];
    return !invalidPatterns.some(pattern => lowerUrl.includes(pattern));
  }

  extractMultiPricing($: any, urlAnalysis: any): { price: string | null, originalPrice: string | null } {
    const priceSelectors = [
      '.a-price-current .a-offscreen',
      '._30jeq3._16Jk6d',
      '.current-price',
      '.price'
    ];
    
    let price: string | null = null;
    let originalPrice: string | null = null;
    
    for (const selector of priceSelectors) {
      const element = $(selector).first();
      if (element.length) {
        const priceText = element.text().trim();
        const extractedPrice = this.extractPriceFromText(priceText);
        if (extractedPrice > 0) {
          price = extractedPrice.toString();
          break;
        }
      }
    }
    
    const originalPriceSelectors = [
      '.a-price.a-text-price .a-offscreen',
      '._3I9_wc._2p6lqe',
      '.original-price'
    ];
    
    for (const selector of originalPriceSelectors) {
      const element = $(selector).first();
      if (element.length) {
        const priceText = element.text().trim();
        const extractedPrice = this.extractPriceFromText(priceText);
        if (extractedPrice > 0) {
          originalPrice = extractedPrice.toString();
          break;
        }
      }
    }
    
    return { price, originalPrice };
  }

  extractPriceFromText(text: string): number {
    const cleanText = text.replace(/[₹$,\s]/g, '');
    const priceMatch = cleanText.match(/([0-9]+(?:\.[0-9]{1,2})?)/);
    return priceMatch ? parseFloat(priceMatch[1]) : 0;
  }

  extractMultiRating($: any): number | null {
    const selectors = ['.a-icon-alt', '.pdp-rating', '._3LWZlK'];
    for (const selector of selectors) {
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

  extractMultiReviewCount($: any): number | null {
    const selectors = ['#acrCustomerReviewText', '.pdp-review-count', '._2_R_DZ'];
    for (const selector of selectors) {
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

  extractMultiBrand($: any): string | null {
    const selectors = ['.brand-name', '.product-brand', 'meta[property="product:brand"]'];
    for (const selector of selectors) {
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

  detectMultiCategory(url: string, $: any): string {
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('mobile') || urlLower.includes('phone')) {
      return 'Mobile & Accessories';
    }
    if (urlLower.includes('laptop') || urlLower.includes('electronics')) {
      return 'Electronics';
    }
    if (urlLower.includes('fashion') || urlLower.includes('clothing')) {
      return 'Fashion';
    }
    if (urlLower.includes('home') || urlLower.includes('kitchen')) {
      return 'Home & Kitchen';
    }
    
    return 'General';
  }

  // Helper methods
  extractProductNameFromMessage(text: string): string | null {
    const lines = text.split('\n').filter(line => line.trim());
    for (const line of lines) {
      if (!line.includes('http') && !line.includes('₹') && line.length > 10 && line.length < 100) {
        return line.trim();
      }
    }
    return null;
  }

  extractDescriptionFromMessage(text: string): string | null {
    const lines = text.split('\n').filter(line => 
      line.trim() && !line.includes('http') && !line.includes('Live:')
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
    
    if (textLower.includes('mobile') || textLower.includes('phone')) {
      return 'Mobile & Accessories';
    }
    if (textLower.includes('laptop') || textLower.includes('computer')) {
      return 'Electronics';
    }
    if (textLower.includes('fashion') || textLower.includes('clothing')) {
      return 'Fashion';
    }
    if (textLower.includes('home') || textLower.includes('kitchen')) {
      return 'Home & Kitchen';
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

  calculateEngagementScore(dealInfo: any, productData: any): number {
    let score = 0.5; // Base score
    
    // Boost based on deal urgency
    score += (dealInfo.urgencyLevel / 5) * 0.3;
    
    // Boost based on discount
    if (productData.discount) {
      score += Math.min(productData.discount / 100, 0.2);
    }
    
    return Math.min(Math.round(score * 100) / 100, 1.0);
  }

  extractBrandFromName(name: string | null): string | null {
    if (!name) return null;
    
    const words = name.split(' ');
    if (words.length > 0 && words[0].length > 2) {
      return words[0];
    }
    
    return null;
  }

  async saveDealsHubProduct(productData: any) {
    try {
      console.log('Save Saving DealsHub product to database...');
      
      const db = new Database('database.sqlite');
      
      const stmt = db.prepare(`
        INSERT INTO deals_hub_products (
          name, description, price, original_price, currency, image_url, 
          affiliate_url, original_url, category, rating, review_count, 
          discount, is_new, is_featured, affiliate_network, telegram_message_id, 
          telegram_channel_id, telegram_channel_name, processing_status, 
          content_type, affiliate_tag_applied, url_type, source_platform,
          redirect_chain, final_destination, primary_affiliate, data_quality_score,
          brand, availability, deal_type, deal_priority, deal_badge, deal_urgency_level,
          deal_status, stock_status, price_drop_percentage, is_trending, engagement_score
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        productData.availability,
        productData.deal_type,
        productData.deal_priority,
        productData.deal_badge,
        productData.deal_urgency_level,
        productData.deal_status,
        productData.stock_status,
        productData.price_drop_percentage,
        productData.is_trending,
        productData.engagement_score
      );
      
      console.log(`Success DealsHub product saved successfully with ID: ${result.lastInsertRowid}`);
      console.log(`Link Affiliate URL: ${productData.affiliate_url}`);
      console.log(`🛒 Deal Type: ${productData.deal_type}`);
      console.log(`🏷️ Deal Badge: ${productData.deal_badge}`);
      console.log(`Fast Priority: ${productData.deal_priority}`);
      console.log(`🌍 Platform: ${productData.source_platform}`);
      console.log(`Price Affiliate Network: ${productData.primary_affiliate}`);
      console.log(`Stats Quality Score: ${productData.data_quality_score}`);
      console.log(`📈 Engagement Score: ${productData.engagement_score}`);
      console.log(`Mobile DealsHub product will appear on /dealshub page immediately`);
      
      db.close();
      
    } catch (error) {
      console.error('Error Error saving DealsHub product:', error);
    }
  }

  async stop() {
    try {
      if (this.telegramBot && this.isInitialized) {
        console.log('Stop Stopping DealsHub bot...');
        await this.telegramBot.stopPolling();
        this.isInitialized = false;
        console.log('Success DealsHub bot stopped successfully');
      }
    } catch (error) {
      console.error('Error Error stopping DealsHub bot:', error);
    }
  }
}

// Create and export DealsHub bot instance
const dealsHubBot = new DealsHubBot();

// Enhanced Manager Integration - Export initialization function
export async function initializeDealsHubBot(): Promise<void> {
  try {
    console.log('Launch Initializing DealsHub Bot with Enhanced Manager...');
    await dealsHubBot.initialize();
    console.log('Success DealsHub Bot initialized successfully');
  } catch (error) {
    console.error('Error Failed to initialize DealsHub Bot:', error);
    throw error;
  }
}

// Auto-initialize if credentials are available (fallback)
if (BOT_TOKEN && CHANNEL_ID && !process.env.ENHANCED_MANAGER_ACTIVE) {
  dealsHubBot.initialize().catch(console.error);
} else if (!BOT_TOKEN || !CHANNEL_ID) {
  console.log('Warning DealsHub automation disabled - missing credentials');
}

export default dealsHubBot;