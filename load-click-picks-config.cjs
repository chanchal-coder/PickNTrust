// Load Click Picks configuration from environment file
const fs = require('fs');
const path = require('path');

function loadClickPicksConfig() {
  try {
    const configPath = path.join(__dirname, '.env.click-picks');
    
    if (fs.existsSync(configPath)) {
      console.log('📋 Loading Click Picks configuration from .env.click-picks');
      
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
      
      console.log('Success Click Picks configuration loaded successfully');
      console.log(`   Bot: ${process.env.CLICK_PICKS_BOT_NAME} (@${process.env.CLICK_PICKS_BOT_USERNAME})`);
      console.log(`   Channel: ${process.env.CLICK_PICKS_CHANNEL_URL}`);
      console.log(`   Bundle Processing: ${process.env.CLICK_PICKS_BUNDLE_PROCESSING}`);
      
    } else {
      console.log('Warning  .env.click-picks file not found, using default configuration');
      
      // Set default values
      process.env.CLICK_PICKS_BOT_NAME = process.env.CLICK_PICKS_BOT_NAME || 'ClickPicks';
      process.env.CLICK_PICKS_BOT_USERNAME = process.env.CLICK_PICKS_BOT_USERNAME || 'clickpicks_bot';
      process.env.CLICK_PICKS_BOT_TOKEN = process.env.CLICK_PICKS_BOT_TOKEN || 'YOUR_CLICK_PICKS_BOT_TOKEN_HERE';
      process.env.CLICK_PICKS_CHANNEL_URL = process.env.CLICK_PICKS_CHANNEL_URL || 'https://t.me/clickpicks';
      process.env.CLICK_PICKS_CHANNEL_ID = process.env.CLICK_PICKS_CHANNEL_ID || '@clickpicks';
      process.env.CLICK_PICKS_CHANNEL_TITLE = process.env.CLICK_PICKS_CHANNEL_TITLE || 'Click Picks';
      process.env.CLICK_PICKS_AFFILIATE_TEMPLATE = process.env.CLICK_PICKS_AFFILIATE_TEMPLATE || 'https://clickpicks.com/redirect?url={URL}';
      process.env.CLICK_PICKS_BUNDLE_PROCESSING = process.env.CLICK_PICKS_BUNDLE_PROCESSING || 'true';
    }
    
  } catch (error) {
    console.error('Error Error loading Click Picks configuration:', error.message);
    console.log('Refresh Using fallback configuration...');
    
    // Fallback configuration
    process.env.CLICK_PICKS_BOT_NAME = 'ClickPicks';
    process.env.CLICK_PICKS_BOT_USERNAME = 'clickpicks_bot';
    process.env.CLICK_PICKS_BOT_TOKEN = 'YOUR_CLICK_PICKS_BOT_TOKEN_HERE';
    process.env.CLICK_PICKS_CHANNEL_URL = 'https://t.me/clickpicks';
    process.env.CLICK_PICKS_CHANNEL_ID = '@clickpicks';
    process.env.CLICK_PICKS_CHANNEL_TITLE = 'Click Picks';
    process.env.CLICK_PICKS_AFFILIATE_TEMPLATE = 'https://clickpicks.com/redirect?url={URL}';
    process.env.CLICK_PICKS_BUNDLE_PROCESSING = 'true';
  }
}

// Load configuration immediately
loadClickPicksConfig();

// Export for manual loading
module.exports = { loadClickPicksConfig };

console.log('Target Click Picks configuration module loaded');