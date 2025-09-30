#!/usr/bin/env node

require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();

console.log('🚀 Simple Telegram Bot Flow Test');
console.log('=================================\n');

async function testSimpleFlow() {
  try {
    // 1. Check environment
    console.log('1️⃣ Environment Check:');
    console.log(`✅ ENABLE_TELEGRAM_BOT: ${process.env.ENABLE_TELEGRAM_BOT}`);
    console.log(`✅ MASTER_BOT_TOKEN: ${process.env.MASTER_BOT_TOKEN ? 'SET' : 'NOT SET'}`);
    console.log(`✅ PRIME_PICKS_CHANNEL_ID: ${process.env.PRIME_PICKS_CHANNEL_ID}`);
    
    // 2. Check database before
    console.log('\n2️⃣ Database Check (Before):');
    const db = new sqlite3.Database('./database.sqlite');
    
    const beforeCount = await new Promise((resolve, reject) => {
      db.get("SELECT COUNT(*) as count FROM unified_content WHERE display_pages LIKE '%prime-picks%'", (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });
    
    console.log(`📊 Current Prime Picks products: ${beforeCount}`);
    
    // 3. Simulate direct database insertion (like the bot would do)
    console.log('\n3️⃣ Simulating Bot Database Insertion:');
    
    const testProduct = {
      title: 'Test Gaming Headset - Direct Insert',
      description: 'High-quality wireless gaming headset with noise cancellation - Direct Bot Test',
      price: '₹2,999',
      image_url: 'https://m.media-amazon.com/images/I/71ABC123DEF._SL1500_.jpg',
      affiliate_url: "https://www.amazon.in/dp/B08XYZ123/ref=sr_1_1?keywords=gaming+headset&tag=pickntrust03-21",
      content_type: "product",
      category: "Electronics",
      source_type: "telegram", // Fixed field name
      display_pages: JSON.stringify(["prime-picks"]),
      page_type: "prime-picks",
      processing_status: "processed",
      created_at: new Date().toISOString()
    };
    
    const insertResult = await new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT INTO unified_content (
          title, description, price, image_url, affiliate_url, 
          content_type, category, source_type, display_pages, page_type, 
          processing_status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        testProduct.title,
        testProduct.description,
        testProduct.price,
        testProduct.image_url,
        testProduct.affiliate_url,
        testProduct.content_type,
        testProduct.category,
        'telegram', // Fixed: use 'telegram' instead of 'telegram_bot'
        testProduct.display_pages,
        testProduct.page_type,
        testProduct.processing_status,
        testProduct.created_at,
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, changes: this.changes });
        }
      );
      
      stmt.finalize();
    });
    
    console.log(`✅ Product inserted with ID: ${insertResult.id}`);
    
    // 4. Check database after
    console.log('\n4️⃣ Database Check (After):');
    const afterCount = await new Promise((resolve, reject) => {
      db.get("SELECT COUNT(*) as count FROM unified_content WHERE display_pages LIKE '%prime-picks%'", (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });
    
    console.log(`📊 Prime Picks products after insert: ${afterCount}`);
    console.log(`🎉 New products added: ${afterCount - beforeCount}`);
    
    // 5. Get the latest product
    console.log('\n5️⃣ Latest Product Details:');
    const latestProduct = await new Promise((resolve, reject) => {
      db.get(`SELECT * FROM unified_content 
              WHERE display_pages LIKE '%prime-picks%' 
              ORDER BY created_at DESC LIMIT 1`, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (latestProduct) {
      console.log(`   📦 Title: ${latestProduct.title}`);
      console.log(`   💰 Price: ${latestProduct.price}`);
      console.log(`   🔗 Affiliate URL: ${latestProduct.affiliate_url}`);
      console.log(`   📱 Source: ${latestProduct.source_platform}`);
      console.log(`   📄 Pages: ${latestProduct.display_pages}`);
      console.log(`   ⏰ Created: ${latestProduct.created_at}`);
    }
    
    // 6. Test API endpoint
    console.log('\n6️⃣ Testing API Endpoint:');
    try {
      const response = await fetch('http://localhost:5000/api/products/page/prime-picks');
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ API Response: ${response.status}`);
        console.log(`📊 Products returned: ${data.products ? data.products.length : 'N/A'}`);
        
        if (data.products && data.products.length > 0) {
          const firstProduct = data.products[0];
          console.log(`   First product: ${firstProduct.title}`);
        }
      } else {
        console.log(`❌ API Error: ${response.status}`);
      }
    } catch (apiError) {
      console.log(`⚠️  API Test failed: ${apiError.message}`);
    }
    
    // Close database
    db.close();
    
    console.log('\n✅ Simple Flow Test Complete!');
    console.log('\n🔗 Check results at: http://localhost:5000/prime-picks');
    console.log('\n📝 Summary:');
    console.log(`   - Database insertion: ✅ Working`);
    console.log(`   - Product count increased: ✅ ${afterCount > beforeCount ? 'Yes' : 'No'}`);
    console.log(`   - Ready for real Telegram bot testing`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSimpleFlow().catch(console.error);