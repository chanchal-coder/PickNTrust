const http = require('http');

function testAPI() {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/products',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Response body:', data);
      if (res.statusCode === 200) {
        console.log('✅ API is working!');
      } else {
        console.log('❌ API returned error status');
      }
    });
  });

  req.on('error', (e) => {
    console.error(`❌ Request failed: ${e.message}`);
    console.log('Server might not be running. Try: npm run dev');
  });

  req.end();
}

console.log('Testing API connection...');
testAPI();
