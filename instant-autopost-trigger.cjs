/**
 * Instant Autopost Trigger - Manual Message Processing
 * Bypasses network issues by allowing direct message input
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const readline = require('readline');

const DATABASE_PATH = path.join(__dirname, 'database.sqlite');

class InstantAutopostTrigger {
  constructor() {
    this.db = null;
    this.rl = null;
  }

  async start() {
    console.log('Launch Instant Autopost Trigger - Manual Message Processing');
    console.log('Mobile Paste Telegram messages here to create products instantly\n');
    
    try {
      await this.initDatabase();
      await this.startInteractiveMode();
    } catch (error) {
      console.error('Error Failed to start:', error.message);
    }
  }

  async initDatabase() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(DATABASE_PATH, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Success Database connected');
          resolve();
        }
      });
    });
  }

  async startInteractiveMode() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('📋 Instructions:');
    console.log('1. Copy a message from Telegram Cue Picks channel');
    console.log('2. Paste it here and press Enter');
    console.log('3. Product will be created instantly');
    console.log('4. Type "exit" to quit\n');

    this.promptForMessage();
  }

  promptForMessage() {
    this.rl.question('📨 Paste Telegram message (or "exit" to quit): ', async (input) => {
      if (input.toLowerCase() === 'exit') {
        console.log('👋 Goodbye!');
        this.cleanup();
        return;
      }

      if (input.trim().length < 10) {
        console.log('Warning Message too short. Please paste a complete Telegram message.\n');
        this.promptForMessage();
        return;
      }

      try {
        await this.processMessage(input.trim());
      } catch (error) {
        console.error('Error Error processing message:', error.message);
      }

      console.log('');
      this.promptForMessage();
    });
  }

  async processMessage(messageText) {
    console.log('\nRefresh Processing message...');
    console.log(`Blog Text: ${messageText.substring(0, 100)}...`);
    
    // Extract URLs from message
    const urls = this.extractUrls(messageText);
    
    if (urls.length === 0) {
      console.log('Warning No URLs found in message');
      return;
    }
    
    console.log(`Link Found ${urls.length} URL(s)`);
    
    // Process each URL
    for (const url of urls) {
      await this.createProduct(url, messageText);
    }
  }

  extractUrls(text) {
    const urlRegex = /https?:\/\/[^\s]+/g;
    return text.match(urlRegex) || [];
  }

  async createProduct(url, messageText) {
    try {
      console.log(`\nRefresh Creating product for: ${url.substring(0, 50)}...`);
      
      // Extract product information
      const productName = this.extractProductName(messageText, url);
      const price = this.extractPrice(messageText);
      const originalPrice = this.extractOriginalPrice(messageText);
      const description = this.extractDescription(messageText);
      
      // Create Cuelinks affiliate URL
      const affiliateUrl = this.createCuelinksUrl(url);
      
      // Calculate discount
      const discount = originalPrice && price ? 
        Math.round(((originalPrice - price) / originalPrice) * 100) : null;
      
      // Create product data
      const productData = {
        name: productName,
        description: description,
        price: price.toString(),
        original_price: originalPrice ? originalPrice.toString() : null,
        currency: 'INR',
        image_url: this.getDefaultImage(url),
        affiliate_url: affiliateUrl,
        category: this.detectCategory(url, productName),
        rating: '4.5',
        review_count: Math.floor(Math.random() * 500) + 100,
        discount: discount,
        source: 'cue-picks-manual',
        is_new: 1,
        is_featured: 1,
        display_pages: JSON.stringify(['cue-picks']),
        created_at: new Date(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        telegram_message_id: Date.now() // Use timestamp as message ID
      };
      
      // Insert into database
      const productId = await this.insertProduct(productData);
      
      console.log('Success Product created successfully!');
      console.log(`🆔 Product ID: ${productId}`);
      console.log(`Mobile Name: ${productName}`);
      console.log(`Price Price: ₹${price}${originalPrice ? ` (was ₹${originalPrice})` : ''}`);
      console.log(`Stats Discount: ${discount ? discount + '%' : 'N/A'}`);
      console.log(`Products Category: ${productData.category}`);
      console.log(`Link Affiliate URL: ${affiliateUrl.substring(0, 60)}...`);
      console.log(`Global View at: http://localhost:5000/cue-picks`);
      
    } catch (error) {
      console.error(`Error Error creating product for ${url}:`, error.message);
    }
  }

  extractProductName(text, url) {
    // Try to extract product name from message text
    const lines = text.split('\n');
    
    // Look for lines that might contain product names
    for (const line of lines) {
      const cleanLine = line.trim();
      
      // Skip URLs, emojis, and short lines
      if (cleanLine.includes('http') || cleanLine.length < 10) continue;
      if (/^[\d%₹Rs\s.,#-]+$/.test(cleanLine)) continue; // Skip price/discount lines
      if (/^[Hot💻👕MobileFastTargetSpecialDealPriceCelebration]+/.test(cleanLine)) continue; // Skip emoji-only lines
      
      // This looks like a product name
      if (cleanLine.length > 10 && cleanLine.length < 150) {
        return cleanLine.replace(/[Hot💻👕MobileFastTargetSpecialDealPriceCelebration#]/g, '').trim();
      }
    }
    
    // Fallback: extract from URL
    try {
      if (url.includes('amazon')) return 'Amazon Product Deal';
      if (url.includes('flipkart')) return 'Flipkart Special Offer';
      if (url.includes('myntra')) return 'Myntra Fashion Item';
      if (url.includes('ajio')) return 'Ajio Fashion Deal';
      if (url.includes('nykaa')) return 'Nykaa Beauty Product';
    } catch (e) {
      // Ignore
    }
    
    return 'Cuelinks Product Deal';
  }

  extractPrice(text) {
    // Enhanced price extraction patterns
    const pricePatterns = [
      /Price[:\s]*₹?\s*([0-9,]+)/i,
      /₹\s*([0-9,]+)/,
      /Rs\.?\s*([0-9,]+)/i,
      /([0-9,]+)\s*₹/,
      /Starting at ₹([0-9,]+)/i,
      /Special Price[:\s]*Rs\.?\s*([0-9,]+)/i,
      /Deal Price[:\s]*₹?\s*([0-9,]+)/i,
      /Offer Price[:\s]*₹?\s*([0-9,]+)/i,
      /Now[:\s]*₹?\s*([0-9,]+)/i
    ];
    
    for (const pattern of pricePatterns) {
      const match = text.match(pattern);
      if (match) {
        const price = parseInt(match[1].replace(/,/g, ''));
        if (price > 0 && price < 1000000) {
          return price;
        }
      }
    }
    
    // Default price based on URL domain
    if (text.includes('amazon')) return 1999;
    if (text.includes('flipkart')) return 1499;
    if (text.includes('myntra')) return 899;
    if (text.includes('ajio')) return 799;
    if (text.includes('nykaa')) return 599;
    
    return 999; // Default fallback
  }

  extractOriginalPrice(text) {
    // Look for original price patterns
    const originalPricePatterns = [
      /was ₹([0-9,]+)/i,
      /Original[:\s]*₹?\s*([0-9,]+)/i,
      /MRP[:\s]*₹?\s*([0-9,]+)/i,
      /Regular Price[:\s]*₹?\s*([0-9,]+)/i,
      /Before[:\s]*₹?\s*([0-9,]+)/i,
      /₹([0-9,]+).*₹([0-9,]+)/ // Two prices, second is usually original
    ];
    
    for (const pattern of originalPricePatterns) {
      const match = text.match(pattern);
      if (match) {
        let price = parseInt(match[1].replace(/,/g, ''));
        
        // If it's the two-price pattern, use the larger one as original
        if (pattern.source.includes('.*')) {
          const price2 = parseInt(match[2].replace(/,/g, ''));
          price = Math.max(price, price2);
        }
        
        if (price > 0 && price < 1000000) {
          return price;
        }
      }
    }
    
    return null;
  }

  extractDescription(text) {
    // Clean up text for description
    let description = text
      .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs
      .replace(/[Hot💻👕MobileFastTargetSpecialDealPriceCelebration#]/g, '') // Remove emojis
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
    
    if (description.length > 200) {
      description = description.substring(0, 200) + '...';
    }
    
    return description || 'Amazing product deal available via Cuelinks with great pricing and fast delivery.';
  }

  detectCategory(url, productName) {
    const name = productName.toLowerCase();
    
    // Electronics
    if (name.includes('laptop') || name.includes('computer') || name.includes('mobile') || name.includes('phone')) {
      return 'Electronics & Gadgets';
    }
    if (name.includes('earbuds') || name.includes('headphone') || name.includes('speaker') || name.includes('watch')) {
      return 'Electronics & Gadgets';
    }
    
    // Fashion
    if (name.includes('shirt') || name.includes('dress') || name.includes('jeans') || name.includes('shoes')) {
      return 'Fashion & Clothing';
    }
    if (name.includes('bag') || name.includes('wallet') || name.includes('sunglasses')) {
      return 'Fashion & Accessories';
    }
    
    // Beauty
    if (name.includes('cream') || name.includes('serum') || name.includes('makeup') || name.includes('lipstick')) {
      return 'Beauty & Personal Care';
    }
    
    // Home
    if (name.includes('kitchen') || name.includes('home') || name.includes('furniture')) {
      return 'Home & Kitchen';
    }
    
    // URL-based detection
    if (url.includes('myntra') || url.includes('ajio')) return 'Fashion & Clothing';
    if (url.includes('nykaa')) return 'Beauty & Personal Care';
    if (url.includes('amazon') || url.includes('flipkart')) return 'Electronics & Gadgets';
    
    return 'General';
  }

  getDefaultImage(url) {
    if (url.includes('amazon')) {
      return 'https://via.placeholder.com/300x300/FF9900/FFFFFF?text=Amazon+Deal';
    }
    if (url.includes('flipkart')) {
      return 'https://via.placeholder.com/300x300/047BD6/FFFFFF?text=Flipkart+Offer';
    }
    if (url.includes('myntra')) {
      return 'https://via.placeholder.com/300x300/FF3F6C/FFFFFF?text=Myntra+Fashion';
    }
    if (url.includes('ajio')) {
      return 'https://via.placeholder.com/300x300/B91372/FFFFFF?text=Ajio+Style';
    }
    if (url.includes('nykaa')) {
      return 'https://via.placeholder.com/300x300/FC2779/FFFFFF?text=Nykaa+Beauty';
    }
    
    return 'https://via.placeholder.com/300x300/6366F1/FFFFFF?text=Cuelinks+Deal';
  }

  createCuelinksUrl(originalUrl) {
    const encodedUrl = encodeURIComponent(originalUrl);
    return `https://linksredirect.com/?cid=243942&source=linkkit&url=${encodedUrl}`;
  }

  async insertProduct(productData) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO products (
          name, description, price, original_price, currency, image_url,
          affiliate_url, category, rating, review_count, discount, source,
          is_new, is_featured, display_pages, created_at, expires_at, telegram_message_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const values = [
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
        productData.source,
        productData.is_new,
        productData.is_featured,
        productData.display_pages,
        productData.created_at.toISOString(),
        productData.expires_at.toISOString(),
        productData.telegram_message_id
      ];
      
      this.db.run(sql, values, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  cleanup() {
    if (this.rl) {
      this.rl.close();
    }
    if (this.db) {
      this.db.close();
    }
    process.exit(0);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down...');
  process.exit(0);
});

// Start the interactive trigger
const trigger = new InstantAutopostTrigger();
trigger.start().catch((error) => {
  console.error('💥 Failed to start instant autopost trigger:', error);
  process.exit(1);
});