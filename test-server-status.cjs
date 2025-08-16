const http = require('http');

function testServer() {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/products',
    method: 'GET',
    timeout: 5000
  };

  console.log('Testing server connection...');
  
  const req = http.request(options, (res) => {
    console.log(`Server responded with status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const jsonData = JSON.parse(data);
        console.log('Server is running and responding with data:');
        console.log(JSON.stringify(jsonData, null, 2));
      } catch (e) {
        console.log('Server responded but data is not JSON:', data);
      }
    });
  });

  req.on('error', (err) => {
    console.error('Server connection failed:', err.message);
    console.log('\nThis means:');
    console.log('1. The server is not running on port 5000');
    console.log('2. You need to start the server with: npm run dev');
    console.log('3. The ProductManagement component will show "Error Loading Products" until the server is running');
  });

  req.on('timeout', () => {
    console.error('Server connection timed out');
    req.destroy();
  });

  req.end();
}

testServer();
