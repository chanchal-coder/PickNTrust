/**
 * Comprehensive Posting Diagnosis - Deep Analysis of Bot Posting Issues
 * This script will thoroughly test every aspect of the posting system
 */

const Database = require('better-sqlite3');
const axios = require('axios');
const path = require('path');

const DB_PATH = path.join(__dirname, 'database.sqlite');

class ComprehensivePostingDiagnosis {
  constructor() {
    this.db = new Database(DB_PATH);
    this.issues = [];
    this.successes = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'error' ? 'Error' : type === 'success' ? 'Success' : type === 'warning' ? 'Warning' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
    
    if (type === 'error') {
      this.issues.push(message);
    } else if (type === 'success') {
      this.successes.push(message);
    }
  }

  /**
   * Test 1: Database Structure and Content
   */
  async testDatabaseStructure() {
    this.log('\nSearch TESTING DATABASE STRUCTURE AND CONTENT', 'info');
    this.log('=' .repeat(60), 'info');
    
    try {
      // Check if database file exists
      const fs = require('fs');
      if (!fs.existsSync(DB_PATH)) {
        this.log(`Database file not found at: ${DB_PATH}`, 'error');
        return false;
      }
      this.log(`Database file exists: ${DB_PATH}`, 'success');
      
      // Check all bot tables
      const botTables = [
        'amazon_products',
        'cuelinks_products', 
        'value_picks_products',
        'click_picks_products',
        'global_picks_products',
        'deals_hub_products',
        'lootbox_products'
      ];
      
      let totalProducts = 0;
      
      for (const table of botTables) {
        try {
          const count = this.db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
          totalProducts += count.count;
          
          if (count.count > 0) {
            this.log(`${table}: ${count.count} products`, 'success');
            
            // Show recent products
            const recent = this.db.prepare(`
              SELECT name, price, created_at, source 
              FROM ${table} 
              ORDER BY created_at DESC 
              LIMIT 2
            `).all();
            
            recent.forEach(product => {
              const createdAt = new Date(product.created_at * 1000).toLocaleString();
              this.log(`   Recent: ${product.name} - ₹${product.price} (${createdAt})`, 'info');
            });
          } else {
            this.log(`${table}: 0 products - NO DATA!`, 'error');
          }
        } catch (error) {
          this.log(`${table}: Table doesn't exist or error - ${error.message}`, 'error');
        }
      }
      
      this.log(`\nTotal products across all tables: ${totalProducts}`, totalProducts > 0 ? 'success' : 'error');
      return totalProducts > 0;
      
    } catch (error) {
      this.log(`Database test failed: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Test 2: API Endpoints Functionality
   */
  async testApiEndpoints() {
    this.log('\nGlobal TESTING API ENDPOINTS', 'info');
    this.log('=' .repeat(40), 'info');
    
    const endpoints = [
      { name: 'Prime Picks', url: 'http://localhost:5000/api/products/page/prime-picks' },
      { name: 'Cue Picks', url: 'http://localhost:5000/api/products/page/cue-picks' },
      { name: 'Value Picks', url: 'http://localhost:5000/api/products/page/value-picks' },
      { name: 'Click Picks', url: 'http://localhost:5000/api/products/page/click-picks' },
      { name: 'Global Picks', url: 'http://localhost:5000/api/products/page/global-picks' },
      { name: 'Deals Hub', url: 'http://localhost:5000/api/products/page/deals-hub' },
      { name: 'Loot Box', url: 'http://localhost:5000/api/products/page/lootbox' }
    ];
    
    let workingEndpoints = 0;
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(endpoint.url, { timeout: 5000 });
        
        if (response.status === 200 && Array.isArray(response.data)) {
          const productCount = response.data.length;
          if (productCount > 0) {
            this.log(`${endpoint.name}: ${productCount} products via API`, 'success');
            workingEndpoints++;
          } else {
            this.log(`${endpoint.name}: API works but 0 products returned`, 'warning');
          }
        } else {
          this.log(`${endpoint.name}: Invalid API response`, 'error');
        }
      } catch (error) {
        this.log(`${endpoint.name}: API failed - ${error.message}`, 'error');
      }
    }
    
    this.log(`\nWorking API endpoints: ${workingEndpoints}/${endpoints.length}`, workingEndpoints === endpoints.length ? 'success' : 'error');
    return workingEndpoints > 0;
  }

  /**
   * Test 3: Bot Configuration and Status
   */
  async testBotConfiguration() {
    this.log('\nAI TESTING BOT CONFIGURATION', 'info');
    this.log('=' .repeat(45), 'info');
    
    const dotenv = require('dotenv');
    dotenv.config();
    
    const botConfigs = [
      { name: 'Prime Picks', token: process.env.TELEGRAM_BOT_TOKEN_PRIME_PICKS, channel: process.env.TELEGRAM_CHANNEL_ID_PRIME_PICKS },
      { name: 'Cue Picks', token: process.env.TELEGRAM_BOT_TOKEN_CUE_PICKS, channel: process.env.TELEGRAM_CHANNEL_ID_CUE_PICKS },
      { name: 'Value Picks', token: process.env.TELEGRAM_BOT_TOKEN_VALUE_PICKS, channel: process.env.TELEGRAM_CHANNEL_ID_VALUE_PICKS },
      { name: 'Click Picks', token: process.env.CLICK_PICKS_BOT_TOKEN, channel: process.env.CLICK_PICKS_CHANNEL_ID },
      { name: 'Global Picks', token: process.env.GLOBAL_PICKS_BOT_TOKEN, channel: process.env.GLOBAL_PICKS_CHANNEL_ID },
      { name: 'Deals Hub', token: process.env.TELEGRAM_BOT_TOKEN_DEALSHUB, channel: process.env.TELEGRAM_CHANNEL_ID_DEALSHUB },
      { name: 'Loot Box', token: process.env.LOOT_BOX_BOT_TOKEN, channel: process.env.LOOT_BOX_CHANNEL_ID }
    ];
    
    let configuredBots = 0;
    
    for (const bot of botConfigs) {
      if (bot.token && bot.channel) {
        this.log(`${bot.name}: Token and Channel configured`, 'success');
        configuredBots++;
        
        // Test bot connectivity
        try {
          const response = await axios.get(`https://api.telegram.org/bot${bot.token}/getMe`, { timeout: 5000 });
          if (response.data.ok) {
            this.log(`   Bot API: Connected (${response.data.result.username})`, 'success');
          } else {
            this.log(`   Bot API: Failed to connect`, 'error');
          }
        } catch (error) {
          this.log(`   Bot API: Connection error - ${error.message}`, 'error');
        }
      } else {
        this.log(`${bot.name}: Missing token or channel configuration`, 'error');
      }
    }
    
