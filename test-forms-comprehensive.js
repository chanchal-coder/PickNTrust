// Comprehensive Admin Forms Testing
console.log('🔍 Starting Comprehensive Admin Forms Test...\n');

// Test 1: Check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:5000/api/products/featured');
    if (response.ok) {
      console.log('✅ Server is running on port 5000');
      return true;
    } else {
      console.log('❌ Server responded with error:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Server is not running or not accessible:', error.message);
    return false;
  }
}

// Test 2: Admin Authentication
async function testAdminAuth() {
  console.log('\n📝 Testing Admin Authentication...');
  try {
    const response = await fetch('http://localhost:5000/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'pickntrust2025' })
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ Admin authentication successful');
      return true;
    } else {
      console.log('❌ Admin authentication failed:', result.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Admin auth error:', error.message);
    return false;
  }
}

// Test 3: Product Form Validation
async function testProductForm() {
  console.log('\n📦 Testing Product Form...');
  
  const testProduct = {
    password: 'pickntrust2025',
    name: 'Test Gaming Laptop',
    description: 'High-performance gaming laptop with RTX graphics and fast processor',
    price: '75999',
    originalPrice: '89999',
    imageUrl: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400',
    affiliateUrl: 'https://example.com/gaming-laptop',
    category: 'Computers & Laptops',
    rating: 4.7,
    reviewCount: 156,
    discount: 15,
    isFeatured: true,
    isNew: true,
    hasTimer: true,
    timerDuration: 24
  };
  
  try {
    const response = await fetch('http://localhost:5000/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testProduct)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Product form works correctly');
      console.log('   Product added:', result.product?.name || 'Success');
      return true;
    } else {
      const error = await response.text();
      console.log('❌ Product form failed:', response.status, error);
      return false;
    }
  } catch (error) {
    console.log('❌ Product form error:', error.message);
    return false;
  }
}

// Test 4: Blog Post Form Validation
async function testBlogForm() {
  console.log('\n📝 Testing Blog Post Form...');
  
  const testBlog = {
    password: 'pickntrust2025',
    title: 'Best Gaming Laptops Under ₹80,000 in 2024',
    excerpt: 'Discover the top gaming laptops that offer excellent performance without breaking your budget. Perfect for gaming enthusiasts and content creators.',
    content: `# Best Gaming Laptops Under ₹80,000 in 2024

Gaming laptops have become more affordable while maintaining excellent performance. Here are our top picks:

## 1. ASUS TUF Gaming A15
- **Price**: ₹75,999
- **Processor**: AMD Ryzen 7
- **Graphics**: RTX 4050
- [Check Latest Price](https://example.com/asus-tuf-a15)

## 2. HP Pavilion Gaming
- **Price**: ₹72,999
- **Processor**: Intel Core i5
- **Graphics**: GTX 1650
- [Buy Now](https://example.com/hp-pavilion)

## Key Features to Look For:
- Dedicated graphics card
- At least 16GB RAM
- SSD storage for faster loading
- Good cooling system

These laptops offer great value for money and can handle modern games at decent settings.`,
    category: 'Product Reviews',
    tags: ['gaming', 'laptops', 'budget', 'reviews', 'tech'],
    imageUrl: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    publishedAt: new Date().toISOString().split('T')[0],
    readTime: '7 min read',
    slug: 'best-gaming-laptops-under-80000-2024',
    hasTimer: false
  };
  
  try {
    const response = await fetch('http://localhost:5000/api/admin/blog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testBlog)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Blog post form works correctly');
      console.log('   Blog post added:', result.blogPost?.title || 'Success');
      return true;
    } else {
      const error = await response.text();
      console.log('❌ Blog post form failed:', response.status, error);
      return false;
    }
  } catch (error) {
    console.log('❌ Blog post form error:', error.message);
    return false;
  }
}

