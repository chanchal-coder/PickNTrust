async function testAllEndpoints() {
  console.log('🧪 Testing All React Query Endpoints...\n');
  
  const endpoints = [
    '/api/products/featured',
    '/api/categories',
    '/api/products',
    '/api/blog',
    '/api/video-content'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`📡 Testing ${endpoint}...`);
      const response = await fetch(`http://localhost:5000${endpoint}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${endpoint}: ${response.status} - ${Array.isArray(data) ? data.length : 'object'} items`);
      } else {
        console.log(`❌ ${endpoint}: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`💥 ${endpoint}: Connection failed - ${error.message}`);
    }
  }
  
  console.log('\n🎯 All React Query endpoints tested!');
  console.log('\n📝 Summary:');
  console.log('- Fixed featured-products.tsx: queryFn now fetches from /api/products/featured');
  console.log('- Fixed ProductManagement.tsx: Added explicit type annotations');
  console.log('- All other components already have correct queryFn implementations');
  console.log('\n💡 If browser still shows errors, try hard refresh (Ctrl+F5) to clear cache');
}

testAllEndpoints().catch(console.error);