    this.log(`\nConfigured bots: ${configuredBots}/${botConfigs.length}`, configuredBots === botConfigs.length ? 'success' : 'error');
    return configuredBots > 0;
  }

  /**
   * Test 4: Recent Bot Activity
   */
  async testRecentBotActivity() {
    this.log('\nStats TESTING RECENT BOT ACTIVITY', 'info');
    this.log('=' .repeat(45), 'info');
    
    try {
      // Check for products added in the last 24 hours
      const yesterday = Math.floor(Date.now() / 1000) - (24 * 60 * 60);
      
      const botTables = [
        { name: 'Prime Picks', table: 'amazon_products' },
        { name: 'Cue Picks', table: 'cuelinks_products' },
        { name: 'Value Picks', table: 'value_picks_products' },
        { name: 'Click Picks', table: 'click_picks_products' },
        { name: 'Global Picks', table: 'global_picks_products' },
        { name: 'Deals Hub', table: 'deals_hub_products' },
        { name: 'Loot Box', table: 'lootbox_products' }
      ];
      
      let recentActivity = 0;
      
      for (const bot of botTables) {
        try {
          const recent = this.db.prepare(`
            SELECT COUNT(*) as count 
            FROM ${bot.table} 
            WHERE created_at > ?
          `).get(yesterday);
          
          if (recent.count > 0) {
            this.log(`${bot.name}: ${recent.count} products in last 24h`, 'success');
            recentActivity += recent.count;
          } else {
            this.log(`${bot.name}: No recent activity (24h)`, 'warning');
          }
        } catch (error) {
          this.log(`${bot.name}: Error checking activity - ${error.message}`, 'error');
        }
      }
      
      this.log(`\nTotal recent activity: ${recentActivity} products in 24h`, recentActivity > 0 ? 'success' : 'error');
      return recentActivity > 0;
      
    } catch (error) {
      this.log(`Recent activity test failed: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Test 5: Server Process Analysis
   */
  async testServerProcesses() {
    this.log('\n⚙️ TESTING SERVER PROCESSES', 'info');
    this.log('=' .repeat(40), 'info');
    
    try {
      // Test if server is responding
      const response = await axios.get('http://localhost:5000/api/products', { timeout: 5000 });
      this.log('Server is responding to requests', 'success');
      
      // Check for 409 conflicts in logs (indicating multiple bot instances)
      this.log('Checking for bot conflicts...', 'info');
      
      // This would require access to server logs, so we'll simulate
      this.log('Note: Check server terminal for 409 conflict errors', 'warning');
      
    } catch (error) {
      this.log(`Server test failed: ${error.message}`, 'error');
      return false;
    }
    
    return true;
  }

  /**
   * Test 6: Manual Posting Simulation
   */
  async testManualPosting() {
    this.log('\n🧪 TESTING MANUAL POSTING SIMULATION', 'info');
    this.log('=' .repeat(50), 'info');
    
    try {
      // Insert a test product to see if the system can handle new data
      const testProduct = {
        name: 'Test Product - Posting Diagnosis',
        description: 'This is a test product to verify posting functionality',
        price: '999',
        image_url: 'https://via.placeholder.com/400x400',
        affiliate_url: 'https://example.com/test-product',
        category: 'Test Category',
        created_at: Math.floor(Date.now() / 1000),
        source: 'diagnosis_test'
      };
      
      // Try inserting into cuelinks_products table
      const insertStmt = this.db.prepare(`
        INSERT INTO cuelinks_products (
          name, description, price, image_url, affiliate_url, 
          category, created_at, source
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = insertStmt.run(
        testProduct.name,
        testProduct.description,
        testProduct.price,
        testProduct.image_url,
        testProduct.affiliate_url,
        testProduct.category,
        testProduct.created_at,
        testProduct.source
      );
      
      if (result.changes > 0) {
        this.log('Manual product insertion: SUCCESS', 'success');
        
        // Test if API can retrieve it
        const apiResponse = await axios.get('http://localhost:5000/api/products/page/cue-picks');
        const foundProduct = apiResponse.data.find(p => p.source === 'diagnosis_test');
        
        if (foundProduct) {
          this.log('API retrieval of test product: SUCCESS', 'success');
          
          // Clean up test product
          this.db.prepare('DELETE FROM cuelinks_products WHERE source = ?').run('diagnosis_test');
          this.log('Test product cleaned up', 'info');
          
          return true;
        } else {
          this.log('API retrieval of test product: FAILED', 'error');
        }
      } else {
        this.log('Manual product insertion: FAILED', 'error');
      }
      
    } catch (error) {
      this.log(`Manual posting test failed: ${error.message}`, 'error');
    }
    
    return false;
  }

  /**
   * Generate Comprehensive Report
   */
  generateReport() {
    this.log('\n📋 COMPREHENSIVE DIAGNOSIS REPORT', 'info');
    this.log('=' .repeat(60), 'info');
    
    this.log(`\nSuccess SUCCESSES (${this.successes.length}):`, 'success');
    this.successes.forEach(success => {
      this.log(`   • ${success}`, 'info');
    });
    
    this.log(`\nError ISSUES FOUND (${this.issues.length}):`, 'error');
    this.issues.forEach(issue => {
      this.log(`   • ${issue}`, 'info');
    });
    
    this.log('\nTarget DIAGNOSIS SUMMARY:', 'info');
    
    if (this.issues.length === 0) {
      this.log('Celebration NO ISSUES FOUND - System appears to be working correctly!', 'success');
      this.log('If posting still not working, the issue may be:', 'info');
      this.log('   • Bots not receiving messages from Telegram channels', 'info');
      this.log('   • Message processing logic not triggering', 'info');
      this.log('   • Channel permissions or bot admin status', 'info');
    } else if (this.issues.length <= 3) {
      this.log('Warning MINOR ISSUES DETECTED - System mostly functional', 'warning');
      this.log('Focus on fixing the issues listed above', 'info');
    } else {
      this.log('Alert MAJOR ISSUES DETECTED - System needs significant fixes', 'error');
      this.log('Multiple components are not working correctly', 'info');
    }
    
    this.log('\n🔧 RECOMMENDED ACTIONS:', 'info');
    
    if (this.issues.some(issue => issue.includes('Database'))) {
      this.log('   1. Fix database connectivity and structure issues', 'info');
    }
    
    if (this.issues.some(issue => issue.includes('API'))) {
      this.log('   2. Resolve API endpoint failures', 'info');
    }
    
    if (this.issues.some(issue => issue.includes('Bot'))) {
      this.log('   3. Fix bot configuration and connectivity', 'info');
    }
    
    if (this.issues.some(issue => issue.includes('activity'))) {
      this.log('   4. Investigate why bots are not processing messages', 'info');
    }
    
    this.log('\nMobile NEXT STEPS FOR TESTING:', 'info');
    this.log('   1. Post a product URL in one of your Telegram channels', 'info');
    this.log('   2. Watch server terminal for message processing logs', 'info');
    this.log('   3. Check if new products appear in database and website', 'info');
    this.log('   4. Verify bot admin permissions in Telegram channels', 'info');
  }

  /**
   * Run all diagnostic tests
   */
  async runComprehensiveDiagnosis() {
    this.log('Launch STARTING COMPREHENSIVE POSTING DIAGNOSIS', 'info');
    this.log('This will test every aspect of your posting system...\n', 'info');
    
    const tests = [
      { name: 'Database Structure', test: () => this.testDatabaseStructure() },
      { name: 'API Endpoints', test: () => this.testApiEndpoints() },
      { name: 'Bot Configuration', test: () => this.testBotConfiguration() },
      { name: 'Recent Bot Activity', test: () => this.testRecentBotActivity() },
      { name: 'Server Processes', test: () => this.testServerProcesses() },
      { name: 'Manual Posting', test: () => this.testManualPosting() }
    ];
    
    for (const test of tests) {
      try {
        await test.test();
      } catch (error) {
        this.log(`${test.name} test crashed: ${error.message}`, 'error');
      }
    }
    
    this.generateReport();
    
    return {
      totalIssues: this.issues.length,
      totalSuccesses: this.successes.length,
      systemHealth: this.issues.length === 0 ? 'excellent' : 
                   this.issues.length <= 3 ? 'good' : 'poor'
    };
  }

  cleanup() {
    if (this.db) {
      this.db.close();
    }
  }
}

// Run comprehensive diagnosis
async function runDiagnosis() {
  const diagnosis = new ComprehensivePostingDiagnosis();
  
  try {
    const results = await diagnosis.runComprehensiveDiagnosis();
    
    console.log('\n🏁 DIAGNOSIS COMPLETE!');
    console.log(`System Health: ${results.systemHealth.toUpperCase()}`);
    console.log(`Issues Found: ${results.totalIssues}`);
    console.log(`Components Working: ${results.totalSuccesses}`);
    
    process.exit(results.totalIssues === 0 ? 0 : 1);
    
  } catch (error) {
    console.error('💥 Diagnosis failed:', error.message);
    process.exit(1);
  } finally {
    diagnosis.cleanup();
  }
}

if (require.main === module) {
  runDiagnosis();
}

module.exports = { ComprehensivePostingDiagnosis, runDiagnosis };