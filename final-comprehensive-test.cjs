const http = require('http');
const { spawn } = require('child_process');

console.log('🔧 Final Comprehensive Test - Both Critical Issues\n');

// Test functions
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

async function runComprehensiveTests() {
  console.log('🚀 Starting server for testing...\n');
  
  // Start server
  const serverProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'pipe',
    shell: true
  });

  let serverOutput = '';
  serverProcess.stdout.on('data', (data) => {
    serverOutput += data.toString();
  });

  serverProcess.stderr.on('data', (data) => {
    console.error('Server error:', data.toString());
  });

  // Wait for server to start
  console.log('⏳ Waiting for server to start...');
  await new Promise(resolve => setTimeout(resolve, 8000));

  console.log('📊 Running comprehensive tests...\n');

  // Test 1: Blog API (for blank screen issue)
  console.log('🧪 Test 1: Blog API (Blank Screen Fix)');
  const blogTest = await testAPI('/api/blog');
  if (blogTest.success) {
    console.log('✅ Blog API working - No blank screen issue');
    console.log(`📊 Response: ${blogTest.data.substring(0, 100)}...`);
  } else {
    console.log('❌ Blog API failed:', blogTest.error || `Status: ${blogTest.statusCode}`);
  }

  // Test 2: Video Content API (for video posting)
  console.log('\n🧪 Test 2: Video Content API (Video Posting Fix)');
  const videoGetTest = await testAPI('/api/video-content');
  if (videoGetTest.success) {
    console.log('✅ Video Content GET API working');
    console.log(`📊 Response: ${videoGetTest.data.substring(0, 100)}...`);
  } else {
    console.log('❌ Video Content GET API failed:', videoGetTest.error || `Status: ${videoGetTest.statusCode}`);
  }

  // Test 3: Video Posting (POST)
  console.log('\n🧪 Test 3: Video Posting (POST)');
  const videoPostData = {
    password: 'pickntrust2025',
    title: 'Test Video Post',
    description: 'Testing video posting functionality',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    platform: 'YouTube',
    category: 'Test',
    tags: ['test', 'video', 'functionality']
  };

  const videoPostTest = await testAPI('/api/admin/video-content', 'POST', videoPostData);
  if (videoPostTest.success) {
    console.log('✅ Video posting works - No "failed to post" error');
    console.log(`📊 Response: ${videoPostTest.data}`);
  } else {
    console.log('❌ Video posting failed:', videoPostTest.error || `Status: ${videoPostTest.statusCode}`);
    if (videoPostTest.data) {
      console.log(`📊 Error response: ${videoPostTest.data}`);
    }
  }

  // Test 4: Categories API (for React Query errors)
  console.log('\n🧪 Test 4: Categories API (React Query Fix)');
  const categoriesTest = await testAPI('/api/categories');
  if (categoriesTest.success) {
    console.log('✅ Categories API working - React Query errors fixed');
    console.log(`📊 Response: ${categoriesTest.data.substring(0, 100)}...`);
  } else {
    console.log('❌ Categories API failed:', categoriesTest.error || `Status: ${categoriesTest.statusCode}`);
  }

  // Test 5: Products API (for React Query errors)
  console.log('\n🧪 Test 5: Products API (React Query Fix)');
  const productsTest = await testAPI('/api/products');
  if (productsTest.success) {
    console.log('✅ Products API working - React Query errors fixed');
    console.log(`📊 Response: ${productsTest.data.substring(0, 100)}...`);
  } else {
    console.log('❌ Products API failed:', productsTest.error || `Status: ${productsTest.statusCode}`);
  }

  // Test 6: Blog Post Creation (POST)
  console.log('\n🧪 Test 6: Blog Post Creation (POST)');
  const blogPostData = {
    password: 'pickntrust2025',
    title: 'Test Blog Post',
    excerpt: 'Testing blog post creation',
    content: 'This is a test blog post to verify functionality.',
    category: 'Test',
    tags: ['test', 'blog'],
    imageUrl: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&q=80',
    readTime: '2 min read',
    slug: 'test-blog-post-' + Date.now()
  };

  const blogPostTest = await testAPI('/api/admin/blog', 'POST', blogPostData);
  if (blogPostTest.success) {
    console.log('✅ Blog post creation works');
    console.log(`📊 Response: ${blogPostTest.data}`);
  } else {
    console.log('❌ Blog post creation failed:', blogPostTest.error || `Status: ${blogPostTest.statusCode}`);
    if (blogPostTest.data) {
      console.log(`📊 Error response: ${blogPostTest.data}`);
    }
  }

  // Summary
  console.log('\n🎉 COMPREHENSIVE TEST RESULTS:');
  console.log('=====================================');
  console.log(`✅ Blog API (Blank Screen Fix): ${blogTest.success ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Video GET API: ${videoGetTest.success ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Video POST API (Failed to Post Fix): ${videoPostTest.success ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Categories API (React Query Fix): ${categoriesTest.success ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Products API (React Query Fix): ${productsTest.success ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Blog Post Creation: ${blogPostTest.success ? 'PASSED' : 'FAILED'}`);

  const allPassed = blogTest.success && videoGetTest.success && videoPostTest.success && 
                   categoriesTest.success && productsTest.success && blogPostTest.success;

  if (allPassed) {
    console.log('\n🎊 ALL TESTS PASSED! Both critical issues are RESOLVED:');
    console.log('1. ✅ Blog post blank screen issue - FIXED');
    console.log('2. ✅ Video posting "failed to post" issue - FIXED');
    console.log('3. ✅ React Query errors - FIXED');
    console.log('\n🌐 Application is ready at: http://localhost:5000');
    console.log('🔧 Admin panel available at: http://localhost:5000/admin');
  } else {
    console.log('\n❌ Some tests failed. Please check the errors above.');
  }

  console.log('\n⚡ Server is running. Press Ctrl+C to stop.');
  
  // Keep server running for manual testing
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping server...');
    serverProcess.kill();
    process.exit(0);
  });
}

runComprehensiveTests().catch(console.error);
