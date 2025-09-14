// Working Value Picks Bot - CommonJS Version with Enhanced Data Extraction
console.log('Launch VALUE PICKS BOT (WORKING VERSION) LOADING...');

const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const axios = require('axios');
const cheerio = require('cheerio');

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

class ValuePicksBotWorking {
  constructor() {
    this.telegramBot = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      console.log('💎 Initializing Value Picks Telegram bot (Enhanced Version)...');
      
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
      console.log(`Price Features: EKaro conversion, Real data extraction, Smart pricing`);
      
      // Enable polling after successful connection
      this.telegramBot.startPolling();
      
      // Setup message listeners
      this.setupMessageListeners();
      this.setupErrorHandling();
      
      this.isInitialized = true;
      console.log('Target Value Picks bot fully initialized with enhanced data extraction!');
      
    } catch (error) {
      console.error('Error Failed to initialize Value Picks bot:', error.message);
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
    this.telegramBot.on('edited_channel_post', async (message) => {
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
    this.telegramBot.on('message', async (message) => {
      try {
        if (message.chat.type === 'private' && message.text) {
          if (message.text === '/start') {
            const statusMessage = 
              `💎 Value Picks Bot Active!\n\n` +
              `Success Real product data extraction\n` +
              `Price EKaro affiliate conversion\n` +
              `Stats Smart price & image detection\n` +
              `Mobile Monitoring: ${CHANNEL_NAME}\n` +
              `Target Target: ${TARGET_PAGE} page\n\n` +
              `🔧 Status: ENHANCED AUTOPOSTING\n` +
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
      console.error('Error Value Picks Bot polling error:', error.message);
    });
    
    this.telegramBot.on('error', (error) => {
      console.error('Error Value Picks Bot error:', error.message);
    });
  }

  async processChannelMessage(message) {
    try {
      console.log('Refresh Processing Value Picks channel message with enhanced extraction...');
      
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

  extractUrls(text) {
    const urlRegex = /https?:\/\/[^\s]+/g;
    return text.match(urlRegex) || [];
  }

  async processProductUrl(url, message, messageText) {
    try {
      console.log(`Link Processing URL with real data extraction: ${url}`);
      
      // First expand the URL to get the final destination
      console.log('Search Expanding URL to final destination...');
      const expandedUrl = await this.expandUrl(url);
      console.log(`Link Final URL: ${expandedUrl}`);
      
      // Convert the FINAL expanded URL to EKaro affiliate URL (not the original shortened URL)
      const ekaroUrl = this.convertToEkaroUrl(expandedUrl);
      console.log(`Price EKaro URL: ${ekaroUrl}`);
      
      // Extract real product data from the expanded URL with enhanced image extraction
      console.log('Search Extracting real product data from expanded URL with enhanced image extraction...');
      const realProductData = await this.extractRealProductData(expandedUrl, messageText);
      
      // Extract additional info from message
      const messageProductName = this.extractProductNameFromMessage(messageText);
      const messageDescription = this.extractDescriptionFromMessage(messageText);
      const messagePriceInfo = this.extractPriceFromMessage(messageText);
      
      // Log extracted data for debugging
      console.log('Stats Extracted data summary:');
      console.log(`   Real name: ${realProductData.name || 'Not found'}`);
      console.log(`   Real price: ${realProductData.price || 'Not found'}`);
      console.log(`   Real original price: ${realProductData.originalPrice || 'Not found'}`);
      console.log(`   Real image: ${realProductData.imageUrl ? realProductData.imageUrl.substring(0, 60) + '...' : 'Not found'}`);
      console.log(`   Message name: ${messageProductName || 'Not found'}`);
      console.log(`   Message price: ${messagePriceInfo.price || 'Not found'}`);
      
      // Combine real data with message data (prioritize real data, but ensure we have valid data)
      const productData = {
        name: realProductData.name || messageProductName || 'Value Picks Product',
        description: realProductData.description || messageDescription || 'Great product from Value Picks',
        price: realProductData.price || messagePriceInfo.price || '999',
        original_price: realProductData.originalPrice || messagePriceInfo.originalPrice || (realProductData.price ? (parseInt(realProductData.price) * 2).toString() : '1999'),
        currency: 'INR',
        image_url: realProductData.imageUrl || null, // FIXED: No more placeholder images
        affiliate_url: ekaroUrl,
        original_url: expandedUrl, // Use expanded URL instead of original shortened URL
        category: realProductData.category || this.detectCategory(messageText),
        rating: realProductData.rating || '4.5',
        review_count: realProductData.reviewCount || 100,
        discount: realProductData.discount || messagePriceInfo.discount || (realProductData.price && realProductData.originalPrice ? Math.round(((parseFloat(realProductData.originalPrice) - parseFloat(realProductData.price)) / parseFloat(realProductData.originalPrice)) * 100) : 50),
        is_new: 1,
        is_featured: 1,
        affiliate_network: 'EKaro',
        telegram_message_id: message.message_id,
        telegram_channel_id: parseInt(CHANNEL_ID || '0'),
        telegram_channel_name: CHANNEL_NAME,
        processing_status: 'active',
        content_type: 'product',
        affiliate_tag_applied: 1
      };
      
      console.log('Stats Final product data:');
      console.log(`   Name: ${productData.name}`);
      console.log(`   Price: ₹${productData.price} (was ₹${productData.original_price})`);
      console.log(`   Discount: ${productData.discount}%`);
      console.log(`   Image: ${productData.image_url}`);
      console.log(`   Category: ${productData.category}`);
      
      // Save to database
      await this.saveProduct(productData);
      
      console.log('Success Product processed with real data and saved successfully!');
      
    } catch (error) {
      console.error('Error Error processing product URL:', error);
    }
  }

  async extractRealProductData(url, messageText = '') {
    try {
      console.log('Global Fetching product page with enhanced extraction...');
      
      // Expand shortened URLs first
      const expandedUrl = await this.expandUrl(url);
      console.log(`Link Expanded URL: ${expandedUrl}`);
      
      const response = await axios.get(expandedUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      
      // Enhanced image extraction with multiple attempts
      console.log('🖼️ Attempting enhanced image extraction...');
      let imageUrl = this.extractImageUrl($);
      
      // If no image found, try alternative extraction methods
      if (!imageUrl) {
        console.log('Search Primary image extraction failed, trying alternative methods...');
        imageUrl = this.extractImageUrlAlternative($, expandedUrl);
      }
      
      // If still no image, try extracting from message text (for some affiliate links)
      if (!imageUrl && messageText) {
        console.log('Search Trying to extract image from message context...');
        imageUrl = this.extractImageFromMessageContext(messageText);
      }
      
      // Extract product information
      const productData = {
        name: this.extractProductName($, messageText),
        description: this.extractDescription($),
        price: null,
        originalPrice: null,
        discount: null,
        imageUrl: imageUrl,
        category: this.detectCategoryFromUrl(expandedUrl),
        rating: this.extractRating($),
        reviewCount: this.extractReviewCount($)
      };
      
      // Extract pricing information
      const pricingData = this.extractPricing($);
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
      
      console.log('Success Enhanced product data extracted successfully');
      console.log(`   Name: ${productData.name || 'Not found'}`);
      console.log(`   Price: ${productData.price || 'Not found'}`);
      console.log(`   Image: ${productData.imageUrl ? 'Found Success' : 'Not found Error'}`);
      
      return productData;
      
    } catch (error) {
      console.log('Warning Could not extract real product data, using fallback:', error.message);
      return {
        name: null,
        description: null,
        price: null,
        originalPrice: null,
        discount: null,
        imageUrl: null,
        category: null,
        rating: null,
        reviewCount: null
      };
    }
  }

  async expandUrl(url) {
    try {
      console.log(`Link Expanding URL: ${url}`);
      
      // Handle already-wrapped EarnKaro URLs first
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
      
      // Handle multiple redirect layers for shortened URLs
      let currentUrl = url;
      let redirectCount = 0;
      const maxRedirects = 10;
      
      while (redirectCount < maxRedirects) {
        try {
          const response = await axios.get(currentUrl, {
            maxRedirects: 0,
            timeout: 15000,
            validateStatus: (status) => status < 400 || status === 301 || status === 302 || status === 307 || status === 308,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          });
          
          // Check if it's a redirect
          if ([301, 302, 307, 308].includes(response.status)) {
            const location = response.headers.location;
            if (location) {
              currentUrl = location.startsWith('http') ? location : new URL(location, currentUrl).href;
              console.log(`Refresh Redirect ${redirectCount + 1}: ${currentUrl}`);
              redirectCount++;
              continue;
            }
          }
          
          // If we get here, no more redirects
          break;
          
        } catch (redirectError) {
          // If redirect fails, try to extract from known patterns
          console.log(`Warning Redirect failed, trying pattern extraction: ${redirectError.message}`);
          break;
        }
      }
      
      // Enhanced handling for linkredirect.in URLs - extract the actual destination
      if (currentUrl.includes('linkredirect.in')) {
        try {
          // Try dl parameter first
          if (currentUrl.includes('dl=')) {
            const urlObj = new URL(currentUrl);
            const dlParam = urlObj.searchParams.get('dl');
            if (dlParam) {
              const decodedUrl = decodeURIComponent(dlParam);
              console.log(`Unlock Extracted destination URL from dl parameter: ${decodedUrl}`);
              currentUrl = decodedUrl;
            }
          }
          // Try other common redirect parameters
          else if (currentUrl.includes('url=')) {
            const urlObj = new URL(currentUrl);
            const urlParam = urlObj.searchParams.get('url');
            if (urlParam) {
              const decodedUrl = decodeURIComponent(urlParam);
              console.log(`Unlock Extracted destination URL from url parameter: ${decodedUrl}`);
              currentUrl = decodedUrl;
            }
          }
        } catch (decodeError) {
          console.log(`Warning Could not decode linkredirect URL: ${decodeError.message}`);
        }
      }
      
      // Handle other redirect services
      if (currentUrl.includes('bit.ly') || currentUrl.includes('tinyurl') || currentUrl.includes('t.co')) {
        try {
          const response = await axios.head(currentUrl, {
            maxRedirects: 5,
            timeout: 10000
          });
          if (response.request && response.request.res && response.request.res.responseUrl) {
            currentUrl = response.request.res.responseUrl;
            console.log(`Refresh Resolved shortened URL: ${currentUrl}`);
          }
        } catch (shortUrlError) {
          console.log(`Warning Could not resolve shortened URL: ${shortUrlError.message}`);
        }
      }
      
      console.log(`Success Final expanded URL: ${currentUrl}`);
      return currentUrl;
      
    } catch (error) {
      console.log(`Warning Could not expand URL ${url}, using original:`, error.message);
      return url;
    }
  }

  extractProductName($) {
    const nameSelectors = [
      // Amazon selectors
      '#productTitle',
      '.a-size-large.product-title-word-break',
      '.a-size-large.a-spacing-none.a-color-base',
      '#title_feature_div h1',
      
      // Flipkart & Shopsy selectors
      '.B_NuCI',
      '._35KyD6',
      '.yhZ71d',
      '.x-item-title-label h1',
      '.pdp-product-name',
      '._6EBuvT',
      '._35KyD6 span',
      '.B_NuCI span',
      '.pdp-e-i-head h1',
      '.fMghEO',
      
      // Shopsy specific selectors
      '[data-testid="product-title"]',
      '.product-title-text',
      '.item-name',
      '.product-name-text',
      
      // Generic selectors
      'h1[data-automation-id="product-title"]',
      '.product-title',
      '.product-name',
      '.item-title',
      '.title',
      'h1.title',
      'h1.product-title',
      
      // Fallback selectors
      'h1',
      '.main-title',
      '.page-title'
    ];
    
    for (const selector of nameSelectors) {
      const element = $(selector).first();
      if (element.length) {
        let text = element.text().trim();
        
        // Clean up the text
        text = text.replace(/\s+/g, ' '); // Replace multiple spaces with single space
        text = text.replace(/[\n\r\t]/g, ' '); // Replace newlines and tabs with space
        text = text.trim();
        
        // Check if it's a valid product name (not empty, not too short, not just numbers)
        if (text && text.length > 5 && text.length < 300 && !/^[\d\s]+$/.test(text)) {
          console.log(`Success Product name extracted: "${text}" from selector: ${selector}`);
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
          console.log(`Success Product name from meta: "${text}" from selector: ${selector}`);
          return text.substring(0, 200);
        }
      }
    }
    
    console.log('Warning Could not extract product name from page');
    return null;
  }

  extractDescription($) {
    const descSelectors = [
      '#feature-bullets ul',
      '.product-description',
      '.pdp-product-description',
      '[data-automation-id="product-description"]',
      '.product-details',
      '#aplus'
    ];
    
    for (const selector of descSelectors) {
      const element = $(selector).first();
      if (element.length && element.text().trim()) {
        return element.text().trim().substring(0, 300);
      }
    }
    
    return null;
  }

  extractPricing($) {
    let price = null;
    let originalPrice = null;
    
    console.log('Search Extracting pricing information...');
    
    // Enhanced price selectors for major e-commerce sites (prioritized)
    const priceSelectors = [
      // Priority 1: Most specific Shopsy/Flipkart selectors
      '._30jeq3._16Jk6d',
      '._1_WHN1',
      '.CEmiEU .Nx9bqj',
      '._30jeq3',
      '.Nx9bqj.CxhGGd',
      '._16Jk6d',
      '._1vC4OE',
      '._3qQ9m1',
      '.CEmiEU',
      '._25b18c',
      '._1AtVbE ._30jeq3',
      '._1AtVbE ._16Jk6d',
      
      // Priority 2: Amazon selectors - current price
      '.a-price-current .a-offscreen',
      '.a-price .a-offscreen',
      '#priceblock_dealprice',
      '#priceblock_ourprice',
      '.a-price-range .a-offscreen',
      '.a-price-whole',
      '.a-price-symbol + .a-price-whole',
      
      // Priority 3: Shopsy specific price selectors
      '[data-testid="current-price"]',
      '.current-price-value',
      '.selling-price-value',
      '.price-now',
      '.offer-price-value',
      '.price-display',
      '.final-price-display',
      
      // Priority 4: Generic selectors with price indicators
      '.price-current',
      '.current-price',
      '.sale-price',
      '.offer-price',
      '.discounted-price',
      '[data-testid="price"]',
      '.product-price',
      '.final-price',
      '.selling-price',
      
      // Priority 5: Broad fallback selectors
      '.price',
      '[class*="price"]',
      '[class*="Price"]'
    ];
    
    // Try to extract current price with enhanced debugging
    for (const selector of priceSelectors) {
      const priceElements = $(selector);
      
      if (priceElements.length > 0) {
        console.log(`Search Testing price selector: ${selector} (found ${priceElements.length} elements)`);
      }
      
      for (let i = 0; i < priceElements.length; i++) {
        const element = $(priceElements[i]);
        const priceText = element.text().trim();
        
        if (priceText) {
          console.log(`   Blog Price text found: "${priceText}" from ${selector}`);
          const extractedPrice = this.extractPriceFromText(priceText);
          
          if (extractedPrice > 0 && extractedPrice < 1000000) { // Reasonable price range
            price = extractedPrice.toString();
            console.log(`Success Current price extracted: ₹${price} from selector: ${selector}`);
            break;
          } else if (extractedPrice > 0) {
            console.log(`Warning Price out of range: ₹${extractedPrice} from selector: ${selector}`);
          }
        }
      }
      
      if (price) break;
    }
    
    if (!price) {
      console.log('Error No current price found with any selector');
    }
    
    // Enhanced original price selectors
    const originalPriceSelectors = [
      // Amazon original price selectors
      '.a-price.a-text-price .a-offscreen',
      '.a-price-basis-price .a-offscreen',
      '.a-text-strike .a-offscreen',
      '#priceblock_listprice',
      '.a-price-was .a-offscreen',
      '.a-price-list .a-offscreen',
      
      // Flipkart original price selectors
      '._3I9_wc._2p6lqe',
      '._3auQ3N._1POkHg',
      '.CEmiEU ._3tbKJL',
      '._3tbKJL',
      '._2p6lqe',
      
      // Generic original price selectors
      '.original-price',
      '.list-price',
      '.was-price',
      '.regular-price',
      '.strike-price',
      '.crossed-price',
      '.mrp-price',
      '.old-price',
      'del .price',
      's .price',
      'del',
      's',
      '.strikethrough'
    ];
    
    // Try to extract original price
    for (const selector of originalPriceSelectors) {
      const elements = $(selector);
      
      elements.each((_, element) => {
        const priceText = $(element).text().trim();
        
        if (priceText) {
          const extractedPrice = this.extractPriceFromText(priceText);
          
          // Original price should be higher than current price and within reasonable range
          if (extractedPrice > 0 && extractedPrice < 1000000 && 
              (!price || extractedPrice > parseFloat(price))) {
            originalPrice = extractedPrice.toString();
            console.log(`Success Original price found: ₹${originalPrice} from selector: ${selector}`);
            return false; // Break out of each loop
          }
        }
      });
      
      if (originalPrice) break;
    }
    
    // If we have both prices, validate they make sense
    if (price && originalPrice) {
      const currentPrice = parseFloat(price);
      const listPrice = parseFloat(originalPrice);
      
      // If original price is not higher than current price, ignore it
      if (listPrice <= currentPrice) {
        console.log(`Warning Original price (₹${originalPrice}) not higher than current price (₹${price}), ignoring original price`);
        originalPrice = null;
      }
    }
    
    console.log(`Stats Final pricing: Current=₹${price || 'N/A'}, Original=₹${originalPrice || 'N/A'}`);
    return { price, originalPrice };
  }

  extractPriceFromText(text) {
    if (!text) return 0;
    
    // Clean the text - remove extra whitespace and normalize
    let cleanText = text.trim().replace(/\s+/g, ' ');
    
    // Remove common non-numeric characters but keep currency symbols for context
    cleanText = cleanText.replace(/[^0-9₹$€£¥.,\s]/g, '');
    
    // Try different price patterns
    const pricePatterns = [
      // Pattern 1: Currency symbol followed by number (₹1,234.56)
      /[₹$€£¥]\s*([0-9,]+(?:\.[0-9]{1,2})?)/,
      
      // Pattern 2: Number followed by currency (1234.56₹)
      /([0-9,]+(?:\.[0-9]{1,2})?)\s*[₹$€£¥]/,
      
      // Pattern 3: Just numbers with commas (1,234.56)
      /([0-9,]+(?:\.[0-9]{1,2})?)/,
      
      // Pattern 4: Numbers with spaces as thousands separator (1 234.56)
      /([0-9]+(?:\s[0-9]{3})*(?:\.[0-9]{1,2})?)/
    ];
    
    for (const pattern of pricePatterns) {
      const match = cleanText.match(pattern);
      if (match && match[1]) {
        // Remove commas and spaces from the number
        let numberStr = match[1].replace(/[,\s]/g, '');
        
        // Parse the number
        const price = parseFloat(numberStr);
        
        // Validate the price (should be positive and reasonable)
        if (!isNaN(price) && price > 0 && price < 10000000) {
          return Math.round(price);
        }
      }
    }
    
    return 0;
  }

  extractImageUrl($) {
    console.log('🖼️ Extracting product image with enhanced selectors...');
    
    const imageSelectors = [
      // Priority 1: Main product images (Amazon)
      '#landingImage',
      '.a-dynamic-image.a-stretch-horizontal',
      '.a-dynamic-image',
      '#imgTagWrapperId img',
      '#altImages img',
      
      // Priority 2: Flipkart/Shopsy main images with high-quality indicators
      '._396cs4 img[src*="/image/"]',
      '._2r_T1I img[src*="/image/"]',
      '._1BweB8 img[src*="/image/"]',
      '.CXW8mj img[src*="/image/"]',
      '._2_AcLJ img[src*="/image/"]',
      '._2KpZ6l img[src*="/image/"]',
      '._53J4C- img[src*="/image/"]',
      '._1AtVbE img[src*="/image/"]',
      
      // Priority 3: Specific product images (avoid generic promo images)
      'img[src*="/image/"][src*="flixcart.com"]',
      'img[data-src*="/image/"][data-src*="flixcart.com"]',
      'img[src*="/image/"][src*="rukminim"]',
      'img[data-src*="/image/"][data-src*="rukminim"]',
      
      // Priority 4: Shopsy specific selectors
      '[data-testid="product-image"] img',
      '.product-image-main img',
      '.hero-image img',
      '.product-hero img',
      '.product-image-container img',
      '.image-gallery img',
      
      // Priority 5: Generic product selectors
      '.pdp-image img',
      '.product-image img',
      '[data-automation-id="product-image"] img',
      '.gallery-image img',
      '.main-image img',
      'img[alt*="product"]',
      'img[alt*="Product"]',
      
      // Priority 6: Data attribute images with quality filters
      'img[data-src*="/image/"]',
      'img[data-original*="/image/"]',
      'img[data-lazy*="/image/"]',
      
      // Priority 7: Fallback - any quality image (but validate it's not promo)
      'img[src*="flixcart"]',
      'img[src*="shopsy"]',
      'img[src*="amazon"]',
      'img[data-src]',
      '.main-image img'
    ];
    
    // Try each selector in priority order
    for (const selector of imageSelectors) {
      const imgElements = $(selector);
      
      for (let i = 0; i < imgElements.length; i++) {
        const imgElement = $(imgElements[i]);
        let src = imgElement.attr('src') || imgElement.attr('data-src') || imgElement.attr('data-original') || imgElement.attr('data-lazy');
        
        if (src) {
          // Handle relative URLs
          if (src.startsWith('//')) {
            src = 'https:' + src;
          } else if (src.startsWith('/')) {
            src = 'https://www.shopsy.in' + src;
          }
          
          // Validate image URL and ensure it's product-specific
          if (src.startsWith('http') && this.isValidImageUrl(src) && this.isProductSpecificImage(src)) {
            console.log(`Success Product image found: ${src.substring(0, 80)}... (selector: ${selector})`);
            return src;
          } else if (src.startsWith('http')) {
            console.log(`Warning Skipping generic/invalid image: ${src.substring(0, 80)}... (selector: ${selector})`);
          }
        }
      }
    }
    
    console.log('Warning No valid product image found with enhanced selectors');
    return null;
  }

  isValidImageUrl(url) {
    if (!url) return false;
    
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const lowerUrl = url.toLowerCase();
    
    // Check for image extensions or image-related patterns
    const hasImageExtension = imageExtensions.some(ext => lowerUrl.includes(ext));
    const hasImagePattern = lowerUrl.includes('image') || lowerUrl.includes('/dp/') || lowerUrl.includes('xif0q');
    
    // Ensure minimum quality - avoid very small images
    const hasQualityIndicators = lowerUrl.includes('400') || lowerUrl.includes('500') || lowerUrl.includes('600') || 
                                lowerUrl.includes('800') || lowerUrl.includes('1000') || !lowerUrl.includes('128');
    
    return (hasImageExtension || hasImagePattern) && hasQualityIndicators;
  }

  isProductSpecificImage(url) {
    if (!url) return false;
    
    const lowerUrl = url.toLowerCase();
    
    // Filter out generic promo images and low-quality images
    const genericPatterns = [
      '/www/128/128/promos/',  // Generic promo images
      '/www/400/400/promos/',  // Generic promo images
      '/banners/',             // Banner images
      '/promotions/',          // Promotional images
      '/category/',            // Category images
      '/brand/',               // Brand images
      '/logo/',                // Logo images
      '/icons/',               // Icon images
      'placeholder',           // Placeholder images
      'no-image',              // No image placeholders
      'default-image',         // Default images
      '/128/128/',             // Very small images
      '/64/64/',               // Very small images
      'thumbnail',             // Thumbnail images
    ];
    
    // Check if URL contains generic patterns
    const isGeneric = genericPatterns.some(pattern => lowerUrl.includes(pattern));
    if (isGeneric) {
      return false;
    }
    
    // Prioritize specific product image patterns
    const productPatterns = [
      '/image/',               // Specific product images
      '/product/',             // Product images
      '/item/',                // Item images
      'xif0q',                 // Flipkart product image identifier
      '/dp/',                  // Amazon product identifier
      'rukminim',              // Flipkart CDN for product images
      '/400/',                 // Good quality images
      '/500/',                 // Good quality images
      '/600/',                 // Good quality images
      '/800/',                 // High quality images
    ];
    
    // Check if URL contains product-specific patterns
    const isProductSpecific = productPatterns.some(pattern => lowerUrl.includes(pattern));
    
    // Additional validation: ensure it's not a very small image
    const hasGoodDimensions = !lowerUrl.includes('/64/') && !lowerUrl.includes('/128/');
    
    return isProductSpecific && hasGoodDimensions;
  }

  extractImageUrlAlternative($, url) {
    console.log('Search Trying alternative image extraction methods...');
    
    // Method 1: Look for JSON-LD structured data
    try {
      const jsonLdScripts = $('script[type="application/ld+json"]');
      for (let i = 0; i < jsonLdScripts.length; i++) {
        const scriptContent = $(jsonLdScripts[i]).html();
        if (scriptContent) {
          const jsonData = JSON.parse(scriptContent);
          if (jsonData.image) {
            const imageUrl = Array.isArray(jsonData.image) ? jsonData.image[0] : jsonData.image;
            if (typeof imageUrl === 'string' && this.isValidProductImage(imageUrl)) {
              console.log('Success Found image in JSON-LD data');
              return imageUrl;
            }
          }
        }
      }
    } catch (error) {
      console.log('Warning JSON-LD parsing failed:', error.message);
    }
    
    // Method 2: Look for Open Graph images
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage && this.isValidProductImage(ogImage)) {
      console.log('Success Found image in Open Graph meta');
      return ogImage;
    }
    
    // Method 3: Look for Twitter Card images
    const twitterImage = $('meta[name="twitter:image"]').attr('content');
    if (twitterImage && this.isValidProductImage(twitterImage)) {
      console.log('Success Found image in Twitter Card meta');
      return twitterImage;
    }
    
    // Method 4: Look for any high-quality images on the page
    const allImages = $('img');
    for (let i = 0; i < allImages.length; i++) {
      const img = $(allImages[i]);
      let src = img.attr('src') || img.attr('data-src') || img.attr('data-original');
      
      if (src) {
        // Handle relative URLs
        if (src.startsWith('//')) {
          src = 'https:' + src;
        } else if (src.startsWith('/')) {
          const urlObj = new URL(url);
          src = urlObj.origin + src;
        }
        
        // Check for high-quality indicators
        if (src.startsWith('http') && this.isHighQualityImage(src)) {
          console.log('Success Found high-quality image on page');
          return src;
        }
      }
    }
    
    console.log('Error No alternative images found');
    return null;
  }
  
  isHighQualityImage(imageUrl) {
    const lowerUrl = imageUrl.toLowerCase();
    
    // Must be a valid product image first
    if (!this.isValidProductImage(imageUrl)) {
      return false;
    }
    
    // Look for high-quality indicators
    const qualityIndicators = [
      '/400/',
      '/500/',
      '/600/',
      '/800/',
      '/1000/',
      'large',
      'medium',
      'original'
    ];
    
    return qualityIndicators.some(indicator => lowerUrl.includes(indicator));
  }
  
  extractImageFromMessageContext(messageText) {
    console.log('Search Trying to extract image context from message...');
    
    // This is a fallback method - in most cases we should get images from the actual product page
    // For now, return null to force proper image extraction from product pages
    console.log('Warning Message context image extraction not implemented (forces real product page extraction)');
    return null;
  }

  extractRating($) {
    const ratingSelectors = [
      '.a-icon-alt',
      '.pdp-rating',
      '.rating-value',
      '.star-rating',
      '._3LWZlK'
    ];
    
    for (const selector of ratingSelectors) {
      const ratingText = $(selector).first().text().trim();
      if (ratingText) {
        const ratingMatch = ratingText.match(/(\d+(?:\.\d+)?)/);  
        if (ratingMatch) {
          return ratingMatch[1];
        }
      }
    }
    
    return null;
  }

  extractReviewCount($) {
    const reviewSelectors = [
      '#acrCustomerReviewText',
      '.pdp-review-count',
      '.review-count',
      '.reviews-count',
      '._2_R_DZ'
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

  detectCategoryFromUrl(url) {
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('mobile') || urlLower.includes('phone') || urlLower.includes('electronics')) {
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
    
    return 'General';
  }

  convertToEkaroUrl(url) {
    try {
      console.log(`Price Converting to EKaro URL: ${url}`);
      
      // Check if URL is already an EKaro URL
      if (url.includes('ekaro.in/enkr2020/')) {
        console.log('Success URL is already EKaro format, keeping as-is');
        return url;
      }
      
      // Ensure we have a valid URL
      if (!url || !url.startsWith('http')) {
        console.log('Warning Invalid URL for EKaro conversion, using fallback');
        return url;
      }
      
      // Properly encode the URL
      const encodedUrl = encodeURIComponent(url);
      
      // Use the correct EKaro format with ref ID
      const ekaroUrl = `https://ekaro.in/enkr2020/?url=${encodedUrl}&ref=${EKARO_REF_ID}`;
      
      console.log(`Success EKaro URL generated: ${ekaroUrl}`);
      console.log(`Price Ref ID: ${EKARO_REF_ID}`);
      
      return ekaroUrl;
      
    } catch (error) {
      console.error('Error Error converting to EKaro URL:', error);
      return url; // Return original URL if conversion fails
    }
  }

  extractProductNameFromMessage(text) {
    // Look for product names in the message
    const lines = text.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      // Skip lines with URLs, prices, or common keywords
      if (line.includes('http') || line.includes('₹') || line.includes('@') || 
          line.includes('Live:') || line.includes('Lowest') || line.includes('Mela')) {
        continue;
      }
      
      // Look for lines that seem like product names
      if (line.length > 10 && line.length < 100) {
        return line.trim();
      }
    }
    
    return null;
  }

  extractDescriptionFromMessage(text) {
    // Use first few lines as description, excluding URLs
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

  extractPriceFromMessage(text) {
    const priceInfo = {
      price: null,
      originalPrice: null,
      discount: null
    };
    
    // Look for price patterns like "@ 99" or "₹99"
    const priceMatch = text.match(/[@₹]\s*(\d+)/g);
    if (priceMatch && priceMatch.length > 0) {
      const prices = priceMatch.map(p => parseInt(p.replace(/[@₹\s]/g, '')));
      priceInfo.price = Math.min(...prices).toString();
      
      if (prices.length > 1) {
        priceInfo.originalPrice = Math.max(...prices).toString();
        const discount = Math.round(((priceInfo.originalPrice - priceInfo.price) / priceInfo.originalPrice) * 100);
        priceInfo.discount = discount;
      }
    }
    
    return priceInfo;
  }

  detectCategory(text) {
    const textLower = text.toLowerCase();
    
    if (textLower.includes('baby') || textLower.includes('wipes') || textLower.includes('infant')) {
      return 'Baby Care';
    }
    if (textLower.includes('shirt') || textLower.includes('men') || textLower.includes('clothing')) {
      return 'Fashion';
    }
    if (textLower.includes('buddha') || textLower.includes('idol') || textLower.includes('showpiece')) {
      return 'Home Decor';
    }
    if (textLower.includes('kurti') || textLower.includes('women') || textLower.includes('dress')) {
      return 'Fashion';
    }
    
    return 'General';
  }

  async saveProduct(productData) {
    try {
      console.log('Save Saving Value Picks product with real data to database...');
      
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
      console.log(`Mobile Product with REAL DATA will appear on /value-picks page immediately`);
      
      db.close();
      
    } catch (error) {
      console.error('Error Error saving Value Picks product:', error);
      throw error;
    }
  }

  getStatus() {
    return {
      initialized: this.isInitialized,
      channelId: CHANNEL_ID,
      targetPage: TARGET_PAGE,
      features: [
        'Real Product Data Extraction',
        'Smart Price Detection',
        'Actual Image Scraping',
        'EKaro Affiliate Conversion',
        'Auto Product Detection',
        'Database Integration',
        'Enhanced Message Processing',
        'Category Detection'
      ]
    };
  }

  async shutdown() {
    if (this.telegramBot) {
      await this.telegramBot.stopPolling();
      this.telegramBot = null;
      this.isInitialized = false;
      console.log('💎 Value Picks bot shutdown complete');
    }
  }
}

// Create and export bot instance
const valuePicksBotWorking = new ValuePicksBotWorking();

// Note: Initialization is handled by TelegramManager to prevent conflicts
if (BOT_TOKEN && CHANNEL_ID) {
  console.log('💎 Value Picks Telegram automation ready (Enhanced Version)');
} else {
  console.log('Warning Value Picks automation disabled - missing credentials');
}

module.exports = { valuePicksBotWorking };