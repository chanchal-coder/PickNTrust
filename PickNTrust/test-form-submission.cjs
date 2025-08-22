const fetch = require('node-fetch');

async function testFormSubmission() {
  console.log('🧪 Testing Product Form Submission...\n');
  
  try {
    // Test data that matches the form structure
    const testProduct = {
      password: 'pickntrust2025',
      name: 'Test UI Product',
      description: 'Testing form submission from UI',
      price: 1999,
      originalPrice: 2999,
      imageUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400',
      affiliateUrl: 'https://example.com/test-product',
      category: 'Electronics & Gadgets', // This is the key field that might be failing
      gender: null,
      rating: 4.5,
      reviewCount: 100,
      discount: 33,
      isFeatured: true,
      isNew: false,
      hasTimer: false,
      timerDuration: null,
      customFields: null
    };

    console.log('📤 Sending product data:');
    console.log(JSON.stringify(testProduct, null, 2));
    console.log('\n');

    const response = await fetch('http://localhost:5000/api/admin/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testProduct)
    });

    console.log(`📊 Response Status: ${response.status}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ SUCCESS: Product added successfully!');
      console.log('📋 Response:', JSON.stringify(result, null, 2));
      
      // Test with missing category (this should fail)
      console.log('\n🧪 Testing with missing category (should fail)...');
      const invalidProduct = { ...testProduct, category: '' };
      
      const invalidResponse = await fetch('http://localhost:5000/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidProduct)
      });
      
      console.log(`📊 Invalid Response Status: ${invalidResponse.status}`);
      if (!invalidResponse.ok) {
        const errorText = await invalidResponse.text();
        console.log('❌ Expected failure:', errorText);
      }
      
    } else {
      const errorText = await response.text();
      console.log('❌ FAILED: Product addition failed');
      console.log('📋 Error:', errorText);
    }

  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
  }
}

testFormSubmission();
