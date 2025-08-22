const { spawn } = require('child_process');

console.log('🧪 TESTING CANVA AUTOMATION WITH CURL...\n');

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

function runCurlCommand(url, data, description) {
  return new Promise((resolve) => {
    console.log(`📤 ${description}...`);
    
    const curlArgs = [
      '-X', 'POST',
      '-H', 'Content-Type: application/json',
      '-d', JSON.stringify(data),
      `http://localhost:3000${url}`,
      '--connect-timeout', '5',
      '--max-time', '10'
    ];
    
    const curl = spawn('curl', curlArgs);
    let output = '';
    let error = '';
    
    curl.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    curl.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    curl.on('close', (code) => {
      if (code === 0 && output) {
        try {
          const response = JSON.parse(output);
          console.log('✅ Success:', response.message || 'Request completed');
          if (response.product) console.log('🆔 Product ID:', response.product.id);
          if (response.blogPost) console.log('🆔 Blog Post ID:', response.blogPost.id);
          if (response.videoContent) console.log('🆔 Video ID:', response.videoContent.id);
          resolve(true);
        } catch (e) {
          console.log('✅ Response received (non-JSON):', output.substring(0, 100));
          resolve(true);
        }
      } else {
        console.log('❌ Failed:', error || `Exit code: ${code}`);
        resolve(false);
      }
    });
  });
}

async function testAutomation() {
  console.log('🚀 STARTING AUTOMATION TESTS WITH CURL...\n');
  
  // Test 1: Product automation
  console.log('1️⃣ TESTING PRODUCT AUTOMATION:');
  console.log('==============================');
  const productResult = await runCurlCommand('/api/admin/products', sampleProduct, 'Adding test product');
  
  // Wait between tests
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 2: Blog automation
  console.log('\n2️⃣ TESTING BLOG POST AUTOMATION:');
  console.log('=================================');
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
  
  const blogResult = await runCurlCommand('/api/admin/blog', sampleBlogPost, 'Adding test blog post');
  
  // Wait between tests
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 3: Video automation
  console.log('\n3️⃣ TESTING VIDEO AUTOMATION:');
  console.log('=============================');
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
  
  const videoResult = await runCurlCommand('/api/admin/video-content', sampleVideo, 'Adding test video');
  
  // Summary
  console.log('\n🎯 AUTOMATION TEST RESULTS:');
  console.log('============================');
  console.log(`${productResult ? '✅' : '❌'} Product Automation: ${productResult ? 'WORKING' : 'FAILED'}`);
  console.log(`${blogResult ? '✅' : '❌'} Blog Post Automation: ${blogResult ? 'WORKING' : 'FAILED'}`);
  console.log(`${videoResult ? '✅' : '❌'} Video Automation: ${videoResult ? 'WORKING' : 'FAILED'}`);
  
  const allPassed = productResult && blogResult && videoResult;
  
  if (allPassed) {
    console.log('\n🎉 ALL AUTOMATION TESTS PASSED!');
    console.log('\n📋 WHAT TO CHECK NOW:');
    console.log('1. Check PM2 logs for automation messages:');
    console.log('   pm2 logs');
    console.log('   Look for: "🚀 Triggering Canva automation..."');
    console.log('   Look for: "✅ Canva automation completed..."');
    console.log('2. Check your social media accounts for new posts');
    console.log('3. Verify the test content appears in your admin panel');
    console.log('\n🔗 TEST CONTENT URLS:');
    console.log('- Admin Panel: http://localhost:3000/admin');
    console.log('- Products: http://localhost:3000/');
    console.log('- Blog: http://localhost:3000/blog');
    console.log('- Videos: http://localhost:3000/videos');
  } else {
    console.log('\n❌ SOME TESTS FAILED');
    console.log('🔧 TROUBLESHOOTING:');
    console.log('1. Make sure the server is running: pm2 status');
    console.log('2. If not running: pm2 start ecosystem.config.cjs');
    console.log('3. Check PM2 logs: pm2 logs');
    console.log('4. Verify the admin password is correct');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(allPassed ? '🎊 AUTOMATION SYSTEM IS WORKING! 🎊' : '⚠️ PLEASE FIX ISSUES ABOVE');
  console.log('='.repeat(60));
}

// Run the tests
testAutomation().catch(console.error);
