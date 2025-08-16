// Simple test without external dependencies
const http = require('http');

const BASE_URL = 'localhost';
const PORT = 5000;
const ADMIN_PASSWORD = 'pickntrust2025';

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          body: body,
          ok: res.statusCode >= 200 && res.statusCode < 300
        });
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testServerConnection() {
  console.log('\n🧪 Testing Server Connection...');
  
  try {
    const options = {
      hostname: BASE_URL,
      port: PORT,
      path: '/api/products',
      method: 'GET'
    };

    const response = await makeRequest(options);
    console.log(`Server Status: ${response.status}`);
    
    if (response.ok) {
      console.log('✅ Server is running and accessible');
      return true;
    } else {
      console.log('❌ Server responded with error');
      console.log(`Response: ${response.body}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Server connection error: ${error.message}`);
    return false;
  }
}

async function testAddProduct() {
  console.log('\n🧪 Testing Product Addition...');
  
  const productData = {
    password: ADMIN_PASSWORD,
    name: 'Test Product',
    description: 'This is a test product',
    price: 999,
    originalPrice: 1299,
    imageUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400',
    affiliateUrl: 'https://example.com/product',
    category: 'Electronics & Gadgets',
    gender: null,
    rating: 4.5,
    reviewCount: 100,
    discount: 23,
    isFeatured: true,
    isNew: false,
    hasTimer: false,
    timerDuration: null,
    customFields: null
  };

  try {
    const options = {
      hostname: BASE_URL,
      port: PORT,
      path: '/api/admin/products',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const response = await makeRequest(options, productData);
    console.log(`Response Status: ${response.status}`);
    console.log(`Response Body: ${response.body}`);

    if (!response.ok) {
      console.log('❌ Product addition failed');
      return false;
    } else {
      console.log('✅ Product addition successful');
      return true;
    }
  } catch (error) {
    console.log(`❌ Product addition error: ${error.message}`);
    return false;
  }
}

async function testAddVideoContent() {
  console.log('\n🧪 Testing Video Content Addition...');
  
  const videoData = {
    password: ADMIN_PASSWORD,
    title: 'Test Video',
    description: 'This is a test video',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400',
    platform: 'YouTube',
    category: 'Tech Reviews',
    duration: '5:30',
    tags: ['test', 'video'],
    isActive: true
  };

  try {
    const options = {
      hostname: BASE_URL,
      port: PORT,
      path: '/api/admin/video-content',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const response = await makeRequest(options, videoData);
    console.log(`Response Status: ${response.status}`);
    console.log(`Response Body: ${response.body}`);

    if (!response.ok) {
      console.log('❌ Video content addition failed');
      return false;
    } else {
      console.log('✅ Video content addition successful');
      return true;
    }
  } catch (error) {
    console.log(`❌ Video content addition error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Add Functionality Tests...');
  
  const serverOk = await testServerConnection();
  if (!serverOk) {
    console.log('\n❌ Server is not running. Please start the server with: npm run dev');
    return;
  }

  const productResult = await testAddProduct();
  const videoResult = await testAddVideoContent();

  console.log('\n📊 Test Results Summary:');
  console.log(`Product Addition: ${productResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Video Addition: ${videoResult ? '✅ PASS' : '❌ FAIL'}`);
  
  if (!productResult || !videoResult) {
    console.log('\n🔍 Common Issues to Check:');
    console.log('1. Database schema - missing columns or tables');
    console.log('2. Server routes - incorrect endpoint paths');
    console.log('3. Validation errors - required fields missing');
    console.log('4. Authentication - incorrect admin password');
    console.log('5. Database permissions - write access issues');
  }
}

runTests().catch(console.error);
