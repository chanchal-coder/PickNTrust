/**
 * Investigate Current Issues - UI, Data, Images, Affiliate Links
 * Comprehensive analysis of Global Picks UI, Deals Hub products, and data quality issues
 */

const Database = require('better-sqlite3');
const axios = require('axios');
const path = require('path');

const BASE_URL = 'http://localhost:5000';
const DB_PATH = path.join(__dirname, 'database.sqlite');

class CurrentIssuesInvestigator {
  constructor() {
    this.db = new Database(DB_PATH);
  }

  /**
   * Check Deals Hub API and database status
   */
  async checkDealsHubStatus() {
    console.log('Search Investigating Deals Hub Status...');
    console.log('=' .repeat(50));
    
    try {
      // Check database
      const dbCount = this.db.prepare('SELECT COUNT(*) as count FROM deals_hub_products').get().count;
      const activeCount = this.db.prepare(`
        SELECT COUNT(*) as count FROM deals_hub_products 
        WHERE processing_status = 'active'
      `).get().count;
      
      console.log(`Stats Database Status:`);
      console.log(`  • Total products: ${dbCount}`);
      console.log(`  • Active products: ${activeCount}`);
      
      // Check API response
      const response = await axios.get(`${BASE_URL}/api/products/page/deals-hub`);
      const apiProducts = response.data;
      
      console.log(`Global API Response:`);
      console.log(`  • Products returned: ${apiProducts.length}`);
      
      if (apiProducts.length === 0 && dbCount > 0) {
        console.log(`Error ISSUE: Database has ${dbCount} products but API returns 0`);
        
        // Check sample database products
        const sampleProducts = this.db.prepare(`
          SELECT id, name, processing_status, created_at 
          FROM deals_hub_products 
          ORDER BY created_at DESC 
          LIMIT 3
        `).all();
        
        console.log(`📋 Sample database products:`);
        sampleProducts.forEach((product, index) => {
          console.log(`  ${index + 1}. ${product.name} (status: ${product.processing_status})`);
        });
        
      } else if (apiProducts.length > 0) {
        console.log(`Success API working - sample product: ${apiProducts[0].name}`);
      }
      
    } catch (error) {
      console.log(`Error Error checking Deals Hub: ${error.message}`);
    }
  }

  /**
   * Check Global Picks UI and data
   */
  async checkGlobalPicksUI() {
    console.log('\nSearch Investigating Global Picks UI and Data...');
    console.log('=' .repeat(50));
    
    try {
      const response = await axios.get(`${BASE_URL}/api/products/page/global-picks`);
      const products = response.data;
      
      console.log(`Stats Global Picks API Response: ${products.length} products`);
      
      if (products.length > 0) {
        const sampleProduct = products[0];
        
        console.log(`\nProducts Sample Global Picks Product:`);
        console.log(`  • Name: ${sampleProduct.name}`);
        console.log(`  • Price: ${sampleProduct.price}`);
        console.log(`  • Original Price: ${sampleProduct.originalPrice || 'Not set'}`);
        console.log(`  • Image: ${sampleProduct.imageUrl}`);
        console.log(`  • Affiliate URL: ${sampleProduct.affiliateUrl}`);
        console.log(`  • Original URL: ${sampleProduct.originalUrl}`);
        
        // Check if it looks like Amazon product
        const isAmazonProduct = sampleProduct.originalUrl && sampleProduct.originalUrl.includes('amazon');
        console.log(`  • Is Amazon Product: ${isAmazonProduct}`);
        
        if (isAmazonProduct) {
          console.log(`Tip RECOMMENDATION: Global Picks should use Amazon product card UI`);
        }
        
      } else {
        console.log(`Error No Global Picks products found`);
      }
      
    } catch (error) {
      console.log(`Error Error checking Global Picks: ${error.message}`);
    }
  }

