const fetch = require('node-fetch');

async function testServerAfterFix() {
  const baseUrl = 'http://localhost:5000';
  
  console.log('🧪 Testing server after database fix...\n');
  
  try {
    // Test 1: Check products endpoint
    console.log('1. Testing /api/products endpoint...');
    const productsResponse = await fetch(`${baseUrl}/api/products`);
    console.log(`   Status: ${productsResponse.status}`);
    
    if (productsResponse.status === 200) {
      const products = await productsResponse.json();
      console.log(`   ✅ Products endpoint working. Found ${Array.isArray(products) ? products.length : products.products?.length || 0} products\n`);
    } else {
      console.log(`   ❌ Products endpoint failed\n`);
    }
    
    // Test 2: Check video content endpoint
    console.log('2. Testing /api/video-content endpoint...');
    const videoResponse = await fetch(`${baseUrl}/api/video-content`);
    console.log(`   Status: ${videoResponse.status}`);
    
    if (videoResponse.status === 200) {
      const videos = await videoResponse.json();
      console.log(`   ✅ Video content endpoint working. Found ${videos.length} videos\n`);
    } else {
      const errorText = await videoResponse.text();
      console.log(`   ❌ Video content endpoint failed: ${errorText}\n`);
    }
    
    // Test 3: Try adding a product
    console.log('3. Testing product addition...');
    const testProduct = {
      password: 'pickntrust2025',
      name: 'Test Product After Fix',
      description: 'Testing after database fix',
      price: '1999',
      imageUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400',
      affiliateUrl: 'https://example.com/test',
      category: 'Electronics & Gadgets',
      rating: '4.5',
      reviewCount: '100',
      isFeatured: true
    };
    
    const addResponse = await fetch(`${baseUrl}/api/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testProduct)
    });
    
    console.log(`   Status: ${addResponse.status}`);
    
    if (addResponse.status === 200) {
      const result = await addResponse.json();
      console.log(`   ✅ Product addition working! Product ID: ${result.product?.id}\n`);
    } else {
      const errorText = await addResponse.text();
      console.log(`   ❌ Product addition failed: ${errorText}\n`);
    }
    
    console.log('🎉 Server testing complete!');
    
  } catch (error) {
    console.error('❌ Error testing server:', error.message);
    console.log('\n💡 Make sure the server is running with: npm run dev');
  }
}

testServerAfterFix();
