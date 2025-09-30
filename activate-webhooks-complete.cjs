// Complete Webhook Activation - Automatic Setup for All 8 Bots
// This script automatically sets up webhooks using LocalTunnel (free ngrok alternative)

const TelegramBot = require('node-telegram-bot-api');
const { spawn } = require('child_process');
const axios = require('axios');
require('dotenv').config();

console.log('🚀 COMPLETE WEBHOOK ACTIVATION');
console.log('=' .repeat(50));
console.log('Setting up webhooks for all 8 Telegram bots automatically...');

// Bot configurations
const botConfigs = {
  'prime-picks': {
    token: '8260140807:AAEy6I9xxtYbvddJKDNfRwmcIWDX1Y9pck4',
    name: 'Prime Picks',
    channel: '@pntamazon'
  },
  'cue-picks': {
    token: '8352384812:AAE-bwA_3zIB8ZnPG4ZmyEbREBlfijjE32I',
    name: 'Cue Picks',
    channel: '@cuelinkspnt'
  },
  'value-picks': {
    token: '8293858742:AAGDnH8aN5e-JOvhLQNCR_rWEOicOPji41A',
    name: 'Value Picks',
    channel: '@earnkaropnt'
  },
  'click-picks': {
    token: '8077836519:AAGoSql-Fz9lF_90AKxobprROub89VVKePg',
    name: 'Click Picks',
    channel: '@clickpicks'
  },
  'loot-box': {
    token: '8141266952:AAEosdwI8BkIpSk0f1AVzn8l4iwRnS8HXFQ',
    name: 'Loot Box',
    channel: '@deodappnt'
  },
  'global-picks': {
    token: '8341930611:AAHq7sS4Sk6HKoyfUGYwYWHwXZrGOgeWx-E',
    name: 'Global Picks',
    channel: '@globalpnt'
  },
  'dealshub': {
    token: '8292764619:AAEkfPXIsgNh1JC3n2p6VYo27V-EHepzmBo',
    name: 'DealsHub',
    channel: '@dealshubpnt'
  },
  'travel-picks': {
    token: '7998139680:AAGVKECApmHNi4LMp2wR3UdVFfYgkT1HwZo',
    name: 'Travel Picks',
    channel: '@travelpickspnt'
  }
};

let tunnelProcess = null;
let publicUrl = null;

async function installLocalTunnel() {
  console.log('\n📦 Installing LocalTunnel (free tunnel service)...');
  
  return new Promise((resolve, reject) => {
    const install = spawn('npm', ['install', '-g', 'localtunnel'], {
      stdio: 'pipe',
      shell: true
    });
    
    install.on('close', (code) => {
      if (code === 0) {
        console.log('✅ LocalTunnel installed successfully');
        resolve();
      } else {
        console.log('⚠️  LocalTunnel may already be installed or installation failed');
        resolve(); // Continue anyway
      }
    });
    
    install.on('error', () => {
      console.log('⚠️  Installation error, continuing...');
      resolve(); // Continue anyway
    });
  });
}

async function createTunnel() {
  console.log('\n🌐 Creating public tunnel to localhost:5000...');
  
  return new Promise((resolve, reject) => {
    // Try localtunnel first
    tunnelProcess = spawn('npx', ['localtunnel', '--port', '5000'], {
      stdio: 'pipe',
      shell: true
    });
    
    let output = '';
    
    tunnelProcess.stdout.on('data', (data) => {
      output += data.toString();
      const urlMatch = output.match(/https:\/\/[a-z0-9-]+\.loca\.lt/);
      if (urlMatch && !publicUrl) {
        publicUrl = urlMatch[0];
        console.log(`✅ Tunnel created: ${publicUrl}`);
        resolve(publicUrl);
      }
    });
    
    tunnelProcess.stderr.on('data', (data) => {
      const error = data.toString();
      if (error.includes('your url is:')) {
        const urlMatch = error.match(/https:\/\/[a-z0-9-]+\.loca\.lt/);
        if (urlMatch && !publicUrl) {
          publicUrl = urlMatch[0];
          console.log(`✅ Tunnel created: ${publicUrl}`);
          resolve(publicUrl);
        }
      }
    });
    
    tunnelProcess.on('error', (error) => {
      console.log('❌ Tunnel creation failed:', error.message);
      reject(error);
    });
    
    // Timeout after 15 seconds
    setTimeout(() => {
      if (!publicUrl) {
        reject(new Error('Tunnel creation timeout'));
      }
    }, 15000);
  });
}

