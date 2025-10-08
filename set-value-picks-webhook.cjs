const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

function getArg(name, defaultValue = undefined) {
  const idx = process.argv.findIndex(a => a === `--${name}`);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return defaultValue;
}

function getPublicBaseUrl() {
  return process.env.PUBLIC_BASE_URL || 'https://pickntrust.com';
}

function getTokenFromEnvOrArgs() {
  const argToken = getArg('token');
  if (argToken) return argToken;
  if (process.env.VALUE_PICKS_BOT_TOKEN) return process.env.VALUE_PICKS_BOT_TOKEN;
  return null;
}

async function main() {
  const BOT_TOKEN = getTokenFromEnvOrArgs();
  if (!BOT_TOKEN) {
    console.error('❌ No bot token provided. Use --token <TOKEN> or set VALUE_PICKS_BOT_TOKEN in .env');
    process.exit(1);
  }

  const bot = new TelegramBot(BOT_TOKEN, { polling: false });
  const baseUrl = getPublicBaseUrl();
  const webhookUrl = `${baseUrl}/webhook/master/${BOT_TOKEN}`;

  try {
    console.log(`🔧 Clearing existing webhook for Value Picks bot...`);
    await bot.deleteWebHook();
  } catch (e) {
    console.warn('⚠️ Failed to clear webhook (may be none):', e?.message || e);
  }

  try {
    console.log(`🔗 Setting webhook: ${webhookUrl}`);
    await bot.setWebHook(webhookUrl, {
      allowed_updates: ['message', 'channel_post', 'edited_channel_post']
    });
    const info = await bot.getWebHookInfo();
    console.log('📊 Webhook info', {
      url: info.url,
      pending_update_count: info.pending_update_count,
      has_custom_certificate: info.has_custom_certificate,
      max_connections: info.max_connections,
    });
    console.log('✅ Webhook configured for Value Picks bot');
  } catch (err) {
    console.error('❌ Failed to set webhook:', err?.message || err);
    process.exit(1);
  }
}

main();