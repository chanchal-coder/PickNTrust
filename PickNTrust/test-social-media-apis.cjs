const https = require('https');
const http = require('http');
require('dotenv').config();

console.log('🧪 Testing Social Media API Credentials...\n');

// Test Facebook API
async function testFacebook() {
  return new Promise((resolve) => {
    const token = process.env.FACEBOOK_ACCESS_TOKEN;
    const pageId = process.env.FACEBOOK_PAGE_ID;
    
    if (!token || !pageId) {
      console.log('❌ Facebook: Missing credentials');
      resolve(false);
      return;
    }
    
    const url = `https://graph.facebook.com/v18.0/${pageId}?access_token=${token}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.error) {
            console.log('❌ Facebook: API Error -', result.error.message);
            resolve(false);
          } else {
            console.log('✅ Facebook: Connected successfully -', result.name || 'Page found');
            resolve(true);
          }
        } catch (error) {
          console.log('❌ Facebook: Parse error -', error.message);
          resolve(false);
        }
      });
    }).on('error', (error) => {
      console.log('❌ Facebook: Connection error -', error.message);
      resolve(false);
    });
  });
}

// Test Instagram API
async function testInstagram() {
  return new Promise((resolve) => {
    const token = process.env.INSTAGRAM_ACCESS_TOKEN;
    const accountId = process.env.INSTAGRAM_ACCOUNT_ID;
    
    if (!token || !accountId) {
      console.log('❌ Instagram: Missing credentials');
      resolve(false);
      return;
    }
    
    const url = `https://graph.facebook.com/v18.0/${accountId}?fields=id,username&access_token=${token}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.error) {
            console.log('❌ Instagram: API Error -', result.error.message);
            resolve(false);
          } else {
            console.log('✅ Instagram: Connected successfully -', result.username || 'Account found');
            resolve(true);
          }
        } catch (error) {
          console.log('❌ Instagram: Parse error -', error.message);
          resolve(false);
        }
      });
    }).on('error', (error) => {
      console.log('❌ Instagram: Connection error -', error.message);
      resolve(false);
    });
  });
}

// Test Telegram API
async function testTelegram() {
  return new Promise((resolve) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const channel = process.env.TELEGRAM_CHANNEL_ID;
    
    if (!token || !channel) {
      console.log('❌ Telegram: Missing credentials');
      resolve(false);
      return;
    }
    
    const url = `https://api.telegram.org/bot${token}/getMe`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (!result.ok) {
            console.log('❌ Telegram: API Error -', result.description);
            resolve(false);
          } else {
            console.log('✅ Telegram: Connected successfully -', result.result.username || 'Bot found');
            resolve(true);
          }
        } catch (error) {
          console.log('❌ Telegram: Parse error -', error.message);
          resolve(false);
        }
      });
    }).on('error', (error) => {
      console.log('❌ Telegram: Connection error -', error.message);
      resolve(false);
    });
  });
}

// Test YouTube API (just check if credentials exist)
function testYouTube() {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;
  
  if (!clientId || !clientSecret || !refreshToken) {
    console.log('❌ YouTube: Missing credentials');
    return false;
  }
  
  console.log('✅ YouTube: Credentials configured (OAuth2 flow required for testing)');
  return true;
}

// Run all tests
async function runTests() {
  console.log('🔍 Testing API Connections...\n');
  
  const results = {
    facebook: await testFacebook(),
    instagram: await testInstagram(),
    telegram: await testTelegram(),
    youtube: testYouTube()
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  const working = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([platform, status]) => {
    const icon = status ? '✅' : '❌';
    const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
    console.log(`${icon} ${platformName}: ${status ? 'Ready' : 'Needs Setup'}`);
  });
  
  console.log(`\n🎯 ${working}/${total} platforms ready for automation!`);
  
  if (working >= 3) {
    console.log('\n🚀 You have enough platforms configured to start TRUE AUTOMATION!');
    console.log('💡 Add products/services and they will automatically post to working platforms.');
  } else {
    console.log('\n⚠️  Consider adding more platform credentials for better reach.');
  }
  
  console.log('\n📝 Next Steps:');
  console.log('1. Go to Admin Panel → Automation');
  console.log('2. Enable working platforms');
  console.log('3. Add a test product/service');
  console.log('4. Watch it automatically post to social media!');
}

// Run the tests
runTests().catch(console.error);
