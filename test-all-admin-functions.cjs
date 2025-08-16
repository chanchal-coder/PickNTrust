// Comprehensive test for all admin functions
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

async function testAddServiceProduct() {
  console.log('\n🧪 Testing Service Product Addition...');
  
  const serviceData = {
    password: ADMIN_PASSWORD,
    name: 'Test Service - HDFC Credit Card',
    description: 'Premium credit card with cashback rewards',
    price: 0, // Services might be free
    originalPrice: null,
    imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400',
    affiliateUrl: 'https://example.com/hdfc-card',
    category: 'Credit Cards',
    gender: null,
    rating: 4.8,
    reviewCount: 250,
    discount: null,
    isFeatured: true,
    isNew: false,
    isService: true, // This marks it as a service
    hasTimer: false,
    timerDuration: null,
    customFields: JSON.stringify({
      serviceType: 'credit-card',
      provider: 'HDFC Bank',
      features: 'Cashback, Rewards, Premium Support',
      eligibility: 'Age 21+, Minimum income ₹25,000',
      processingTime: '7-10 days'
    })
  };

  try {
    const options = {
      hostname: BASE_URL,
      port: PORT,
      path: '/api/admin/products', // Services use the same endpoint
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const response = await makeRequest(options, serviceData);
    console.log(`Response Status: ${response.status}`);
    console.log(`Response Body: ${response.body}`);

    if (!response.ok) {
      console.log('❌ Service product addition failed');
      return false;
    } else {
      console.log('✅ Service product addition successful');
      return true;
    }
  } catch (error) {
    console.log(`❌ Service product addition error: ${error.message}`);
    return false;
  }
}

async function testAddVideoContent() {
  console.log('\n🧪 Testing Video Content Addition...');
  
  const videoData = {
    password: ADMIN_PASSWORD,
    title: 'Test Video Content',
    description: 'This is a test video for the platform',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400',
    platform: 'YouTube', // Required field
    category: 'Tech Reviews',
    duration: '5:30',
    tags: ['test', 'video', 'demo'],
    hasTimer: false,
    timerDuration: null
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

async function testAddBlogPost() {
  console.log('\n🧪 Testing Blog Post Addition...');
  
  const blogData = {
    password: ADMIN_PASSWORD,
    title: 'Test Blog Post',
    excerpt: 'This is a test blog post excerpt',
    content: 'This is the full content of the test blog post. It contains detailed information about the topic.',
    category: 'Technology',
    tags: ['test', 'blog', 'demo'],
    imageUrl: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400',
    publishedAt: new Date().toISOString(),
    slug: 'test-blog-post-' + Date.now(),
    isPublished: true,
    hasTimer: false,
    timerDuration: null
  };

  try {
    const options = {
      hostname: BASE_URL,
      port: PORT,
      path: '/api/admin/blog',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const response = await makeRequest(options, blogData);
    console.log(`Response Status: ${response.status}`);
    console.log(`Response Body: ${response.body}`);

    if (!response.ok) {
      console.log('❌ Blog post addition failed');
      return false;
    } else {
      console.log('✅ Blog post addition successful');
      return true;
    }
  } catch (error) {
    console.log(`❌ Blog post addition error: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Comprehensive Admin Function Tests...');
  console.log('Testing all admin functionalities: Products, Services, Videos, and Blog Posts\n');
  
  const productResult = await testAddProduct();
  const serviceResult = await testAddServiceProduct();
  const videoResult = await testAddVideoContent();
  const blogResult = await testAddBlogPost();

  console.log('\n📊 Complete Test Results Summary:');
  console.log(`Regular Product Addition: ${productResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Service Product Addition: ${serviceResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Video Content Addition: ${videoResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Blog Post Addition: ${blogResult ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = productResult && serviceResult && videoResult && blogResult;
  
  if (allPassed) {
    console.log('\n🎉 All admin functions are working correctly!');
    console.log('The issue might be in the frontend UI components or form validation.');
  } else {
    console.log('\n🔍 Issues Found - Check the failed endpoints above for details.');
    console.log('Common issues to investigate:');
    console.log('1. Missing required fields in the request payload');
    console.log('2. Incorrect data types or format');
    console.log('3. Database schema mismatches');
    console.log('4. Server-side validation errors');
  }
}

runAllTests().catch(console.error);
