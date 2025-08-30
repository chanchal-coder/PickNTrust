const http = require('http');

console.log('🧪 Testing Featured Products Flow\n');

// Test the featured products functionality
function testAPI(endpoint, method = 'GET', data = null) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: endpoint,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        resolve({
          success: res.statusCode >= 200 && res.statusCode < 300,
          statusCode: res.statusCode,
          data: responseData,
          error: null
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        success: false,
        statusCode: 0,
        data: null,
        error: err.message
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        success: false,
        statusCode: 0,
        data: null,
        error: 'Request timeout'
      });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testFeaturedProductsFlow() {
  console.log('⏳ Waiting for server to be ready...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('🧪 Testing Featured Products Flow...\n');

  // Test 1: Create a test featured product
  console.log('1. Creating a test featured product...');
  const testProduct = {
    password: 'pickntrust2025',
    name: 'Test Featured Product - iPhone 15',
    description: 'This is a test featured product to verify the flow',
    price: 79999,
    originalPrice: 89999,
    imageUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&q=80',
    affiliateUrl: 'https://amazon.in/test-product',
    category: 'Electronics & Gadgets',
    rating: 4.8,
    reviewCount: 150,
    discount: 11,
    isFeatured: true, // This is the key - marking as featured
    hasTimer: false
  };

  const createResult = await testAPI('/api/admin/products', 'POST', testProduct);
  
  if (createResult.success) {
    console.log('✅ Test featured product created successfully');
    const createdProduct = JSON.parse(createResult.data);
    console.log(`📊 Product ID: ${createdProduct.id}, Featured: ${testProduct.isFeatured}`);
    
    // Test 2: Check if product appears in featured products
    console.log('\n2. Checking if product appears in featured products...');
    const featuredResult = await testAPI('/api/products/featured');
    
    if (featuredResult.success) {
      const featuredProducts = JSON.parse(featuredResult.data);
      const ourProduct = featuredProducts.find(p => p.name === testProduct.name);
      
      if (ourProduct) {
        console.log('✅ Product appears in "Today\'s Top Picks" (Featured Products)');
        console.log(`📊 Found in featured list: "${ourProduct.name}"`);
      } else {
        console.log('❌ Product NOT found in featured products list');
      }
    } else {
      console.log('❌ Failed to fetch featured products');
    }
    
    // Test 3: Check if product appears in its category
    console.log('\n3. Checking if product appears in its category...');
    const categoryResult = await testAPI(`/api/products/category/${encodeURIComponent(testProduct.category)}`);
    
    if (categoryResult.success) {
      const categoryProducts = JSON.parse(categoryResult.data);
      const ourProduct = categoryProducts.find(p => p.name === testProduct.name);
      
      if (ourProduct) {
        console.log('✅ Product appears in its respective category');
        console.log(`📊 Found in category "${testProduct.category}": "${ourProduct.name}"`);
        console.log(`📊 Featured status in category: ${ourProduct.isFeatured}`);
      } else {
        console.log('❌ Product NOT found in category products list');
      }
    } else {
      console.log('❌ Failed to fetch category products');
    }
    
    // Test 4: Verify the flow works as expected
    console.log('\n4. Flow Verification Summary:');
    console.log('=====================================');
    
    const featuredCheck = await testAPI('/api/products/featured');
    const categoryCheck = await testAPI(`/api/products/category/${encodeURIComponent(testProduct.category)}`);
    
    if (featuredCheck.success && categoryCheck.success) {
      const featuredProducts = JSON.parse(featuredCheck.data);
      const categoryProducts = JSON.parse(categoryCheck.data);
      
      const inFeatured = featuredProducts.some(p => p.name === testProduct.name);
      const inCategory = categoryProducts.some(p => p.name === testProduct.name);
      
      if (inFeatured && inCategory) {
        console.log('🎉 SUCCESS: Featured product appears in BOTH places!');
        console.log('✅ ✓ Today\'s Top Picks (Featured Products)');
        console.log('✅ ✓ Respective Category Page');
        console.log('\n🎯 CONCLUSION: The featured products flow is working correctly!');
        console.log('When admin checks "Featured Product" checkbox:');
        console.log('  → Product appears in "Today\'s Top Picks"');
        console.log('  → Product ALSO appears in its category');
        console.log('  → This is exactly what was requested! ✨');
      } else {
        console.log('❌ ISSUE: Product not appearing in both places');
        console.log(`   In Featured: ${inFeatured}`);
        console.log(`   In Category: ${inCategory}`);
      }
    }
    
  } else {
    console.log('❌ Failed to create test product');
    console.log(`📊 Status: ${createResult.statusCode}, Error: ${createResult.error}`);
    if (createResult.data) {
      console.log(`📊 Response: ${createResult.data}`);
    }
  }

  console.log('\n🌐 You can verify this manually at:');
  console.log('   • Homepage "Today\'s Top Picks" section: http://localhost:5000');
  console.log('   • Today\'s Top Picks page: http://localhost:5000/top-picks');
  console.log('   • Electronics category: http://localhost:5000/category/Electronics%20%26%20Gadgets');
  console.log('   • Admin panel: http://localhost:5000/admin');
}

testFeaturedProductsFlow().catch(console.error);
