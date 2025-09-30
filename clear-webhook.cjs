const https = require('https');
require('dotenv').config();

const token = process.env.MASTER_BOT_TOKEN;

console.log('Clearing webhook...');

https.get(`https://api.telegram.org/bot${token}/deleteWebhook`, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log('Webhook cleared:', data);
        
        // Also try to get webhook info to confirm
        setTimeout(() => {
            https.get(`https://api.telegram.org/bot${token}/getWebhookInfo`, (res2) => {
                let data2 = '';
                res2.on('data', chunk => data2 += chunk);
                res2.on('end', () => {
                    console.log('Webhook info after clearing:', data2);
                });
            });
        }, 1000);
    });
}).on('error', (err) => {
    console.error('Error clearing webhook:', err);
});