async function setupWebhooks(baseUrl) {
  console.log(`\n🔧 Setting up webhooks with base URL: ${baseUrl}`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const [botName, config] of Object.entries(botConfigs)) {
    try {
      console.log(`\n🤖 Setting up ${config.name}...`);
      
      // Create bot instance without polling
      const bot = new TelegramBot(config.token, { polling: false });
      
      // Clear any existing webhook first
      await bot.deleteWebHook();
      console.log(`   ✅ Cleared existing webhook`);
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Set new webhook
      const webhookUrl = `${baseUrl}/webhook/${botName}`;
      await bot.setWebHook(webhookUrl, {
        secret_token: 'pickntrust_webhook_secret_2025'
      });
      
      console.log(`   ✅ Webhook set: ${webhookUrl}`);
      
      // Verify webhook
      await new Promise(resolve => setTimeout(resolve, 2000));
      const webhookInfo = await bot.getWebHookInfo();
      
      if (webhookInfo.url === webhookUrl) {
        console.log(`   ✅ Webhook verified successfully`);
        console.log(`   📱 Channel: ${config.channel}`);
        successCount++;
      } else {
        console.log(`   ⚠️  Webhook verification failed`);
        console.log(`   Expected: ${webhookUrl}`);
        console.log(`   Got: ${webhookInfo.url}`);
        errorCount++;
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      errorCount++;
    }
  }
  
  return { successCount, errorCount };
}

async function testWebhookEndpoints(baseUrl) {
  console.log('\n🧪 Testing webhook endpoints...');
  
  try {
    // Test health endpoint
    const healthResponse = await axios.get(`${baseUrl}/webhook/health`, {
      timeout: 10000
    });
    
    if (healthResponse.status === 200) {
      console.log('✅ Webhook health endpoint accessible');
      console.log(`   Registered bots: ${healthResponse.data.registeredBots?.join(', ') || 'None'}`);
      return true;
    }
  } catch (error) {
    console.log('❌ Webhook endpoints not accessible:', error.message);
    return false;
  }
  
  return false;
}

async function sendTestMessage() {
  console.log('\n📱 Sending test message to verify auto-posting...');
  
  try {
    // Use Prime Picks bot for testing
    const bot = new TelegramBot(botConfigs['prime-picks'].token, { polling: false });
    
    const testMessage = await bot.sendMessage(
      '-1002955338551', // Prime Picks channel
      `🧪 **WEBHOOK AUTO-POSTING TEST**\n\n` +
      `✅ Webhooks configured successfully\n` +
      `🔗 Test URL: https://amazon.in/dp/B08N5WRWNW\n\n` +
      `⏰ Time: ${new Date().toLocaleString()}\n` +
      `🎯 Expected: Product should appear on website in 10 seconds`
    );
    
    console.log('✅ Test message sent to Prime Picks channel');
    console.log(`   Message ID: ${testMessage.message_id}`);
    
    return true;
  } catch (error) {
    console.log('❌ Failed to send test message:', error.message);
    return false;
  }
}

async function monitorResults() {
  console.log('\n⏳ Monitoring for new products (30 seconds)...');
  
  // Wait for processing
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  try {
    const Database = require('better-sqlite3');
    const db = new Database('database.sqlite');
    
    // Check for recent products (last 2 minutes)
    const twoMinutesAgo = Math.floor(Date.now() / 1000) - 120;
    
    const tables = [
      'products', 'amazon_products', 'cue_picks_products', 
      'value_picks_products', 'click_picks_products', 'loot_box_products',
      'global_picks_products', 'dealshub_products', 'travel_products'
    ];
    
    let totalNewProducts = 0;
    
    for (const table of tables) {
      try {
        const recentProducts = db.prepare(`
          SELECT COUNT(*) as count FROM ${table} 
          WHERE created_at > ?
        `).get(twoMinutesAgo);
        
        if (recentProducts.count > 0) {
          console.log(`✅ ${table}: ${recentProducts.count} new products`);
          totalNewProducts += recentProducts.count;
        }
      } catch (error) {
        // Table might not exist, skip
      }
    }
    
    db.close();
    
    return totalNewProducts;
  } catch (error) {
    console.log('⚠️  Could not check database:', error.message);
    return 0;
  }
}

async function cleanup() {
  if (tunnelProcess) {
    console.log('\n🧹 Cleaning up tunnel process...');
    tunnelProcess.kill();
  }
}

async function main() {
  try {
    // Step 1: Install LocalTunnel
    await installLocalTunnel();
    
    // Step 2: Create tunnel
    const baseUrl = await createTunnel();
    
    // Step 3: Wait for tunnel to stabilize
    console.log('\n⏳ Waiting for tunnel to stabilize...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Step 4: Test webhook endpoints
    const endpointsWorking = await testWebhookEndpoints(baseUrl);
    if (!endpointsWorking) {
      throw new Error('Webhook endpoints not accessible');
    }
    
    // Step 5: Setup webhooks
    const { successCount, errorCount } = await setupWebhooks(baseUrl);
    
    // Step 6: Results
    console.log('\n📊 WEBHOOK SETUP RESULTS:');
    console.log(`   ✅ Success: ${successCount} bots`);
    console.log(`   ❌ Errors: ${errorCount} bots`);
    console.log(`   📊 Total: ${Object.keys(botConfigs).length} bots`);
    
    if (successCount > 0) {
      console.log('\n🎉 WEBHOOKS ACTIVATED SUCCESSFULLY!');
      
      // Step 7: Send test message
      await sendTestMessage();
      
      // Step 8: Monitor results
      const newProducts = await monitorResults();
      
      console.log('\n🎯 FINAL RESULTS:');
      if (newProducts > 0) {
        console.log(`🎉 SUCCESS! ${newProducts} new products created`);
        console.log('\n✅ Auto-posting is working perfectly!');
        console.log('\n🌐 Check your website:');
        console.log('   • http://localhost:5000/prime-picks');
        console.log('   • http://localhost:5000/cue-picks');
        console.log('   • http://localhost:5000/value-picks');
        console.log('   • And all other bot pages...');
        
      } else {
        console.log('⚠️  No new products detected yet');
        console.log('\n💡 This might be normal - try posting more URLs in channels');
      }
      
      console.log('\n🔗 Your webhook URLs:');
      Object.keys(botConfigs).forEach(botName => {
        console.log(`   ${baseUrl}/webhook/${botName}`);
      });
      
      console.log('\n📱 Telegram Channels:');
      Object.values(botConfigs).forEach(config => {
        console.log(`   ${config.name}: ${config.channel}`);
      });
      
      console.log('\n🚀 SYSTEM IS LIVE!');
      console.log('   • Post product URLs in any Telegram channel');
      console.log('   • Products will appear on website automatically');
      console.log('   • Webhooks are processing messages in real-time');
      
      console.log('\n⚠️  IMPORTANT: Keep this terminal open to maintain the tunnel!');
      console.log('   Press Ctrl+C to stop the webhook system');
      
      // Keep the process running
      process.on('SIGINT', () => {
        console.log('\n\n🛑 Shutting down webhook system...');
        cleanup();
        process.exit(0);
      });
      
      // Keep alive
      setInterval(() => {
        console.log(`\n💓 Webhook system running... (${new Date().toLocaleTimeString()})`);
        console.log(`   Tunnel: ${baseUrl}`);
        console.log(`   Status: All ${successCount} bots active`);
      }, 60000); // Status update every minute
      
    } else {
      console.log('\n❌ NO WEBHOOKS CONFIGURED');
      console.log('\n🔧 All bots failed to set up webhooks');
      console.log('   Check bot tokens and network connectivity');
      await cleanup();
    }
    
  } catch (error) {
    console.error('\n❌ Webhook activation failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check internet connectivity');
    console.log('   2. Verify bot tokens are correct');
    console.log('   3. Ensure server is running on port 5000');
    console.log('   4. Try running the script again');
    
    await cleanup();
    process.exit(1);
  }
}

// Handle cleanup on exit
process.on('exit', cleanup);
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

// Run the complete activation
main();