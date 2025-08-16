const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000';
const ADMIN_PASSWORD = 'pickntrust2025';

async function testServiceFeatures() {
  console.log('🧪 Testing Service Features Implementation...\n');

  try {
    // Test 1: Add a service product
    console.log('1️⃣ Testing service product creation...');
    const serviceProduct = {
      password: ADMIN_PASSWORD,
      name: 'HDFC Credit Card Premium',
      description: 'Premium credit card with excellent rewards and benefits',
      price: '0',
      originalPrice: '500',
      imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400',
      affiliateUrl: 'https://example.com/hdfc-credit-card',
      category: 'Credit Cards',
      rating: '4.8',
      reviewCount: '2500',
      discount: '100',
      isFeatured: true,
      isService: true,
      customFields: {
        serviceType: 'credit-card',
        pricingType: 'free',
        provider: 'HDFC Bank',
        features: '5% cashback, Airport lounge access, Zero annual fee',
        eligibility: 'Age 21+, Minimum income ₹50,000, Good credit score',
        terms: 'No hidden charges, Instant approval, 24/7 customer support',
        processingTime: 'Instant approval',
        support: '24/7 Phone & Chat',
        rewards: '5% cashback on all purchases'
      }
    };

    const addResponse = await fetch(`${BASE_URL}/api/admin/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(serviceProduct)
    });

    if (addResponse.ok) {
      const result = await addResponse.json();
      console.log('✅ Service product created successfully:', result.message);
      console.log('   Product ID:', result.product?.id);
    } else {
      const error = await addResponse.json();
      console.log('❌ Failed to create service product:', error.message);
    }

    // Test 2: Add a regular product
    console.log('\n2️⃣ Testing regular product creation...');
    const regularProduct = {
      password: ADMIN_PASSWORD,
      name: 'Wireless Bluetooth Headphones',
      description: 'High-quality wireless headphones with noise cancellation',
      price: '2999',
      originalPrice: '4999',
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
      affiliateUrl: 'https://example.com/headphones',
      category: 'Electronics & Gadgets',
      rating: '4.5',
      reviewCount: '1200',
      discount: '40',
      isFeatured: true,
      isService: false,
      customFields: {
        brand: 'Sony',
        color: 'Black',
        warranty: '2 years'
      }
    };

    const addRegularResponse = await fetch(`${BASE_URL}/api/admin/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regularProduct)
    });

    if (addRegularResponse.ok) {
      const result = await addRegularResponse.json();
      console.log('✅ Regular product created successfully:', result.message);
      console.log('   Product ID:', result.product?.id);
    } else {
      const error = await addRegularResponse.json();
      console.log('❌ Failed to create regular product:', error.message);
    }

    // Test 3: Fetch all products
    console.log('\n3️⃣ Testing product retrieval...');
    const productsResponse = await fetch(`${BASE_URL}/api/products`);
    
    if (productsResponse.ok) {
      const data = await productsResponse.json();
      const products = Array.isArray(data) ? data : data.products || [];
      console.log(`✅ Retrieved ${products.length} products`);
      
      const serviceProducts = products.filter(p => p.isService);
      const regularProducts = products.filter(p => !p.isService);
      
      console.log(`   - Service products: ${serviceProducts.length}`);
      console.log(`   - Regular products: ${regularProducts.length}`);
    } else {
      console.log('❌ Failed to retrieve products');
    }

    // Test 4: Fetch service products specifically
    console.log('\n4️⃣ Testing service products endpoint...');
    const serviceResponse = await fetch(`${BASE_URL}/api/products/services`);
    
    if (serviceResponse.ok) {
      const serviceProducts = await serviceResponse.json();
      console.log(`✅ Retrieved ${serviceProducts.length} service products`);
      
      if (serviceProducts.length > 0) {
        const firstService = serviceProducts[0];
        console.log('   Sample service product:');
        console.log(`   - Name: ${firstService.name}`);
        console.log(`   - Category: ${firstService.category}`);
        console.log(`   - Is Service: ${firstService.isService}`);
        
        // Check if customFields are properly stored and retrieved
        if (firstService.customFields) {
          try {
            const customFields = typeof firstService.customFields === 'string' 
              ? JSON.parse(firstService.customFields) 
              : firstService.customFields;
            console.log('   - Custom Fields:', Object.keys(customFields).join(', '));
          } catch (e) {
            console.log('   - Custom Fields: (parsing error)');
          }
        }
      }
    } else {
      console.log('❌ Failed to retrieve service products');
    }

    console.log('\n🎉 Service features testing completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testServiceFeatures();
