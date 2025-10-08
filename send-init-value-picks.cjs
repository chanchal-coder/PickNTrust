const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

function getArg(name, defaultValue = undefined) {
  const idx = process.argv.findIndex(a => a === `--${name}`);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return defaultValue;
}

function resolveToken() {
  const fromArg = getArg('token');
  if (fromArg) return fromArg;
  if (process.env.VALUE_PICKS_BOT_TOKEN) return process.env.VALUE_PICKS_BOT_TOKEN;
  return null;
}

function resolveChannelId() {
  const fromArg = getArg('channel');
  if (fromArg) return fromArg;
  return process.env.VALUE_PICKS_CHANNEL_ID || '-1003017626269';
}

async function main() {
  const BOT_TOKEN = resolveToken();
  const CHANNEL_ID = resolveChannelId();

  if (!BOT_TOKEN) {
    console.error('❌ No bot token provided. Use --token <TOKEN> or set VALUE_PICKS_BOT_TOKEN in .env');
    process.exit(1);
  }
  if (!CHANNEL_ID) {
    console.error('❌ No channel ID provided. Use --channel <ID> or set VALUE_PICKS_CHANNEL_ID in .env');
    process.exit(1);
  }

  const bot = new TelegramBot(BOT_TOKEN, { polling: false });

  try {
    const me = await bot.getMe();
    const msg = [
      '✅ Value Picks Initialized (webhook-only)',
      `• Bot: @${me.username} (ID: ${me.id})`,
      '• Channel: Value Picks EK',
      '• Affiliate: EarnKaro (single platform)',
      `• Time: ${new Date().toISOString()}`,
    ].join('\n');

    console.log(`📤 Sending init message to Value Picks (${CHANNEL_ID})...`);
    const res = await bot.sendMessage(CHANNEL_ID, msg, { parse_mode: 'HTML' });
    console.log('✅ Init message sent, message_id:', res.message_id);
  } catch (err) {
    console.error('❌ Failed to send init message:', err?.message || err);
    process.exit(1);
  }
}

main();