/**
 * Check Image URLs Across All Bot Pages
 * Investigate wrong image issues in all pages except Prime Picks
 */

const Database = require('better-sqlite3');
const axios = require('axios');
const path = require('path');

const BASE_URL = 'http://localhost:5000';
const DB_PATH = path.join(__dirname, 'database.sqlite');

class ImageURLChecker {
  constructor() {
    this.db = new Database(DB_PATH);
  }

  /**
   * Check image URLs in all bot tables
   */
  checkAllImageURLs() {
    console.log('🖼️ Checking Image URLs Across All Bot Pages...');
    console.log('=' .repeat(60));
    
    const tables = [
      { name: 'amazon_products', page: 'prime-picks', description: 'Prime Picks (Working)' },
      { name: 'cuelinks_products', page: 'cue-picks', description: 'Cue Picks' },
      { name: 'value_picks_products', page: 'value-picks', description: 'Value Picks' },
      { name: 'click_picks_products', page: 'click-picks', description: 'Click Picks' },
      { name: 'global_picks_products', page: 'global-picks', description: 'Global Picks' },
      { name: 'deals_hub_products', page: 'deals-hub', description: 'Deals Hub' },
      { name: 'loot_box_products', page: 'lootbox', description: 'Loot Box' }
    ];
    
    let totalIssues = 0;
    
    tables.forEach(table => {
      console.log(`\nProducts ${table.description} (${table.name})`);
      const issues = this.checkTableImages(table.name, table.page);
      totalIssues += issues;
    });
    
    console.log(`\nStats Total Image Issues Found: ${totalIssues}`);
    return totalIssues;
  }

  /**
   * Check images in specific table
   */
  checkTableImages(tableName, pageName) {
    try {
      const products = this.db.prepare(`
        SELECT id, name, image_url, original_url, affiliate_url, created_at 
        FROM ${tableName} 
        ORDER BY created_at DESC 
        LIMIT 5
      `).all();
      
      if (products.length === 0) {
        console.log('  📭 No products found');
        return 0;
      }
      
      let issues = 0;
      
      products.forEach((product, index) => {
        console.log(`\n  Search Product ${index + 1}: ${product.name}`);
        console.log(`     Image URL: ${product.image_url}`);
        console.log(`     Original URL: ${product.original_url}`);
        
        // Analyze image URL
        const imageIssues = this.analyzeImageURL(product.image_url, product.original_url, product.name);
        
        if (imageIssues.length > 0) {
          console.log(`     Warning Image Issues:`);
          imageIssues.forEach(issue => {
            console.log(`       - ${issue}`);
          });
          issues++;
        } else {
          console.log(`     Success Image URL looks correct`);
        }
      });
      
      return issues;
      
    } catch (error) {
      console.log(`  Error Error checking ${tableName}: ${error.message}`);
      return 0;
    }
  }

  /**
   * Analyze image URL for issues
   */
  analyzeImageURL(imageUrl, originalUrl, productName) {
    const issues = [];
    
    if (!imageUrl) {
      issues.push('Missing image URL');
      return issues;
    }
    
    // Check for placeholder images
    if (imageUrl.includes('placeholder') || imageUrl.includes('via.placeholder.com')) {
      issues.push('Using placeholder image instead of real product image');
    }
    
    // Check for generic/wrong images
    if (imageUrl.includes('example.com')) {
      issues.push('Using example.com placeholder');
    }
    
    // Check if image URL matches the product source
    if (originalUrl) {
      const productDomain = this.extractDomain(originalUrl);
      const imageDomain = this.extractDomain(imageUrl);
      
      if (productDomain && imageDomain) {
        // For Amazon products, image should be from Amazon CDN
        if (productDomain.includes('amazon') && !imageDomain.includes('amazon') && !imageDomain.includes('ssl-images-amazon')) {
          issues.push(`Image not from Amazon CDN (product: ${productDomain}, image: ${imageDomain})`);
        }
        
        // For Flipkart products, image should be from Flipkart CDN
        if (productDomain.includes('flipkart') && !imageDomain.includes('flipkart') && !imageDomain.includes('rukminim')) {
          issues.push(`Image not from Flipkart CDN (product: ${productDomain}, image: ${imageDomain})`);
        }
        
        // For Deodap products, image should be from Deodap or Shopify CDN
        if (productDomain.includes('deodap') && !imageDomain.includes('deodap') && !imageDomain.includes('shopify')) {
          issues.push(`Image not from Deodap/Shopify CDN (product: ${productDomain}, image: ${imageDomain})`);
        }
      }
    }
    
    // Check for broken or invalid URLs
    try {
      new URL(imageUrl);
    } catch (error) {
      issues.push('Invalid image URL format');
    }
    
    return issues;
  }

  /**
   * Extract domain from URL
   */
  extractDomain(url) {
    try {
      return new URL(url).hostname;
    } catch (error) {
      return null;
    }
  }

