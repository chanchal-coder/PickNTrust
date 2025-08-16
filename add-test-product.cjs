const http = require('http');

const testProduct = {
  password: 'pickntrust2025',
  name: 'Test Wireless Headphones',
  description: 'High-quality wireless headphones with noise cancellation',
  price: 2999,
  originalPrice: 3999,
  imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
  affiliateUrl: 'https://example.com/headphones',
  category: 'Electronics & Gadgets',
  rating: 4.5,
  reviewCount: 150,
  discount: 25,
  isFeatured: true,
  isService: false,
  hasTimer: false
};

function addTestProduct() {
  const postData = JSON.stringify(testProduct);
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/products',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  console.log('Adding test product...');
  
  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        console.log('Product added successfully:', result);
        
        // Now test getting products
        testGetProducts();
      } catch (e) {
        console.log('Response:', data);
      }
    });
  });

  req.on('error', (err) => {
    console.error('Error adding product:', err.message);
  });

  req.write(postData);
  req.end();
}

function testGetProducts() {
  console.log('\nTesting GET /api/products...');
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/products',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        console.log('Products retrieved:', JSON.stringify(result, null, 2));
      } catch (e) {
        console.log('Response:', data);
      }
    });
  });

  req.on('error', (err) => {
    console.error('Error getting products:', err.message);
  });

  req.end();
}

addTestProduct();
