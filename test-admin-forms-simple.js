// Simple test to verify admin forms are working
console.log('🧪 Testing Admin Forms - Product and Blog Addition...\n');

async function testAdminForms() {
  try {
    console.log('1. Testing Product Addition...');
    
    // Test adding a simple product
    const testProduct = {
      password: 'pickntrust2025',
      name: 'Test Product - Frontend Fix',
      description: 'Testing if frontend forms work properly',
      price: '999',
      originalPrice: '1299',
      imageUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400',
      affiliateUrl: 'https://example.com/test-product',
      category: 'Electronics & Gadgets',
      rating: '4.5',
      reviewCount: '100',
      discount: '23',
      isFeatured: true,
      isNew: false,
      hasTimer: false
    };

    const productResponse = await fetch('http://localhost:5000/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testProduct)
    });

    if (productResponse.ok) {
      const productResult = await productResponse.json();
      console.log('   ✅ Product added successfully:', productResult.product?.name);
      
      // Immediately check if it appears in featured products
      const featuredResponse = await fetch('http://localhost:5000/api/products/featured');
      const featuredProducts = await featuredResponse.json();
      const testProductFound = featuredProducts.find(p => p.name === 'Test Product - Frontend Fix');
      
      if (testProductFound) {
        console.log('   ✅ Product appears in featured products immediately');
      } else {
        console.log('   ❌ Product NOT found in featured products');
        console.log('   📊 Current featured products count:', featuredProducts.length);
      }
    } else {
      const error = await productResponse.text();
      console.log('   ❌ Product addition failed:', error);
    }

    console.log('\n2. Testing Blog Post Addition...');
    
    // Test adding a simple blog post
    const testBlog = {
      password: 'pickntrust2025',
      title: 'Test Blog Post - Frontend Fix',
      excerpt: 'Testing if frontend blog forms work properly. This is a test excerpt.',
      content: 'This is test content for the blog post. Testing if the frontend forms are working correctly after the cache fixes.',
      category: 'Shopping Tips',
      tags: ['test', 'frontend', 'fix'],
      imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
      publishedAt: new Date().toISOString().split('T')[0],
      readTime: '2 min read',
      slug: 'test-blog-post-frontend-fix',
      hasTimer: false
    };

    const blogResponse = await fetch('http://localhost:5000/api/admin/blog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testBlog)
    });

    if (blogResponse.ok) {
      const blogResult = await blogResponse.json();
      console.log('   ✅ Blog post added successfully:', blogResult.blogPost?.title);
      
      // Immediately check if it appears in blog posts
      const blogListResponse = await fetch('http://localhost:5000/api/blog');
      const blogPosts = await blogListResponse.json();
      const testBlogFound = blogPosts.find(b => b.title === 'Test Blog Post - Frontend Fix');
      
      if (testBlogFound) {
        console.log('   ✅ Blog post appears in blog list immediately');
      } else {
        console.log('   ❌ Blog post NOT found in blog list');
        console.log('   📊 Current blog posts count:', blogPosts.length);
      }
    } else {
      const error = await blogResponse.text();
      console.log('   ❌ Blog post addition failed:', error);
    }

    console.log('\n3. Testing API Endpoints Status...');
    
    // Test all relevant endpoints
    const endpoints = [
      '/api/products/featured',
      '/api/blog',
      '/api/admin/stats',
      '/api/categories'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`http://localhost:5000${endpoint}`);
        if (response.ok) {
          const data = await response.json();
          console.log(`   ✅ ${endpoint}: Working (${Array.isArray(data) ? data.length : 'object'} items)`);
        } else {
          console.log(`   ❌ ${endpoint}: Failed (${response.status})`);
        }
      } catch (error) {
        console.log(`   ❌ ${endpoint}: Error - ${error.message}`);
      }
    }

    console.log('\n🎯 Frontend Form Issues Diagnosis:');
    console.log('If backend APIs work but frontend forms don\'t:');
    console.log('1. Check browser console for JavaScript errors');
    console.log('2. Verify form validation is not blocking submission');
    console.log('3. Check if mutation functions are being called');
    console.log('4. Verify query invalidation is working');
    console.log('5. Check if toast notifications appear');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAdminForms();
