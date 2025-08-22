import fetch from 'node-fetch';

console.log('🔍 Testing API Endpoints for Featured Products and Blog Posts...\n');

async function testEndpoints() {
  try {
    // Test 1: Check featured products endpoint
    console.log('1. Testing /api/products/featured endpoint...');
    const productsResponse = await fetch('http://localhost:5000/api/products/featured');
    
    if (productsResponse.ok) {
      const products = await productsResponse.json();
      console.log(`✅ Featured products endpoint working - Found ${products.length} products`);
      
      if (products.length > 0) {
        console.log('   Sample product:', {
          id: products[0].id,
          name: products[0].name,
          isFeatured: products[0].isFeatured,
          createdAt: products[0].createdAt
        });
      } else {
        console.log('   ⚠️  No featured products found in database');
      }
    } else {
      console.log('❌ Featured products endpoint failed:', productsResponse.status);
    }

    // Test 2: Check blog posts endpoint
    console.log('\n2. Testing /api/blog endpoint...');
    const blogResponse = await fetch('http://localhost:5000/api/blog');
    
    if (blogResponse.ok) {
      const blogPosts = await blogResponse.json();
      console.log(`✅ Blog posts endpoint working - Found ${blogPosts.length} blog posts`);
      
      if (blogPosts.length > 0) {
        console.log('   Sample blog post:', {
          id: blogPosts[0].id,
          title: blogPosts[0].title,
          publishedAt: blogPosts[0].publishedAt,
          createdAt: blogPosts[0].createdAt
        });
      } else {
        console.log('   ⚠️  No blog posts found in database');
      }
    } else {
      console.log('❌ Blog posts endpoint failed:', blogResponse.status);
    }

    // Test 3: Check all products endpoint (to see if products exist but aren't featured)
    console.log('\n3. Testing /api/products endpoint...');
    const allProductsResponse = await fetch('http://localhost:5000/api/products');
    
    if (allProductsResponse.ok) {
      const allProductsData = await allProductsResponse.json();
      const allProducts = allProductsData.products || allProductsData;
      console.log(`✅ All products endpoint working - Found ${allProducts.length} total products`);
      
      if (allProducts.length > 0) {
        const featuredCount = allProducts.filter(p => p.isFeatured).length;
        console.log(`   Featured products in all products: ${featuredCount}`);
        console.log('   Sample product flags:', {
          isFeatured: allProducts[0].isFeatured,
          isApproved: allProducts[0].isApproved,
          status: allProducts[0].status
        });
      }
    } else {
      console.log('❌ All products endpoint failed:', allProductsResponse.status);
    }

    // Test 4: Add a test product to verify the add functionality
    console.log('\n4. Testing product addition...');
    const testProduct = {
      password: 'pickntrust2025',
      name: 'Test Product - API Verification',
      description: 'This is a test product to verify API functionality',
      price: '999',
      originalPrice: '1299',
      imageUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400',
      affiliateUrl: 'https://example.com/test-product',
      category: 'Electronics & Gadgets',
      rating: '4.5',
      reviewCount: '100',
      discount: '23',
      isFeatured: true,
      isNew: true
    };

    const addProductResponse = await fetch('http://localhost:5000/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testProduct)
    });

    if (addProductResponse.ok) {
      const result = await addProductResponse.json();
      console.log('✅ Test product added successfully');
      console.log('   Product ID:', result.product?.id);
      
      // Immediately check if it appears in featured products
      console.log('\n5. Verifying test product appears in featured products...');
      const verifyResponse = await fetch('http://localhost:5000/api/products/featured');
      if (verifyResponse.ok) {
        const verifyProducts = await verifyResponse.json();
        const testProductFound = verifyProducts.find(p => p.name === 'Test Product - API Verification');
        
        if (testProductFound) {
          console.log('✅ Test product found in featured products immediately');
        } else {
          console.log('❌ Test product NOT found in featured products');
          console.log('   This indicates a caching or filtering issue');
        }
      }
    } else {
      const error = await addProductResponse.text();
      console.log('❌ Failed to add test product:', addProductResponse.status, error);
    }

    // Test 5: Add a test blog post
    console.log('\n6. Testing blog post addition...');
    const testBlog = {
      password: 'pickntrust2025',
      title: 'Test Blog Post - API Verification',
      excerpt: 'This is a test blog post to verify API functionality',
      content: 'This is the full content of the test blog post to verify that the blog posting functionality is working correctly.',
      category: 'Shopping Tips',
      tags: ['test', 'api', 'verification'],
      imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
      publishedAt: new Date().toISOString().split('T')[0],
      readTime: '2 min read',
      slug: 'test-blog-post-api-verification'
    };

    const addBlogResponse = await fetch('http://localhost:5000/api/admin/blog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testBlog)
    });

    if (addBlogResponse.ok) {
      const result = await addBlogResponse.json();
      console.log('✅ Test blog post added successfully');
      
      // Immediately check if it appears in blog posts
      console.log('\n7. Verifying test blog post appears in blog posts...');
      const verifyBlogResponse = await fetch('http://localhost:5000/api/blog');
      if (verifyBlogResponse.ok) {
        const verifyBlogs = await verifyBlogResponse.json();
        const testBlogFound = verifyBlogs.find(b => b.title === 'Test Blog Post - API Verification');
        
        if (testBlogFound) {
          console.log('✅ Test blog post found in blog posts immediately');
        } else {
          console.log('❌ Test blog post NOT found in blog posts');
          console.log('   This indicates a caching or filtering issue');
        }
      }
    } else {
      const error = await addBlogResponse.text();
      console.log('❌ Failed to add test blog post:', addBlogResponse.status, error);
    }

    console.log('\n🎉 API Endpoint Testing Complete!');
    console.log('\n📋 Summary:');
    console.log('- If products/blogs are added but not appearing, it\'s likely a frontend caching issue');
    console.log('- Check React Query cache invalidation in the admin forms');
    console.log('- Verify that the frontend components are using the correct API endpoints');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testEndpoints();
