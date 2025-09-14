const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const db = new Database('./database.sqlite');

console.log('🔍 Diagnosing Non-Posting Bots: Cue Picks, Value Picks, Click Picks');
console.log('=' .repeat(70));

// Check current database status
console.log('\n📊 CURRENT DATABASE STATUS:');
const botTables = [
  { name: 'Cue Picks', table: 'cuelinks_products' },
  { name: 'Value Picks', table: 'value_picks_products' },
  { name: 'Click Picks', table: 'click_picks_products' }
];

botTables.forEach(({ name, table }) => {
  try {
    const total = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
    const active = db.prepare(`SELECT COUNT(*) as count FROM ${table} WHERE processing_status = 'active'`).get();
    const recent = db.prepare(`SELECT COUNT(*) as count FROM ${table} WHERE created_at > ?`).get(Math.floor(Date.now() / 1000) - 3600); // Last hour
    
    console.log(`${name}:`);
    console.log(`  📦 Total products: ${total.count}`);
    console.log(`  ✅ Active products: ${active.count}`);
    console.log(`  🕐 Recent products (1h): ${recent.count}`);
    
    if (total.count > 0) {
      const latest = db.prepare(`SELECT name, created_at, telegram_message_id FROM ${table} ORDER BY created_at DESC LIMIT 1`).get();
      console.log(`  📅 Latest: ${latest.name} (${new Date(latest.created_at * 1000).toLocaleString()})`);
      console.log(`  📱 Telegram ID: ${latest.telegram_message_id || 'None'}`);
    }
  } catch (error) {
    console.log(`${name}: ❌ Error - ${error.message}`);
  }
  console.log('');
});

// Check bot file configurations
console.log('\n🤖 BOT FILE ANALYSIS:');

// 1. Cue Picks Bot Analysis
console.log('\n1️⃣ CUE PICKS BOT:');
const cuePicksPath = path.join(__dirname, 'server', 'cue-picks-bot.ts');
if (fs.existsSync(cuePicksPath)) {
  const cueContent = fs.readFileSync(cuePicksPath, 'utf8');
  
  // Check for Drizzle ORM usage
  const usesDrizzle = cueContent.includes('db.insert(products)');
  const usesDirectSQL = cueContent.includes('INSERT INTO cuelinks_products');
  
  console.log(`  📄 File exists: ✅`);
  console.log(`  🔧 Uses Drizzle ORM: ${usesDrizzle ? '✅' : '❌'}`);
  console.log(`  🔧 Uses Direct SQL: ${usesDirectSQL ? '✅' : '❌'}`);
  
  if (usesDrizzle) {
    console.log(`  ⚠️  ISSUE: Uses generic 'products' table via Drizzle`);
    console.log(`  🔧 FIX NEEDED: Should use 'cuelinks_products' table`);
  }
  
  // Check for Enhanced Manager integration
  const hasEnhancedManager = cueContent.includes('ENHANCED_MANAGER_ACTIVE');
  console.log(`  🎛️  Enhanced Manager: ${hasEnhancedManager ? '✅' : '❌'}`);
  
} else {
  console.log(`  ❌ File not found`);
}

// 2. Value Picks Bot Analysis
console.log('\n2️⃣ VALUE PICKS BOT:');
const valuePicksPath = path.join(__dirname, 'server', 'value-picks-bot.ts');
if (fs.existsSync(valuePicksPath)) {
  const valueContent = fs.readFileSync(valuePicksPath, 'utf8');
  
  const usesCorrectTable = valueContent.includes('INSERT INTO value_picks_products');
  const hasEnhancedManager = valueContent.includes('ENHANCED_MANAGER_ACTIVE');
  
  console.log(`  📄 File exists: ✅`);
  console.log(`  🎯 Correct table: ${usesCorrectTable ? '✅' : '❌'}`);
  console.log(`  🎛️  Enhanced Manager: ${hasEnhancedManager ? '✅' : '❌'}`);
  
  if (usesCorrectTable) {
    console.log(`  ✅ Uses correct 'value_picks_products' table`);
  }
} else {
  console.log(`  ❌ File not found`);
}

// 3. Click Picks Bot Analysis
console.log('\n3️⃣ CLICK PICKS BOT:');
const clickPicksPath = path.join(__dirname, 'server', 'click-picks-bot.ts');
if (fs.existsSync(clickPicksPath)) {
  const clickContent = fs.readFileSync(clickPicksPath, 'utf8');
  
  const usesCorrectTable = clickContent.includes('INSERT INTO click_picks_products');
  const hasEnhancedManager = clickContent.includes('ENHANCED_MANAGER_ACTIVE');
  
  console.log(`  📄 File exists: ✅`);
  console.log(`  🎯 Correct table: ${usesCorrectTable ? '✅' : '❌'}`);
  console.log(`  🎛️  Enhanced Manager: ${hasEnhancedManager ? '✅' : '❌'}`);
  
  if (usesCorrectTable) {
    console.log(`  ✅ Uses correct 'click_picks_products' table`);
  }
} else {
  console.log(`  ❌ File not found`);
}

