const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

console.log('🔍 COMPREHENSIVE BOT DIAGNOSIS');
console.log('=====================================\n');

// Check database connection
try {
  const db = new Database('database.sqlite');
  console.log('✅ Database connection: SUCCESS');
  db.close();
} catch (error) {
  console.log('❌ Database connection: FAILED -', error.message);
}

// Check all bot environment files
const bots = [
  { name: 'Prime Picks', envFile: '.env.prime-picks', expectedToken: '8260140807' },
  { name: 'Cue Picks', envFile: '.env.cue-picks', expectedToken: '8352384812' },
  { name: 'Value Picks', envFile: '.env.value-picks', expectedToken: '8293858742' },
  { name: 'Click Picks', envFile: '.env.click-picks', expectedToken: '8077836519' },
  { name: 'Loot Box', envFile: '.env.loot-box', expectedToken: '8141266952' },
  { name: 'Global Picks', envFile: '.env.global-picks', expectedToken: 'unknown' },
  { name: 'Deals Hub', envFile: '.env.deals-hub', expectedToken: 'unknown' },
  { name: 'Travel Picks', envFile: '.env.travel-picks', expectedToken: 'unknown' }
];

console.log('\n🤖 BOT ENVIRONMENT VALIDATION:');
console.log('================================');

bots.forEach(bot => {
  const envPath = path.join(process.cwd(), bot.envFile);
  
  if (!fs.existsSync(envPath)) {
    console.log(`❌ ${bot.name}: Environment file missing (${bot.envFile})`);
    return;
  }
  
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const tokenMatch = envContent.match(/TELEGRAM_BOT_TOKEN=([^\n\r]+)/);
    const channelMatch = envContent.match(/CHANNEL_ID=([^\n\r]+)/);
    
    const hasToken = tokenMatch && tokenMatch[1].trim();
    const hasChannel = channelMatch && channelMatch[1].trim();
    const tokenPrefix = hasToken ? hasToken.substring(0, 10) : 'NONE';
    
    console.log(`\n📋 ${bot.name}:`);
    console.log(`   Environment: ${fs.existsSync(envPath) ? '✅' : '❌'}`);
    console.log(`   Bot Token: ${hasToken ? '✅' : '❌'} (${tokenPrefix}...)`);
    console.log(`   Channel ID: ${hasChannel ? '✅' : '❌'} (${hasChannel || 'MISSING'})`);
    
    if (bot.expectedToken !== 'unknown' && hasToken) {
      const tokenValid = hasToken.startsWith(bot.expectedToken);
      console.log(`   Token Valid: ${tokenValid ? '✅' : '❌'} (Expected: ${bot.expectedToken}...)`);
    }
    
  } catch (error) {
    console.log(`❌ ${bot.name}: Error reading environment - ${error.message}`);
  }
});

// Check bot-specific tables
console.log('\n\n📊 BOT TABLE VALIDATION:');
console.log('=========================');

const botTables = [
  'prime_picks_products',
  'cue_picks_products', 
  'value_picks_products',
  'click_picks_products',
  'global_picks_products',
  'deals_hub_products',
  'loot_box_products',
  'travel_picks_products'
];

try {
  const db = new Database('database.sqlite');
  
  botTables.forEach(tableName => {
    try {
      const count = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
      const schema = db.prepare(`PRAGMA table_info(${tableName})`).all();
      
      console.log(`\n📋 ${tableName}:`);
      console.log(`   Table Exists: ✅`);
      console.log(`   Product Count: ${count.count}`);
      console.log(`   Columns: ${schema.length}`);
      
      // Check for common required columns
      const hasName = schema.some(col => col.name === 'name');
      const hasAffiliateUrl = schema.some(col => col.name === 'affiliateUrl' || col.name === 'affiliate_url');
      const hasTelegramId = schema.some(col => col.name === 'telegramMessageId' || col.name === 'telegram_message_id');
      
      console.log(`   Has Name: ${hasName ? '✅' : '❌'}`);
      console.log(`   Has Affiliate URL: ${hasAffiliateUrl ? '✅' : '❌'}`);
      console.log(`   Has Telegram ID: ${hasTelegramId ? '✅' : '❌'}`);
      
    } catch (error) {
      console.log(`❌ ${tableName}: ${error.message}`);
    }
  });
  
  db.close();
} catch (error) {
  console.log('❌ Database table check failed:', error.message);
}

// Check for potential issues
console.log('\n\n🚨 POTENTIAL ISSUES:');
console.log('====================');

// Check if server is running
const serverRunning = process.env.npm_lifecycle_event === 'dev' || 
                     fs.existsSync('server.pid') ||
                     process.argv.includes('--server-check');

console.log(`Server Status: ${serverRunning ? '✅ Running' : '❓ Unknown'}`);

// Check for common bot issues
const commonIssues = [
  'Bot permissions in Telegram channels',
  'Webhook vs Polling conflicts (409 errors)',
  'Network connectivity issues',
  'Rate limiting from Telegram API',
  'Message processing errors',
  'Database write permissions',
  'Environment variable loading',
  'Bot initialization failures'
];

console.log('\n🔍 Common Issues to Check:');
commonIssues.forEach((issue, index) => {
  console.log(`   ${index + 1}. ${issue}`);
});

console.log('\n\n💡 NEXT STEPS:');
console.log('===============');
console.log('1. Check server logs for bot initialization messages');
console.log('2. Verify bot admin permissions in Telegram channels');
console.log('3. Test with a single message to one channel');
console.log('4. Monitor for 409 polling conflicts');
console.log('5. Check webhook configurations');
console.log('\n🎯 Run this diagnosis after any bot configuration changes!');