const fetch = require('node-fetch');
const Database = require('better-sqlite3');

console.log('🔍 COMPREHENSIVE AUTOPOSTING DIAGNOSIS');
console.log('=' .repeat(60));

class AutopostingDiagnostic {
  constructor() {
    this.db = new Database('database.sqlite');
    this.webhookSecret = 'pickntrust_webhook_secret_2025';
    this.baseUrl = 'http://localhost:5000';
    
    this.botConfigs = [
      {
        name: 'Value Picks',
        webhookUrl: '/webhook/value-picks',
        tableName: 'value_picks_products',
        channelId: -1003017626269,
        testUrl: 'https://www.amazon.in/dp/B08N5WRWNW'
      },
      {
        name: 'Prime Picks',
        webhookUrl: '/webhook/prime-picks',
        tableName: 'amazon_products',
        channelId: -1002345678901,
        testUrl: 'https://www.amazon.in/dp/B09ABCDEFG'
      },
      {
        name: 'Click Picks',
        webhookUrl: '/webhook/click-picks',
        tableName: 'click_picks_products',
        channelId: -1002981205504,
        testUrl: 'https://www.flipkart.com/product/p-itm123456'
      },
      {
        name: 'Cue Picks',
        webhookUrl: '/webhook/cue-picks',
        tableName: 'cuelinks_products',
        channelId: -1002982344997,
        testUrl: 'https://www.paytmmall.com/product/123456'
      },
      {
        name: 'Global Picks',
        webhookUrl: '/webhook/global-picks',
        tableName: 'global_picks_products',
        channelId: -1002902496654,
        testUrl: 'https://www.aliexpress.com/item/123456789.html'
      },
      {
        name: 'Loot Box',
        webhookUrl: '/webhook/lootbox',
        tableName: 'lootbox_products',
        channelId: -1002991047787,
        testUrl: 'https://www.myntra.com/product/123456'
      },
      {
        name: 'DealsHub',
        webhookUrl: '/webhook/dealshub',
        tableName: 'deals_hub_products',
        channelId: -1003029983162,
        testUrl: 'https://www.snapdeal.com/product/electronics/123456'
      },
      {
        name: 'Travel Picks',
        webhookUrl: '/webhook/travel-picks',
        tableName: 'travel_products',
        channelId: -1002345678902,
        testUrl: 'https://www.makemytrip.com/flights/search?from=DEL&to=GOA'
      }
    ];
  }

  async checkDatabaseTables() {
    console.log('\n📊 DATABASE TABLE ANALYSIS');
    console.log('=' .repeat(40));
    
    for (const config of this.botConfigs) {
      try {
        // Check if table exists
        const tableExists = this.db.prepare(`
          SELECT name FROM sqlite_master 
          WHERE type='table' AND name=?
        `).get(config.tableName);
        
        if (tableExists) {
          // Count products
          const count = this.db.prepare(`SELECT COUNT(*) as count FROM ${config.tableName}`).get().count;
          
          // Get latest product
          const latest = this.db.prepare(`
            SELECT id, name, created_at 
            FROM ${config.tableName} 
            ORDER BY id DESC 
            LIMIT 1
          `).get();
          
          console.log(`\n✅ ${config.name}:`);
          console.log(`   Table: ${config.tableName} (exists)`);
          console.log(`   Products: ${count}`);
          
          if (latest) {
            const createdDate = new Date(latest.created_at * 1000).toLocaleString();
            console.log(`   Latest: ID ${latest.id} - "${latest.name?.substring(0, 30)}..."`);
            console.log(`   Created: ${createdDate}`);
          } else {
            console.log(`   Latest: No products found`);
          }
        } else {
          console.log(`\n❌ ${config.name}:`);
          console.log(`   Table: ${config.tableName} (MISSING!)`);
        }
      } catch (error) {
        console.log(`\n❌ ${config.name}:`);
        console.log(`   Error: ${error.message}`);
      }
    }
  }

  async checkWebhookEndpoints() {
    console.log('\n🔗 WEBHOOK ENDPOINT ANALYSIS');
    console.log('=' .repeat(40));
    
    // Check webhook health
    try {
      const healthResponse = await fetch(`${this.baseUrl}/webhook/health`);
      const healthData = await healthResponse.json();
      
      console.log(`\n📡 Webhook System Status: ${healthData.status}`);
      console.log(`   Registered Bots: ${healthData.registeredBots?.length || 0}`);
      
      if (healthData.registeredBots) {
        console.log(`   Active Bots: ${healthData.registeredBots.join(', ')}`);
      }
    } catch (error) {
      console.log(`\n❌ Webhook Health Check Failed: ${error.message}`);
    }
  }

