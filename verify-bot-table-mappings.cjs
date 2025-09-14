const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const db = new Database('./database.sqlite');

console.log('🔍 Verifying Bot Table Mappings...');
console.log('=' .repeat(60));

// Expected bot-to-table mappings
const expectedMappings = {
  'prime-picks': 'amazon_products',
  'cue-picks': 'cuelinks_products', 
  'value-picks': 'value_picks_products',
  'click-picks': 'click_picks_products',
  'global-picks': 'global_picks_products',
  'travel-picks': 'travel_products',
  'deals-hub': 'deals_hub_products',
  'lootbox': 'lootbox_products'
};

console.log('\n📋 EXPECTED BOT-TABLE MAPPINGS:');
Object.entries(expectedMappings).forEach(([bot, table]) => {
  console.log(`  ${bot} → ${table}`);
});

// Check Enhanced Telegram Manager configuration
console.log('\n🔧 ENHANCED TELEGRAM MANAGER CONFIG:');
const managerPath = path.join(__dirname, 'server', 'enhanced-telegram-manager.ts');
if (fs.existsSync(managerPath)) {
  const managerContent = fs.readFileSync(managerPath, 'utf8');
  
  // Extract table configurations
  const tableMatches = managerContent.match(/tableName: '([^']+)'/g);
  if (tableMatches) {
    console.log('  Found table configurations:');
    tableMatches.forEach(match => {
      const tableName = match.match(/'([^']+)'/)[1];
      console.log(`    tableName: '${tableName}'`);
    });
  }
} else {
  console.log('  ❌ Enhanced Telegram Manager not found');
}

// Check individual bot saveProduct methods
console.log('\n🤖 BOT SAVEPRODUCT METHOD VERIFICATION:');

const botFiles = [
  { name: 'prime-picks', file: 'server/prime-picks-bot.ts', expectedTable: 'amazon_products' },
  { name: 'cue-picks', file: 'server/cue-picks-bot.ts', expectedTable: 'cuelinks_products' },
  { name: 'value-picks', file: 'server/value-picks-bot.ts', expectedTable: 'value_picks_products' },
  { name: 'click-picks', file: 'server/click-picks-bot.ts', expectedTable: 'click_picks_products' },
  { name: 'global-picks', file: 'server/global-picks-bot.ts', expectedTable: 'global_picks_products' },
  { name: 'travel-picks', file: 'server/travel-picks-bot.ts', expectedTable: 'travel_products' },
  { name: 'deals-hub', file: 'server/dealshub-bot.ts', expectedTable: 'deals_hub_products' },
  { name: 'lootbox', file: 'server/loot-box-bot.ts', expectedTable: 'lootbox_products' }
];

let correctMappings = 0;
let totalBots = 0;

botFiles.forEach(({ name, file, expectedTable }) => {
  totalBots++;
  const filePath = path.join(__dirname, file);
  
  console.log(`\n${name.toUpperCase()}:`);
  
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Look for INSERT INTO statements
    const insertMatches = content.match(/INSERT INTO ([a-zA-Z_]+)/g);
    if (insertMatches) {
      const tables = insertMatches.map(match => match.replace('INSERT INTO ', ''));
      const uniqueTables = [...new Set(tables)];
      
      console.log(`  📄 File exists: ${file}`);
      console.log(`  🎯 Expected table: ${expectedTable}`);
      console.log(`  💾 Actual tables: ${uniqueTables.join(', ')}`);
      
      if (uniqueTables.includes(expectedTable)) {
        console.log(`  ✅ CORRECT: Saves to ${expectedTable}`);
        correctMappings++;
      } else {
        console.log(`  ❌ INCORRECT: Should save to ${expectedTable}`);
        if (uniqueTables.length > 0) {
          console.log(`  🔧 Fix needed: Change ${uniqueTables[0]} to ${expectedTable}`);
        }
      }
    } else {
      console.log(`  ⚠️  No INSERT statements found`);
    }
  } else {
    console.log(`  ❌ File not found: ${file}`);
  }
});

// Check database tables exist
console.log('\n🗄️  DATABASE TABLE VERIFICATION:');
Object.entries(expectedMappings).forEach(([bot, table]) => {
  try {
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name=?
    `).get(table);
    
    if (tableExists) {
      const count = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
      console.log(`  ✅ ${table}: EXISTS (${count.count} records)`);
    } else {
      console.log(`  ❌ ${table}: MISSING`);
    }
  } catch (error) {
    console.log(`  ❌ ${table}: ERROR - ${error.message}`);
  }
});

// Check Bot Posting Integration configuration
console.log('\n🔗 BOT POSTING INTEGRATION CONFIG:');
const integrationPath = path.join(__dirname, 'server', 'bot-posting-integration.ts');
if (fs.existsSync(integrationPath)) {
  const integrationContent = fs.readFileSync(integrationPath, 'utf8');
  
  // Look for tableName configurations
  const tableNameMatches = integrationContent.match(/tableName: '[^']+'/g);
  if (tableNameMatches) {
    console.log('  Found integration table mappings:');
    tableNameMatches.forEach(match => {
      console.log(`    ${match}`);
    });
  }
} else {
  console.log('  ❌ Bot Posting Integration not found');
}

db.close();

console.log('\n📊 VERIFICATION SUMMARY:');
console.log('=' .repeat(40));
console.log(`✅ Correct mappings: ${correctMappings}/${totalBots}`);
console.log(`📈 Success rate: ${((correctMappings / totalBots) * 100).toFixed(1)}%`);

if (correctMappings === totalBots) {
  console.log('\n🎉 ALL BOTS CONFIGURED CORRECTLY!');
  console.log('   - All bots save to correct tables');
  console.log('   - Database tables exist');
  console.log('   - Mappings are consistent');
} else {
  console.log('\n⚠️  ISSUES FOUND:');
  console.log(`   - ${totalBots - correctMappings} bots have incorrect table mappings`);
  console.log('   - Fix needed before bots can save data properly');
  console.log('   - Check individual bot saveProduct methods');
}

console.log('\n🔧 NEXT STEPS:');
if (correctMappings < totalBots) {
  console.log('   1. Fix incorrect table mappings in bot files');
  console.log('   2. Update Enhanced Telegram Manager configuration');
  console.log('   3. Ensure all database tables exist');
  console.log('   4. Test bot posting after fixes');
} else {
  console.log('   1. Bots are correctly configured');
  console.log('   2. Focus on Telegram permissions for posting');
  console.log('   3. Test actual message processing');
}