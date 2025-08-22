async function testAutomationWithFallback() {
  console.log('🧪 Testing Canva Automation with Graceful Fallback...\n');
  
  const baseUrl = 'http://localhost:3000';
  const adminPassword = 'pickntrust2025';
  
  try {
    // Test 1: Add a product (should trigger automation)
    console.log('📦 Test 1: Adding product with automation trigger...');
    
    const productData = {
      password: adminPassword,
      name: 'Test Automation Product',
      description: 'Testing the new graceful fallback automation system',
      price: '999',
      originalPrice: '1299',
      category: 'Electronics & Gadgets',
      imageUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&q=80',
      affiliateUrl: 'https://example.com/test-product',
      affiliateNetworkId: '1',
      isFeatured: true,
      isApproved: true,
      status: 'active'
    };
    
    const productResponse = await fetch(`${baseUrl}/api/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData)
    });
    
    if (productResponse.ok) {
      const result = await productResponse.json();
      console.log('✅ Product created successfully:', result.message);
      console.log('🤖 Automation should have triggered in the background');
    } else {
      const error = await productResponse.text();
      console.log('❌ Product creation failed:', error);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 2: Add a blog post (should trigger automation)
    console.log('📝 Test 2: Adding blog post with automation trigger...');
    
    const blogData = {
      password: adminPassword,
      title: 'Test Automation Blog Post',
      excerpt: 'Testing the graceful fallback system for blog automation',
      content: 'This is a test blog post to verify that automation works even when Canva fails.',
      category: 'Technology',
      tags: ['automation', 'testing', 'canva', 'fallback'],
      imageUrl: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&q=80',
      publishedAt: new Date().toISOString(),
      slug: 'test-automation-blog-post-' + Date.now(),
      isPublished: true,
      status: 'published'
    };
    
    const blogResponse = await fetch(`${baseUrl}/api/admin/blog`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(blogData)
    });
    
    if (blogResponse.ok) {
      const result = await blogResponse.json();
      console.log('✅ Blog post created successfully:', result.message);
      console.log('🤖 Automation should have triggered in the background');
    } else {
      const error = await blogResponse.text();
      console.log('❌ Blog post creation failed:', error);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 3: Add video content (should trigger automation)
    console.log('🎬 Test 3: Adding video content with automation trigger...');
    
    const videoData = {
      password: adminPassword,
      title: 'Test Automation Video',
      description: 'Testing video automation with graceful fallback',
      videoUrl: 'https://www.youtube.com/watch?v=test123',
      platform: 'YouTube',
      category: 'Technology',
      tags: ['automation', 'video', 'testing'],
      thumbnailUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&q=80',
      duration: '5:30'
    };
    
    const videoResponse = await fetch(`${baseUrl}/api/admin/video-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(videoData)
    });
    
    if (videoResponse.ok) {
      const result = await videoResponse.json();
      console.log('✅ Video content created successfully:', result.message);
      console.log('🤖 Automation should have triggered in the background');
    } else {
      const error = await videoResponse.text();
      console.log('❌ Video content creation failed:', error);
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    console.log('🎉 AUTOMATION TESTING COMPLETE!');
    console.log('\n📊 What to check now:');
    console.log('1. Check PM2 logs: pm2 logs');
    console.log('2. Look for these automation messages:');
    console.log('   🚀 Triggering Canva automation for new [content]');
    console.log('   ⚠️ Canva design failed, using fallback approach');
    console.log('   📱 Auto-posting to social platforms (with fallback image)');
    console.log('   ✅ PARTIAL SUCCESS: Posted to X/4 platforms (Canva unavailable, used fallback images)');
    console.log('\n🔧 Expected behavior:');
    console.log('- Canva API will fail (Bad Request)');
    console.log('- System will gracefully fall back to original images');
    console.log('- Social media posting will still work');
    console.log('- You should see success messages for platforms with valid credentials');
    
  } catch (error) {
    console.error('🚨 Test failed with error:', error.message);
  }
}

// Run the test
testAutomationWithFallback();
