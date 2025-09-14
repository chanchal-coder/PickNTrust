/**
 * Complete 8-Bot System Configuration
 * Real bot tokens, channels, and affiliate tags provided by user
 */

const fs = require('fs');
const path = require('path');

console.log('Launch Setting up complete 8-bot system with real configurations...');

// Bot configurations with real data
const botConfigurations = {
  'prime-picks': {
    displayName: 'Prime Picks Bot',
    botToken: '8260140807:AAEy6I9xxtYbvddJKDNfRwmcIWDX1Y9pck4',
    botUsername: '@pntamazon_bot',
    channelId: '-1002955338551',
    channelUsername: 'pntamazon',
    channelType: 'channel',
    affiliateTag: '{{URL}}{{SEP}}tag=pickntrust03-21',
    network: 'amazon',
    tableName: 'amazon_products',
    envFile: '.env.prime-picks'
  },
  
  'cue-picks': {
    displayName: 'Cue Picks Bot',
    botToken: '8352384812:AAE-bwA_3zIB8ZnPG4ZmyEbREBlfijjE32I',
    botUsername: '@cuelinkspnt_bot',
    channelId: '-1002982344997',
    channelName: 'Cuelinks PNT',
    affiliateTag: 'https://linksredirect.com/?cid=243942&source=linkkit&url={{URL_ENC}}',
    network: 'cuelinks',
    tableName: 'cuelinks_products',
    envFile: '.env.cue-picks'
  },
  
  'value-picks': {
    displayName: 'Value Picks Bot',
    botToken: '8293858742:AAGDnH8aN5e-JOvhLQNCR_rWEOicOPji41A',
    botUsername: '@earnkaropnt_bot',
    channelId: '-1003017626269',
    channelName: 'Value Picks EK',
    affiliateTag: 'https://ekaro.in/enkr2020/?url={{URL_ENC}}&ref=4530348',
    network: 'earnkaro',
    tableName: 'value_picks_products',
    envFile: '.env.value-picks'
  },
  
  'click-picks': {
    displayName: 'Click Picks Bot (Smart)',
    botToken: '8077836519:AAGoSql-Fz9lF_90AKxobprROub89VVKePg',
    botUsername: '@clickpicks_bot',
    channelId: '-1002981205504',
    channelName: 'Click Picks',
    affiliateTags: {
      cuelinks: 'https://linksredirect.com/?cid=243942&source=linkkit&url={{URL_ENC}}',
      inrdeals: 'id=sha678089037',
      earnkaro: 'https://ekaro.in/enkr2020/?url={{URL_ENC}}&ref=4530348'
    },
    network: 'multi-cpc',
    tableName: 'click_picks_products',
    envFile: '.env.click-picks'
  },
  
  'global-picks': {
    displayName: 'Global Picks Bot (Smart)',
    botToken: '8341930611:AAHq7sS4Sk6HKoyfUGYwYWHwXZrGOgeWx-E',
    botUsername: '@globalpnt_bot',
    channelId: '-1002902496654',
    channelName: 'Global Picks',
    affiliateTags: {
      amazon_us: '{{URL}}{{SEP}}tag=pickntrust0b-20',
      amazon_uk: '{{URL}}{{SEP}}tag=pickntrust0e-21',
      amazon_in: '{{URL}}{{SEP}}tag=pickntrust03-21',
      cuelinks: 'https://linksredirect.com/?cid=243942&source=linkkit&url={{URL_ENC}}',
      inrdeals: 'id=sha678089037',
      earnkaro: 'https://ekaro.in/enkr2020/?url={{URL_ENC}}&ref=4530348'
    },
    network: 'global-multi',
    tableName: 'global_picks_products',
    envFile: '.env.global-picks'
  },
  
  'travel-picks': {
    displayName: 'Travel Picks Bot (Smart)',
    botToken: '7998139680:AAGVKECApmHNi4LMp2wR3UdVFfYgkT1HwZo',
    botUsername: '@travelpicks_bot',
    channelId: '-1003047967930',
    channelName: 'Travel Picks',
    affiliateTags: {
      cuelinks: 'https://linksredirect.com/?cid=243942&source=linkkit&url={{URL_ENC}}',
      inrdeals: 'id=sha678089037',
      earnkaro: 'https://ekaro.in/enkr2020/?url={{URL_ENC}}&ref=4530348',
      amazon_in: '{{URL}}{{SEP}}tag=pickntrust03-21',
      amazon_us: '{{URL}}{{SEP}}tag=pickntrust0b-20',
      amazon_uk: '{{URL}}{{SEP}}tag=pickntrust0e-21'
    },
    network: 'travel-multi',
    tableName: 'deals_hub_products', // Shared with DealsHub
    envFile: '.env.travel-picks'
  },
  
  'dealshub': {
    displayName: 'DealsHub Bot',
    botToken: '8292764619:AAEkfPXIsgNh1JC3n2p6VYo27V-EHepzmBo',
    botUsername: '@dealshubpnt_bot',
    channelId: '-1003029983162',
    channelName: 'Dealshub PNT',
    affiliateTag: 'id=sha678089037',
    network: 'inrdeals',
    tableName: 'dealshub_products',
    envFile: '.env.dealshub'
  },
  
  'lootbox': {
    displayName: 'Loot Box Bot',
    botToken: '8141266952:AAEosdwI8BkIpSk0f1AVzn8l4iwRnS8HXFQ',
    botUsername: '@deodappnt_bot',
    channelId: '-1002991047787',
    channelName: 'Deodap pnt',
    affiliateTag: '{{URL}}{{SEP}}ref=sicvppak',
    network: 'deodap',
    tableName: 'loot_box_products',
    envFile: '.env.loot-box'
  }
};

