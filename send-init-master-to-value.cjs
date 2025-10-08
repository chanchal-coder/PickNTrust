const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

// Usage: node send-init-master-to-value.cjs [--channel-id <id>]
const args = process.argv.slice(2);
let channelId = process.env.VALUE_PICKS_CHANNEL_ID || '-1003017626269';
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--channel-id' && args[i + 1]) {
    channelId = args[i + 1];
    break;
  }
}

const BOT_TOKEN = process.env.MASTER_BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error('❌ MASTER_BOT_TOKEN not found in environment variables');
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: false });

async function sendInit() {
  try {
    console.log('🚀 Sending initialization message via MASTER bot...');
    console.log('📺 Channel ID:', channelId);

    const message = `✅ Master Bot Initialized for Value Picks

The master bot is now configured to read channel posts and deliver updates.

- Webhook: https://pickntrust.com/webhook/master/<token>
- Mode: Webhook-only
- Permissions: Post Messages enabled

If you see this, posting permissions are working. 🎉`;

    const result = await bot.sendMessage(channelId, message, { disable_web_page_preview: true });
    console.log('✅ Init message sent!');
    console.log('   Message ID:', result.message_id);
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to send init message:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.body);
    }
    process.exit(1);
  }
}

sendInit();