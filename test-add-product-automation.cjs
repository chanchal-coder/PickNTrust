/**
 * Test Script: Add Sample Product and Verify Canva Automation
 * This script adds a sample product and monitors the automation trigger
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const Database = require('better-sqlite3');
const path = require('path');

async function testProductAutomation() {
  console.log('🧪 Testing Product Addition with Canva Automation...');
  console.log('=' .repeat(60));
  
  const API_BASE = 'http://localhost:5000';
  const dbPath = path.join(__dirname, 'database.sqlite');
  const db = new Database(dbPath);
  
  try {
    // Step 1: Check initial Canva posts count
    console.log('\n1️⃣ Checking initial automation state...');
    const initialPosts = db.prepare('SELECT COUNT(*) as count FROM canva_posts').get();
    console.log(`   📊 Initial Canva posts: ${initialPosts.count}`);
    
    // Step 2: Verify Canva automation is enabled
    const canvaSettings = db.prepare('SELECT * FROM canva_settings LIMIT 1').get();
    if (!canvaSettings || !canvaSettings.is_enabled) {
      console.log('❌ Canva automation is disabled. Please enable it first.');
      return false;
    }
    console.log('✅ Canva automation is enabled');
    
    // Step 3: Create sample product data
    console.log('\n2️⃣ Preparing sample product...');
    const sampleProduct = {
      title: 'Premium Wireless Bluetooth Headphones',
      description: 'High-quality wireless headphones with active noise cancellation, 30-hour battery life, and premium sound quality. Perfect for music lovers and professionals.',
      price: 4999,
      originalPrice: 7999,
      category: 'Electronics',
      affiliateUrl: 'https://example.com/headphones',
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
      tags: 'wireless,bluetooth,headphones,audio,music',
      isService: false,
      password: 'pickntrust2025' // Correct admin password from routes.ts
    };
    
    console.log(`   📦 Product: ${sampleProduct.title}`);
    console.log(`   💰 Price: ₹${sampleProduct.price} (was ₹${sampleProduct.originalPrice})`);
    console.log(`   🏷️ Category: ${sampleProduct.category}`);
    
    // Step 4: Add product via API
    console.log('\n3️⃣ Adding product via API...');
    
    const response = await fetch(`${API_BASE}/api/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sampleProduct)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Failed to add product: ${response.status} ${response.statusText}`);
      console.log(`   Error: ${errorText}`);
      return false;
    }
    
    const result = await response.json();
    console.log('✅ Product added successfully!');
    console.log(`   📝 Product ID: ${result.product?.id || 'Unknown'}`);
    
    // Step 5: Wait for automation to process
    console.log('\n4️⃣ Waiting for automation to process...');
    console.log('   ⏳ Giving automation 3 seconds to trigger...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 6: Check if automation was triggered
    console.log('\n5️⃣ Checking automation results...');
    
    const finalPosts = db.prepare('SELECT COUNT(*) as count FROM canva_posts').get();
    const newPosts = finalPosts.count - initialPosts.count;
    
    console.log(`   📊 Final Canva posts: ${finalPosts.count}`);
    console.log(`   🆕 New posts created: ${newPosts}`);
    
    if (newPosts > 0) {
      console.log('\n🎉 SUCCESS: Automation triggered!');
      
      // Get details of new posts
      const latestPosts = db.prepare(`
        SELECT * FROM canva_posts 
        ORDER BY created_at DESC 
        LIMIT ${newPosts}
      `).all();
      
      console.log('\n📱 Generated Posts:');
      latestPosts.forEach((post, index) => {
        console.log(`   ${index + 1}. Platform: ${post.platform}`);
        console.log(`      Template: ${post.template_id || 'Default'}`);
        console.log(`      Caption: ${post.caption?.substring(0, 50)}...`);
        console.log(`      Hashtags: ${post.hashtags}`);
        console.log(`      Status: ${post.status}`);
        console.log('');
      });
      
    } else {
      console.log('\n⚠️ No new posts created. Checking possible reasons...');
      
      // Debug information
      console.log('\n🔍 Debug Information:');
      console.log(`   - Canva enabled: ${canvaSettings.is_enabled}`);
      console.log(`   - Auto captions: ${canvaSettings.auto_generate_captions}`);
      console.log(`   - Auto hashtags: ${canvaSettings.auto_generate_hashtags}`);
      console.log(`   - Platforms: ${canvaSettings.platforms}`);
      
      // Check if product was actually added
      const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
      console.log(`   - Total products in DB: ${productCount.count}`);
      
      const latestProduct = db.prepare('SELECT * FROM products ORDER BY id DESC LIMIT 1').get();
      if (latestProduct) {
        console.log(`   - Latest product: ${latestProduct.title}`);
        console.log(`   - Added at: ${latestProduct.createdAt || 'Unknown'}`);
      }
    }
    
    // Step 7: Summary
    console.log('\n' + '=' .repeat(60));
    console.log('📋 TEST SUMMARY:');
    console.log('=' .repeat(60));
    console.log(`✅ Product API: Working`);
    console.log(`✅ Database: Connected`);
    console.log(`${newPosts > 0 ? '✅' : '❌'} Automation: ${newPosts > 0 ? 'Triggered' : 'Not triggered'}`);
    console.log(`📊 Posts created: ${newPosts}`);
    
    if (newPosts > 0) {
      console.log('\n🎯 RESULT: Canva automation is working correctly!');
      console.log('   The system successfully created social media content');
      console.log('   when a new product was added.');
    } else {
      console.log('\n🔧 RESULT: Automation may need debugging.');
      console.log('   Check server logs for any error messages.');
    }
    
    return newPosts > 0;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  } finally {
    db.close();
  }
}

// Run the test
if (require.main === module) {
  testProductAutomation()
    .then(success => {
      console.log(`\n${success ? '🎉' : '❌'} Test ${success ? 'PASSED' : 'FAILED'}`);
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test crashed:', error);
      process.exit(1);
    });
}

module.exports = { testProductAutomation };