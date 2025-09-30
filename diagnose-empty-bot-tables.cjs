/**
 * Diagnose Why Bot Tables Are Empty
 * Check if bots are posting products and identify blocking issues
 */

const Database = require('better-sqlite3');
const axios = require('axios');

console.log('🔍 DIAGNOSING EMPTY BOT TABLES');
console.log('='.repeat(70));
console.log('🎯 Goal: Find why 6 bot tables have 0 products');
console.log('📊 Issue: APIs work but no data in database tables');
console.log('='.repeat(70));

try {
  const db = new Database('./database.sqlite');
  
  // Define bot-to-table mapping
  const botTables = {
    'Prime Picks': 'amazon_products',
    'Cue Picks': 'cuelinks_products', 
    'Value Picks': 'value_picks_products',
    'Travel Picks': 'travel_products',
    'Click Picks': 'click_picks_products',
    'Global Picks': 'global_picks_products'
  };
  
  console.log('\n📊 CHECKING DATABASE TABLES:');
  
  Object.entries(botTables).forEach(([botName, tableName]) => {
    console.log(`\n🤖 ${botName} Bot:`);
    
    try {
      // Check if table exists
      const tableExists = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name=?
      `).get(tableName);
      
      if (!tableExists) {
        console.log(`   ❌ TABLE MISSING: ${tableName}`);
        console.log('   🔧 Solution: Create table or fix table name');
        return;
      }
      
      console.log(`   ✅ Table exists: ${tableName}`);
      
      // Count total records
      const totalCount = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
      console.log(`   📦 Total records: ${totalCount.count}`);
      
      if (totalCount.count === 0) {
        console.log('   ❌ EMPTY TABLE - No products posted by bot');
        
        // Check table schema to see if it's properly configured
        const schema = db.prepare(`PRAGMA table_info(${tableName})`).all();
        const hasRequiredFields = schema.some(col => col.name === 'name') && 
                                 schema.some(col => col.name === 'affiliate_url');
        
        if (hasRequiredFields) {
          console.log('   ✅ Table schema looks correct');
          console.log('   🔧 Issue: Bot not posting or bot not running');
        } else {
          console.log('   ❌ Table schema may be incorrect');
          console.log('   📋 Required fields: name, affiliate_url, price, etc.');
        }
      } else {
        console.log('   ✅ Has data - checking recent activity...');
        
        // Check for recent records
        const recentCount = db.prepare(`
          SELECT COUNT(*) as count FROM ${tableName} 
          WHERE created_at > ?
        `).get(Date.now() - (24 * 60 * 60 * 1000)); // Last 24 hours
        
        console.log(`   📅 Recent (24h): ${recentCount.count} products`);
        
        if (recentCount.count === 0) {
          console.log('   ⚠️  No recent activity - bot may not be posting');
        }
      }
      
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
    }
  });
  
  console.log('\n\n🤖 CHECKING BOT STATUS:');
  console.log('-'.repeat(50));
  
  // Check if bots are configured and running
  const botFiles = [
    'server/prime-picks-bot.ts',
    'server/cue-picks-bot.ts', 
    'server/value-picks-bot.ts',
    'server/click-picks-bot.ts'
    // Note: travel-picks and global-picks may use services instead of bots
  ];
  
  const fs = require('fs');
  const path = require('path');
  
  botFiles.forEach(botFile => {
    const botPath = path.join(__dirname, botFile);
    const botName = path.basename(botFile, '.ts');
    
    console.log(`\n🤖 ${botName}:`);
    
    if (fs.existsSync(botPath)) {
      console.log('   ✅ Bot file exists');
      
      // Check if bot has proper configuration
      const botContent = fs.readFileSync(botPath, 'utf8');
      
      const hasToken = botContent.includes('BOT_TOKEN');
      const hasChannel = botContent.includes('CHANNEL_ID');
      const hasSaveMethod = botContent.includes('saveProduct') || botContent.includes('INSERT INTO');
      
      console.log(`   🔑 Has token config: ${hasToken ? '✅' : '❌'}`);
      console.log(`   📺 Has channel config: ${hasChannel ? '✅' : '❌'}`);
      console.log(`   💾 Has save method: ${hasSaveMethod ? '✅' : '❌'}`);
      
      if (!hasToken || !hasChannel) {
        console.log('   🔧 Issue: Bot credentials not configured');
        console.log('   💡 Solution: Set up .env file with bot token and channel ID');
      }
      
      if (!hasSaveMethod) {
        console.log('   🔧 Issue: Bot missing save functionality');
        console.log('   💡 Solution: Implement saveProduct method');
      }
      
    } else {
      console.log('   ❌ Bot file missing');
      console.log('   🔧 Solution: Create bot file or check file path');
    }
  });
  
  console.log('\n\n🔍 POSSIBLE ROOT CAUSES:');
  console.log('='.repeat(50));
  console.log('\n1. 🤖 BOT ISSUES:');
  console.log('   • Bots not running (no Telegram credentials)');
  console.log('   • Bots not receiving messages (channel not configured)');
  console.log('   • Bots failing to save products (database errors)');
  console.log('   • Bots not processing URLs correctly');
  
  console.log('\n2. 📊 DATABASE ISSUES:');
  console.log('   • Tables exist but bots saving to wrong tables');
  console.log('   • Database connection issues');
  console.log('   • Schema mismatches between bot and table');
  
  console.log('\n3. 🔧 CONFIGURATION ISSUES:');
  console.log('   • Missing environment variables');
  console.log('   • Wrong table names in bot code');
  console.log('   • Bots not initialized in server startup');
  
  console.log('\n\n💡 RECOMMENDED SOLUTIONS:');
  console.log('='.repeat(50));
  console.log('\n✅ IMMEDIATE FIXES:');
  console.log('   1. Add test products to empty tables manually');
  console.log('   2. Check bot environment variables (.env files)');
  console.log('   3. Verify bots are running in server startup');
  console.log('   4. Test bot posting with sample Telegram messages');
  
  console.log('\n🔄 LONG-TERM FIXES:');
  console.log('   1. Set up proper Telegram bot credentials');
  console.log('   2. Configure Telegram channels for each bot');
  console.log('   3. Test end-to-end posting workflow');
  console.log('   4. Add monitoring for bot activity');
  
  db.close();
  
  console.log('\n\n🎯 NEXT STEPS:');
  console.log('='.repeat(30));
  console.log('1. 🧪 Add test products to verify API/frontend works');
  console.log('2. 🤖 Check bot configurations and credentials');
  console.log('3. 📱 Set up Telegram channels and test posting');
  console.log('4. 🔄 Implement proper bot initialization');
  
} catch (error) {
  console.error('❌ Diagnosis failed:', error.message);
}