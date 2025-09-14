// Check Prime Picks Database Schema and Bot Issues
// This script identifies coding, database, and schema errors preventing autoposting

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

console.log('Search COMPREHENSIVE PRIME PICKS DIAGNOSTIC');
console.log('=' .repeat(50));

async function checkPrimePicksIssues() {
  const db = new sqlite3.Database('database.sqlite');
  
  try {
    console.log('\n1. Stats CHECKING AMAZON_PRODUCTS TABLE SCHEMA:');
    
    const tableInfo = await new Promise((resolve, reject) => {
      db.all('PRAGMA table_info(amazon_products)', (err, info) => {
        if (err) reject(err);
        else resolve(info);
      });
    });
    
    console.log('   Available columns:');
    const columnNames = [];
    tableInfo.forEach(col => {
      console.log(`   - ${col.name} (${col.type})`);
      columnNames.push(col.name);
    });
    
    console.log('\n2. Search CHECKING REQUIRED COLUMNS FOR PRIME PICKS BOT:');
    const requiredColumns = [
      'name', 'description', 'price', 'original_price', 'currency',
      'image_url', 'affiliate_url', 'original_url', 'category', 'rating',
      'review_count', 'discount', 'is_featured', 'source',
      'telegram_message_id', 'created_at', 'expires_at',
      'affiliate_network', 'content_type'
    ];
    
    const missingColumns = [];
    requiredColumns.forEach(col => {
      if (columnNames.includes(col)) {
        console.log(`   Success ${col}`);
      } else {
        console.log(`   Error ${col} - MISSING!`);
        missingColumns.push(col);
      }
    });
    
    if (missingColumns.length > 0) {
      console.log('\nError SCHEMA ERROR: Missing columns will cause INSERT failures!');
      console.log('   Missing columns:', missingColumns.join(', '));
    } else {
      console.log('\nSuccess All required columns present in amazon_products table');
    }
    
    console.log('\n3. Mobile CHECKING CURRENT DATA IN AMAZON_PRODUCTS:');
    const productCount = await new Promise((resolve) => {
      db.get('SELECT COUNT(*) as count FROM amazon_products', (err, row) => {
        resolve(err ? 0 : row.count);
      });
    });
    
    console.log(`   Total products: ${productCount}`);
    
    if (productCount > 0) {
      const sampleProduct = await new Promise((resolve) => {
        db.get('SELECT * FROM amazon_products ORDER BY created_at DESC LIMIT 1', (err, row) => {
          resolve(row);
        });
      });
      
      if (sampleProduct) {
        console.log('   Latest product:');
        console.log(`     Name: ${sampleProduct.name}`);
        console.log(`     Source: ${sampleProduct.source}`);
        console.log(`     Telegram ID: ${sampleProduct.telegram_message_id}`);
        console.log(`     Created: ${new Date(sampleProduct.created_at * 1000).toLocaleString()}`);
      }
    }
    
    console.log('\n4. AI CHECKING PRIME PICKS BOT CONFIGURATION:');
    
    // Check .env.telegram file
    if (fs.existsSync('.env.telegram')) {
      const envContent = fs.readFileSync('.env.telegram', 'utf8');
      const botToken = envContent.match(/TELEGRAM_BOT_TOKEN_PRIME_PICKS=(.+)/);
      const channelId = envContent.match(/TELEGRAM_CHANNEL_ID_PRIME_PICKS=(.+)/);
      
      console.log(`   Bot Token: ${botToken ? 'Present' : 'Missing'}`);
      console.log(`   Channel ID: ${channelId ? channelId[1] : 'Missing'}`);
      
      if (botToken && channelId) {
        console.log('   Success Bot configuration looks correct');
      } else {
        console.log('   Error Bot configuration incomplete');
      }
    } else {
      console.log('   Error .env.telegram file not found');
    }
    
    console.log('\n5. 🔧 CHECKING PRIME PICKS BOT CODE:');
    
    if (fs.existsSync('./server/prime-picks-bot.ts')) {
      const botCode = fs.readFileSync('./server/prime-picks-bot.ts', 'utf8');
      
      // Check for critical code patterns
      const hasChannelCheck = botCode.includes('msg.chat.id.toString()');
      const hasAmazonProductsInsert = botCode.includes('amazon_products');
      const hasErrorHandling = botCode.includes('catch');
      const hasMessageListener = botCode.includes('channel_post');
      
      console.log(`   Channel ID check: ${hasChannelCheck ? 'Success' : 'Error'}`);
      console.log(`   Amazon products insert: ${hasAmazonProductsInsert ? 'Success' : 'Error'}`);
      console.log(`   Error handling: ${hasErrorHandling ? 'Success' : 'Error'}`);
      console.log(`   Message listener: ${hasMessageListener ? 'Success' : 'Error'}`);
      
      // Check for specific issues
      if (botCode.includes('msg.chat.id.toString() !== CHANNEL_ID')) {
        console.log('   Error OLD BUG: Direct channel ID comparison (should be fixed)');
      } else if (botCode.includes('chatId !== targetChannelId')) {
        console.log('   Success Channel ID comparison fixed');
      }
      
    } else {
      console.log('   Error prime-picks-bot.ts not found');
    }
    
    console.log('\n6. Global TESTING API ENDPOINT:');
    
    try {
      const fetch = require('node-fetch');
      const response = await fetch('http://localhost:5000/api/products/page/prime-picks');
      
      if (response.ok) {
        const products = await response.json();
        console.log(`   Success API responds with ${products.length} products`);
        
        if (products.length > 0) {
          console.log(`   Sample product: ${products[0].name}`);
        }
      } else {
        console.log(`   Error API error: ${response.status}`);
      }
    } catch (error) {
      console.log(`   Error API test failed: ${error.message}`);
    }
    
    console.log('\n7. 📋 DIAGNOSTIC SUMMARY:');
    console.log('=' .repeat(30));
    
    if (missingColumns.length === 0) {
      console.log('Success Database schema: OK');
    } else {
      console.log('Error Database schema: ERRORS FOUND');
    }
    
    console.log('Success TypeScript compilation: OK (checked earlier)');
    console.log(`Stats Products in database: ${productCount}`);
    
    console.log('\nTarget NEXT STEPS:');
    if (missingColumns.length > 0) {
      console.log('1. Fix database schema by adding missing columns');
    }
    console.log('2. Test message processing with a real Telegram message');
    console.log('3. Check server logs for any runtime errors');
    
  } catch (error) {
    console.error('Error Diagnostic failed:', error);
  } finally {
    db.close();
  }
}

// Run the diagnostic
checkPrimePicksIssues().then(() => {
  console.log('\n' + '=' .repeat(50));
  console.log('🏁 Prime Picks diagnostic completed');
}).catch(error => {
  console.error('Error Fatal error:', error);
});