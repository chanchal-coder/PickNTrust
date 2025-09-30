// Diagnose Prime Picks Autoposting Issue
// This script checks database, bot status, and identifies the problem

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

console.log('Search DIAGNOSING PRIME PICKS AUTOPOSTING ISSUE');
console.log('=' .repeat(60));

function checkDatabase() {
  return new Promise((resolve) => {
    const db = new sqlite3.Database('database.sqlite');
    
    console.log('\nStats DATABASE ANALYSIS:');
    
    // Check amazon_products table
    db.all('SELECT COUNT(*) as count FROM amazon_products', (err, rows) => {
      if (err) {
        console.log('Error Amazon Products Table Error:', err.message);
      } else {
        console.log(`Success Amazon Products in DB: ${rows[0].count}`);
      }
    });
    
    // Check recent products
    db.all('SELECT id, name, price, created_at FROM amazon_products ORDER BY created_at DESC LIMIT 3', (err, rows) => {
      if (err) {
        console.log('Error Error fetching recent products:', err.message);
      } else {
        console.log('\n📋 Recent Amazon Products:');
        if (rows.length === 0) {
          console.log('   Warning No products found in amazon_products table');
        } else {
          rows.forEach((p, i) => {
            console.log(`   ${i+1}. ID: ${p.id}`);
            console.log(`      Name: ${p.name?.substring(0, 50)}...`);
            console.log(`      Price: ₹${p.price}`);
            console.log(`      Created: ${p.created_at}`);
            console.log('');
          });
        }
      }
      
      db.close();
      resolve();
    });
  });
}

function checkBotConfiguration() {
  console.log('\nAI BOT CONFIGURATION ANALYSIS:');
  
  // Check .env file
  if (fs.existsSync('.env')) {
    const envContent = fs.readFileSync('.env', 'utf8');
    
    // Check Prime Picks bot token
    const primePicksToken = envContent.match(/PRIME_PICKS_BOT_TOKEN=(.+)/);
    if (primePicksToken && primePicksToken[1] && primePicksToken[1] !== '') {
      console.log('Success Prime Picks Bot Token: Configured');
      console.log(`   Token: ${primePicksToken[1].substring(0, 20)}...`);
    } else {
      console.log('Error Prime Picks Bot Token: Missing or empty');
    }
    
    // Check channel ID
    const channelId = envContent.match(/PRIME_PICKS_CHANNEL_ID=(.+)/);
    if (channelId && channelId[1] && channelId[1] !== '') {
      console.log('Success Prime Picks Channel ID: Configured');
      console.log(`   Channel: ${channelId[1]}`);
    } else {
      console.log('Error Prime Picks Channel ID: Missing or empty');
    }
  } else {
    console.log('Error .env file not found');
  }
}

function checkServerLogs() {
  console.log('\nMobile TELEGRAM BOT STATUS:');
  console.log('   Check server terminal for these messages:');
  console.log('   Success "Prime Picks Telegram automation ready"');
  console.log('   Success "Bot initialized successfully"');
  console.log('   Error "409 Conflict" errors (bot conflicts)');
  console.log('   Error "404 Not Found" errors (invalid token)');
}

function provideSolution() {
  console.log('\n🔧 COMMON SOLUTIONS:');
  console.log('\n1. AI BOT PERMISSION ISSUES:');
  console.log('   - Bot not added as admin to Telegram channel');
  console.log('   - Bot missing "Read Messages" permission');
  console.log('   - Channel privacy settings blocking bot');
  
  console.log('\n2. Refresh BOT CONFLICTS (409 errors):');
  console.log('   - Multiple bot instances running');
  console.log('   - Restart server to clear conflicts');
  console.log('   - Check for duplicate bot processes');
  
  console.log('\n3. 🔑 TOKEN ISSUES:');
  console.log('   - Invalid or expired bot token');
  console.log('   - Wrong channel ID configuration');
  console.log('   - Bot token not matching channel');
  
  console.log('\n4. Save DATABASE ISSUES:');
  console.log('   - Products saving to wrong table');
  console.log('   - API not reading from correct table');
  console.log('   - Database schema mismatch');
  
  console.log('\nTarget IMMEDIATE FIXES TO TRY:');
  console.log('1. Add bot as admin to @pntprimepicks channel');
  console.log('2. Grant "Read Messages" permission to bot');
  console.log('3. Restart server: npm run dev');
  console.log('4. Test by posting Amazon URL in channel');
  console.log('5. Check server logs for processing messages');
}

async function runDiagnosis() {
  try {
    await checkDatabase();
    checkBotConfiguration();
    checkServerLogs();
    provideSolution();
    
    console.log('\n🎊 DIAGNOSIS COMPLETE!');
    console.log('\nTip NEXT STEPS:');
    console.log('1. Fix bot permissions in Telegram channel');
    console.log('2. Restart server if needed');
    console.log('3. Test autoposting with Amazon URL');
    console.log('4. Monitor server logs for processing');
    
  } catch (error) {
    console.error('Error Diagnosis failed:', error);
  }
}

runDiagnosis();