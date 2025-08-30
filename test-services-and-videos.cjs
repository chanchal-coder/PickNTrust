console.log('Testing Services and Video Content adding...');

// Test 1: Add a Service Product
const serviceData = {
  password: 'pickntrust2025',
  name: 'HDFC Credit Card',
  description: 'Premium credit card with cashback rewards',
  price: '0', // Services often have no upfront cost
  originalPrice: '',
  imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400',
  affiliateUrl: 'https://example.com/hdfc-card',
  category: 'Credit Cards',
  gender: '',
  rating: '4.8',
  reviewCount: '500',
  discount: '',
  isFeatured: true,
  isService: true, // This is a service
  hasTimer: false,
  timerDuration: '24',
  customFields: {
    serviceType: 'credit-card',
    provider: 'HDFC Bank',
    features: 'Cashback, Rewards, No Annual Fee'
  }
};

// Test 2: Add Video Content
const videoData = {
  password: 'pickntrust2025',
  title: 'Best Credit Cards 2024 Review',
  description: 'Comprehensive review of top credit cards',
  videoUrl: 'https://www.youtube.com/watch?v=example123',
  thumbnailUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400',
  platform: 'YouTube',
  category: 'Finance',
  tags: ['credit cards', 'finance', 'review'],
  duration: '10:30',
  hasTimer: false,
  timerDuration: null
};

async function testServiceAdding() {
  try {
    console.log('\n=== TESTING SERVICE ADDING ===');
    console.log('Sending service data:', JSON.stringify(serviceData, null, 2));
    
    const response = await fetch('http://localhost:5000/api/admin/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(serviceData)
    });
    
    console.log('Service Response status:', response.status);
    const result = await response.json();
    console.log('Service Response:', JSON.stringify(result, null, 2));
    
    return response.status === 200;
  } catch (error) {
    console.error('Service Error:', error.message);
    return false;
  }
}

async function testVideoAdding() {
  try {
    console.log('\n=== TESTING VIDEO CONTENT ADDING ===');
    console.log('Sending video data:', JSON.stringify(videoData, null, 2));
    
    const response = await fetch('http://localhost:5000/api/admin/video-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(videoData)
    });
    
    console.log('Video Response status:', response.status);
    const result = await response.json();
    console.log('Video Response:', JSON.stringify(result, null, 2));
    
    return response.status === 200;
  } catch (error) {
    console.error('Video Error:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 Starting comprehensive admin functionality tests...\n');
  
  const serviceSuccess = await testServiceAdding();
  const videoSuccess = await testVideoAdding();
  
  console.log('\n=== TEST RESULTS SUMMARY ===');
  console.log(`✅ Service Adding: ${serviceSuccess ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Video Adding: ${videoSuccess ? 'PASSED' : 'FAILED'}`);
  
  if (serviceSuccess && videoSuccess) {
    console.log('\n🎉 ALL TESTS PASSED! Services and Videos are working correctly.');
  } else {
    console.log('\n❌ Some tests failed. Check the errors above.');
  }
}

runAllTests();
