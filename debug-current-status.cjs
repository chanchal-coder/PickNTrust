console.log('Search Debugging current server and API status...');

async function checkServerStatus() {
  try {
    console.log('\n=== CHECKING SERVER STATUS ===');
    const response = await fetch('http://localhost:5000/api/products');
    console.log('Server Response Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Success Server is running and responding');
      console.log('Products count:', Array.isArray(data) ? data.length : 'Unknown format');
    } else {
      console.log('Error Server responded with error:', response.status);
    }
  } catch (error) {
    console.log('Error Server connection failed:', error.message);
    console.log('Tip Server might not be running. Try: npm run dev');
    return false;
  }
  return true;
}

async function testProductAdding() {
  console.log('\n=== TESTING PRODUCT ADDING ===');
  
  const productData = {
    password: 'pickntrust2025',
    name: 'Debug Test Product',
    description: 'Testing product addition',
    price: '999',
    originalPrice: '',
    imageUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400',
    affiliateUrl: 'https://example.com/test',
    category: 'Electronics & Gadgets',
    gender: '',
    rating: '4.5',
    reviewCount: '100',
    discount: '',
    isFeatured: true,
    isService: false,
    hasTimer: false,
    timerDuration: '24',
    customFields: {}
  };

  try {
    const response = await fetch('http://localhost:5000/api/admin/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData)
    });
    
    console.log('Product Response Status:', response.status);
    const result = await response.json();
    console.log('Product Response:', JSON.stringify(result, null, 2));
    
    return response.status === 200;
  } catch (error) {
    console.log('Error Product adding failed:', error.message);
    return false;
  }
}

async function testVideoAdding() {
  console.log('\n=== TESTING VIDEO ADDING ===');
  
  const videoData = {
    password: 'pickntrust2025',
    title: 'Debug Test Video',
    description: 'Testing video addition',
    videoUrl: 'https://www.youtube.com/watch?v=test123',
    thumbnailUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400',
    platform: 'YouTube',
    category: 'Tech',
    tags: ['test'],
    duration: '5:00',
    hasTimer: false,
    timerDuration: null
  };

  try {
    const response = await fetch('http://localhost:5000/api/admin/video-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(videoData)
    });
    
    console.log('Video Response Status:', response.status);
    const result = await response.json();
    console.log('Video Response:', JSON.stringify(result, null, 2));
    
    return response.status === 200;
  } catch (error) {
    console.log('Error Video adding failed:', error.message);
    return false;
  }
}

async function runDiagnostics() {
  const serverOk = await checkServerStatus();
  
  if (!serverOk) {
    console.log('\nAlert SERVER IS NOT RUNNING!');
    console.log('Please start the server with: npm run dev');
    return;
  }
  
  const productOk = await testProductAdding();
  const videoOk = await testVideoAdding();
  
  console.log('\n=== DIAGNOSTIC RESULTS ===');
  console.log(`Server Status: ${serverOk ? 'Success RUNNING' : 'Error DOWN'}`);
  console.log(`Product Adding: ${productOk ? 'Success WORKING' : 'Error FAILING'}`);
  console.log(`Video Adding: ${videoOk ? 'Success WORKING' : 'Error FAILING'}`);
  
  if (!productOk || !videoOk) {
    console.log('\n🔧 ISSUES DETECTED - Need to fix the failing endpoints');
  } else {
    console.log('\nCelebration ALL SYSTEMS WORKING!');
  }
}

runDiagnostics();