// Test 5: File Upload Functionality
async function testFileUpload() {
  console.log('\n📁 Testing File Upload...');
  
  try {
    // Test if upload endpoint exists
    const response = await fetch('http://localhost:5000/api/upload', {
      method: 'POST',
      body: new FormData() // Empty form data to test endpoint
    });
    
    // We expect a 400 error for no file, which means endpoint exists
    if (response.status === 400) {
      console.log('✅ File upload endpoint is working');
      return true;
    } else {
      console.log('❌ File upload endpoint issue:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ File upload error:', error.message);
    return false;
  }
}

// Test 6: Data Retrieval
async function testDataRetrieval() {
  console.log('\n📊 Testing Data Retrieval...');
  
  try {
    // Test products endpoint
    const productsResponse = await fetch('http://localhost:5000/api/products/featured');
    const products = await productsResponse.json();
    console.log(`✅ Products endpoint: ${products.length} products found`);
    
    // Test blog posts endpoint
    const blogResponse = await fetch('http://localhost:5000/api/blog');
    const blogs = await blogResponse.json();
    console.log(`✅ Blog posts endpoint: ${blogs.length} blog posts found`);
    
    // Test categories endpoint
    const categoriesResponse = await fetch('http://localhost:5000/api/categories');
    if (categoriesResponse.ok) {
      const categories = await categoriesResponse.json();
      console.log(`✅ Categories endpoint: ${categories.length} categories found`);
    } else {
      console.log('⚠️  Categories endpoint not working (using predefined categories)');
    }
    
    return true;
  } catch (error) {
    console.log('❌ Data retrieval error:', error.message);
    return false;
  }
}

// Test 7: Form Validation
async function testFormValidation() {
  console.log('\n🔍 Testing Form Validation...');
  
  try {
    // Test product form with missing required fields
    const invalidProduct = {
      password: 'pickntrust2025',
      name: '', // Empty name should fail
      description: 'Test description'
    };
    
    const productResponse = await fetch('http://localhost:5000/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidProduct)
    });
    
    if (!productResponse.ok) {
      console.log('✅ Product form validation working (rejected invalid data)');
    } else {
      console.log('⚠️  Product form validation may be weak');
    }
    
    // Test blog form with missing required fields
    const invalidBlog = {
      password: 'pickntrust2025',
      title: '', // Empty title should fail
      excerpt: 'Test excerpt'
    };
    
    const blogResponse = await fetch('http://localhost:5000/api/admin/blog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidBlog)
    });
    
    if (!blogResponse.ok) {
      console.log('✅ Blog form validation working (rejected invalid data)');
    } else {
      console.log('⚠️  Blog form validation may be weak');
    }
    
    return true;
  } catch (error) {
    console.log('❌ Form validation test error:', error.message);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 PickNTrust Admin Forms Comprehensive Test Suite\n');
  console.log('=' .repeat(60));
  
  const results = {
    server: await checkServer(),
    auth: false,
    productForm: false,
    blogForm: false,
    fileUpload: false,
    dataRetrieval: false,
    validation: false
  };
  
  if (results.server) {
    results.auth = await testAdminAuth();
    results.productForm = await testProductForm();
    results.blogForm = await testBlogForm();
    results.fileUpload = await testFileUpload();
    results.dataRetrieval = await testDataRetrieval();
    results.validation = await testFormValidation();
  }
  
  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📋 TEST RESULTS SUMMARY:');
  console.log('=' .repeat(60));
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const testName = test.charAt(0).toUpperCase() + test.slice(1).replace(/([A-Z])/g, ' $1');
    console.log(`${status} - ${testName}`);
  });
  
  console.log('\n' + '=' .repeat(60));
  console.log(`🎯 Overall Score: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 ALL TESTS PASSED! Admin forms are working perfectly.');
  } else if (passed >= total * 0.8) {
    console.log('✅ Most tests passed. Minor issues may exist.');
  } else {
    console.log('⚠️  Several issues detected. Please check the failed tests.');
  }
  
  console.log('\n💡 Next Steps:');
  console.log('1. Open http://localhost:5173/admin in your browser');
  console.log('2. Login with password: pickntrust2025');
  console.log('3. Test the forms manually to verify UI functionality');
  console.log('4. Check that data appears correctly in the interface');
}

// Add fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

// Run the tests
runAllTests().catch(console.error);