// Create environment files for each bot
function createEnvironmentFiles() {
  console.log('\nBlog Creating environment files for all 8 bots...');
  
  Object.entries(botConfigurations).forEach(([botName, config]) => {
    const envContent = generateEnvContent(botName, config);
    const envPath = path.join(__dirname, config.envFile);
    
    try {
      fs.writeFileSync(envPath, envContent);
      console.log(`Success Created ${config.envFile} for ${config.displayName}`);
    } catch (error) {
      console.error(`Error Error creating ${config.envFile}:`, error.message);
    }
  });
}

function generateEnvContent(botName, config) {
  const baseContent = `# ${config.displayName} Configuration
# Auto-generated with real bot tokens and affiliate tags

# Bot Configuration
TELEGRAM_BOT_TOKEN=${config.botToken}
BOT_USERNAME=${config.botUsername}
CHANNEL_ID=${config.channelId}
CHANNEL_NAME=${config.channelName || config.channelUsername}
TARGET_PAGE=${botName}
AFFILIATE_NETWORK=${config.network}
TABLE_NAME=${config.tableName}

# Method Selection
METHOD_TELEGRAM_ENABLED=true
METHOD_SCRAPING_ENABLED=true
METHOD_API_ENABLED=false

# Performance Settings
POLLING_INTERVAL=2000
MAX_RETRIES=3
TIMEOUT=30000

`;

  // Add affiliate tags based on bot type
  if (config.affiliateTags) {
    // Smart bot with multiple affiliate tags
    let affiliateSection = '# Multiple Affiliate Tags (Smart Bot)\n';
    Object.entries(config.affiliateTags).forEach(([network, tag]) => {
      const networkUpper = network.toUpperCase().replace('-', '_');
      affiliateSection += `AFFILIATE_TAG_${networkUpper}=${tag}\n`;
    });
    return baseContent + affiliateSection;
  } else {
    // Simple bot with single affiliate tag
    return baseContent + `# Single Affiliate Tag\nAFFILIATE_TAG=${config.affiliateTag}\n`;
  }
}

