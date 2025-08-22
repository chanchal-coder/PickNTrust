const http = require('http');
const https = require('https');

console.log('🧪 TESTING CANVA AUTOMATION WITH REAL SAMPLES...\n');

// Helper function to make HTTP requests
function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const protocol = options.port === 443 ? https : http;
    const req = protocol.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Test data
const testPassword = 'pickntrust2025';

const sampleProduct = {
  password: testPassword,
  name: 'Test Automation Product',
  description: 'This is a test product to verify Canva automation is working correctly.',
  price: '99.99',
  originalPrice: '149.99',
  category: 'Electronics & Gadgets',
  imageUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&q=80',
  affiliateUrl: 'https://example.com/test-product',
  affiliateNetworkId: '1',
  isFeatured: true,
  isApproved: true,
  status: 'active'
};

const sampleBlogPost = {
  password: testPassword,
  title: 'Test Automation Blog Post',
  excerpt: 'This is a test blog post to verify Canva automation is working correctly.',
  content: 'This is the full content of our test blog post. It contains information about testing the Canva automation system.',
  category: 'Technology',
  tags: ['automation', 'testing', 'canva'],
  imageUrl: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&q=80',
  slug: 'test-automation-blog-post-' + Date.now(),
  publishedAt: new Date().toISOString(),
  isPublished: true,
  status: 'published'
};

const sampleVideo = {
  password: testPassword,
  title: 'Test Automation Video',
  description: 'This is a test video to verify Canva automation is working correctly.',
  videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  platform: 'YouTube',
  category: 'Technology',
  tags: ['automation', 'testing', 'video'],
  thumbnailUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&q=80',
  duration: '5:30'
};

// Test functions
async function testProductAutomation() {
  console.log('1️⃣ TESTING PRODUCT AUTOMATION:');
  console.log('==============================');
  
  try {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/products',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    console.log('📤 Adding test product...');
    const response = await makeRequest(options, sampleProduct);
    
    if (response.status === 200) {
      console.log('✅ Product created successfully!');
      console.log('📊 Response:', response.data.message);
      if (response.data.product) {
        console.log('🆔 Product ID:', response.data.product.id);
        console.log('🔗 Product URL: http://localhost:3000/product/' + response.data.product.id);
      }
      return true;
    } else {
      console.log('❌ Product creation failed:', response.status);
      console.log('📄 Response:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Product test error:', error.message);
    return false;
  }
}

async function testBlogAutomation() {
  console.log('\n2️⃣ TESTING BLOG POST AUTOMATION:');
  console.log('=================================');
  
  try {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/blog',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    console.log('📤 Adding test blog post...');
    const response = await makeRequest(options, sampleBlogPost);
    
    if (response.status === 200) {
      console.log('✅ Blog post created successfully!');
      console.log('📊 Response:', response.data.message);
      if (response.data.blogPost) {
        console.log('🆔 Blog Post ID:', response.data.blogPost.id);
        console.log('🔗 Blog URL: http://localhost:3000/blog/' + response.data.blogPost.slug);
      }
      return true;
    } else {
      console.log('❌ Blog post creation failed:', response.status);
      console.log('📄 Response:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Blog test error:', error.message);
    return false;
  }
}

async function testVideoAutomation() {
  console.log('\n3️⃣ TESTING VIDEO AUTOMATION:');
  console.log('=============================');
  
  try {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/video-content',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    console.log('📤 Adding test video...');
    const response = await makeRequest(options, sampleVideo);
    
    if (response.status === 200) {
      console.log('✅ Video created successfully!');
      console.log('📊 Response:', response.data.message);
      if (response.data.videoContent) {
        console.log('🆔 Video ID:', response.data.videoContent.id);
        console.log('🔗 Video URL: http://localhost:3000/video/' + response.data.videoContent.id);
      }
      return true;
    } else {
      console.log('❌ Video creation failed:', response.status);
      console.log('📄 Response:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Video test error:', error.message);
    return false;
  }
}

async function checkServerStatus() {
  console.log('🔍 CHECKING SERVER STATUS:');
  console.log('==========================');
  
  try {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/products',
      method: 'GET'
    };
    
    const response = await makeRequest(options);
    
    if (response.status === 200) {
      console.log('✅ Server is running and responding');
      return true;
    } else {
      console.log('❌ Server responded with status:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Server is not running or not accessible');
    console.log('💡 Please start the server with: npm run dev');
    return false;
  }
}

// Main test execution
async function runAutomationTests() {
  console.log('🚀 STARTING AUTOMATION TESTS...\n');
  
  // Check if server is running
  const serverRunning = await checkServerStatus();
  if (!serverRunning) {
    console.log('\n❌ TESTS FAILED: Server is not running');
    console.log('💡 Start the server first: npm run dev');
    return;
  }
  
  // Wait a moment for server to be ready
  console.log('\n⏳ Waiting for server to be ready...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Run tests
  const productTest = await testProductAutomation();
  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait between tests
  
  const blogTest = await testBlogAutomation();
  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait between tests
  
  const videoTest = await testVideoAutomation();
  
  // Summary
  console.log('\n🎯 AUTOMATION TEST RESULTS:');
  console.log('============================');
  console.log(`${productTest ? '✅' : '❌'} Product Automation: ${productTest ? 'WORKING' : 'FAILED'}`);
  console.log(`${blogTest ? '✅' : '❌'} Blog Post Automation: ${blogTest ? 'WORKING' : 'FAILED'}`);
  console.log(`${videoTest ? '✅' : '❌'} Video Automation: ${videoTest ? 'WORKING' : 'FAILED'}`);
  
  const allPassed = productTest && blogTest && videoTest;
  
  if (allPassed) {
    console.log('\n🎉 ALL AUTOMATION TESTS PASSED!');
    console.log('\n📋 WHAT TO CHECK NOW:');
    console.log('1. Check server logs for automation messages:');
    console.log('   Look for: "🚀 Triggering Canva automation..."');
    console.log('   Look for: "✅ Canva automation completed..."');
    console.log('2. Check your social media accounts for new posts');
    console.log('3. Verify the test content appears in your admin panel');
    console.log('\n🔗 TEST CONTENT URLS:');
    console.log('- Products: http://localhost:3000/admin (Product Management)');
    console.log('- Blog: http://localhost:3000/admin (Blog Management)');
    console.log('- Videos: http://localhost:3000/videos');
  } else {
    console.log('\n❌ SOME TESTS FAILED');
    console.log('🔧 TROUBLESHOOTING:');
    console.log('1. Check if the server is running: npm run dev');
    console.log('2. Verify the admin password is correct');
    console.log('3. Check server logs for error messages');
    console.log('4. Ensure database is accessible');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(allPassed ? '🎊 AUTOMATION SYSTEM IS WORKING! 🎊' : '⚠️ PLEASE FIX ISSUES ABOVE');
  console.log('='.repeat(60));
}

// Run the tests
runAutomationTests().catch(console.error);
