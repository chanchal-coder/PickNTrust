const https = require('https');

const token = process.argv[2];
const webhookUrl = process.argv[3];
if (!token || !webhookUrl) {
  console.error('Usage: node set-webhook-raw.cjs <BOT_TOKEN> <WEBHOOK_URL>');
  process.exit(1);
}

const postData = new URLSearchParams({ url: webhookUrl }).toString();

const options = {
  hostname: 'api.telegram.org',
  path: `/bot${token}/setWebhook`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log(data);
  });
});

req.on('error', (err) => {
  console.error('Request error:', err.message);
  process.exit(1);
});

req.write(postData);
req.end();