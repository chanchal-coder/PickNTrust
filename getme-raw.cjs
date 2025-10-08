const https = require('https');

const token = process.argv[2];
if (!token) {
  console.error('Usage: node getme-raw.cjs <BOT_TOKEN>');
  process.exit(1);
}

const url = `https://api.telegram.org/bot${token}/getMe`;

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log(data);
  });
}).on('error', (err) => {
  console.error('Request error:', err.message);
  process.exit(1);
});