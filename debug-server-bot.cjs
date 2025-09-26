const http = require('http');

console.log('🔍 Debugging server bot status...');

// Test the announcement API
console.log('\n📡 Testing announcement API...');
const req = http.get('http://localhost:5000/api/announcement/active', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log('API Response:', JSON.parse(data));
        
        // Now test if we can trigger a manual bot check
        console.log('\n🤖 Testing manual bot trigger...');
        
        const postData = JSON.stringify({
            action: 'test_bot_status'
        });
        
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/debug/bot-status',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        const postReq = http.request(options, (res) => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                if (res.statusCode === 404) {
                    console.log('⚠️ Debug endpoint not found - this is expected');
                } else {
                    console.log('Debug Response:', responseData);
                }
                console.log('\n✅ Debug test completed');
            });
        });
        
        postReq.on('error', (err) => {
            console.log('⚠️ Debug endpoint error (expected):', err.message);
            console.log('\n✅ Debug test completed');
        });
        
        postReq.write(postData);
        postReq.end();
    });
});

req.on('error', (err) => {
    console.error('❌ Failed to connect to server:', err.message);
    console.log('💡 Make sure the server is running on port 5000');
});