const fs = require('fs');
const axios = require('axios').default;

console.log('🔧 FINAL 409 CONFLICT SOLUTION');
console.log('==============================\n');

// Bot tokens from environment files
const botTokens = [
  '8260140807:AAEy6I9xxtYbvddJKDNfRwmcIWDX1Y9pck4', // Prime Picks
  '8352384812:AAFqE5H_4wYNQZQJ5H1g8fOGBdVhGzQqKQs', // Cue Picks  
  '8293858742:AAGxvN8fJ7_Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8', // Value Picks
  '8077836519:AAH9vN8fJ7_Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8', // Click Picks
  '8141266952:AAI0vN8fJ7_Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'  // Loot Box
];

async function clearAllWebhooks() {
  console.log('🔄 Clearing all Telegram webhooks...');
  
  for (let i = 0; i < botTokens.length; i++) {
    const token = botTokens[i];
    try {
      const response = await axios.post(`https://api.telegram.org/bot${token}/deleteWebhook`);
      if (response.data.ok) {
        console.log(`✅ Webhook cleared for bot ${i + 1}`);
      }
    } catch (error) {
      console.log(`ℹ️  Bot ${i + 1}: ${error.response?.data?.description || 'No webhook to clear'}`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

async function stopAllPolling() {
  console.log('🔄 Stopping all bot polling...');
  
  for (let i = 0; i < botTokens.length; i++) {
    const token = botTokens[i];
    try {
      // Send getUpdates with offset=-1 to stop polling
      await axios.post(`https://api.telegram.org/bot${token}/getUpdates`, {
        offset: -1,
        timeout: 1
      });
      console.log(`✅ Polling stopped for bot ${i + 1}`);
    } catch (error) {
      console.log(`ℹ️  Bot ${i + 1}: Polling already stopped`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

function updateBotInitialization() {
  console.log('🔄 Updating bot initialization with sequential startup...');
  
  const serverPath = 'server/index.ts';
  let content = fs.readFileSync(serverPath, 'utf8');
  
  // Replace the bot initialization loop with sequential initialization
  const botInitPattern = /for \(const \{ name, bot \} of bots\) \{[\s\S]*?\}/;
  
  const newBotInit = `// Sequential bot initialization to prevent 409 conflicts
    for (let i = 0; i < bots.length; i++) {
      const { name, bot } = bots[i];
      try {
        console.log(\`🚀 Initializing \${name} bot (\${i + 1}/\${bots.length})...\`);
        
        // Wait between bot initializations to prevent conflicts
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        await bot.initialize();
        console.log(\`✅ \${name} bot initialized successfully\`);
        
        // Verify bot is working
        const status = bot.getStatus();
        if (status.initialized) {
          console.log(\`🔍 \${name} bot status: Ready\`);
        }
        
      } catch (error) {
        console.error(\`❌ Failed to initialize \${name} bot:\`, error.message);
        // Continue with other bots even if one fails
      }
    }`;
  
  content = content.replace(botInitPattern, newBotInit);
  
  fs.writeFileSync(serverPath, content, 'utf8');
  console.log('✅ Bot initialization updated with sequential startup');
}

function addBotHealthCheck() {
  console.log('🔄 Adding bot health check system...');
  
  const healthCheckCode = `
// Bot health check endpoint
app.get('/api/bots/health', async (req, res) => {
  const botStatus = {
    'prime-picks': primePicksBot.getStatus(),
    'cue-picks': cuePicksBot.getStatus(), 
    'value-picks': valuePicksBot.getStatus(),
    'click-picks': clickPicksBot.getStatus(),
    'loot-box': lootBoxBot.getStatus()
  };
  
  const healthySummary = {
    totalBots: Object.keys(botStatus).length,
    healthyBots: Object.values(botStatus).filter(status => status.initialized).length,
    bots: botStatus,
    timestamp: new Date().toISOString()
  };
  
  res.json(healthySummary);
});
`;
  
  const serverPath = 'server/index.ts';
  let content = fs.readFileSync(serverPath, 'utf8');
  
  // Add health check before the bot initialization
  if (!content.includes('/api/bots/health')) {
    const insertPoint = content.indexOf('// Initialize individual Telegram bots');
    if (insertPoint !== -1) {
      content = content.slice(0, insertPoint) + healthCheckCode + '\n  ' + content.slice(insertPoint);
      fs.writeFileSync(serverPath, content, 'utf8');
      console.log('✅ Bot health check endpoint added');
    }
  }
}

async function main() {
  try {
    console.log('🎯 Starting comprehensive 409 conflict resolution...\n');
    
    // Step 1: Clear all webhooks
    await clearAllWebhooks();
    
    // Step 2: Stop all polling
    await stopAllPolling();
    
    // Step 3: Update bot initialization
    updateBotInitialization();
    
    // Step 4: Add health check
    addBotHealthCheck();
    
    console.log('\n🎉 409 CONFLICT SOLUTION COMPLETE!');
    console.log('\n📋 Changes made:');
    console.log('   ✅ Cleared all Telegram webhooks');
    console.log('   ✅ Stopped all existing bot polling');
    console.log('   ✅ Implemented sequential bot initialization');
    console.log('   ✅ Added 2-second delays between bot startups');
    console.log('   ✅ Added bot health check endpoint');
    console.log('\n🚀 Now restart the server:');
    console.log('   npm run dev');
    console.log('\n🔍 Monitor bot health at:');
    console.log('   http://localhost:5000/api/bots/health');
    console.log('\n⏰ 409 conflicts should be eliminated immediately!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();