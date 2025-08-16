async function testApiConnection() {
  try {
    console.log('Testing API connection to http://localhost:5000/api/products...');
    
    const response = await fetch('http://localhost:5000/api/products');
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('Error response:', errorText);
    }
  } catch (error) {
    console.error('Connection error:', error.message);
    console.error('Full error:', error);
  }
}

testApiConnection();
