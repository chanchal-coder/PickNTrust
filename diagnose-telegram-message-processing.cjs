/**
 * Diagnose Telegram Message Processing Issues
 * Check why Telegram messages aren't being processed by website bots
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

class TelegramMessageProcessingDiagnoser {
  constructor() {
    this.db = new Database('./database.sqlite');
    this.issues = [];
    this.botConfigs = [];
  }

  /**
   * Check if Telegram bots are configured and running
   */
  checkBotConfigurations() {
    console.log('🤖 CHECKING TELEGRAM BOT CONFIGURATIONS');
    console.log('='.repeat(50));
    
    const botFiles = [
      { name: 'Prime Picks', file: 'server/prime-picks-bot.ts', env: '.env.prime-picks' },
      { name: 'Cue Picks', file: 'server/cue-picks-bot.ts', env: '.env.cue-picks' },
      { name: 'Value Picks', file: 'server/value-picks-bot.ts', env: '.env.value-picks' },
      { name: 'Travel Picks', file: 'server/travel-picks-bot.ts', env: '.env.travel-picks' },
      { name: 'Click Picks', file: 'server/click-picks-bot.ts', env: '.env.click-picks' },
      { name: 'Global Picks', file: 'server/global-picks-bot.ts', env: '.env.global-picks' },
      { name: 'DealsHub', file: 'server/dealshub-bot.ts', env: '.env.dealshub' },
      { name: 'Loot Box', file: 'server/loot-box-bot.ts', env: '.env.loot-box' }
    ];
    
    for (const bot of botFiles) {
      console.log(`\n📋 Checking ${bot.name}:`);
      
      // Check if bot file exists
      const botFilePath = path.join(__dirname, bot.file);
      if (fs.existsSync(botFilePath)) {
        console.log(`   ✅ Bot file exists: ${bot.file}`);
        
        // Check if env file exists
        const envFilePath = path.join(__dirname, bot.env);
        if (fs.existsSync(envFilePath)) {
          console.log(`   ✅ Environment file exists: ${bot.env}`);
          
          // Read env file to check configuration
          const envContent = fs.readFileSync(envFilePath, 'utf8');
          const hasToken = envContent.includes('BOT_TOKEN=');
          const hasChannelId = envContent.includes('CHANNEL_ID=');
          
          if (hasToken && hasChannelId) {
            console.log(`   ✅ Bot token and channel ID configured`);
            this.botConfigs.push({ name: bot.name, configured: true, env: bot.env });
          } else {
            console.log(`   ❌ Missing bot token or channel ID`);
            this.issues.push(`${bot.name} bot missing token or channel ID`);
            this.botConfigs.push({ name: bot.name, configured: false, env: bot.env });
          }
        } else {
          console.log(`   ❌ Environment file missing: ${bot.env}`);
          this.issues.push(`${bot.name} environment file missing`);
        }
      } else {
        console.log(`   ❌ Bot file missing: ${bot.file}`);
        this.issues.push(`${bot.name} bot file missing`);
      }
    }
  }

  /**
   * Check if bots are initialized in the main server
   */
  checkServerBotInitialization() {
    console.log('\n🚀 CHECKING SERVER BOT INITIALIZATION');
    console.log('='.repeat(50));
    
    const serverIndexPath = path.join(__dirname, 'server/index.ts');
    
    if (!fs.existsSync(serverIndexPath)) {
      console.log('❌ Server index.ts file not found');
      this.issues.push('Server index.ts file missing');
      return;
    }
    
    const serverContent = fs.readFileSync(serverIndexPath, 'utf8');
    
    // Check for bot imports and initializations
    const botChecks = [
      { name: 'Prime Picks', import: 'prime-picks-bot', init: 'primePicks' },
      { name: 'Cue Picks', import: 'cue-picks-bot', init: 'cuePicks' },
      { name: 'Value Picks', import: 'value-picks-bot', init: 'valuePicks' },
      { name: 'Travel Picks', import: 'travel-picks-bot', init: 'travelPicks' },
      { name: 'Click Picks', import: 'click-picks-bot', init: 'clickPicks' },
      { name: 'Global Picks', import: 'global-picks-bot', init: 'globalPicks' },
      { name: 'DealsHub', import: 'dealshub-bot', init: 'dealshub' },
      { name: 'Loot Box', import: 'loot-box-bot', init: 'lootBox' }
    ];
    
    for (const bot of botChecks) {
      const hasImport = serverContent.includes(bot.import) || serverContent.includes(bot.name);
      const hasInit = serverContent.includes(bot.init) || serverContent.includes(bot.name);
      
      console.log(`\n📋 ${bot.name}:`);
      if (hasImport) {
        console.log(`   ✅ Bot imported in server`);
      } else {
        console.log(`   ❌ Bot not imported in server`);
        this.issues.push(`${bot.name} not imported in server`);
      }
      
      if (hasInit) {
        console.log(`   ✅ Bot initialized in server`);
      } else {
        console.log(`   ❌ Bot not initialized in server`);
        this.issues.push(`${bot.name} not initialized in server`);
      }
    }
  }

  /**
   * Check message processing logic in bot files
   */
  checkMessageProcessingLogic() {
    console.log('\n💬 CHECKING MESSAGE PROCESSING LOGIC');
    console.log('='.repeat(50));
    
    const botFiles = [
      'server/prime-picks-bot.ts',
      'server/cue-picks-bot.ts',
      'server/value-picks-bot.ts'
    ];
    
    for (const botFile of botFiles) {
      const botPath = path.join(__dirname, botFile);
      
      if (fs.existsSync(botPath)) {
        console.log(`\n📋 Checking ${botFile}:`);
        
        const botContent = fs.readFileSync(botPath, 'utf8');
        
        // Check for message event listeners
        const hasMessageListener = botContent.includes('on(\'message\')') || 
                                  botContent.includes('on("message")') ||
                                  botContent.includes('message') ||
                                  botContent.includes('onText');
        
        const hasUrlProcessing = botContent.includes('http') || 
                                botContent.includes('url') ||
                                botContent.includes('link');
        
        const hasDatabaseSave = botContent.includes('INSERT') || 
                              botContent.includes('addProduct') ||
                              botContent.includes('storage');
        
        console.log(`   Message listener: ${hasMessageListener ? '✅' : '❌'}`);
        console.log(`   URL processing: ${hasUrlProcessing ? '✅' : '❌'}`);
        console.log(`   Database saving: ${hasDatabaseSave ? '✅' : '❌'}`);
        
        if (!hasMessageListener) {
          this.issues.push(`${botFile} missing message listener`);
        }
        if (!hasUrlProcessing) {
          this.issues.push(`${botFile} missing URL processing`);
        }
        if (!hasDatabaseSave) {
          this.issues.push(`${botFile} missing database save logic`);
        }
      } else {
        console.log(`\n❌ Bot file not found: ${botFile}`);
      }
    }
  }

  /**
   * Check recent message processing activity
   */
  checkRecentActivity() {
    console.log('\n📊 CHECKING RECENT MESSAGE PROCESSING ACTIVITY');
    console.log('='.repeat(50));
    
    const tables = [
      'amazon_products',
      'cuelinks_products', 
      'value_picks_products',
      'travel_products',
      'click_picks_products',
      'global_picks_products',
      'deals_hub_products',
      'lootbox_products'
    ];
    
    const now = Math.floor(Date.now() / 1000);
    const oneHourAgo = now - 3600;
    const oneDayAgo = now - 86400;
    
    for (const table of tables) {
      try {
        // Check total products
        const total = this.db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
        
        // Check recent products (last hour)
        const recentHour = this.db.prepare(`
          SELECT COUNT(*) as count FROM ${table} 
          WHERE created_at > ?
        `).get(oneHourAgo);
        
        // Check recent products (last day)
        const recentDay = this.db.prepare(`
          SELECT COUNT(*) as count FROM ${table} 
          WHERE created_at > ?
        `).get(oneDayAgo);
        
        console.log(`\n📋 ${table}:`);
        console.log(`   Total products: ${total.count}`);
        console.log(`   Added last hour: ${recentHour.count}`);
        console.log(`   Added last day: ${recentDay.count}`);
        
        if (recentHour.count === 0 && recentDay.count === 0) {
          console.log(`   ⚠️  No recent activity detected`);
        }
        
      } catch (error) {
        console.log(`\n❌ Error checking ${table}: ${error.message}`);
      }
    }
  }

  /**
   * Check Telegram bot connectivity
   */
  async checkTelegramConnectivity() {
    console.log('\n🔗 CHECKING TELEGRAM BOT CONNECTIVITY');
    console.log('='.repeat(50));
    
    console.log('\n📋 Bot connectivity test requires:');
    console.log('   1. Valid bot tokens in .env files');
    console.log('   2. Bots added to channels as administrators');
    console.log('   3. Bots have "Read Messages" permission');
    console.log('   4. Server running and bots initialized');
    
    console.log('\n🧪 To test connectivity:');
    console.log('   1. Post a product URL in any Telegram channel');
    console.log('   2. Watch server logs for message processing');
    console.log('   3. Check if new products appear in database');
    console.log('   4. Verify products show up on website pages');
  }

  /**
   * Generate diagnosis report
   */
  generateDiagnosisReport() {
    console.log('\n🔧 TELEGRAM MESSAGE PROCESSING DIAGNOSIS REPORT');
    console.log('='.repeat(60));
    
    if (this.issues.length === 0) {
      console.log('\n✅ NO MAJOR ISSUES DETECTED');
      console.log('\nPossible causes for messages not being processed:');
      console.log('   1. Bots not added to Telegram channels');
      console.log('   2. Bots missing "Read Messages" permission');
      console.log('   3. Wrong channel IDs in .env files');
      console.log('   4. Network connectivity issues');
      console.log('   5. Telegram API rate limiting');
    } else {
      console.log(`\n❌ FOUND ${this.issues.length} ISSUES:`);
      this.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    }
    
    console.log('\n🎯 RECOMMENDED ACTIONS:');
    console.log('   1. Verify all bots are added to their respective Telegram channels');
    console.log('   2. Check bot permissions in each channel (must be admin with read access)');
    console.log('   3. Test by posting a product URL in one channel');
    console.log('   4. Monitor server logs for message processing activity');
    console.log('   5. Check if products appear in database after posting');
    
    console.log('\n🚨 CRITICAL CHECKS:');
    console.log('   • Are bots running? (Check server startup logs)');
    console.log('   • Are .env files configured? (BOT_TOKEN, CHANNEL_ID)');
    console.log('   • Are channels accessible? (Private channels need correct IDs)');
    console.log('   • Are message listeners active? (Check bot code)');
    
    console.log('\n💡 QUICK TEST:');
    console.log('   1. Post this URL in Prime Picks channel: https://amazon.in/test');
    console.log('   2. Watch server terminal for "Processing message" logs');
    console.log('   3. If no logs appear, the issue is bot connectivity');
    console.log('   4. If logs appear but no product saved, the issue is processing logic');
  }

  /**
   * Run complete diagnosis
   */
  async runDiagnosis() {
    console.log('🔍 TELEGRAM MESSAGE PROCESSING DIAGNOSIS');
    console.log('='.repeat(60));
    console.log('🎯 Diagnosing why Telegram messages aren\'t being processed by website');
    console.log('='.repeat(60));
    
    try {
      this.checkBotConfigurations();
      this.checkServerBotInitialization();
      this.checkMessageProcessingLogic();
      this.checkRecentActivity();
      await this.checkTelegramConnectivity();
      this.generateDiagnosisReport();
      
      console.log('\n✅ DIAGNOSIS COMPLETE!');
      
    } catch (error) {
      console.error('❌ Diagnosis failed:', error.message);
    } finally {
      this.db.close();
    }
  }
}

// Run the diagnosis
const diagnoser = new TelegramMessageProcessingDiagnoser();
diagnoser.runDiagnosis();