  /**
   * Check image quality across all pages
   */
  async checkImageQuality() {
    console.log('\nSearch Investigating Image Quality Issues...');
    console.log('=' .repeat(50));
    
    const pages = [
      { name: 'prime-picks', description: 'Prime Picks' },
      { name: 'cue-picks', description: 'Cue Picks' },
      { name: 'value-picks', description: 'Value Picks' },
      { name: 'click-picks', description: 'Click Picks' },
      { name: 'global-picks', description: 'Global Picks' },
      { name: 'deals-hub', description: 'Deals Hub' },
      { name: 'lootbox', description: 'Loot Box' }
    ];
    
    let totalIssues = 0;
    
    for (const page of pages) {
      try {
        const response = await axios.get(`${BASE_URL}/api/products/page/${page.name}`);
        const products = response.data;
        
        console.log(`\nProducts ${page.description}: ${products.length} products`);
        
        if (products.length > 0) {
          const sampleProduct = products[0];
          const imageUrl = sampleProduct.imageUrl || sampleProduct.image_url;
          
          console.log(`  • Sample Image: ${imageUrl}`);
          
          // Check for image issues
          const imageIssues = [];
          
          if (!imageUrl) {
            imageIssues.push('Missing image URL');
          } else if (imageUrl.includes('placeholder')) {
            imageIssues.push('Using placeholder image');
          } else if (imageUrl.includes('example.com')) {
            imageIssues.push('Using example.com image');
          }
          
          if (imageIssues.length > 0) {
            console.log(`  Error Image Issues: ${imageIssues.join(', ')}`);
            totalIssues++;
          } else {
            console.log(`  Success Image looks good`);
          }
        }
        
      } catch (error) {
        console.log(`  Error Error checking ${page.description}: ${error.message}`);
      }
    }
    
    console.log(`\nStats Total pages with image issues: ${totalIssues}`);
  }

  /**
   * Check affiliate URL quality
   */
  async checkAffiliateURLs() {
    console.log('\nSearch Investigating Affiliate URL Issues...');
    console.log('=' .repeat(50));
    
    const pages = [
      { name: 'prime-picks', expectedTag: 'pickntrust03-21', platform: 'amazon' },
      { name: 'cue-picks', expectedTag: 'cid=243942', platform: 'cuelinks' },
      { name: 'value-picks', expectedTag: 'ref=4530348', platform: 'earnkaro' },
      { name: 'global-picks', expectedTag: 'pickntrust', platform: 'mixed' },
      { name: 'deals-hub', expectedTag: 'pickntrust', platform: 'mixed' }
    ];
    
    let totalIssues = 0;
    
    for (const page of pages) {
      try {
        const response = await axios.get(`${BASE_URL}/api/products/page/${page.name}`);
        const products = response.data;
        
        console.log(`\nProducts ${page.name}: ${products.length} products`);
        
        if (products.length > 0) {
          const sampleProduct = products[0];
          const affiliateUrl = sampleProduct.affiliateUrl || sampleProduct.affiliate_url;
          
          console.log(`  • Affiliate URL: ${affiliateUrl}`);
          
          // Check affiliate URL quality
          const affiliateIssues = [];
          
          if (!affiliateUrl) {
            affiliateIssues.push('Missing affiliate URL');
          } else if (!affiliateUrl.includes(page.expectedTag)) {
            affiliateIssues.push(`Missing expected tag: ${page.expectedTag}`);
          }
          
          if (affiliateIssues.length > 0) {
            console.log(`  Error Affiliate Issues: ${affiliateIssues.join(', ')}`);
            totalIssues++;
          } else {
            console.log(`  Success Affiliate URL looks good`);
          }
        }
        
      } catch (error) {
        console.log(`  Error Error checking ${page.name}: ${error.message}`);
      }
    }
    
    console.log(`\nStats Total pages with affiliate URL issues: ${totalIssues}`);
  }

  /**
   * Check pricing information
   */
  async checkPricingInfo() {
    console.log('\nSearch Investigating Pricing Information Issues...');
    console.log('=' .repeat(50));
    
    const pages = ['prime-picks', 'cue-picks', 'value-picks', 'click-picks', 'global-picks', 'deals-hub'];
    
    let totalIssues = 0;
    
    for (const page of pages) {
      try {
        const response = await axios.get(`${BASE_URL}/api/products/page/${page}`);
        const products = response.data;
        
        console.log(`\nProducts ${page}: ${products.length} products`);
        
        if (products.length > 0) {
          const sampleProduct = products[0];
          
          console.log(`  • Price: ${sampleProduct.price}`);
          console.log(`  • Original Price: ${sampleProduct.originalPrice || 'Not set'}`);
          console.log(`  • Currency: ${sampleProduct.currency}`);
          
          // Check pricing issues
          const pricingIssues = [];
          
          if (!sampleProduct.price) {
            pricingIssues.push('Missing price');
          }
          
          if (!sampleProduct.currency) {
            pricingIssues.push('Missing currency');
          }
          
          if (pricingIssues.length > 0) {
            console.log(`  Error Pricing Issues: ${pricingIssues.join(', ')}`);
            totalIssues++;
          } else {
            console.log(`  Success Pricing looks good`);
          }
        }
        
      } catch (error) {
        console.log(`  Error Error checking ${page}: ${error.message}`);
      }
    }
    
    console.log(`\nStats Total pages with pricing issues: ${totalIssues}`);
  }

