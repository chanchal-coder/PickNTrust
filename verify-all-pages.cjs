const axios = require('axios');

console.log('🔍 Verifying Products Appear on Correct Pages...\n');

const baseUrl = 'http://localhost:5173';
const apiUrl = 'http://localhost:5000'; // Assuming backend runs on port 5000

// List of all pages to test
const pages = [
  'prime-picks',
  'cue-picks', 
  'value-picks',
  'click-picks',
  'global-picks',
  'deals-hub',
  'loot-box',
  'travel-picks'
];

async function verifyPageProducts() {
  console.log('📊 Testing API endpoints for each page...\n');
  
  for (const page of pages) {
    try {
      console.log(`🔍 Testing ${page}...`);
      
      // Test the API endpoint
      const apiResponse = await axios.get(`${apiUrl}/api/products/page/${page}`, {
        timeout: 5000
      });
      
      if (apiResponse.status === 200) {
        const products = apiResponse.data;
        console.log(`   ✅ API Response: ${products.length} products found`);
        
        if (products.length > 0) {
          const firstProduct = products[0];
          console.log(`   📦 Sample Product: ${firstProduct.title}`);
          console.log(`   🏷️  Category: ${firstProduct.category}`);
          console.log(`   💰 Price: ${firstProduct.price}`);
        }
      } else {
        console.log(`   ❌ API Error: Status ${apiResponse.status}`);
      }
      
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`   ⚠️  Backend server not running on port 5000`);
        console.log(`   💡 Trying to check database directly...`);
        
        // Fallback to direct database check
        await checkDatabaseDirectly(page);
      } else {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
    
    console.log(''); // Empty line for readability
  }
}

async function checkDatabaseDirectly(page) {
  try {
    const Database = require('better-sqlite3');
    const path = require('path');
    
    const dbPath = path.join(__dirname, 'database.sqlite');
    const db = new Database(dbPath);
    
    const products = db.prepare(`
      SELECT * FROM unified_content 
      WHERE display_pages = ? 
      ORDER BY created_at DESC
    `).all(page);
    
    console.log(`   📊 Database Check: ${products.length} products found`);
    
    if (products.length > 0) {
      const firstProduct = products[0];
      console.log(`   📦 Sample Product: ${firstProduct.title}`);
      console.log(`   🏷️  Category: ${firstProduct.category}`);
      console.log(`   💰 Price: ${firstProduct.price}`);
    }
    
    db.close();
    
  } catch (dbError) {
    console.log(`   ❌ Database Error: ${dbError.message}`);
  }
}

async function checkWebsitePages() {
  console.log('🌐 Testing website page accessibility...\n');
  
  for (const page of pages) {
    try {
      const response = await axios.get(`${baseUrl}/${page}`, {
        timeout: 5000
      });
      
      if (response.status === 200) {
        console.log(`✅ ${page}: Page loads successfully`);
      } else {
        console.log(`❌ ${page}: Status ${response.status}`);
      }
      
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`⚠️  ${page}: Frontend server not running on port 5173`);
      } else {
        console.log(`❌ ${page}: ${error.message}`);
      }
    }
  }
}

async function runVerification() {
  try {
    await verifyPageProducts();
    await checkWebsitePages();
    
    console.log('\n🎯 Verification Summary:');
    console.log('1. ✅ Test products have been inserted into database');
    console.log('2. 📊 Each page should have exactly 1 test product');
    console.log('3. 🔗 API endpoints should return products for each page');
    console.log('4. 🌐 Website pages should load without errors');
    
    console.log('\n💡 Manual verification steps:');
    console.log('1. Open each page in browser to visually confirm products appear');
    console.log('2. Check that products show correct data (title, price, image)');
    console.log('3. Test affiliate links functionality');
    console.log('4. Verify page navigation works correctly');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

runVerification();