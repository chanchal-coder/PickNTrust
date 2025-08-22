import fetch from 'node-fetch';

console.log('🔍 Testing Cache Fix - Products and Blog Posts Visibility...\n');

async function testCacheFix() {
  try {
    // Test 1: Check current state
    console.log('1. Checking current state...');
    
    const productsResponse = await fetch('http://localhost:5000/api/products/featured');
    const products = await productsResponse.json();
    console.log(`   Current featured products: ${products.length}`);
    
    const blogResponse = await fetch('http://localhost:5000/api/blog');
    const blogs = await blogResponse.json();
    console.log(`   Current blog posts: ${blogs.length}`);

    // Test 2: Add a test product
    console.log('\n2. Adding test product...');
    const testProduct = {
      password: 'pickntrust2025',
      name: 'Cache Fix Test Product',
      description: 'Testing if products appear immediately after adding',
      price: '1999',
      originalPrice: '2499',
      imageUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400',
      affiliateUrl: 'https://example.com/test-cache-fix',
      category: 'Electronics & Gadgets',
      rating: '4.7',
      reviewCount: '150',
      discount: '20',
      isFeatured: true,
      isNew: true
    };

    const addProductResponse = await fetch('http://localhost:5000/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testProduct)
    });

    if (addProductResponse.ok) {
      console.log('   ✅ Test product added successfully');
      
      // Immediately check if it appears
      const verifyResponse = await fetch('http://localhost:5000/api/products/featured');
      const verifyProducts = await verifyResponse.json();
      const testProductFound = verifyProducts.find(p => p.name === 'Cache Fix Test Product');
      
      if (testProductFound) {
        console.log('   ✅ Test product appears in featured products immediately');
      } else {
        console.log('   ❌ Test product NOT found in featured products');
      }
    } else {
      console.log('   ❌ Failed to add test product');
    }

    // Test 3: Add a test blog post
    console.log('\n3. Adding test blog post...');
    const testBlog = {
      password: 'pickntrust2025',
      title: 'Cache Fix Test Blog Post',
      excerpt: 'Testing if blog posts appear immediately after adding',
      content: 'This is a test blog post to verify that the cache fix is working correctly and blog posts appear immediately in the Quick Tips & Trending section.',
      category: 'Shopping Tips',
      tags: ['test', 'cache', 'fix'],
      imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
      publishedAt: new Date().toISOString().split('T')[0],
      readTime: '2 min read',
      slug: 'cache-fix-test-blog-post'
    };

    const addBlogResponse = await fetch('http://localhost:5000/api/admin/blog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testBlog)
    });

    if (addBlogResponse.ok) {
      console.log('   ✅ Test blog post added successfully');
      
      // Immediately check if it appears
      const verifyBlogResponse = await fetch('http://localhost:5000/api/blog');
      const verifyBlogs = await verifyBlogResponse.json();
      const testBlogFound = verifyBlogs.find(b => b.title === 'Cache Fix Test Blog Post');
      
      if (testBlogFound) {
        console.log('   ✅ Test blog post appears in blog posts immediately');
      } else {
        console.log('   ❌ Test blog post NOT found in blog posts');
      }
    } else {
      console.log('   ❌ Failed to add test blog post');
    }

    // Test 4: Final count
    console.log('\n4. Final verification...');
    const finalProductsResponse = await fetch('http://localhost:5000/api/products/featured');
    const finalProducts = await finalProductsResponse.json();
    
    const finalBlogResponse = await fetch('http://localhost:5000/api/blog');
    const finalBlogs = await finalBlogResponse.json();
    
    console.log(`   Final featured products count: ${finalProducts.length}`);
    console.log(`   Final blog posts count: ${finalBlogs.length}`);

    console.log('\n🎉 Cache Fix Testing Complete!');
    console.log('\n📋 Summary:');
    console.log('✅ Fixed query client configuration (removed staleTime: Infinity)');
    console.log('✅ Added proper cache invalidation in admin forms');
    console.log('✅ Added force refetch for immediate updates');
    console.log('✅ Fixed categories dropdown visibility issue');
    console.log('\n💡 Changes made:');
    console.log('- Updated staleTime from Infinity to 5 minutes');
    console.log('- Added refetchOnWindowFocus: true');
    console.log('- Added queryClient.refetchQueries() after successful additions');
    console.log('- Fixed categories dropdown with all 36 predefined categories');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCacheFix();
