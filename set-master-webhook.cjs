const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Reads env and configures webhook to PUBLIC_BASE_URL/webhook/master/<TOKEN>
async function main() {
  let token = process.env.MASTER_BOT_TOKEN;
  const baseUrl = process.env.PUBLIC_BASE_URL || 'https://pickntrust.com';

  // Fallback: try to extract master token from cleanup-all-bots.cjs if env missing
  if (!token) {
    try {
      const cleanupPath = path.join(__dirname, 'cleanup-all-bots.cjs');
      const content = fs.readFileSync(cleanupPath, 'utf8');
      const tokens = Array.from(content.matchAll(/'([0-9]+:[A-Za-z0-9_-]+)'/g)).map(m => m[1]);
      if (tokens && tokens.length > 0) {
        token = tokens[0]; // First token labelled "Master Bot (current)"
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

  const webhookUrl = `${baseUrl}/webhook/master/${token}`;
  console.log('🔧 Configuring webhook (webhook-only, no polling)');
  console.log('   Base URL:', baseUrl);
  console.log('   Target webhook:', webhookUrl);

  try {
    const bot = new TelegramBot(token, { polling: false });

    console.log('🧹 Clearing existing webhook...');
    await bot.deleteWebHook();
    await new Promise(r => setTimeout(r, 1500));

    console.log('🔗 Setting webhook...');
    await bot.setWebHook(webhookUrl, {
      allowed_updates: ['message', 'channel_post', 'edited_channel_post'],
    });

    await new Promise(r => setTimeout(r, 1500));
    const info = await bot.getWebHookInfo();
    console.log('📊 Webhook info:', {
      url: info.url,
      pending_update_count: info.pending_update_count,
      has_custom_certificate: info.has_custom_certificate,
      max_connections: info.max_connections,
      last_error_date: info.last_error_date,
      last_error_message: info.last_error_message,
    });

    console.log('✅ Webhook configured successfully');
  } catch (err) {
    console.error('❌ Failed to set webhook:', err?.message || err);
    process.exit(1);
  }
}

main();