// Check Enhanced Telegram Manager status
console.log('\n🎛️  ENHANCED TELEGRAM MANAGER CHECK:');
const managerPath = path.join(__dirname, 'server', 'enhanced-telegram-manager.ts');
if (fs.existsSync(managerPath)) {
  const managerContent = fs.readFileSync(managerPath, 'utf8');
  
  // Check if bots are enabled
  const cueEnabled = managerContent.includes("botName: 'cue-picks'") && managerContent.includes('isEnabled: true');
  const valueEnabled = managerContent.includes("botName: 'value-picks'") && managerContent.includes('isEnabled: true');
  const clickEnabled = managerContent.includes("botName: 'click-picks'") && managerContent.includes('isEnabled: true');
  
  console.log(`  📄 Manager exists: ✅`);
  console.log(`  🟢 Cue Picks enabled: ${cueEnabled ? '✅' : '❌'}`);
  console.log(`  🟢 Value Picks enabled: ${valueEnabled ? '✅' : '❌'}`);
  console.log(`  🟢 Click Picks enabled: ${clickEnabled ? '✅' : '❌'}`);
} else {
  console.log(`  ❌ Enhanced Manager not found`);
}

// Check environment files
console.log('\n📁 ENVIRONMENT FILES CHECK:');
const envFiles = [
  { name: 'Cue Picks', file: '.env.cue-picks' },
  { name: 'Value Picks', file: '.env.value-picks' },
  { name: 'Click Picks', file: '.env.click-picks' }
];

envFiles.forEach(({ name, file }) => {
  const envPath = path.join(__dirname, file);
  const exists = fs.existsSync(envPath);
  console.log(`  ${name}: ${exists ? '✅' : '❌'} ${file}`);
  
  if (exists) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const hasToken = envContent.includes('BOT_TOKEN');
    const hasChannel = envContent.includes('CHANNEL_ID');
    console.log(`    🔑 Has token: ${hasToken ? '✅' : '❌'}`);
    console.log(`    📢 Has channel: ${hasChannel ? '✅' : '❌'}`);
  }
});

db.close();

console.log('\n🎯 DIAGNOSIS SUMMARY:');
console.log('=' .repeat(40));

// Analyze the issues
const issues = [];
const solutions = [];

// Check if Cue Picks uses wrong table
if (fs.existsSync(cuePicksPath)) {
  const cueContent = fs.readFileSync(cuePicksPath, 'utf8');
  if (cueContent.includes('db.insert(products)')) {
    issues.push('Cue Picks uses generic "products" table via Drizzle ORM');
    solutions.push('Fix Cue Picks to use "cuelinks_products" table directly');
  }
}

// Check database records
const cueCount = db.prepare('SELECT COUNT(*) as count FROM cuelinks_products').get().count;
const valueCount = db.prepare('SELECT COUNT(*) as count FROM value_picks_products').get().count;
const clickCount = db.prepare('SELECT COUNT(*) as count FROM click_picks_products').get().count;

if (cueCount === 0) {
  issues.push('Cue Picks has 0 products in database');
  solutions.push('Test Cue Picks bot posting in Telegram channel');
}

if (valueCount === 0) {
  issues.push('Value Picks has 0 products in database');
  solutions.push('Test Value Picks bot posting in Telegram channel');
}

if (clickCount === 0) {
  issues.push('Click Picks has 0 products in database');
  solutions.push('Test Click Picks bot posting in Telegram channel');
}

console.log('\n❌ ISSUES FOUND:');
if (issues.length === 0) {
  console.log('   ✅ No major configuration issues detected');
} else {
  issues.forEach((issue, i) => {
    console.log(`   ${i + 1}. ${issue}`);
  });
}

console.log('\n🔧 RECOMMENDED SOLUTIONS:');
if (solutions.length === 0) {
  console.log('   ✅ Focus on Telegram bot permissions and channel access');
} else {
  solutions.forEach((solution, i) => {
    console.log(`   ${i + 1}. ${solution}`);
  });
}

console.log('\n💡 NEXT STEPS:');
console.log('   1. Fix Cue Picks table mapping if using wrong table');
console.log('   2. Test posting URLs in each bot\'s Telegram channel');
console.log('   3. Check bot admin permissions in Telegram channels');
console.log('   4. Monitor server logs for message processing activity');
console.log('   5. Verify Enhanced Telegram Manager is running correctly');