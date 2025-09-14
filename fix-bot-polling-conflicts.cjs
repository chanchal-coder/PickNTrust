/**
 * Fix Bot Polling Conflicts and Channel Permissions
 * Resolve 409 errors and ensure bots can read messages from channels
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class BotPollingFixer {
  constructor() {
    this.botConfigs = {
      'prime-picks': {
        token: '8260140807:AAEy6I9xxtYbvddJKDNfRwmcIWDX1Y9pck4',
        channelId: '-1002955338551',
        username: '@pntamazon_bot'
      },
      'cue-picks': {
        token: '8352384812:AAE-bwA_3zIB8ZnPG4ZmyEbREBlfijjE32I',
        channelId: '-1002982344997',
        username: '@cuelinkspnt_bot'
      },
      'value-picks': {
        token: '8293858742:AAGDnH8aN5e-JOvhLQNCR_rWEOicOPji41A',
        channelId: '-1003017626269',
        username: '@earnkaropnt_bot'
      },
      'click-picks': {
        token: '8077836519:AAGoSql-Fz9lF_90AKxobprROub89VVKePg',
        channelId: '-1002981205504',
        username: '@clickpicks_bot'
      },
      'global-picks': {
        token: '8341930611:AAHq7sS4Sk6HKoyfUGYwYWHwXZrGOgeWx-E',
        channelId: '-1002902496654',
        username: '@globalpnt_bot'
      },
      'deals-hub': {
        token: '8292764619:AAEkfPXIsgNh1JC3n2p6VYo27V-EHepzmBo',
        channelId: '-1003029983162',
        username: '@dealshubpnt_bot'
      },
      'lootbox': {
        token: '8141266952:AAEosdwI8BkIpSk0f1AVzn8l4iwRnS8HXFQ',
        channelId: '-1002991047787',
        username: '@deodappnt_bot'
      }
    };
  }

  /**
   * Clear webhook and reset to polling for all bots
   */
  async clearWebhooksAndResetPolling() {
    console.log('Refresh Clearing Webhooks and Resetting to Polling...');
    console.log('=' .repeat(60));
    
    const results = {};
    
    for (const [botName, config] of Object.entries(this.botConfigs)) {
      console.log(`\nAI ${botName.toUpperCase()}:`);
      
      try {
        // Clear webhook
        const deleteWebhookResponse = await axios.post(
          `https://api.telegram.org/bot${config.token}/deleteWebhook`
        );
        
        if (deleteWebhookResponse.data.ok) {
          console.log('   Success Webhook cleared');
        } else {
          console.log(`   Warning Webhook clear failed: ${deleteWebhookResponse.data.description}`);
        }
        
        // Clear pending updates to avoid conflicts
        const getUpdatesResponse = await axios.get(
          `https://api.telegram.org/bot${config.token}/getUpdates?offset=-1`
        );
        
        if (getUpdatesResponse.data.ok) {
          console.log('   Success Pending updates cleared');
        }
        
        results[botName] = {
          webhookCleared: deleteWebhookResponse.data.ok,
          updatesCleared: getUpdatesResponse.data.ok,
          status: 'READY_FOR_POLLING'
        };
        
      } catch (error) {
        console.log(`   Error Reset failed: ${error.message}`);
        results[botName] = {
          error: error.message,
          status: 'ERROR'
        };
      }
    }
    
    return results;
  }

  /**
   * Check bot permissions in channels
   */
  async checkChannelPermissions() {
    console.log('\n🔐 Checking Bot Permissions in Channels...');
    console.log('=' .repeat(55));
    
    const results = {};
    
    for (const [botName, config] of Object.entries(this.botConfigs)) {
      console.log(`\n📢 ${botName.toUpperCase()} in channel ${config.channelId}:`);
      
      try {
        // Get bot info
        const botInfoResponse = await axios.get(
          `https://api.telegram.org/bot${config.token}/getMe`
        );
        
        if (!botInfoResponse.data.ok) {
          console.log('   Error Bot not accessible');
          continue;
        }
        
        const botInfo = botInfoResponse.data.result;
        
        // Check if bot is member of the channel
        const memberResponse = await axios.get(
          `https://api.telegram.org/bot${config.token}/getChatMember?chat_id=${config.channelId}&user_id=${botInfo.id}`
        );
        
        if (memberResponse.data.ok) {
          const memberInfo = memberResponse.data.result;
          console.log(`   Success Bot status in channel: ${memberInfo.status}`);
          
          if (memberInfo.status === 'administrator') {
            console.log('   🔑 Bot is admin - can read all messages');
          } else if (memberInfo.status === 'member') {
            console.log('   Warning Bot is member - limited message access');
          } else {
            console.log(`   Error Bot status: ${memberInfo.status}`);
          }
          
          results[botName] = {
            inChannel: true,
            status: memberInfo.status,
            canReadMessages: memberInfo.status === 'administrator' || memberInfo.status === 'creator'
          };
          
        } else {
          console.log(`   Error Bot not in channel: ${memberResponse.data.description}`);
          results[botName] = {
            inChannel: false,
            error: memberResponse.data.description
          };
        }
        
      } catch (error) {
        console.log(`   Error Permission check failed: ${error.message}`);
        results[botName] = {
          error: error.message
        };
      }
    }
    
    return results;
  }

  /**
   * Test message retrieval from channels
   */
  async testMessageRetrieval() {
    console.log('\n📨 Testing Message Retrieval from Channels...');
    console.log('=' .repeat(55));
    
    const results = {};
    
    for (const [botName, config] of Object.entries(this.botConfigs)) {
      console.log(`\nMobile ${botName.toUpperCase()}:`);
      
      try {
        // Get recent updates
        const updatesResponse = await axios.get(
          `https://api.telegram.org/bot${config.token}/getUpdates?limit=5`
        );
        
        if (updatesResponse.data.ok) {
          const updates = updatesResponse.data.result;
          console.log(`   Stats Recent updates: ${updates.length}`);
          
          if (updates.length > 0) {
            const latestUpdate = updates[updates.length - 1];
            console.log(`   🕐 Latest update ID: ${latestUpdate.update_id}`);
            
            if (latestUpdate.message) {
              console.log(`   💬 Message from: ${latestUpdate.message.chat.id}`);
              console.log(`   Blog Message text: ${latestUpdate.message.text ? latestUpdate.message.text.substring(0, 50) + '...' : 'No text'}`);
            } else if (latestUpdate.channel_post) {
              console.log(`   📢 Channel post from: ${latestUpdate.channel_post.chat.id}`);
              console.log(`   Blog Post text: ${latestUpdate.channel_post.text ? latestUpdate.channel_post.text.substring(0, 50) + '...' : 'No text'}`);
            }
          }
          
          results[botName] = {
            canReceiveUpdates: true,
            updateCount: updates.length,
            status: 'RECEIVING_MESSAGES'
          };
          
        } else {
          console.log(`   Error Cannot get updates: ${updatesResponse.data.description}`);
          results[botName] = {
            canReceiveUpdates: false,
            error: updatesResponse.data.description,
            status: 'NO_UPDATES'
          };
        }
        
      } catch (error) {
        console.log(`   Error Message test failed: ${error.message}`);
        results[botName] = {
          error: error.message,
          status: 'ERROR'
        };
      }
    }
    
    return results;
  }

  /**
   * Generate bot setup instructions
   */
  generateSetupInstructions(permissionResults) {
    console.log('\n📋 BOT SETUP INSTRUCTIONS');
    console.log('=' .repeat(40));
    
    const needsSetup = [];
    
    Object.entries(this.botConfigs).forEach(([botName, config]) => {
      const permissions = permissionResults[botName] || {};
      
      if (!permissions.inChannel || !permissions.canReadMessages) {
        needsSetup.push({ botName, config, permissions });
      }
    });
    
    if (needsSetup.length === 0) {
      console.log('\nSuccess All bots are properly configured!');
      return;
    }
    
    console.log(`\nWarning ${needsSetup.length} bots need setup:`);
    
    needsSetup.forEach(({ botName, config, permissions }) => {
      console.log(`\nAI ${botName.toUpperCase()}:`);
      console.log(`   Bot: ${config.username}`);
      console.log(`   Channel: ${config.channelId}`);
      
      if (!permissions.inChannel) {
        console.log('   Error Bot not in channel');
        console.log('   🔧 Action: Add bot to channel');
      } else if (!permissions.canReadMessages) {
        console.log('   Warning Bot has limited permissions');
        console.log('   🔧 Action: Make bot admin in channel');
      }
      
      console.log('   Mobile Steps:');
      console.log('      1. Open Telegram and go to the channel');
      console.log(`      2. Add ${config.username} to the channel`);
      console.log('      3. Make the bot an administrator');
      console.log('      4. Enable "Delete Messages" and "Pin Messages" permissions');
    });
  }

  /**
   * Create bot restart script
   */
  createBotRestartScript() {
    console.log('\nBlog Creating Bot Restart Script...');
    console.log('=' .repeat(40));
    
    const restartScript = `#!/bin/bash
# Bot Restart Script - Fix Polling Conflicts
# Run this script to restart bots without conflicts

echo "Refresh Restarting PickNTrust Bot System..."
echo "======================================"

# Kill any existing Node.js processes
echo "Stop Stopping existing processes..."
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "tsx server" 2>/dev/null || true
sleep 2

# Clear any webhook conflicts
echo "Cleanup Clearing webhook conflicts..."
node fix-bot-polling-conflicts.cjs

# Wait a moment
sleep 3

# Start the server
echo "Launch Starting server..."
npm run dev

echo "Success Bot system restarted!"
echo "Mobile Test posting URLs in Telegram channels"
`;
    
    const scriptPath = path.join(__dirname, 'restart-bots.sh');
    fs.writeFileSync(scriptPath, restartScript, 'utf8');
    
    console.log(`   Success Created: ${scriptPath}`);
    console.log('   🔧 Usage: bash restart-bots.sh');
  }

  /**
   * Generate comprehensive report
   */
  generateComprehensiveReport(webhookResults, permissionResults, messageResults) {
    console.log('\nStats COMPREHENSIVE BOT DIAGNOSIS REPORT');
    console.log('=' .repeat(60));
    
    let workingBots = 0;
    let totalBots = Object.keys(this.botConfigs).length;
    
    Object.entries(this.botConfigs).forEach(([botName, config]) => {
      console.log(`\nAI ${botName.toUpperCase()}:`);
      
      const webhook = webhookResults[botName] || {};
      const permission = permissionResults[botName] || {};
      const message = messageResults[botName] || {};
      
      console.log(`   Refresh Webhook Reset: ${webhook.status || 'UNKNOWN'}`);
      console.log(`   🔐 Channel Access: ${permission.inChannel ? 'YES' : 'NO'}`);
      console.log(`   👑 Admin Status: ${permission.canReadMessages ? 'YES' : 'NO'}`);
      console.log(`   📨 Message Retrieval: ${message.status || 'UNKNOWN'}`);
      
      const isWorking = (
        webhook.status === 'READY_FOR_POLLING' &&
        permission.inChannel &&
        permission.canReadMessages &&
        message.canReceiveUpdates
      );
      
      if (isWorking) {
        workingBots++;
        console.log(`   Success Status: FULLY OPERATIONAL`);
      } else {
        console.log(`   Warning Status: NEEDS SETUP`);
      }
    });
    
    console.log('\n📈 SUMMARY:');
    console.log(`   AI Total Bots: ${totalBots}`);
    console.log(`   Success Working: ${workingBots}`);
    console.log(`   Warning Need Setup: ${totalBots - workingBots}`);
    console.log(`   Stats Success Rate: ${((workingBots / totalBots) * 100).toFixed(1)}%`);
    
    if (workingBots === totalBots) {
      console.log('\nCelebration ALL BOTS READY FOR POSTING!');
      console.log('   Mobile Test by posting URLs in Telegram channels');
    } else {
      console.log('\n🔧 SETUP REQUIRED:');
      console.log('   1. Add bots to channels as administrators');
      console.log('   2. Enable message reading permissions');
      console.log('   3. Restart server to clear conflicts');
    }
    
    return workingBots === totalBots;
  }

  /**
   * Run comprehensive bot fixing
   */
  async runComprehensiveFix() {
    console.log('Launch Comprehensive Bot Polling Fix');
    console.log('=' .repeat(50));
    
    // Step 1: Clear webhooks and reset polling
    const webhookResults = await this.clearWebhooksAndResetPolling();
    
    // Step 2: Check channel permissions
    const permissionResults = await this.checkChannelPermissions();
    
    // Step 3: Test message retrieval
    const messageResults = await this.testMessageRetrieval();
    
    // Step 4: Generate setup instructions
    this.generateSetupInstructions(permissionResults);
    
    // Step 5: Create restart script
    this.createBotRestartScript();
    
    // Step 6: Generate comprehensive report
    const allWorking = this.generateComprehensiveReport(webhookResults, permissionResults, messageResults);
    
    console.log('\nTarget FIX COMPLETE!');
    
    return allWorking;
  }
}

// Run comprehensive fix
async function runBotPollingFix() {
  const fixer = new BotPollingFixer();
  
  try {
    const success = await fixer.runComprehensiveFix();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('Error Bot polling fix failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  runBotPollingFix();
}

module.exports = { BotPollingFixer, runBotPollingFix };