  async testBotWebhooks() {
    console.log('\n🧪 WEBHOOK FUNCTIONALITY TEST');
    console.log('=' .repeat(40));
    
    const results = [];
    
    for (const config of this.botConfigs) {
      console.log(`\n📱 Testing ${config.name}...`);
      
      try {
        // Get product count before
        const beforeCount = await this.getProductCount(config.tableName);
        
        // Create test message
        const testMessage = {
          message: {
            message_id: Math.floor(Math.random() * 100000),
            chat: {
              id: config.channelId,
              type: 'channel'
            },
            text: `Test product: ${config.testUrl} - Great deal at ₹999!`,
            date: Math.floor(Date.now() / 1000)
          }
        };
        
        // Send webhook
        const response = await fetch(`${this.baseUrl}${config.webhookUrl}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Telegram-Bot-Api-Secret-Token': this.webhookSecret
          },
          body: JSON.stringify(testMessage)
        });
        
        console.log(`   Webhook Response: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          // Wait for processing
          await this.sleep(3000);
          
          // Check product count after
          const afterCount = await this.getProductCount(config.tableName);
          const newProducts = afterCount - beforeCount;
          
          console.log(`   Products Before: ${beforeCount}`);
          console.log(`   Products After: ${afterCount}`);
          console.log(`   New Products: ${newProducts}`);
          
          const success = newProducts > 0;
          console.log(`   Status: ${success ? '✅ SUCCESS' : '❌ FAILED'}`);
          
          results.push({
            bot: config.name,
            success: success,
            newProducts: newProducts,
            error: null
          });
        } else {
          const errorText = await response.text();
          console.log(`   Error: ${errorText}`);
          
          results.push({
            bot: config.name,
            success: false,
            newProducts: 0,
            error: `HTTP ${response.status}: ${errorText}`
          });
        }
      } catch (error) {
        console.log(`   Exception: ${error.message}`);
        
        results.push({
          bot: config.name,
          success: false,
          newProducts: 0,
          error: error.message
        });
      }
    }
    
    return results;
  }

  async getProductCount(tableName) {
    try {
      const result = this.db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
      return result.count || 0;
    } catch (error) {
      return 0;
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  printSummary(results) {
    console.log('\n' + '=' .repeat(60));
    console.log('📋 AUTOPOSTING DIAGNOSIS SUMMARY');
    console.log('=' .repeat(60));
    
    const working = results.filter(r => r.success);
    const broken = results.filter(r => !r.success);
    const totalProducts = results.reduce((sum, r) => sum + r.newProducts, 0);
    
    console.log(`\n🎯 Overall Results:`);
    console.log(`   ✅ Working Bots: ${working.length}/${results.length}`);
    console.log(`   ❌ Broken Bots: ${broken.length}/${results.length}`);
    console.log(`   📦 Total New Products: ${totalProducts}`);
    
    if (working.length > 0) {
      console.log(`\n✅ WORKING BOTS:`);
      working.forEach(result => {
        console.log(`   • ${result.bot} (+${result.newProducts} products)`);
      });
    }
    
    if (broken.length > 0) {
      console.log(`\n❌ BROKEN BOTS:`);
      broken.forEach(result => {
        console.log(`   • ${result.bot}: ${result.error || 'No products created'}`);
      });
    }
    
    console.log(`\n🔧 DIAGNOSIS:`);
    if (working.length === results.length) {
      console.log('   🎉 ALL BOTS ARE WORKING! Autoposting is fully functional.');
    } else if (working.length > 0) {
      console.log(`   ⚠️ PARTIAL FAILURE: ${working.length} bots working, ${broken.length} need fixing.`);
    } else {
      console.log('   💥 TOTAL FAILURE: No bots are working. System needs immediate attention.');
    }
    
    console.log(`\n💡 RECOMMENDATIONS:`);
    if (broken.length > 0) {
      console.log('   1. Check server logs for specific error messages');
      console.log('   2. Verify bot configurations and channel IDs');
      console.log('   3. Ensure database tables exist and are accessible');
      console.log('   4. Test individual bot message processing logic');
    } else {
      console.log('   1. System is working correctly');
      console.log('   2. Monitor for consistent performance');
      console.log('   3. Consider adding more test coverage');
    }
  }

  async runFullDiagnosis() {
    try {
      console.log('🚀 Starting comprehensive autoposting diagnosis...');
      
      await this.checkDatabaseTables();
      await this.checkWebhookEndpoints();
      const results = await this.testBotWebhooks();
      this.printSummary(results);
      
      console.log('\n✅ Diagnosis complete!');
      
    } catch (error) {
      console.error('❌ Diagnosis failed:', error);
    } finally {
      this.db.close();
    }
  }
}

// Run the diagnosis
const diagnostic = new AutopostingDiagnostic();
diagnostic.runFullDiagnosis();