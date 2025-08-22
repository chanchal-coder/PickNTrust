const fetch = require('node-fetch');

async function testProductsAPI() {
  try {
    console.log('Testing /api/products endpoint...');
    
    const response = await fetch('http://localhost:5000/api/products');
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      return;
    }
    
    const data = await response.json();
    console.log('API Response data:', JSON.stringify(data, null, 2));
    console.log('Data type:', typeof data);
    console.log('Is array:', Array.isArray(data));
    
    if (data && data.products) {
      console.log('Has products property:', Array.isArray(data.products));
      console.log('Products count:', data.products.length);
    }
    
  } catch (error) {
    console.error('Fetch error:', error.message);
  }
}

testProductsAPI();
