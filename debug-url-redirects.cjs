/**
 * Debug URL Redirect Issues
 * Check affiliate URLs vs original URLs to identify redirect problems
 */

const Database = require('better-sqlite3');
const axios = require('axios');
const path = require('path');

const DB_PATH = path.join(__dirname, 'database.sqlite');

class URLRedirectDebugger {
  constructor() {
    this.db = new Database(DB_PATH);
  }

  /**
   * Check all products for URL issues
   */
  checkAllProductURLs() {
    console.log('Search Debugging URL Redirect Issues...');
    console.log('=' .repeat(50));
    
    const tables = [
      'amazon_products', 'cuelinks_products', 'value_picks_products',
      'click_picks_products', 'global_picks_products', 'deals_hub_products',
      'loot_box_products'
    ];
    
    let totalIssues = 0;
    
    tables.forEach(table => {
      console.log(`\nProducts Checking ${table}...`);
      const issues = this.checkTableURLs(table);
      totalIssues += issues;
    });
    
    console.log(`\nStats Total URL Issues Found: ${totalIssues}`);
    return totalIssues;
  }

  /**
   * Check URLs in specific table
   */
  checkTableURLs(tableName) {
    try {
      const products = this.db.prepare(`
        SELECT id, name, original_url, affiliate_url 
        FROM ${tableName} 
        ORDER BY created_at DESC 
        LIMIT 10
      `).all();
      
      if (products.length === 0) {
        console.log('  📭 No products found');
        return 0;
      }
      
      let issues = 0;
      
      products.forEach((product, index) => {
        console.log(`\n  Link Product ${index + 1}: ${product.name}`);
        console.log(`     Original: ${product.original_url}`);
        console.log(`     Affiliate: ${product.affiliate_url}`);
        
        // Check for common issues
        const urlIssues = this.analyzeURLs(product.original_url, product.affiliate_url);
        
        if (urlIssues.length > 0) {
          console.log(`     Warning Issues found:`);
          urlIssues.forEach(issue => {
            console.log(`       - ${issue}`);
          });
          issues++;
        } else {
          console.log(`     Success URLs look correct`);
        }
      });
      
      return issues;
      
    } catch (error) {
      console.log(`  Error Error checking ${tableName}: ${error.message}`);
      return 0;
    }
  }

  /**
   * Analyze URLs for common issues
   */
  analyzeURLs(originalUrl, affiliateUrl) {
    const issues = [];
    
    if (!originalUrl) {
      issues.push('Missing original URL');
    }
    
    if (!affiliateUrl) {
      issues.push('Missing affiliate URL');
    }
    
    if (originalUrl && affiliateUrl) {
      // Check if affiliate URL contains original product ID
      const originalProductId = this.extractProductId(originalUrl);
      const affiliateProductId = this.extractProductId(affiliateUrl);
      
      if (originalProductId && affiliateProductId) {
        if (originalProductId !== affiliateProductId) {
          issues.push(`Product ID mismatch: ${originalProductId} vs ${affiliateProductId}`);
        }
      }
      
      // Check for Amazon-specific issues
      if (originalUrl.includes('amazon')) {
        if (!affiliateUrl.includes('tag=pickntrust')) {
          issues.push('Missing Amazon affiliate tag');
        }
        
        // Check if affiliate URL points to different domain
        const originalDomain = this.extractDomain(originalUrl);
        const affiliateDomain = this.extractDomain(affiliateUrl);
        
        if (originalDomain !== affiliateDomain) {
          issues.push(`Domain mismatch: ${originalDomain} vs ${affiliateDomain}`);
        }
      }
      
      // Check for CueLinks issues
      if (affiliateUrl.includes('linksredirect.com')) {
        try {
          const encodedUrl = new URL(affiliateUrl).searchParams.get('url');
          if (encodedUrl) {
            const decodedUrl = decodeURIComponent(encodedUrl);
            const decodedProductId = this.extractProductId(decodedUrl);
            
            if (originalProductId && decodedProductId && originalProductId !== decodedProductId) {
              issues.push(`CueLinks encoding issue: ${originalProductId} vs ${decodedProductId}`);
            }
          }
        } catch (error) {
          issues.push('Invalid CueLinks URL format');
        }
      }
    }
    
    return issues;
  }