  /**
   * Generate comprehensive recommendations
   */
  generateRecommendations() {
    console.log('\nTip COMPREHENSIVE ISSUE ANALYSIS & RECOMMENDATIONS');
    console.log('=' .repeat(60));
    
    console.log('\n🔧 **IDENTIFIED ISSUES:**');
    console.log('\n1. **Global Picks UI Issue:**');
    console.log('   • Should use Amazon product card UI like Prime Picks');
    console.log('   • Currently using generic product card');
    
    console.log('\n2. **Deals Hub Zero Products:**');
    console.log('   • Database has products but API returns 0');
    console.log('   • Likely API routing or query filtering issue');
    
    console.log('\n3. **Image Quality Issues:**');
    console.log('   • Some pages still using placeholder images');
    console.log('   • Wrong product images not matching actual products');
    
    console.log('\n4. **Affiliate URL Issues:**');
    console.log('   • Missing or incorrect affiliate tags');
    console.log('   • Wrong affiliate network URLs');
    
    console.log('\n5. **Pricing Information Issues:**');
    console.log('   • Missing original prices');
    console.log('   • Incorrect price formatting');
    
    console.log('\nSuccess **SOLUTIONS:**');
    console.log('\n1. **Fix Global Picks UI:**');
    console.log('   • Update frontend to use Amazon product card component');
    console.log('   • Ensure consistent UI across all Amazon-based pages');
    
    console.log('\n2. **Fix Deals Hub API:**');
    console.log('   • Debug API routing logic');
    console.log('   • Fix database query filtering');
    console.log('   • Ensure products are returned correctly');
    
    console.log('\n3. **Fix Images:**');
    console.log('   • Update placeholder images with real product images');
    console.log('   • Implement better image extraction from product URLs');
    
    console.log('\n4. **Fix Affiliate URLs:**');
    console.log('   • Update affiliate tag configuration');
    console.log('   • Ensure correct affiliate network URLs');
    
    console.log('\n5. **Fix Pricing:**');
    console.log('   • Add original price extraction');
    console.log('   • Implement proper price formatting');
    
    console.log('\nLaunch **PRIORITY ORDER:**');
    console.log('1. Fix Deals Hub zero products (high impact)');
    console.log('2. Fix Global Picks UI consistency (user experience)');
    console.log('3. Fix affiliate URLs (revenue impact)');
    console.log('4. Fix images and pricing (data quality)');
  }

  /**
   * Run complete investigation
   */
  async runCompleteInvestigation() {
    console.log('Launch Comprehensive Investigation of Current Issues');
    console.log('=' .repeat(60));
    
    // Check Deals Hub status
    await this.checkDealsHubStatus();
    
    // Check Global Picks UI
    await this.checkGlobalPicksUI();
    
    // Check image quality
    await this.checkImageQuality();
    
    // Check affiliate URLs
    await this.checkAffiliateURLs();
    
    // Check pricing info
    await this.checkPricingInfo();
    
    // Generate recommendations
    this.generateRecommendations();
    
    console.log('\nTarget **INVESTIGATION COMPLETE**');
    console.log('Ready to implement fixes based on findings above.');
  }

  cleanup() {
    if (this.db) {
      this.db.close();
    }
  }
}

// Run the investigation
async function runInvestigation() {
  const investigator = new CurrentIssuesInvestigator();
  
  try {
    await investigator.runCompleteInvestigation();
  } catch (error) {
    console.error('Error Investigation failed:', error.message);
  } finally {
    investigator.cleanup();
  }
}

if (require.main === module) {
  runInvestigation();
}

module.exports = { CurrentIssuesInvestigator, runInvestigation };