const axios = require('axios');
const Database = require('better-sqlite3');

console.log('🔍 VERIFYING ACTUAL DATA DISPLAY - Not Hardcoded Values');
console.log('='.repeat(70));

async function verifyDataDisplay() {
  try {
    // Connect to database to get the actual submitted data
    const db = new Database('./database.sqlite');
    
    console.log('📊 Checking recently added test data...');
    
    // Get the most recent test items from database
    const recentTestItems = db.prepare(`
      SELECT id, name, category, price, original_price, travel_type, created_at
      FROM travel_products 
      WHERE name LIKE '%Test%' 
      ORDER BY created_at DESC 
      LIMIT 10
    `).all();
    
    console.log(`Found ${recentTestItems.length} recent test items in database:`);
    
    if (recentTestItems.length === 0) {
      console.log('❌ No test data found in database!');
      return false;
    }
    
    let allMatched = true;
    
    for (const dbItem of recentTestItems) {
      console.log(`\n🔍 Verifying: ${dbItem.name} (ID: ${dbItem.id})`);
      console.log(`   Category: ${dbItem.category}`);
      console.log(`   Database Price: ${dbItem.price}`);
      console.log(`   Database Original Price: ${dbItem.original_price}`);
      
      // Parse travel_type to see section info
      let travelTypeData = {};
      try {
        travelTypeData = JSON.parse(dbItem.travel_type || '{}');
        console.log(`   Database Section Type: ${travelTypeData.section_type || 'undefined'}`);
      } catch (e) {
        console.log(`   Database Section Type: parsing error`);
      }
      
      // Fetch from API to see what frontend gets
      try {
        const apiResponse = await axios.get(`http://localhost:5000/api/travel-products/${dbItem.category}`);
        const apiItem = apiResponse.data.find(item => item.id === dbItem.id);
        
        if (!apiItem) {
          console.log(`   ❌ Item not found in API response!`);
          allMatched = false;
          continue;
        }
        
        console.log(`   API Name: ${apiItem.name}`);
        console.log(`   API Price: ${apiItem.price}`);
        console.log(`   API Original Price: ${apiItem.original_price}`);
        console.log(`   API Section Type: ${apiItem.section_type || apiItem.sectionType || 'undefined'}`);
        
        // Verify data matches
        const nameMatches = apiItem.name === dbItem.name;
        const priceMatches = apiItem.price === dbItem.price;
        const originalPriceMatches = apiItem.original_price === dbItem.original_price;
        const sectionMatches = (apiItem.section_type || apiItem.sectionType) === travelTypeData.section_type;
        
        console.log(`   ✅ Name Match: ${nameMatches}`);
        console.log(`   ✅ Price Match: ${priceMatches}`);
        console.log(`   ✅ Original Price Match: ${originalPriceMatches}`);
        console.log(`   ✅ Section Match: ${sectionMatches}`);
        
        if (nameMatches && priceMatches && originalPriceMatches && sectionMatches) {
          console.log(`   ✅ ALL DATA MATCHES - Real values are displaying correctly!`);
        } else {
          console.log(`   ❌ DATA MISMATCH - Some values may be hardcoded or incorrect!`);
          allMatched = false;
        }
        
      } catch (apiError) {
        console.log(`   ❌ API Error: ${apiError.message}`);
        allMatched = false;
      }
    }
    
    db.close();
    
    console.log('\n' + '='.repeat(70));
    console.log('📊 VERIFICATION RESULTS');
    console.log('='.repeat(70));
    
    if (allMatched) {
      console.log('✅ SUCCESS: All submitted data values are displaying correctly!');
      console.log('✅ No hardcoded values detected - real admin data is showing');
      console.log('✅ Names, prices, and sections match what was submitted');
    } else {
      console.log('❌ ISSUES DETECTED: Some data may not be displaying correctly');
      console.log('❌ Possible hardcoded values or data mapping problems');
    }
    
    return allMatched;
    
  } catch (error) {
    console.error('💥 Verification failed:', error.message);
    return false;
  }
}

// Also check specific categories for display
async function checkCategoryDisplay() {
  console.log('\n🎯 CHECKING CATEGORY-SPECIFIC DISPLAY...');
  
  const categories = ['flights', 'hotels', 'tours', 'packages'];
  
  for (const category of categories) {
    try {
      console.log(`\n📂 ${category.toUpperCase()}:`);
      
      const response = await axios.get(`http://localhost:5000/api/travel-products/${category}`);
      const items = response.data;
      
      console.log(`   Total items: ${items.length}`);
      
      // Check for test items
      const testItems = items.filter(item => item.name && item.name.includes('Test'));
      console.log(`   Test items: ${testItems.length}`);
      
      if (testItems.length > 0) {
        testItems.forEach(item => {
          console.log(`     - ${item.name} | Price: ${item.price} | Section: ${item.section_type || item.sectionType || 'undefined'}`);
        });
      }
      
      // Check for any items with placeholder/hardcoded looking data
      const suspiciousItems = items.filter(item => 
        item.name && (
          item.name.includes('Sample') || 
          item.name.includes('Example') || 
          item.name.includes('Placeholder') ||
          item.price === '999' ||
          item.price === '1000'
        )
      );
      
      if (suspiciousItems.length > 0) {
        console.log(`   ⚠️  Suspicious/hardcoded items: ${suspiciousItems.length}`);
        suspiciousItems.forEach(item => {
          console.log(`     - ${item.name} | Price: ${item.price}`);
        });
      } else {
        console.log(`   ✅ No obvious hardcoded/placeholder data detected`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error checking ${category}: ${error.message}`);
    }
  }
}

// Run verification
verifyDataDisplay().then(async (success) => {
  await checkCategoryDisplay();
  
  console.log('\n🎯 FINAL ASSESSMENT:');
  if (success) {
    console.log('✅ Real admin-submitted data is displaying correctly');
    console.log('✅ No hardcoded values interfering with display');
    console.log('✅ Section mapping working with actual data values');
  } else {
    console.log('❌ Issues found with data display');
    console.log('❌ May have hardcoded values or mapping problems');
  }
}).catch(error => {
  console.error('💥 Verification process failed:', error.message);
});