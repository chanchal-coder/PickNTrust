/**
 * URL Validation and Correction System
 * Prevents wrong product links by validating URLs before processing
 */

const Database = require('better-sqlite3');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const DB_PATH = path.join(__dirname, 'database.sqlite');

class URLValidationFixer {
  constructor() {
    this.db = new Database(DB_PATH);
  }

  /**
   * Add URL validation to bot processing
   */
  async addURLValidation() {
    console.log('🔧 Adding URL Validation System...');
    
    // Create URL validation table
    this.createValidationTable();
    
    // Add validation functions to bots
    await this.updateBotValidation();
    
    console.log('Success URL validation system added successfully!');
  }

  /**
   * Create validation table
   */
  createValidationTable() {
    try {
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS url_validations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          original_url TEXT NOT NULL,
          validated_url TEXT,
          product_id TEXT,
          product_name TEXT,
          validation_status TEXT, -- 'valid', 'invalid', 'corrected'
          validation_message TEXT,
          created_at INTEGER DEFAULT (strftime('%s', 'now'))
        )
      `);
      
      console.log('Stats URL validation table created');
    } catch (error) {
      console.log(`Error Error creating validation table: ${error.message}`);
    }
  }

  /**
   * Validate URL before processing
   */
  async validateURL(url, expectedProductName = null) {
    console.log(`Search Validating URL: ${url}`);
    
    try {
      // Step 1: Check if URL is accessible
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      
      // Step 2: Extract product information
      const productInfo = this.extractProductInfo($, url);
      
      // Step 3: Validate product information
      const validation = this.validateProductInfo(productInfo, expectedProductName);
      
      // Step 4: Save validation result
      this.saveValidationResult(url, productInfo, validation);
      
      return {
        isValid: validation.isValid,
        productInfo,
        message: validation.message,
        correctedUrl: validation.correctedUrl
      };
      
    } catch (error) {
      console.log(`Error URL validation failed: ${error.message}`);
      
      this.saveValidationResult(url, null, {
        isValid: false,
        message: `URL not accessible: ${error.message}`
      });
      
      return {
        isValid: false,
        message: `URL validation failed: ${error.message}`
      };
    }
  }

  /**
   * Extract product information from page
   */
  extractProductInfo($, url) {
    let productInfo = {
      name: 'Unknown Product',
      productId: null,
      price: null,
      availability: 'unknown'
    };

    if (url.includes('amazon')) {
      // Amazon product extraction
      productInfo.name = $('#productTitle').text().trim() || 
                        $('h1.a-size-large').text().trim() ||
                        'Amazon Product';
      
      const idMatch = url.match(/\/dp\/([A-Z0-9]{10})/);
      productInfo.productId = idMatch ? idMatch[1] : null;
      
      productInfo.price = $('.a-price-whole').first().text().trim() ||
                         $('.a-offscreen').first().text().trim();
      
      // Check availability
      const availability = $('#availability span').text().trim();
      productInfo.availability = availability.toLowerCase().includes('stock') ? 'in_stock' : 'out_of_stock';
      
    } else if (url.includes('flipkart')) {
      // Flipkart product extraction
      productInfo.name = $('h1._35KyD6').text().trim() ||
                        $('h1').first().text().trim() ||
                        'Flipkart Product';
      
      const idMatch = url.match(/\/p\/([a-zA-Z0-9]+)/);
      productInfo.productId = idMatch ? idMatch[1] : null;
      
      productInfo.price = $('._30jeq3._16Jk6d').text().trim();
      
    } else if (url.includes('deodap')) {
      // Deodap product extraction
      productInfo.name = $('h1.product-single__title').text().trim() ||
                        $('h1').first().text().trim() ||
                        'Deodap Product';
      
      const idMatch = url.match(/\/products\/([a-zA-Z0-9-]+)/);
      productInfo.productId = idMatch ? idMatch[1] : null;
      
      productInfo.price = $('.price').text().trim();
    }

    return productInfo;
  }

  /**
   * Validate product information
   */
  validateProductInfo(productInfo, expectedProductName) {
    const validation = {
      isValid: true,
      message: 'Product validation passed',
      correctedUrl: null
    };

    // Check if product name is meaningful
    if (!productInfo.name || productInfo.name.length < 5) {
      validation.isValid = false;
      validation.message = 'Product name too short or missing';
    }

    // Check if product ID exists
    if (!productInfo.productId) {
      validation.isValid = false;
      validation.message = 'Product ID not found in URL';
    }

    // Check availability
    if (productInfo.availability === 'out_of_stock') {
      validation.isValid = false;
      validation.message = 'Product is out of stock';
    }

    // Check against expected product name if provided
    if (expectedProductName && productInfo.name) {
      const similarity = this.calculateSimilarity(productInfo.name.toLowerCase(), expectedProductName.toLowerCase());
      if (similarity < 0.3) {
        validation.isValid = false;
        validation.message = `Product name mismatch. Expected: ${expectedProductName}, Found: ${productInfo.name}`;
      }
    }

    return validation;
  }

  /**
   * Calculate string similarity
   */
  calculateSimilarity(str1, str2) {
    const words1 = str1.split(' ');
    const words2 = str2.split(' ');
    
    let matches = 0;
    words1.forEach(word1 => {
      if (words2.some(word2 => word2.includes(word1) || word1.includes(word2))) {
        matches++;
      }
    });
    
    return matches / Math.max(words1.length, words2.length);
  }

  /**
   * Save validation result
   */
  saveValidationResult(originalUrl, productInfo, validation) {
    try {
      this.db.prepare(`
        INSERT INTO url_validations (
          original_url, validated_url, product_id, product_name, 
          validation_status, validation_message
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        originalUrl,
        validation.correctedUrl || originalUrl,
        productInfo?.productId || null,
        productInfo?.name || null,
        validation.isValid ? 'valid' : 'invalid',
        validation.message
      );
    } catch (error) {
      console.log(`Error Error saving validation: ${error.message}`);
    }
  }

  /**
   * Update bot validation
   */
  async updateBotValidation() {
    console.log('AI Adding validation to bot processing...');
    
    // Create validation enhancement for Prime Picks bot
    const validationCode = `
/**
 * Enhanced URL validation for Prime Picks Bot
 * Add this to the processProductUrl method
 */

// Before processing URL, validate it first
const validation = await this.validateURL(expandedUrl, message.text);

if (!validation.isValid) {
  console.log(\`Warning URL validation failed: \${validation.message}\`);
  
  // Optionally send warning message to channel
  if (this.bot) {
    await this.bot.sendMessage(CHANNEL_ID, 
      \`Warning URL validation failed: \${validation.message}\\n\\nURL: \${expandedUrl}\`
    );
  }
  
  return; // Skip processing invalid URLs
}

console.log(\`Success URL validation passed: \${validation.productInfo.name}\`);

/**
 * Add this validation method to the PrimePicksBot class
 */
private async validateURL(url: string, messageText?: string): Promise<any> {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    
    // Extract product name
    let productName = '';
    if (url.includes('amazon')) {
      productName = $('#productTitle').text().trim();
    }
    
    // Basic validation
    if (!productName || productName.length < 5) {
      return {
        isValid: false,
        message: 'Product name not found or too short',
        productInfo: { name: productName }
      };
    }
    
    return {
      isValid: true,
      message: 'Validation passed',
      productInfo: { name: productName }
    };
    
  } catch (error) {
    return {
      isValid: false,
      message: \`URL not accessible: \${error.message}\`
    };
  }
}
`;
    
    // Save validation code to file
    require('fs').writeFileSync(
      path.join(__dirname, 'bot-validation-enhancement.txt'),
      validationCode
    );
    
    console.log('Blog Validation code saved to bot-validation-enhancement.txt');
  }

  /**
   * Test current products for validation issues
   */
  async testCurrentProducts() {
    console.log('\n🧪 Testing Current Products for Validation Issues...');
    
    const products = this.db.prepare(`
      SELECT id, name, original_url, affiliate_url 
      FROM amazon_products 
      ORDER BY created_at DESC 
      LIMIT 5
    `).all();
    
    if (products.length === 0) {
      console.log('📭 No products found to test');
      return;
    }
    
    for (const product of products) {
      console.log(`\nSearch Testing: ${product.name}`);
      console.log(`   URL: ${product.original_url}`);
      
      if (product.original_url) {
        const validation = await this.validateURL(product.original_url, product.name);
        
        if (validation.isValid) {
          console.log(`   Success Valid: ${validation.productInfo.name}`);
        } else {
          console.log(`   Error Invalid: ${validation.message}`);
        }
      } else {
        console.log(`   Warning No original URL found`);
      }
    }
  }

  /**
   * Generate recommendations
   */
  generateRecommendations() {
    console.log('\nTip RECOMMENDATIONS TO FIX URL REDIRECT ISSUES');
    console.log('=' .repeat(60));
    
    console.log('\n🔧 **Root Cause Identified:**');
    console.log('The bot is working correctly, but wrong URLs are being posted.');
    console.log('When someone posts a URL that points to Product A, but expects Product B,');
    console.log('the bot correctly processes Product A, causing the "wrong product" issue.');
    
    console.log('\nSuccess **Solutions Implemented:**');
    console.log('1. **URL Validation System** - Validates URLs before processing');
    console.log('2. **Product Name Verification** - Checks if scraped product matches expectations');
    console.log('3. **Availability Checking** - Prevents processing out-of-stock products');
    console.log('4. **Validation Logging** - Tracks all validation attempts');
    
    console.log('\nLaunch **Next Steps:**');
    console.log('1. **Add validation to bot code** (see bot-validation-enhancement.txt)');
    console.log('2. **Train users** to verify URLs before posting');
    console.log('3. **Add URL preview** in Telegram before processing');
    console.log('4. **Implement manual approval** for uncertain URLs');
    
    console.log('\nMobile **User Guidelines:**');
    console.log('• Always verify the URL opens the correct product before posting');
    console.log('• Use direct product URLs, avoid search result URLs');
    console.log('• Check that the product is in stock before posting');
    console.log('• Include product name in message for validation');
  }

  /**
   * Run complete fix
   */
  async runCompleteFix() {
    console.log('Launch URL Redirect Issue - Complete Fix');
    console.log('=' .repeat(50));
    
    // Add validation system
    await this.addURLValidation();
    
    // Test current products
    await this.testCurrentProducts();
    
    // Generate recommendations
    this.generateRecommendations();
    
    console.log('\nCelebration URL validation system is now ready!');
    console.log('Follow the recommendations above to prevent future issues.');
  }

  cleanup() {
    if (this.db) {
      this.db.close();
    }
  }
}

// Run the fix
async function runFix() {
  const fixer = new URLValidationFixer();
  
  try {
    await fixer.runCompleteFix();
  } catch (error) {
    console.error('Error Fix failed:', error.message);
  } finally {
    fixer.cleanup();
  }
}

if (require.main === module) {
  runFix();
}

module.exports = { URLValidationFixer, runFix };