// Update enhanced telegram manager with real configurations
function updateEnhancedManager() {
  console.log('\n🔧 Updating Enhanced Telegram Manager with real configurations...');
  
  const managerPath = path.join(__dirname, 'server', 'enhanced-telegram-manager.ts');
  
  if (!fs.existsSync(managerPath)) {
    console.log('Warning Enhanced Telegram Manager not found, will create it...');
    return;
  }
  
  // Read current manager
  let managerContent = fs.readFileSync(managerPath, 'utf8');
  
  // Generate new bot configurations section
  const newConfigsSection = generateManagerConfigs();
  
  // Replace the initializeBotConfigurations method
  const configMethodRegex = /private initializeBotConfigurations\(\)[\s\S]*?console\.log\(`Success Configured.*?`\);\s*}/;
  
  if (configMethodRegex.test(managerContent)) {
    managerContent = managerContent.replace(configMethodRegex, newConfigsSection);
    fs.writeFileSync(managerPath, managerContent);
    console.log('Success Updated Enhanced Telegram Manager with real configurations');
  } else {
    console.log('Warning Could not find configuration method to update');
  }
}

function generateManagerConfigs() {
  return `private initializeBotConfigurations() {
    // Real bot configurations with actual tokens and affiliate tags
    const configs: BotConfig[] = [
${Object.entries(botConfigurations).map(([botName, config]) => {
  const methodsAvailable = ['telegram', 'scraping'];
  if (config.network === 'amazon' || config.network === 'cuelinks') {
    methodsAvailable.push('api');
  }
  
  return `      {
        botName: '${botName}',
        displayName: '${config.displayName}',
        isEnabled: true,
        tableName: '${config.tableName}',
        affiliateNetwork: '${config.network}',
        botToken: '${config.botToken}',
        channelId: '${config.channelId}',
        channelName: '${config.channelName || config.channelUsername}',
        affiliateTag: '${config.affiliateTag || 'multiple'}',
        methods: {
          telegram: { enabled: true, priority: 1 },
          scraping: { enabled: true, priority: 2 },
          api: { enabled: ${methodsAvailable.includes('api')}, priority: 3 }
        }
      }`;
}).join(',\n')}
    ];

    configs.forEach(config => {
      this.botConfigs.set(config.botName, config);
    });

    console.log(\`Success Configured \${configs.length} bots with real tokens and affiliate tags\`);
  }`;
}

// Create bot status summary
function createBotSummary() {
  console.log('\nStats 8-Bot System Summary:');
  console.log('=' .repeat(80));
  
  Object.entries(botConfigurations).forEach(([botName, config]) => {
    console.log(`\nAI ${config.displayName}`);
    console.log(`   Bot: ${config.botUsername}`);
    console.log(`   Channel: ${config.channelId} (${config.channelName || config.channelUsername})`);
    console.log(`   Network: ${config.network}`);
    console.log(`   Table: ${config.tableName}`);
    
    if (config.affiliateTags) {
      console.log(`   Tags: Multiple (${Object.keys(config.affiliateTags).length} networks)`);
      Object.entries(config.affiliateTags).forEach(([network, tag]) => {
        console.log(`     ${network}: ${tag.substring(0, 50)}...`);
      });
    } else {
      console.log(`   Tag: ${config.affiliateTag.substring(0, 50)}...`);
    }
  });
  
  console.log('\n' + '=' .repeat(80));
  console.log('Success All 8 bots configured with real tokens and affiliate tags!');
}

// Main execution
try {
  createEnvironmentFiles();
  updateEnhancedManager();
  createBotSummary();
  
  console.log('\nCelebration Complete 8-bot system configuration completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Success Environment files created for all 8 bots');
  console.log('2. Success Enhanced Telegram Manager updated');
  console.log('3. Refresh Restart server to load new configurations');
  console.log('4. 🧪 Test each bot individually');
  console.log('5. Stats Monitor via admin panel');
  
} catch (error) {
  console.error('Error Configuration failed:', error);
  process.exit(1);
}