#!/usr/bin/env node

console.log('🔍 Debugging Prime Picks API Response');
console.log('=====================================\n');

async function debugAPIResponse() {
  try {
    console.log('📡 Fetching from: http://localhost:5000/api/products/page/prime-picks');
    
    const response = await fetch('http://localhost:5000/api/products/page/prime-picks');
    
    console.log(`✅ API Response Status: ${response.status}`);
    console.log(`📋 Response Headers:`, Object.fromEntries(response.headers.entries()));
    
    const rawText = await response.text();
    console.log(`📄 Raw Response Text:`, rawText);
    
    try {
      const data = JSON.parse(rawText);
      console.log(`📊 Parsed JSON:`, JSON.stringify(data, null, 2));
      
      if (data.products) {
        console.log(`📦 Products array length: ${data.products.length}`);
        if (data.products.length > 0) {
          console.log(`🔍 First product:`, JSON.stringify(data.products[0], null, 2));
        }
      } else {
        console.log('❌ No "products" property in response');
        console.log('🔍 Available properties:', Object.keys(data));
      }
    } catch (parseError) {
      console.error('❌ Failed to parse JSON:', parseError.message);
    }
    
  } catch (error) {
    console.error('❌ API Test failed:', error.message);
  }
}

debugAPIResponse().catch(console.error);