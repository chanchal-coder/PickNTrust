// Load Value Picks configuration from environment file
const fs = require('fs');
const path = require('path');

function loadValuePicksConfig() {
  try {
    const configPath = path.join(__dirname, '.env.value-picks');
    
    if (fs.existsSync(configPath)) {
      console.log('📋 Loading Value Picks configuration from .env.value-picks');
      
      const configContent = fs.readFileSync(configPath, 'utf8');
      const lines = configContent.split('\n');
      
      lines.forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#') && line.includes('=')) {
          const [key, ...valueParts] = line.split('=');
          const value = valueParts.join('=');
          process.env[key.trim()] = value.trim();
        }
      });
      
      console.log('Success Value Picks configuration loaded successfully');
      console.log(`   Bot: ${process.env.VALUE_PICKS_BOT_NAME} (@${process.env.VALUE_PICKS_BOT_USERNAME})`);
      console.log(`   Channel: ${process.env.VALUE_PICKS_CHANNEL_URL}`);
      console.log(`   Bundle Processing: ${process.env.VALUE_PICKS_BUNDLE_PROCESSING}`);
      
    } else {
      console.log('Warning  .env.value-picks file not found, using default configuration');
      
      // Set default values
      process.env.VALUE_PICKS_BOT_NAME = process.env.VALUE_PICKS_BOT_NAME || 'Pntearnkaro';
      process.env.VALUE_PICKS_BOT_USERNAME = process.env.VALUE_PICKS_BOT_USERNAME || 'pntearnkaro_bot';
      process.env.VALUE_PICKS_BOT_TOKEN = process.env.VALUE_PICKS_BOT_TOKEN || '8336181113:AAHMpM4qRZylA9E5OQspPfA5yDDElJB1_wc';
      process.env.VALUE_PICKS_CHANNEL_URL = process.env.VALUE_PICKS_CHANNEL_URL || 'https://t.me/pntearnkaro';
      process.env.VALUE_PICKS_CHANNEL_ID = process.env.VALUE_PICKS_CHANNEL_ID || '@pntearnkaro';
      process.env.VALUE_PICKS_CHANNEL_TITLE = process.env.VALUE_PICKS_CHANNEL_TITLE || 'PNT EarnKaro';
      process.env.VALUE_PICKS_AFFILIATE_TEMPLATE = process.env.VALUE_PICKS_AFFILIATE_TEMPLATE || 'https://valuepicks.com/redirect?url={URL}';
      process.env.VALUE_PICKS_BUNDLE_PROCESSING = process.env.VALUE_PICKS_BUNDLE_PROCESSING || 'true';
    }
    
  } catch (error) {
    console.error('Error Error loading Value Picks configuration:', error.message);
    console.log('Refresh Using fallback configuration...');
    
    // Fallback configuration
    process.env.VALUE_PICKS_BOT_NAME = 'Pntearnkaro';
    process.env.VALUE_PICKS_BOT_USERNAME = 'pntearnkaro_bot';
    process.env.VALUE_PICKS_BOT_TOKEN = '8336181113:AAHMpM4qRZylA9E5OQspPfA5yDDElJB1_wc';
    process.env.VALUE_PICKS_CHANNEL_URL = 'https://t.me/pntearnkaro';
    process.env.VALUE_PICKS_CHANNEL_ID = '@pntearnkaro';
    process.env.VALUE_PICKS_CHANNEL_TITLE = 'PNT EarnKaro';
    process.env.VALUE_PICKS_AFFILIATE_TEMPLATE = 'https://valuepicks.com/redirect?url={URL}';
    process.env.VALUE_PICKS_BUNDLE_PROCESSING = 'true';
  }
}

// Load configuration immediately when this module is required
loadValuePicksConfig();

module.exports = {
  loadValuePicksConfig,
  getValuePicksConfig: () => ({
    botName: process.env.VALUE_PICKS_BOT_NAME,
    botUsername: process.env.VALUE_PICKS_BOT_USERNAME,
    botToken: process.env.VALUE_PICKS_BOT_TOKEN,
    channelUrl: process.env.VALUE_PICKS_CHANNEL_URL,
    channelId: process.env.VALUE_PICKS_CHANNEL_ID,
    channelTitle: process.env.VALUE_PICKS_CHANNEL_TITLE,
    affiliateTemplate: process.env.VALUE_PICKS_AFFILIATE_TEMPLATE,
    bundleProcessing: process.env.VALUE_PICKS_BUNDLE_PROCESSING === 'true'
  })
};

console.log('Target Value Picks configuration module loaded');