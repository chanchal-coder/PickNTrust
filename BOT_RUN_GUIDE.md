Separate Bot Runner — No Website Impact

- Purpose: Run the Telegram bot as its own process so the web server stays untouched. The bot only writes new rows into `database.sqlite` → `unified_content`.

What Stays the Same

- Web server: no restart needed; code and endpoints unchanged.
- Database schema: unchanged; only adds rows in `unified_content`.
- Site availability: if the bot stops, the website continues working normally.

Prerequisites

- Node.js installed on the host where the bot runs.
- `.env` in project root with at least `MASTER_BOT_TOKEN=<your-token>`.
  - Optional: `PRIMARY_CHANNEL_ID`, `SECONDARY_CHANNEL_ID`, `ALLOWED_CHAT_IDS` as needed.
- `database.sqlite` in the project root (same DB the website reads).

Post‑Deploy Checklist (Critical)

- Always update the bot token after a deployment if it changed.
- Ensure the webhook points to the apex domain to avoid 301 redirects.
- Steps:
- Set `MASTER_BOT_TOKEN` in `ecosystem.config.cjs` and `.env`.
  - Current production `MASTER_BOT_TOKEN`: `8433200963:AAFE8umMtF23xgE7pBZA6wjIVg-o-2GeEvE`.
- Set `PUBLIC_BASE_URL='https://pickntrust.com'` (not `https://www...`).
  - Restart bot: `pm2 restart pickntrust-bot` and check `pm2 logs pickntrust-bot`.
  - Verify via Telegram API:
    - `getMe` → should return 200.
    - `getWebhookInfo` → URL must be `https://pickntrust.com/webhook/master/<TOKEN>`.
  - If `last_error_message` shows `301 Moved Permanently`, switch to apex and re‑set the webhook.
  - Fallback: temporarily delete webhook to allow polling: `deleteWebHook` then enable `TRAVEL_BOT_POLLING=true` only for the travel bot.

Start the Bot (Windows)

- In project root: `./start-bot-separate.ps1`
- PM2 manages the bot: `pm2 status`, `pm2 logs pickntrust-bot`, `pm2 stop pickntrust-bot`.

Start the Bot (Linux/EC2)

- In project root: `bash scripts/start-bot-separate.sh`
- PM2 manages the bot: `pm2 status`, `pm2 logs pickntrust-bot`, `pm2 stop pickntrust-bot`.

Safety: Unified-Only Mode

- The runner `start-bot-fixed.cjs` auto-detects the optional `channel_posts` table.
- If `channel_posts` is missing, it logs `unified_content-only mode` and skips any writes/updates to `channel_posts` while continuing to insert into `unified_content`.

Verification

- Recent bot inserts: run your existing scripts (e.g., `check-recent-bot-activity.cjs`) or query `unified_content` sorted by `created_at`.
- Website endpoints continue to serve content from `unified_content` without any server restart.

Troubleshooting

- 403 on homepage/assets: fix Nginx file permissions under `dist/public` to dirs `755` and files `644`, then reload Nginx.
- Webhook 301 or pending updates stuck: set apex base URL, re‑set webhook, check `pending_update_count` drains.
- Bot restarts reset webhook: keep apex in `PUBLIC_BASE_URL` so webhook is set correctly on startup.
## Telegram Publisher (Safe, Fail-Open)

This repo includes a standalone Telegram publishing module that writes to `unified_content` without affecting existing site reads. Publishing is gated by the `TELEGRAM_PUBLISH` flag and is fail-open: if the flag is not enabled or validation fails, no writes occur and the website remains unchanged.

### Where
- File: `server/telegram/publish.cjs`
- DB target: `database.sqlite`, table `unified_content`

### What it does
- Accepts Telegram `message` and/or `url` inputs.
- Extracts minimal fields: `title`, `image_url` (uses placeholder if missing), optional `affiliate_url`, optional `price`.
- Validates required: `title`, `display_pages` (JSON array string), `image_url`.
- Dedupe and upsert:
  - First by `(source_type='telegram', source_id)` when `messageId` is provided.
  - Otherwise by `affiliate_url` only for existing `source_type='telegram'` rows (does not modify non-telegram rows).
- Leaves `price` as `NULL` when not available; never defaults to `0`.

### Enable/Disable
- Enable: set environment `TELEGRAM_PUBLISH=1` for the worker process.
- Disable: unset or set `TELEGRAM_PUBLISH` to anything else.

### Programmatic usage
```js
const { publishTelegramItem } = require('./server/telegram/publish.cjs');

await publishTelegramItem({
  message: 'Great deal! #prime-picks',
  url: 'https://store.com/p/item123',
  displayPages: ['prime-picks'],
  channelId: 'my_channel',
  messageId: 98765
});
```

### CLI quick test
```
node server/telegram/publish.cjs "Awesome gadget" "https://store.com/p/abc" prime-picks 98765
```

### Notes
- Reads across the website remain unchanged and continue to hit `unified_content`.
- On any issue, switch off `TELEGRAM_PUBLISH` to stop writes immediately.
- If `url` fetching fails or no OG metadata is present, publishing still succeeds with a placeholder image and a title derived from message or URL.

## Channel Mappings (Updated)

- Apps & AI Apps: channel `-1003414218904` (`@pntaiapps`) → page slug `apps-ai-apps` (also accepted `apps`)
- Top Picks: channel `-1003488288404` (`@toppickspnt`) → page slug `top-picks`
- Services: channel `-1003487271664` (`@cardsservicespnt`) → page slug `services`

- Behavior:
  - Incoming posts from these channels are categorized via existing rules (`isAIApp`, `isService`, `isFeatured`).
  - `display_pages` are set to match their mapped slugs, ensuring items appear on the right pages without impacting the website’s existing content.
  - Bot runs separately under PM2 (`pickntrust-bot`), so website remains unaffected by bot restarts.

Posting Correct Pages (Avoid Cross‑Posting)

- Only whitelisted channels should publish. Unknown channels must be acknowledged but not posted.
- Ensure channel IDs are correct in the mapping above.
- Disable fallback posting to a default page for unknown channels.
- Set `ALLOW_ANY_BOT_TOKEN=false` in env to restrict to allowed tokens.