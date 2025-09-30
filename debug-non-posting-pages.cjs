/**
 * Debug Non-Posting Pages - Click Picks, Global Picks, Deals Hub
 * Investigate why these pages return 0 products despite having database data
 */

const Database = require('better-sqlite3');
const axios = require('axios');
const path = require('path');

const BASE_URL = 'http://localhost:5000';
const DB_PATH = path.join(__dirname, 'database.sqlite');

class NonPostingPagesDebugger {
  constructor() {
    this.db = new Database(DB_PATH);
  }

  /**
   * Check database status for problematic pages
   */
  checkDatabaseStatus() {
    console.log('Search Checking Database Status for Non-Posting Pages...');
    console.log('=' .repeat(60));
    
    const problematicPages = [
      { table: 'click_picks_products', page: 'click-picks', description: 'Click Picks' },
      { table: 'global_picks_products', page: 'global-picks', description: 'Global Picks' },
      { table: 'deals_hub_products', page: 'deals-hub', description: 'Deals Hub' }
    ];
    
    problematicPages.forEach(pageInfo => {
      console.log(`\nProducts ${pageInfo.description} (${pageInfo.table}):`);
      this.analyzeTable(pageInfo.table, pageInfo.page);
    });
  }

  /**
   * Analyze specific table
   */
  analyzeTable(tableName, pageName) {
    try {
      // Check total count
      const totalCount = this.db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get().count;
      console.log(`  Stats Total products: ${totalCount}`);
      
      if (totalCount === 0) {
        console.log(`  Error No products in database - this explains why API returns 0`);
        return;
      }
      
      // Check table schema
      const columns = this.db.prepare(`PRAGMA table_info(${tableName})`).all();
      const columnNames = columns.map(col => col.name);
      
      console.log(`  📋 Table columns: ${columnNames.slice(0, 10).join(', ')}${columnNames.length > 10 ? '...' : ''}`);
      
      // Check for processing_status column
      const hasProcessingStatus = columnNames.includes('processing_status');
      console.log(`  🔧 Has processing_status: ${hasProcessingStatus}`);
      
      if (hasProcessingStatus) {
        const activeCount = this.db.prepare(`
          SELECT COUNT(*) as count 
          FROM ${tableName} 
          WHERE processing_status = 'active'
        `).get().count;
        
        const statusCounts = this.db.prepare(`
          SELECT processing_status, COUNT(*) as count 
          FROM ${tableName} 
          GROUP BY processing_status
        `).all();
        
        console.log(`  Success Active products: ${activeCount}`);
        console.log(`  📈 Status breakdown:`);
        statusCounts.forEach(status => {
          console.log(`     - ${status.processing_status || 'NULL'}: ${status.count}`);
        });
      }
      
      // Check for expires_at column
      const hasExpiresAt = columnNames.includes('expires_at');
      if (hasExpiresAt) {
        const currentTime = Math.floor(Date.now() / 1000);
        const nonExpiredCount = this.db.prepare(`
          SELECT COUNT(*) as count 
          FROM ${tableName} 
          WHERE expires_at IS NULL OR expires_at > ?
        `).get(currentTime).count;
        
        console.log(`  ⏰ Non-expired products: ${nonExpiredCount}`);
      }
      
      // Show sample products
      const sampleProducts = this.db.prepare(`
        SELECT id, name, created_at, processing_status, expires_at 
        FROM ${tableName} 
        ORDER BY created_at DESC 
        LIMIT 3
      `).all();
      
      console.log(`  📋 Sample products:`);
      sampleProducts.forEach((product, index) => {
        console.log(`     ${index + 1}. ${product.name} (status: ${product.processing_status || 'NULL'})`);
      });
      
    } catch (error) {
      console.log(`  Error Error analyzing ${tableName}: ${error.message}`);
    }
  }

  /**
   * Test API responses for problematic pages
   */
  async testAPIResponses() {
    console.log('\nGlobal Testing API Responses for Non-Posting Pages...');
    console.log('=' .repeat(50));
    
    const pages = [
      { name: 'click-picks', description: 'Click Picks' },
      { name: 'global-picks', description: 'Global Picks' },
      { name: 'deals-hub', description: 'Deals Hub' }
    ];
    
    for (const page of pages) {
      console.log(`\nSearch Testing ${page.description} API...`);
      
      try {
        const response = await axios.get(`${BASE_URL}/api/products/page/${page.name}`);
        const products = response.data;
        
        console.log(`  Stats API returned: ${products.length} products`);
        
        if (products.length === 0) {
          console.log(`  Error API returns empty - this is the problem!`);
        } else {
          console.log(`  Success API working - returns products`);
          console.log(`  Products Sample: ${products[0].name}`);
        }
        
      } catch (error) {
        console.log(`  Error API Error: ${error.message}`);
      }
    }
  }

