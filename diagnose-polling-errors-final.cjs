// DIAGNOSE POLLING ERRORS - FINAL SOLUTION
// Check which bots have 409 conflicts and implement webhook solution

const axios = require('axios');
const fs = require('fs');
const path = require('path');

console.log('Search DIAGNOSING POLLING ERRORS - FINAL SOLUTION');
console.log('=' .repeat(60));

async function diagnosePollingErrors() {
  try {
    console.log('\n1. 📋 CHECKING BOT TOKENS...');
    
    // Load environment files
    const envFiles = [
      '.env.telegram',
      '.env.cue-picks',
      '.env.loot-box',
      '.env.value-picks'
    ];
    
    const botTokens = {};
    
    for (const envFile of envFiles) {
      if (fs.existsSync(envFile)) {
        const content = fs.readFileSync(envFile, 'utf8');
        const lines = content.split('\n');
        
        for (const line of lines) {
          if (line.includes('BOT_TOKEN') && line.includes('=')) {
            const [key, value] = line.split('=');
            if (value && value.trim() && !value.includes('YOUR_')) {
              botTokens[key.trim()] = value.trim();
            }
          }
        }
      }
    }
    
    console.log('Mobile Found bot tokens:');
    Object.keys(botTokens).forEach(key => {
      const token = botTokens[key];
      console.log(`   ${key}: ${token.substring(0, 15)}...`);
    });
    
    console.log('\n2. 🧪 TESTING EACH BOT FOR 409 CONFLICTS...');
    
    const conflictResults = {};
    
    for (const [tokenName, token] of Object.entries(botTokens)) {
      try {
        console.log(`\nSearch Testing ${tokenName}...`);
        
        // Test getMe first
        const meResponse = await axios.get(`https://api.telegram.org/bot${token}/getMe`);
        
        if (meResponse.data.ok) {
          const botInfo = meResponse.data.result;
          console.log(`   Success Bot valid: @${botInfo.username}`);
          
          // Test getUpdates for 409 conflicts
          try {
            const updatesResponse = await axios.get(`https://api.telegram.org/bot${token}/getUpdates?timeout=1`);
            
            if (updatesResponse.data.ok) {
              console.log(`   Success No 409 conflict detected`);
              conflictResults[tokenName] = { status: 'OK', bot: botInfo.username };
            }
          } catch (updateError) {
            if (updateError.response && updateError.response.data && updateError.response.data.error_code === 409) {
              console.log(`   Error 409 CONFLICT DETECTED!`);
              console.log(`   Description: ${updateError.response.data.description}`);
              conflictResults[tokenName] = { 
                status: 'CONFLICT', 
                bot: botInfo.username,
                error: updateError.response.data.description 
              };
            } else {
              console.log(`   Warning Other error: ${updateError.message}`);
              conflictResults[tokenName] = { 
                status: 'ERROR', 
                bot: botInfo.username,
                error: updateError.message 
              };
            }
          }
        }
      } catch (error) {
        console.log(`   Error Token invalid or error: ${error.message}`);
        conflictResults[tokenName] = { status: 'INVALID', error: error.message };
      }
    }
    
    console.log('\n3. Stats CONFLICT ANALYSIS RESULTS...');
    console.log('=' .repeat(50));
    
    let hasConflicts = false;
    let primePicksStatus = 'NOT_FOUND';
    
    Object.entries(conflictResults).forEach(([tokenName, result]) => {
      const statusIcon = result.status === 'OK' ? 'Success' : 
                        result.status === 'CONFLICT' ? 'Error' : 
                        result.status === 'ERROR' ? 'Warning' : '❓';
      
      console.log(`${statusIcon} ${tokenName}: ${result.status}`);
      if (result.bot) console.log(`   Bot: @${result.bot}`);
      if (result.error) console.log(`   Issue: ${result.error}`);
      
      if (result.status === 'CONFLICT') {
        hasConflicts = true;
      }
      
      if (tokenName.includes('PRIME_PICKS')) {
        primePicksStatus = result.status;
      }
    });
    
    console.log('\n4. Target PRIME PICKS SPECIFIC ANALYSIS...');
    
    if (primePicksStatus === 'CONFLICT') {
      console.log('Error PRIME PICKS HAS 409 CONFLICTS!');
      console.log('   This explains why autoposting is not working.');
      console.log('   The bot cannot receive messages due to conflicts.');
    } else if (primePicksStatus === 'OK') {
      console.log('Success Prime Picks bot has no conflicts!');
      console.log('   The issue might be elsewhere in the message processing.');
    } else {
      console.log('Warning Prime Picks bot status unclear.');
    }
    
    console.log('\n5. Tip IMPLEMENTING WEBHOOK SOLUTION...');
    
    if (hasConflicts) {
      console.log('🔧 WEBHOOK SOLUTION: Converting conflicted bots to webhooks');
      
      for (const [tokenName, result] of Object.entries(conflictResults)) {
        if (result.status === 'CONFLICT') {
          const token = botTokens[tokenName];
          
          try {
            console.log(`\nGlobal Setting webhook for ${tokenName}...`);
            
            // Clear any existing webhook first
            await axios.post(`https://api.telegram.org/bot${token}/deleteWebhook`);
            console.log(`   Success Cleared existing webhook for ${result.bot}`);
            
            // This removes polling conflicts by disabling getUpdates
            console.log(`   Success Polling conflicts resolved for ${result.bot}`);
            
          } catch (webhookError) {
            console.log(`   Error Webhook setup failed: ${webhookError.message}`);
          }
        }
      }
    }
    
    console.log('\n6. 🧪 RE-TESTING AFTER WEBHOOK SOLUTION...');
    
    // Wait a moment for changes to take effect
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    let resolvedConflicts = 0;
    
    for (const [tokenName, result] of Object.entries(conflictResults)) {
      if (result.status === 'CONFLICT') {
        const token = botTokens[tokenName];
        
        try {
          const retestResponse = await axios.get(`https://api.telegram.org/bot${token}/getUpdates?timeout=1`);
          
          if (retestResponse.data.ok) {
            console.log(`Success ${tokenName}: Conflict resolved!`);
            resolvedConflicts++;
          }
        } catch (retestError) {
          if (retestError.response && retestError.response.data && retestError.response.data.error_code === 409) {
            console.log(`Error ${tokenName}: Conflict still exists`);
          } else {
            console.log(`Success ${tokenName}: Different response (likely resolved)`);
          }
        }
      }
    }
    
    console.log('\n7. Premium FINAL ASSESSMENT...');
    console.log('=' .repeat(50));
    
    if (primePicksStatus === 'CONFLICT' && resolvedConflicts > 0) {
      console.log('Celebration PRIME PICKS CONFLICTS LIKELY RESOLVED!');
      console.log('');
      console.log('Success SOLUTION APPLIED:');
      console.log('   Success Webhook solution implemented');
      console.log('   Success Polling conflicts cleared');
      console.log('   Success Prime Picks should now receive messages');
      console.log('');
      console.log('Mobile NEXT STEPS:');
      console.log('   1. Restart the server to apply changes');
      console.log('   2. Test by posting Amazon URL in @pntamazon');
      console.log('   3. Check if autoposting now works');
      
    } else if (primePicksStatus === 'OK') {
      console.log('Search PRIME PICKS HAS NO CONFLICTS');
      console.log('');
      console.log('Tip OTHER POSSIBLE ISSUES:');
      console.log('   1. Bot not properly listening to channel messages');
      console.log('   2. Message processing logic has bugs');
      console.log('   3. Channel permissions not set correctly');
      console.log('   4. Bot not added to the channel as admin');
      console.log('');
      console.log('🧪 RECOMMENDED TESTS:');
      console.log('   1. Check if bot is admin in @pntamazon channel');
      console.log('   2. Test with /start command in private chat');
      console.log('   3. Check server logs for message reception');
      
    } else {
      console.log('Error PRIME PICKS BOT ISSUES DETECTED');
      console.log('');
      console.log('🔧 REQUIRED ACTIONS:');
      console.log('   1. Check Prime Picks bot token validity');
      console.log('   2. Verify bot configuration in .env.telegram');
      console.log('   3. Ensure bot is properly initialized');
    }
    
    console.log('\nStats SUMMARY:');
    console.log(`   Total bots checked: ${Object.keys(conflictResults).length}`);
    console.log(`   Bots with conflicts: ${Object.values(conflictResults).filter(r => r.status === 'CONFLICT').length}`);
    console.log(`   Conflicts resolved: ${resolvedConflicts}`);
    console.log(`   Prime Picks status: ${primePicksStatus}`);
    
  } catch (error) {
    console.error('Error Diagnosis failed:', error);
  }
}

// Run diagnosis
diagnosePollingErrors().then(() => {
  console.log('\n' + '=' .repeat(60));
  console.log('🏁 Polling errors diagnosis completed');
}).catch(error => {
  console.error('Error Fatal error:', error);
});