  /**
   * Test image URLs by making HTTP requests
   */
  async testImageAccessibility() {
    console.log('\nGlobal Testing Image URL Accessibility...');
    
    const tables = ['amazon_products', 'cuelinks_products', 'value_picks_products', 'global_picks_products', 'deals_hub_products', 'loot_box_products'];
    
    for (const table of tables) {
      try {
        const products = this.db.prepare(`
          SELECT name, image_url 
          FROM ${table} 
          WHERE image_url IS NOT NULL 
          ORDER BY created_at DESC 
          LIMIT 2
        `).all();
        
        if (products.length > 0) {
          console.log(`\nProducts Testing ${table}:`);
          
          for (const product of products) {
            try {
              const response = await axios.head(product.image_url, { timeout: 5000 });
              const contentType = response.headers['content-type'] || '';
              
              if (contentType.startsWith('image/')) {
                console.log(`  Success ${product.name}: Image accessible (${contentType})`);
              } else {
                console.log(`  Warning ${product.name}: Not an image (${contentType})`);
              }
            } catch (error) {
              console.log(`  Error ${product.name}: Image not accessible (${error.message})`);
            }
            
            // Wait between requests
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      } catch (error) {
        console.log(`  Error Error testing ${table}: ${error.message}`);
      }
    }
  }

  /**
   * Compare with API responses
   */
  async compareWithAPIResponses() {
    console.log('\nSearch Comparing Database Images with API Responses...');
    
    const pages = [
      { name: 'prime-picks', description: 'Prime Picks (Reference)' },
      { name: 'cue-picks', description: 'Cue Picks' },
      { name: 'value-picks', description: 'Value Picks' },
      { name: 'global-picks', description: 'Global Picks' },
      { name: 'deals-hub', description: 'Deals Hub' },
      { name: 'lootbox', description: 'Loot Box' }
    ];
    
    for (const page of pages) {
      try {
        const response = await axios.get(`${BASE_URL}/api/products/page/${page.name}`);
        const products = response.data;
        
        console.log(`\nStats ${page.description}:`);
        console.log(`  Products in API: ${products.length}`);
        
        if (products.length > 0) {
          const firstProduct = products[0];
          const imageUrl = firstProduct.imageUrl || firstProduct.image_url;
          
          console.log(`  Sample Product: ${firstProduct.name}`);
          console.log(`  Sample Image: ${imageUrl}`);
          
          if (imageUrl) {
            const imageDomain = this.extractDomain(imageUrl);
            console.log(`  Image Domain: ${imageDomain}`);
            
            // Check if it's a placeholder
            if (imageUrl.includes('placeholder') || imageUrl.includes('example.com')) {
              console.log(`  Warning Using placeholder image`);
            } else {
              console.log(`  Success Real product image`);
            }
          } else {
            console.log(`  Error No image URL found`);
          }
        }
        
      } catch (error) {
        console.log(`  Error API Error for ${page.name}: ${error.message}`);
      }
    }
  }

  /**
   * Generate image fix recommendations
   */
  generateImageFixRecommendations() {
    console.log('\nTip IMAGE FIX RECOMMENDATIONS');
    console.log('=' .repeat(50));
    
    console.log('\n🔧 **Common Image Issues:**');
    console.log('1. **Placeholder Images**: Bots using generic placeholders instead of real images');
    console.log('2. **Wrong CDN**: Images not from the correct source (Amazon, Flipkart, etc.)');
    console.log('3. **Broken URLs**: Invalid or inaccessible image URLs');
    console.log('4. **Missing Extraction**: Bot not extracting images from product pages');
    
    console.log('\nSuccess **Solutions:**');
    console.log('1. **Fix Image Extraction Logic**: Update bot scraping to get real product images');
    console.log('2. **Validate Image URLs**: Check if images are accessible before saving');
    console.log('3. **Use Correct Selectors**: Update CSS selectors for each platform');
    console.log('4. **Fallback Images**: Provide platform-specific fallbacks');
    
    console.log('\nAI **Bot-Specific Fixes:**');
    console.log('• **Cue Picks**: Fix Flipkart image extraction');
    console.log('• **Value Picks**: Fix Myntra image extraction');
    console.log('• **Global Picks**: Fix multi-platform image handling');
    console.log('• **Deals Hub**: Fix general e-commerce image extraction');
    console.log('• **Loot Box**: Fix Deodap image extraction');
    
    console.log('\nBlog **Next Steps:**');
    console.log('1. Update image extraction logic in each bot');
    console.log('2. Test with real product URLs');
    console.log('3. Verify images display correctly on website');
    console.log('4. Add image validation before database insertion');
  }

  /**
   * Run complete image analysis
   */
  async runCompleteImageAnalysis() {
    console.log('Launch Complete Image URL Analysis - All Bot Pages');
    console.log('=' .repeat(60));
    
    // Check database image URLs
    const totalIssues = this.checkAllImageURLs();
    
    // Test image accessibility
    await this.testImageAccessibility();
    
    // Compare with API responses
    await this.compareWithAPIResponses();
    
    // Generate recommendations
    this.generateImageFixRecommendations();
    
    console.log('\nTarget **ANALYSIS COMPLETE**');
    if (totalIssues > 0) {
      console.log(`Warning Found ${totalIssues} image issues that need fixing`);
    } else {
      console.log('Success No obvious image issues detected');
    }
    
    return totalIssues;
  }

  cleanup() {
    if (this.db) {
      this.db.close();
    }
  }
}

// Run the analysis
async function runAnalysis() {
  const checker = new ImageURLChecker();
  
  try {
    const issues = await checker.runCompleteImageAnalysis();
    process.exit(issues > 0 ? 1 : 0);
  } catch (error) {
    console.error('Error Analysis failed:', error.message);
    process.exit(1);
  } finally {
    checker.cleanup();
  }
}

if (require.main === module) {
  runAnalysis();
}

module.exports = { ImageURLChecker, runAnalysis };