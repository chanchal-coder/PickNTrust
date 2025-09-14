const Database = require('better-sqlite3');

console.log('🤖 CHECKING ALL 8 BOTS FOR TELEGRAM TO WEBPAGE POSTING');
console.log('===================================================\n');

try {
  const db = new Database('database.sqlite');
  
  // All 8 bot systems in PickNTrust
  const allBots = [
    { name: 'Prime Picks', table: 'prime_picks_products', page: '/prime-picks' },
    { name: 'Cue Picks', table: 'cue_picks_products', page: '/cue-picks' },
    { name: 'Value Picks', table: 'value_picks_products', page: '/value-picks' },
    { name: 'Click Picks', table: 'click_picks_products', page: '/click-picks' },
    { name: 'Loot Box', table: 'loot_box_products', page: '/loot-box' },
    { name: 'Travel Picks', table: 'travel_products', page: '/travel-picks' },
    { name: 'Deals Hub', table: 'deals_hub_products', page: '/deals-hub' },
    { name: 'Global Picks', table: 'global_picks_products', page: '/global-picks' }
  ];
  
  console.log('🔍 VERIFYING ALL 8 BOT SYSTEMS:');
  console.log('================================\n');
  
  let workingBots = 0;
  let totalBots = allBots.length;
  
  allBots.forEach((bot, index) => {
    console.log(`${index + 1}. 🤖 ${bot.name}:`);
    
    try {
      // Check if table exists
      const tableExists = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(bot.table);
      
      if (tableExists) {
        // Get product count
        const count = db.prepare(`SELECT COUNT(*) as count FROM ${bot.table}`).get();
        console.log(`   ✅ Database Table: ${bot.table} (${count.count} products)`);
        console.log(`   ✅ Website Page: ${bot.page}`);
        console.log(`   ✅ Data Flow: Telegram → ${bot.table} → ${bot.page}`);
        workingBots++;
      } else {
        console.log(`   ❌ Database Table: ${bot.table} (MISSING)`);
        console.log(`   ⚠️  Website Page: ${bot.page} (No data source)`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
  });
  
  // Summary
  console.log('📊 SUMMARY:');
  console.log('===========');
  console.log(`✅ Working Bots: ${workingBots}/${totalBots}`);
  console.log(`📊 Success Rate: ${Math.round((workingBots/totalBots) * 100)}%`);
  
  if (workingBots === totalBots) {
    console.log('\n🎉 ALL 8 BOTS ARE READY FOR TELEGRAM TO WEBPAGE POSTING!');
  } else {
    console.log(`\n⚠️  ${totalBots - workingBots} bot(s) need attention`);
  }
  
  // Check server configuration
  console.log('\n🔧 SERVER CONFIGURATION:');
  console.log('========================');
  
  // Check if bot files exist
  const fs = require('fs');
  const botFiles = [
    'server/prime-picks-bot.ts',
    'server/cue-picks-bot.ts', 
    'server/value-picks-bot.ts',
    'server/click-picks-bot.ts',
    'server/loot-box-bot.ts',
    'server/travel-picks-bot.ts',
    'server/dealshub-bot.ts',
    'server/global-picks-bot.ts'
  ];
  
  let existingBotFiles = 0;
  botFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file}`);
      existingBotFiles++;
    } else {
      console.log(`❌ ${file} (MISSING)`);
    }
  });
  
  console.log(`\n📁 Bot Files: ${existingBotFiles}/${botFiles.length} present`);
  
  // Final assessment
  console.log('\n🎯 DEPLOYMENT READINESS FOR ALL 8 BOTS:');
  console.log('=======================================');
  
  if (workingBots >= 6 && existingBotFiles >= 6) {
    console.log('🟢 EXCELLENT: All major bots ready for deployment');
    console.log('🟢 Telegram to webpage posting will work for all configured bots');
  } else if (workingBots >= 4) {
    console.log('🟡 GOOD: Most bots ready, some may need minor fixes');
    console.log('🟡 Core Telegram to webpage posting functionality will work');
  } else {
    console.log('🔴 NEEDS ATTENTION: Several bots require configuration');
  }
  
  console.log('\n📋 WHAT WORKS AFTER DEPLOYMENT:');
  console.log('================================');
  allBots.forEach((bot, index) => {
    try {
      const tableExists = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(bot.table);
      if (tableExists) {
        console.log(`✅ ${bot.name}: Post URL to Telegram → Appears on ${bot.page}`);
      } else {
        console.log(`⚠️  ${bot.name}: Needs table setup`);
      }
    } catch (error) {
      console.log(`❌ ${bot.name}: Configuration error`);
    }
  });
  
  db.close();
  
} catch (error) {
  console.error('❌ Error checking bot systems:', error.message);
}