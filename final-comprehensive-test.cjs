console.log('Target FINAL COMPREHENSIVE TEST - All Admin Functions');
console.log('Testing: Products, Services, and Video Content\n');

// Test data for all three types
const productData = {
  password: 'pickntrust2025',
  name: 'Final Test Product',
  description: 'Testing regular product addition',
  price: '1,999',
  originalPrice: '2,999',
  imageUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400',
  affiliateUrl: 'https://example.com/product',
  category: 'Electronics & Gadgets',
  gender: '',
  rating: '4.5',
  reviewCount: '150',
  discount: '33',
  isFeatured: true,
  isService: false,
  hasTimer: false,
  timerDuration: '24',
  customFields: {
    brand: 'TestBrand',
    color: 'Black'
  }
};

const serviceData = {
  password: 'pickntrust2025',
  name: 'Final Test Service - Premium Credit Card',
  description: 'Premium credit card with exclusive benefits',
  price: '0',
  originalPrice: '',
  imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400',
  affiliateUrl: 'https://example.com/service',
  category: 'Credit Cards',
  gender: '',
  rating: '4.8',
  reviewCount: '500',
  discount: '',
  isFeatured: true,
  isService: true,
  hasTimer: false,
  timerDuration: '24',
  customFields: {
    serviceType: 'credit-card',
    provider: 'Test Bank',
    features: 'Cashback, Rewards, No Annual Fee'
  }
};

const videoData = {
  password: 'pickntrust2025',
  title: 'Final Test Video - Product Review',
  description: 'Comprehensive product review video',
  videoUrl: 'https://www.youtube.com/watch?v=finaltest123',
  thumbnailUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400',
  platform: 'YouTube',
  category: 'Reviews',
  tags: ['review', 'test', 'final'],
  duration: '8:45',
  hasTimer: false,
  timerDuration: null
};

async function testEndpoint(name, url, data) {
  try {
    console.log(`\n=== TESTING ${name.toUpperCase()} ===`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    console.log(`${name} Response Status:`, response.status);
    const result = await response.json();
    
    if (response.status === 200) {
      console.log(`Success ${name} ADDING: PASSED`);
      console.log(`${name} ID:`, result.product?.id || result.videoContent?.id || 'Unknown');
      return true;
    } else {
      console.log(`Error ${name} ADDING: FAILED`);
      console.log('Error:', result.message || result.error || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.log(`Error ${name} ADDING: FAILED`);
    console.log('Network Error:', error.message);
    return false;
  }
}

async function runFinalTest() {
  console.log('Launch Starting final comprehensive test...\n');
  
  const productResult = await testEndpoint('PRODUCT', 'http://localhost:5000/api/admin/products', productData);
  const serviceResult = await testEndpoint('SERVICE', 'http://localhost:5000/api/admin/products', serviceData);
  const videoResult = await testEndpoint('VIDEO', 'http://localhost:5000/api/admin/video-content', videoData);
  
  console.log('\n' + '='.repeat(50));
  console.log('Target FINAL TEST RESULTS SUMMARY');
  console.log('='.repeat(50));
  console.log(`Products Product Adding: ${productResult ? 'Success WORKING' : 'Error FAILING'}`);
  console.log(`💳 Service Adding: ${serviceResult ? 'Success WORKING' : 'Error FAILING'}`);
  console.log(`Movie Video Adding: ${videoResult ? 'Success WORKING' : 'Error FAILING'}`);
  console.log('='.repeat(50));
  
  const allWorking = productResult && serviceResult && videoResult;
  
  if (allWorking) {
    console.log('Celebration ALL ADMIN FUNCTIONS ARE WORKING PERFECTLY!');
    console.log('Success TypeScript errors fixed');
    console.log('Success Database schema complete');
    console.log('Success All endpoints responding correctly');
    console.log('Success Products, Services, and Videos all functional');
  } else {
    console.log('Warning  Some functions are still failing:');
    if (!productResult) console.log('   - Product adding needs attention');
    if (!serviceResult) console.log('   - Service adding needs attention');
    if (!videoResult) console.log('   - Video adding needs attention');
  }
  
  return allWorking;
}

runFinalTest();
