const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function main() {
  let token = process.env.MASTER_BOT_TOKEN;
  if (!token) {
    try {
      const cleanupPath = path.join(__dirname, 'cleanup-all-bots.cjs');
      const content = fs.readFileSync(cleanupPath, 'utf8');
      const tokens = Array.from(content.matchAll(/'([0-9]+:[A-Za-z0-9_-]+)'/g)).map(m => m[1]);
      if (tokens && tokens.length > 0) {
        token = tokens[0];
        console.log('ℹ️ Using master bot token from cleanup-all-bots.cjs');
      }
    } catch (e) {
      // ignore
    }
  }
  if (!token) {
    console.error('❌ MASTER_BOT_TOKEN not found (env or fallback). Set env or update cleanup-all-bots.cjs');
    process.exit(1);
  }

  const bot = new TelegramBot(token, { polling: false });

  // Build channel list (env with fallbacks + handle naming variations)
  const channels = [
    { name: 'Prime Picks', id: process.env.PRIME_PICKS_CHANNEL_ID || '-1002955338551' },
    { name: 'Cue Links', id: process.env.CUE_LINKS_CHANNEL_ID || process.env.CUELINKS_CHANNEL_ID || '-1002982344997' },
    { name: 'Value Picks', id: process.env.VALUE_PICKS_CHANNEL_ID || '-1003017626269' },
    { name: 'Click Picks', id: process.env.CLICK_PICKS_CHANNEL_ID || '-1002981205504' },
    { name: 'Global Picks', id: process.env.GLOBAL_PICKS_CHANNEL_ID || '-1002902496654' },
    { name: 'Deals Hub', id: process.env.DEALS_HUB_CHANNEL_ID || process.env.DEALSHUB_CHANNEL_ID || '-1003029983162' },
    { name: 'Loot Box', id: process.env.LOOT_BOX_CHANNEL_ID || '-1002991047787' },
    { name: 'Travel Picks', id: process.env.TRAVEL_PICKS_CHANNEL_ID || null },
  ].filter(c => !!c.id);

  // Add admin alert chat first if present (so they get the message)
  const alertChatId = process.env.ALERT_CHAT_ID;
  if (alertChatId) {
    channels.unshift({ name: 'Admin Alert', id: alertChatId });
  }

  try {
    const me = await bot.getMe();
    const info = await bot.getWebHookInfo();
    const baseUrl = process.env.PUBLIC_BASE_URL || 'https://pickntrust.com';
    const msg = [
      '✅ Bot Initialized (webhook-only)',
      `• Bot: @${me.username} (ID: ${me.id})`,
      `• Webhook: ${info.url || baseUrl}`,
      `• Pending: ${info.pending_update_count || 0}`,
      `• Env: ${process.env.NODE_ENV || 'development'}`,
      `• Time: ${new Date().toISOString()}`,
    ].join('\n');

    console.log(`📡 Broadcasting init message to ${channels.length} chats...`);
    for (const ch of channels) {
      try {
        console.log(`📤 Sending to ${ch.name} (${ch.id})...`);
        const res = await bot.sendMessage(ch.id, msg, { parse_mode: 'HTML' });
        console.log(`✅ Sent to ${ch.name}, message_id: ${res.message_id}`);
      } catch (e) {
        console.warn(`⚠️ Failed to send to ${ch.name} (${ch.id}):`, e?.message || e);
      }
    }

    console.log('🎉 Broadcast complete');
  } catch (err) {
    console.error('❌ Failed during broadcast:', err?.message || err);
    process.exit(1);
  }
}

main();