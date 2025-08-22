const fetch = require('node-fetch');

async function testAdminForms() {
  const baseUrl = 'http://localhost:5000';
  
  console.log('🔍 Testing Admin Forms Functionality...\n');
  
  try {
    // Test 1: Admin Authentication
    console.log('1. Testing Admin Authentication...');
    const authResponse = await fetch(`${baseUrl}/api/admin/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'pickntrust2025' })
    });
    
    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('✅ Admin auth successful:', authData);
    } else {
      console.log('❌ Admin auth failed:', authResponse.status);
      return;
    }
    
    // Test 2: Add Product Form
    console.log('\n2. Testing Add Product Form...');
    const productData = {
      password: 'pickntrust2025',
      name: 'Test Smartphone',
      description: 'High-quality smartphone with amazing features',
      price: '15999',
      originalPrice: '19999',
      imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
      affiliateUrl: 'https://example.com/smartphone',
      category: 'Electronics & Gadgets',
      rating: 4.5,
      reviewCount: 250,
      discount: 20,
      isFeatured: true,
      isNew: true,
      hasTimer: false
    };
    
    const productResponse = await fetch(`${baseUrl}/api/admin/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });
    
    if (productResponse.ok) {
      const productResult = await productResponse.json();
      console.log('✅ Product added successfully:', productResult.message);
    } else {
      const error = await productResponse.text();
      console.log('❌ Product addition failed:', productResponse.status, error);
    }
    
    // Test 3: Add Blog Post Form
    console.log('\n3. Testing Add Blog Post Form...');
    const blogData = {
      password: 'pickntrust2025',
      title: 'Top 10 Budget Smartphones in 2024',
      excerpt: 'Discover the best budget smartphones that offer great value for money without compromising on features.',
      content: `# Top 10 Budget Smartphones in 2024

Looking for a great smartphone without breaking the bank? Here are our top picks:

## 1. Xiaomi Redmi Note 12
- **Price**: ₹15,999
- **Features**: 50MP camera, 5000mAh battery
- [Buy Now](https://example.com/redmi-note-12)

## 2. Samsung Galaxy M34
- **Price**: ₹18,999  
- **Features**: 120Hz display, 6000mAh battery
- [Check Price](https://example.com/galaxy-m34)

These phones offer excellent value for money and are perfect for everyday use.`,
      category: 'Product Reviews',
      tags: ['smartphones', 'budget', 'reviews', 'tech'],
      imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800',
      publishedAt: new Date().toISOString().split('T')[0],
      readTime: '5 min read',
      slug: 'top-10-budget-smartphones-2024',
      hasTimer: false
    };
    
    const blogResponse = await fetch(`${baseUrl}/api/admin/blog`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(blogData)
    });
    
    if (blogResponse.ok) {
      const blogResult = await blogResponse.json();
      console.log('✅ Blog post added successfully:', blogResult.message);
    } else {
      const error = await blogResponse.text();
      console.log('❌ Blog post addition failed:', blogResponse.status, error);
    }
    
    // Test 4: Verify Data Retrieval
    console.log('\n4. Testing Data Retrieval...');
    
    const productsResponse = await fetch(`${baseUrl}/api/products/featured`);
    if (productsResponse.ok) {
      const products = await productsResponse.json();
      console.log(`✅ Retrieved ${products.length} products`);
    } else {
      console.log('❌ Failed to retrieve products');
    }
    
    const blogResponse2 = await fetch(`${baseUrl}/api/blog`);
    if (blogResponse2.ok) {
      const blogs = await blogResponse2.json();
      console.log(`✅ Retrieved ${blogs.length} blog posts`);
    } else {
      console.log('❌ Failed to retrieve blog posts');
    }
    
    console.log('\n🎉 Admin Forms Testing Complete!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testAdminForms();
