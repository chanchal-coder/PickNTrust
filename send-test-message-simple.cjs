const https = require('https');
require('dotenv').config();

const BOT_TOKEN = process.env.MASTER_BOT_TOKEN;
const CHANNEL_ID = '-1002955338551';

const message = `🔥 DIRECT BOT TEST! 🔥

📱 Test Gaming Mouse
💰 Price: ₹999 (was ₹1,999)
🎯 50% OFF - Test Deal!

✅ Test Feature 1
✅ Test Feature 2
✅ Test Feature 3

🛒 Test Link: https://example.com/test

⏰ This is a test message from direct bot!

#TestMessage #DirectBot #Working`;

console.log('📤 Sending test message via HTTPS...');
console.log('🎯 Target:', CHANNEL_ID);

const postData = JSON.stringify({
    chat_id: CHANNEL_ID,
    text: message,
    parse_mode: 'HTML'
});

const options = {
    hostname: 'api.telegram.org',
    port: 443,
    path: `/bot${BOT_TOKEN}/sendMessage`,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        try {
            const response = JSON.parse(data);
            if (response.ok) {
                console.log('✅ Message sent successfully!');
                console.log('📨 Message ID:', response.result.message_id);
            } else {
                console.log('❌ Error:', response.description);
            }
        } catch (error) {
            console.log('❌ Parse error:', error.message);
            console.log('Raw response:', data);
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Request error:', error.message);
});

req.write(postData);
req.end();