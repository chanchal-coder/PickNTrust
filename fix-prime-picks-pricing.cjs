/**
 * Fix Prime Picks Pricing and Discount Issues
 * Fixes both existing products and improves future extraction
 */

const Database = require('better-sqlite3');
const axios = require('axios');
const cheerio = require('cheerio');

class PrimePicksPricingFixer {
  constructor() {
    this.db = new Database('./database.sqlite');
  }

  /**
   * Fix existing products with incorrect pricing
   */
  async fixExistingProducts() {
    console.log('🔧 Fixing existing Prime Picks products...');
    
    // Get all Prime Picks products with pricing issues
    const products = this.db.prepare(`
      SELECT * FROM amazon_products 
      WHERE (original_price = price OR original_price IS NULL OR discount = 0)
      ORDER BY id DESC
    `).all();

    console.log(`Found ${products.length} products with pricing issues`);

    let fixed = 0;
    for (const product of products) {
      try {
        console.log(`\n📦 Fixing Product ID ${product.id}: ${product.name.substring(0, 50)}...`);
        
        // Re-extract pricing from the original URL
        const pricing = await this.extractCorrectPricing(product.affiliateUrl || product.originalUrl);
        
        if (pricing.originalPrice && pricing.originalPrice !== pricing.price) {
          // Calculate discount
          const currentPrice = parseFloat(pricing.price.replace('₹', ''));
          const originalPrice = parseFloat(pricing.originalPrice.replace('₹', ''));
          const discount = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
          
          // Update the product
          this.db.prepare(`
            UPDATE amazon_products 
            SET original_price = ?, discount = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(pricing.originalPrice, discount, product.id);
          
          console.log(`   ✅ Fixed: Price=${pricing.price}, Original=${pricing.originalPrice}, Discount=${discount}%`);
          fixed++;
        } else {
          console.log(`   ⚠️  No original price found for this product`);
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`   ❌ Error fixing product ${product.id}: ${error.message}`);
      }
    }
    
    console.log(`\n✅ Fixed ${fixed} products`);
  }

  /**
   * Extract correct pricing from Amazon URL
   */
  async extractCorrectPricing(url) {
    try {
      // Clean URL to get direct Amazon URL
      let cleanUrl = url;
      if (url.includes('tag=')) {
        cleanUrl = url.split('?')[0]; // Remove affiliate parameters for scraping
      }
      
      console.log(`   🔍 Scraping: ${cleanUrl}`);
      
      const response = await axios.get(cleanUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 10000
      });
      
      const $ = cheerio.load(response.data);
      
      return this.extractPricingFromPage($);
      
    } catch (error) {
      console.log(`   ⚠️  Scraping failed: ${error.message}`);
      return { price: null, originalPrice: null };
    }
  }

  /**
   * Improved pricing extraction logic
   */
  extractPricingFromPage($) {
    let currentPrice = null;
    let originalPrice = null;
    
    // Enhanced current price selectors
    const currentPriceSelectors = [
      '.a-price.a-text-price.a-size-medium.apexPriceToPay .a-offscreen',
      '.a-price-current .a-offscreen',
      '.a-price .a-offscreen',
      '#priceblock_dealprice',
      '#priceblock_ourprice',
      '.a-price-whole'
    ];
    
    // Enhanced original price selectors
    const originalPriceSelectors = [
      '.a-price.a-text-price.a-size-base.a-color-secondary .a-offscreen',
      '.a-price-was .a-offscreen',
      '.a-text-strike .a-offscreen',
      '#priceblock_was',
      '.a-price.a-text-price:not(.a-size-medium) .a-offscreen'
    ];
    
    // Extract current price
    for (const selector of currentPriceSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const priceText = element.text().trim();
        if (priceText) {
          const priceMatch = priceText.match(/[₹$€£¥]?([\d,]+(?:\.\d{2})?)/); 
          if (priceMatch) {
            const numPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
            if (numPrice > 0) {
              currentPrice = numPrice;
              console.log(`   💰 Current price: ₹${currentPrice}`);
              break;
            }
          }
        }
      }
    }
    
    // Extract original price (MRP)
    for (const selector of originalPriceSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const priceText = element.text().trim();
        if (priceText) {
          const priceMatch = priceText.match(/[₹$€£¥]?([\d,]+(?:\.\d{2})?)/); 
          if (priceMatch) {
            const numPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
            // Original price should be higher than current price
            if (numPrice > 0 && (!currentPrice || numPrice >= currentPrice)) {
              originalPrice = numPrice;
              console.log(`   🏷️  Original price: ₹${originalPrice}`);
              break;
            }
          }
        }
      }
    }
    
    // Alternative approach: Look for all prices and determine which is which
    if (!originalPrice && currentPrice) {
      const allPrices = [];
      $('.a-price .a-offscreen').each((i, el) => {
        const priceText = $(el).text().trim();
        const priceMatch = priceText.match(/₹([\d,]+(?:\.\d{2})?)/); 
        if (priceMatch) {
          const numPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
          if (numPrice > 0) {
            allPrices.push(numPrice);
          }
        }
      });
      
      // If we have multiple prices, the higher one is likely the original
      if (allPrices.length > 1) {
        const sortedPrices = [...new Set(allPrices)].sort((a, b) => b - a);
        if (sortedPrices[0] > currentPrice) {
          originalPrice = sortedPrices[0];
          console.log(`   🔍 Found original price from all prices: ₹${originalPrice}`);
        }
      }
    }
    
    return {
      price: currentPrice ? `₹${Math.floor(currentPrice)}` : null,
      originalPrice: originalPrice ? `₹${Math.floor(originalPrice)}` : null
    };
  }

  /**
   * Test the pricing extraction on a sample URL
   */
  async testPricingExtraction() {
    console.log('\n🧪 Testing pricing extraction...');
    
    // Get a recent product URL to test
    const product = this.db.prepare(`
      SELECT * FROM amazon_products 
      ORDER BY id DESC 
      LIMIT 1
    `).get();
    
    if (product) {
      console.log(`Testing with: ${product.name.substring(0, 50)}...`);
      const pricing = await this.extractCorrectPricing(product.affiliateUrl || product.originalUrl);
      console.log('Test result:', pricing);
    }
  }

  /**
   * Generate improved pricing extraction code for the bot
   */
  generateImprovedCode() {
    console.log('\n📝 Improved pricing extraction code:');
    console.log(`
/**
 * Improved pricing extraction with better original price detection
 */
private extractPricing($: cheerio.Root): { price: string; originalPrice?: string; currency: string } {
  let currency = 'INR';
  let currentPrice: number | null = null;
  let originalPrice: number | null = null;

  // Current price selectors (unchanged)
  const currentPriceSelectors = [
    '.a-price.a-text-price.a-size-medium.apexPriceToPay .a-offscreen',
    '.a-price-current .a-offscreen',
    '.a-price .a-offscreen',
    '#priceblock_dealprice',
    '#priceblock_ourprice',
    '.a-price-whole'
  ];

  // Enhanced original price selectors
  const originalPriceSelectors = [
    '.a-price.a-text-price.a-size-base.a-color-secondary .a-offscreen',
    '.a-price-was .a-offscreen',
    '.a-text-strike .a-offscreen',
    '#priceblock_was',
    '.a-price.a-text-price:not(.a-size-medium) .a-offscreen'
  ];

  // Extract current price (unchanged logic)
  for (const selector of currentPriceSelectors) {
    const element = $(selector).first();
    if (element.length > 0) {
      const priceText = element.text().trim();
      if (priceText) {
        const priceMatch = priceText.match(/[₹$€£¥]?([\\d,]+(?:\\\\d{2})?)/); 
        if (priceMatch) {
          const numPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
          if (numPrice > 0) {
            currentPrice = numPrice;
            if (priceText.includes('₹')) currency = 'INR';
            break;
          }
        }
      }
    }
  }

  // Extract original price with improved logic
  for (const selector of originalPriceSelectors) {
    const element = $(selector).first();
    if (element.length > 0) {
      const priceText = element.text().trim();
      if (priceText) {
        const priceMatch = priceText.match(/[₹$€£¥]?([\\d,]+(?:\\\\d{2})?)/); 
        if (priceMatch) {
          const numPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
          // Original price should be >= current price (allow equal for no discount)
          if (numPrice > 0 && (!currentPrice || numPrice >= currentPrice)) {
            originalPrice = numPrice;
            break;
          }
        }
      }
    }
  }

  // Fallback: collect all prices and find the highest one as original
  if (!originalPrice && currentPrice) {
    const allPrices = [];
    $('.a-price .a-offscreen').each((i, el) => {
      const priceText = $(el).text().trim();
      const priceMatch = priceText.match(/₹([\\d,]+(?:\\\\d{2})?)/); 
      if (priceMatch) {
        const numPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
        if (numPrice > 0) {
          allPrices.push(numPrice);
        }
      }
    });
    
    if (allPrices.length > 1) {
      const sortedPrices = [...new Set(allPrices)].sort((a, b) => b - a);
      if (sortedPrices[0] > currentPrice) {
        originalPrice = sortedPrices[0];
      }
    }
  }

  const price = currentPrice ? \`₹\${Math.floor(currentPrice)}\` : '₹999';
  const originalPriceFormatted = originalPrice ? \`₹\${Math.floor(originalPrice)}\` : undefined;

  return { 
    price, 
    originalPrice: originalPriceFormatted, 
    currency 
  };
}
`);
  }

  close() {
    this.db.close();
  }
}

// Run the fixer
async function main() {
  const fixer = new PrimePicksPricingFixer();
  
  try {
    console.log('🚀 Starting Prime Picks Pricing Fix...');
    
    // Fix existing products
    await fixer.fixExistingProducts();
    
    // Test the extraction
    await fixer.testPricingExtraction();
    
    // Show improved code
    fixer.generateImprovedCode();
    
    console.log('\n✅ Prime Picks pricing fix completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    fixer.close();
  }
}

main().catch(console.error);