  /**
   * Extract product ID from URL
   */
  extractProductId(url) {
    if (!url) return null;
    
    // Amazon product ID patterns
    const amazonMatch = url.match(/\/dp\/([A-Z0-9]{10})/);
    if (amazonMatch) return amazonMatch[1];
    
    // Flipkart product ID patterns
    const flipkartMatch = url.match(/\/p\/([a-zA-Z0-9]+)/);
    if (flipkartMatch) return flipkartMatch[1];
    
    // Generic product ID patterns
    const genericMatch = url.match(/product[\/-]([a-zA-Z0-9-_]+)/);
    if (genericMatch) return genericMatch[1];
    
    return null;
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
   * Test specific URLs
   */
  async testSpecificURLs() {
    console.log('\n🧪 Testing Specific URL Conversions...');
    
    const testUrls = [
      'https://www.amazon.in/dp/B08N5WRWNW',
      'https://www.amazon.in/dp/B07HGJJ586',
      'https://www.flipkart.com/apple-iphone-13/p/itm6c601e0a58b3c'
    ];
    
    for (const url of testUrls) {
      console.log(`\nLink Testing: ${url}`);
      
      // Simulate affiliate conversion
      const affiliateUrl = this.simulateAffiliateConversion(url);
      console.log(`   Converted: ${affiliateUrl}`);
      
      // Check for issues
      const issues = this.analyzeURLs(url, affiliateUrl);
      if (issues.length > 0) {
        console.log(`   Warning Issues:`);
        issues.forEach(issue => console.log(`     - ${issue}`));
      } else {
        console.log(`   Success Conversion looks correct`);
      }
    }
  }

  /**
   * Simulate affiliate conversion
   */
  simulateAffiliateConversion(url) {
    if (url.includes('amazon.in')) {
      // Add Amazon affiliate tag
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}tag=pickntrust03-21`;
    }
    
    if (url.includes('flipkart.com')) {
      // CueLinks conversion
      const encodedUrl = encodeURIComponent(url);
      return `https://linksredirect.com/?cid=243942&source=linkkit&url=${encodedUrl}`;
    }
    
    return url; // No conversion for unknown domains
  }

  /**
   * Check current API responses
   */
  async checkAPIResponses() {
    console.log('\nGlobal Checking Current API Responses...');
    
    try {
      const response = await axios.get('http://localhost:5000/api/products/page/prime-picks');
      const products = response.data;
      
      console.log(`Stats Found ${products.length} products in Prime Picks`);
      
      if (products.length > 0) {
        const product = products[0];
        console.log(`\nProducts Sample Product Analysis:`);
        console.log(`   Name: ${product.name}`);
        console.log(`   Original URL: ${product.originalUrl || product.original_url || 'Not available'}`);
        console.log(`   Affiliate URL: ${product.affiliateUrl || product.affiliate_url || 'Not available'}`);
        
        // Test the affiliate URL
        if (product.affiliateUrl || product.affiliate_url) {
          const affiliateUrl = product.affiliateUrl || product.affiliate_url;
          console.log(`\nSearch Affiliate URL Analysis:`);
          
          if (affiliateUrl.includes('amazon')) {
            const hasTag = affiliateUrl.includes('tag=pickntrust');
            console.log(`   Amazon Tag Present: ${hasTag ? 'Success' : 'Error'}`);
            
            const productId = this.extractProductId(affiliateUrl);
            console.log(`   Product ID: ${productId || 'Not found'}`);
          }
        }
      }
      
    } catch (error) {
      console.log(`Error API Error: ${error.message}`);
    }
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(totalIssues) {
    console.log('\nTip RECOMMENDATIONS');
    console.log('=' .repeat(30));
    
    if (totalIssues === 0) {
      console.log('Success No URL issues detected!');
      console.log('Celebration Your affiliate links should be working correctly.');
    } else {
      console.log('🔧 Issues detected. Here\'s how to fix them:');
      console.log('\n1. **Product ID Mismatches:**');
      console.log('   - Check URL processing logic in bot files');
      console.log('   - Ensure original URLs are preserved correctly');
      
      console.log('\n2. **Missing Affiliate Tags:**');
      console.log('   - Verify affiliate tag configuration in .env files');
      console.log('   - Check affiliate system implementation');
      
      console.log('\n3. **Domain Mismatches:**');
      console.log('   - Review URL redirect logic');
      console.log('   - Ensure affiliate URLs point to correct domains');
      
      console.log('\n4. **CueLinks Encoding Issues:**');
      console.log('   - Check URL encoding/decoding in CueLinks integration');
      console.log('   - Verify CueLinks API parameters');
    }
    
    console.log('\nSearch Next Steps:');
    console.log('1. Fix identified issues in bot code');
    console.log('2. Test with new URLs');
    console.log('3. Verify links open to correct products');
  }

  /**
   * Run complete debug analysis
   */
  async runCompleteDebug() {
    console.log('Launch URL Redirect Debug Analysis');
    console.log('=' .repeat(60));
    
    // Check database URLs
    const totalIssues = this.checkAllProductURLs();
    
    // Test specific URLs
    await this.testSpecificURLs();
    
    // Check API responses
    await this.checkAPIResponses();
    
    // Generate recommendations
    this.generateRecommendations(totalIssues);
    
    return totalIssues;
  }

  cleanup() {
    if (this.db) {
      this.db.close();
    }
  }
}

// Run the debug analysis
async function runDebug() {
  const urlDebugger = new URLRedirectDebugger();
  
  try {
    const issues = await urlDebugger.runCompleteDebug();
    process.exit(issues > 0 ? 1 : 0);
  } catch (error) {
    console.error('Error Debug failed:', error.message);
    process.exit(1);
  } finally {
    urlDebugger.cleanup();
  }
}

if (require.main === module) {
  runDebug();
}

module.exports = { URLRedirectDebugger, runDebug };