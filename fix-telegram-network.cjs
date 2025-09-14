const https = require('https');
const http = require('http');
const { spawn } = require('child_process');

console.log('🔧 FIXING TELEGRAM NETWORK CONNECTIVITY ISSUE');
console.log('=' .repeat(60));

// Test basic internet connectivity
async function testInternetConnectivity() {
  console.log('\nGlobal Testing basic internet connectivity...');
  
  try {
    await new Promise((resolve, reject) => {
      const req = https.get('https://www.google.com', { timeout: 5000 }, (res) => {
        console.log('Success Internet connection: Working');
        resolve(res);
      });
      
      req.on('error', reject);
      req.on('timeout', () => reject(new Error('Timeout')));
    });
  } catch (error) {
    console.log('Error Internet connection: Failed -', error.message);
    return false;
  }
  
  return true;
}

// Test Telegram API connectivity with different approaches
async function testTelegramConnectivity() {
  console.log('\nMobile Testing Telegram API connectivity...');
  
  const testUrls = [
    'https://api.telegram.org',
    'https://149.154.167.220', // Telegram IP
    'https://149.154.175.50'   // Alternative Telegram IP
  ];
  
  for (const url of testUrls) {
    try {
      console.log(`Search Testing: ${url}`);
      
      await new Promise((resolve, reject) => {
        const req = https.get(url, { 
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        }, (res) => {
          console.log(`Success ${url}: Connected (Status: ${res.statusCode})`);
          resolve(res);
        });
        
        req.on('error', (error) => {
          console.log(`Error ${url}: Failed - ${error.message}`);
          reject(error);
        });
        
        req.on('timeout', () => {
          console.log(`Error ${url}: Timeout`);
          reject(new Error('Timeout'));
        });
      });
      
      return true;
    } catch (error) {
      continue;
    }
  }
  
  return false;
}

// Test DNS resolution
async function testDNSResolution() {
  console.log('\nSearch Testing DNS resolution...');
  
  try {
    const dns = require('dns').promises;
    const addresses = await dns.resolve4('api.telegram.org');
    console.log('Success DNS Resolution: Working');
    console.log('📍 Telegram API IPs:', addresses.join(', '));
    return true;
  } catch (error) {
    console.log('Error DNS Resolution: Failed -', error.message);
    return false;
  }
}

// Flush DNS cache (Windows)
async function flushDNSCache() {
  console.log('\nRefresh Flushing DNS cache...');
  
  return new Promise((resolve) => {
    const process = spawn('ipconfig', ['/flushdns'], { shell: true });
    
    process.on('close', (code) => {
      if (code === 0) {
        console.log('Success DNS cache flushed successfully');
      } else {
        console.log('Warning DNS flush may have failed');
      }
      resolve();
    });
    
    process.on('error', (error) => {
      console.log('Warning Could not flush DNS cache:', error.message);
      resolve();
    });
  });
}

// Reset network adapter (Windows)
async function resetNetworkAdapter() {
  console.log('\nRefresh Resetting network adapter...');
  
  return new Promise((resolve) => {
    const process = spawn('netsh', ['winsock', 'reset'], { shell: true });
    
    process.on('close', (code) => {
      if (code === 0) {
        console.log('Success Network adapter reset successfully');
        console.log('Warning You may need to restart your computer for full effect');
      } else {
        console.log('Warning Network reset may have failed');
      }
      resolve();
    });
    
    process.on('error', (error) => {
      console.log('Warning Could not reset network adapter:', error.message);
      resolve();
    });
  });
}

// Test with alternative HTTP client
async function testWithAlternativeClient() {
  console.log('\nRefresh Testing with alternative HTTP configuration...');
  
  try {
    const fetch = require('node-fetch');
    
    const response = await fetch('https://api.telegram.org/bot8336181113:AAHMpM4qRZylA9E5OQspPfA5yDDElJB1_wc/getMe', {
      method: 'GET',
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Connection': 'close'
      },
      agent: new https.Agent({
        keepAlive: false,
        timeout: 15000
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Success Alternative client: SUCCESS!');
      console.log('AI Bot info:', data.result.first_name, '@' + data.result.username);
      return true;
    } else {
      console.log('Error Alternative client: HTTP', response.status);
      return false;
    }
  } catch (error) {
    console.log('Error Alternative client: Failed -', error.message);
    return false;
  }
}

// Main diagnostic and fix function
async function fixTelegramConnectivity() {
  try {
    console.log('Launch Starting comprehensive network diagnostics and fixes...');
    
    // Step 1: Test basic connectivity
    const internetOk = await testInternetConnectivity();
    if (!internetOk) {
      console.log('\nError CRITICAL: No internet connection detected');
      console.log('🔧 Please check your internet connection and try again');
      return;
    }
    
    // Step 2: Test DNS
    const dnsOk = await testDNSResolution();
    if (!dnsOk) {
      console.log('\n🔧 DNS issues detected, attempting fixes...');
      await flushDNSCache();
      
      // Test DNS again
      const dnsFixed = await testDNSResolution();
      if (!dnsFixed) {
        console.log('Error DNS issues persist');
      }
    }
    
    // Step 3: Test Telegram connectivity
    const telegramOk = await testTelegramConnectivity();
    if (!telegramOk) {
      console.log('\n🔧 Telegram API connectivity issues detected');
      console.log('Refresh Attempting network fixes...');
      
      // Try alternative client
      const altClientOk = await testWithAlternativeClient();
      if (altClientOk) {
        console.log('\nSuccess SOLUTION FOUND: Alternative HTTP client works!');
        console.log('🔧 The issue is with the default HTTP client configuration');
        console.log('Tip Recommendation: Update bot to use node-fetch with custom agent');
        return;
      }
      
      // Reset network if alternative also fails
      console.log('\n🔧 Attempting network adapter reset...');
      await resetNetworkAdapter();
    }
    
    // Final test
    console.log('\n🧪 Final connectivity test...');
    const finalTest = await testWithAlternativeClient();
    
    if (finalTest) {
      console.log('\nCelebration SUCCESS: Telegram connectivity restored!');
      console.log('Success Bot should now be able to connect to Telegram API');
    } else {
      console.log('\nError FAILED: Connectivity issues persist');
      console.log('\n🔧 MANUAL SOLUTIONS TO TRY:');
      console.log('1. Global Try using a VPN (some ISPs block Telegram)');
      console.log('2. Hot Temporarily disable Windows Firewall');
      console.log('3. 🛡️ Check antivirus software blocking connections');
      console.log('4. Mobile Try mobile hotspot instead of WiFi');
      console.log('5. Refresh Restart your router/modem');
      console.log('6. 💻 Restart your computer');
    }
    
  } catch (error) {
    console.error('Error Error during network diagnostics:', error);
  }
}

// Run the fix
fixTelegramConnectivity().then(() => {
  console.log('\n' + '=' .repeat(60));
  console.log('🏁 Network diagnostics and fixes completed');
  console.log('Refresh Try running the bot again after applying any suggested fixes');
}).catch(error => {
  console.error('Error Fatal error:', error);
  process.exit(1);
});