/**
 * Simplified Cue Picks Bot - Direct Message Processing
 * Bypasses complex URL processing for reliable autoposting
 */

const TelegramBot = require('node-telegram-bot-api');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: '.env.cue-picks' });

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN_CUE_PICKS;
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID_CUE_PICKS;
const DATABASE_PATH = path.join(__dirname, 'database.sqlite');

if (!BOT_TOKEN || !CHANNEL_ID) {
  console.error('Error Missing bot token or channel ID');
  process.exit(1);
}

class SimpleCuePicksBot {
  constructor() {
    this.bot = null;
    this.db = null;
    this.isRunning = false;
  }

  async start() {
    console.log('Launch Starting Simplified Cue Picks Bot...');
    
    try {
      // Initialize database
      await this.initDatabase();
      
      // Initialize bot
      this.bot = new TelegramBot(BOT_TOKEN, { polling: true });
      
      // Setup message listener
      this.bot.on('channel_post', (msg) => {
        this.processMessage(msg);
      });
      
      this.bot.on('message', (msg) => {
        if (msg.chat.id.toString() === CHANNEL_ID) {
          this.processMessage(msg);
        }
      });
      
      this.isRunning = true;
      console.log('Success Simplified Cue Picks Bot started successfully!');
      console.log(`Mobile Monitoring channel: ${CHANNEL_ID}`);
      
    } catch (error) {
      console.error('Error Failed to start bot:', error.message);
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

  async processMessage(message) {
    try {
      if (!message.text) return;
      
      console.log('\n📨 New message received:');
      console.log(`Blog Text: ${message.text.substring(0, 100)}...`);
      
      // Extract URLs from message
      const urls = this.extractUrls(message.text);
      
      if (urls.length === 0) {
        console.log('Warning No URLs found in message');
        return;
      }
      
      console.log(`Link Found ${urls.length} URL(s)`);
      
      // Process each URL
      for (const url of urls) {
        await this.createSimpleProduct(url, message);
      }
      
    } catch (error) {
      console.error('Error Error processing message:', error.message);
    }
  }

  extractUrls(text) {
    const urlRegex = /https?:\/\/[^\s]+/g;
    return text.match(urlRegex) || [];
  }

  async createSimpleProduct(url, message) {
    try {
      console.log(`\nRefresh Creating product for: ${url}`);
      
      // Extract basic info from message
      const productName = this.extractProductName(message.text, url);
      const price = this.extractPrice(message.text);
      const description = this.extractDescription(message.text);
      
      // Create Cuelinks affiliate URL
      const affiliateUrl = this.createCuelinksUrl(url);
      
      // Create product data
      const productData = {
        name: productName,
        description: description,
        price: price.toString(),
        original_price: null,
        currency: 'INR',
        image_url: 'https://via.placeholder.com/300x300?text=Product+Image',
        affiliate_url: affiliateUrl,
        category: 'General',
        rating: '4.5',
        review_count: 100,
        discount: null,
        source: 'cue-picks-simple',
        is_new: 1,
        is_featured: 1,
        display_pages: JSON.stringify(['cue-picks']),
        created_at: new Date(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        telegram_message_id: message.message_id
      };
      
      // Insert into database
      await this.insertProduct(productData);
      
      console.log(`Success Product created: ${productName}`);
      console.log(`Price Price: ₹${price}`);
      console.log(`Link Affiliate URL: ${affiliateUrl}`);
      
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
      
      // Skip URLs and short lines
      if (cleanLine.includes('http') || cleanLine.length < 10) continue;
      
      // Skip lines with only symbols or numbers
      if (!/[a-zA-Z]/.test(cleanLine)) continue;
      
      // This looks like a product name
      if (cleanLine.length > 10 && cleanLine.length < 100) {
        return cleanLine.replace(/[^a-zA-Z0-9\s\-]/g, '').trim();
      }
    }
    
    // Fallback: extract from URL
    try {
      const urlParts = url.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      if (lastPart && lastPart.length > 5) {
        return lastPart.replace(/[^a-zA-Z0-9\s\-]/g, ' ').trim();
      }
    } catch (e) {
      // Ignore
    }
    
    return 'Product from Cuelinks';
  }

  extractPrice(text) {
    // Enhanced price extraction patterns
    const pricePatterns = [
      /₹\s*([0-9,]+)/,
      /Rs\.?\s*([0-9,]+)/i,
      /Price[:\s]*₹?\s*([0-9,]+)/i,
      /([0-9,]+)\s*₹/,
      /\$\s*([0-9,]+)/
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
    
    return 999; // Default fallback
  }

  extractDescription(text) {
    // Clean up text for description
    let description = text
      .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs
      .replace(/[^a-zA-Z0-9\s\.,!?\-]/g, ' ') // Remove special chars
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
    
    if (description.length > 200) {
      description = description.substring(0, 200) + '...';
    }
    
    return description || 'Great product available via Cuelinks with attractive pricing.';
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
          console.log(`Save Product saved with ID: ${this.lastID}`);
          resolve(this.lastID);
        }
      });
    });
  }

  stop() {
    console.log('Stop Stopping Simplified Cue Picks Bot...');
    
    if (this.bot) {
      this.bot.stopPolling();
    }
    
    if (this.db) {
      this.db.close();
    }
    
    this.isRunning = false;
    console.log('Success Bot stopped');
  }
}

// Create and start the bot
const bot = new SimpleCuePicksBot();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nStop Received SIGINT, shutting down...');
  bot.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nStop Received SIGTERM, shutting down...');
  bot.stop();
  process.exit(0);
});

// Start the bot
bot.start().catch((error) => {
  console.error('💥 Failed to start Simplified Cue Picks Bot:', error);
  process.exit(1);
});

console.log('\nTarget Simplified Cue Picks Bot');
console.log('📋 Features:');
console.log('  Success Direct message processing');
console.log('  Success Simple URL extraction');
console.log('  Success Basic price detection');
console.log('  Success Cuelinks affiliate conversion');
console.log('  Success Automatic product creation');
console.log('  Success No complex scraping or URL expansion');
console.log('\nLaunch Ready for autoposting!');