  /**
   * Check server logs for API calls
   */
  async testWithServerLogs() {
    console.log('\nBlog Testing API Calls with Server Logging...');
    
    const pages = ['click-picks', 'global-picks', 'deals-hub'];
    
    for (const page of pages) {
      console.log(`\nSearch Calling /api/products/page/${page}...`);
      
      try {
        const response = await axios.get(`${BASE_URL}/api/products/page/${page}`);
        console.log(`  Stats Response: ${response.data.length} products`);
        
        // Wait a moment for server logs
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`  Error Error: ${error.message}`);
      }
    }
    
    console.log('\nTip Check the server terminal for detailed API logs!');
  }

  /**
   * Analyze API routing logic
   */
  analyzeAPIRouting() {
    console.log('\nSearch API Routing Analysis...');
    console.log('=' .repeat(40));
    
    console.log('\n📋 Expected API Logic:');
    console.log('  • click-picks → click_picks_products table');
    console.log('  • global-picks → global_picks_products table');
    console.log('  • deals-hub → deals_hub_products table');
    
    console.log('\n🔧 Common Issues:');
    console.log('  1. Missing API route logic for these pages');
    console.log('  2. Incorrect table name mapping');
    console.log('  3. Wrong processing_status filtering');
    console.log('  4. Missing WHERE clauses in database queries');
    console.log('  5. Page name mismatch (deals-hub vs dealshub)');
    
    console.log('\nTip Solutions:');
    console.log('  1. Add missing API route logic in routes.ts');
    console.log('  2. Set processing_status = "active" for all products');
    console.log('  3. Remove expires_at filtering if not needed');
    console.log('  4. Fix page name mapping inconsistencies');
  }

  /**
   * Generate fix recommendations
   */
  generateFixRecommendations() {
    console.log('\nTip FIX RECOMMENDATIONS');
    console.log('=' .repeat(40));
    
    console.log('\n🔧 **Immediate Fixes:**');
    console.log('\n1. **Update Processing Status:**');
    console.log('   ```sql');
    console.log('   UPDATE click_picks_products SET processing_status = "active" WHERE processing_status IS NULL;');
    console.log('   UPDATE global_picks_products SET processing_status = "active" WHERE processing_status IS NULL;');
    console.log('   UPDATE deals_hub_products SET processing_status = "active" WHERE processing_status IS NULL;');
    console.log('   ```');
    
    console.log('\n2. **Add Missing API Routes:**');
    console.log('   - Add click-picks logic in routes.ts');
    console.log('   - Add global-picks logic in routes.ts');
    console.log('   - Fix deals-hub vs dealshub naming');
    
    console.log('\n3. **Remove Strict Filtering:**');
    console.log('   - Remove processing_status = "active" requirement');
    console.log('   - Remove expires_at filtering');
    console.log('   - Use simple SELECT * FROM table queries');
    
    console.log('\nLaunch **Expected Result:**');
    console.log('   After fixes, all three pages should return products!');
  }

  /**
   * Run complete diagnosis
   */
  async runCompleteDiagnosis() {
    console.log('Launch Diagnosing Non-Posting Pages Issue');
    console.log('=' .repeat(60));
    
    // Check database status
    this.checkDatabaseStatus();
    
    // Test API responses
    await this.testAPIResponses();
    
    // Test with server logs
    await this.testWithServerLogs();
    
    // Analyze routing
    this.analyzeAPIRouting();
    
    // Generate recommendations
    this.generateFixRecommendations();
    
    console.log('\nTarget **DIAGNOSIS COMPLETE**');
    console.log('The issue is likely in the API routing logic or database filtering.');
    console.log('Check the recommendations above to fix the non-posting pages.');
  }

  cleanup() {
    if (this.db) {
      this.db.close();
    }
  }
}

// Run the diagnosis
async function runDiagnosis() {
  const pageDebugger = new NonPostingPagesDebugger();
  
  try {
    await pageDebugger.runCompleteDiagnosis();
  } catch (error) {
    console.error('Error Diagnosis failed:', error.message);
  } finally {
    pageDebugger.cleanup();
  }
}

if (require.main === module) {
  runDiagnosis();
}

module.exports = { NonPostingPagesDebugger, runDiagnosis };