# Production Start Commands (EC2‑Ready)

- Install dependencies: `npm install`
- Build artifacts: `npm run build`
- Start locally in production: `npm start`

This uses `cross-env` so it works on Linux (EC2) and Windows. The server serves static files from `dist/public` and injects active meta tags before returning `index.html`.

## PM2 (Recommended)

- Start with PM2 on Linux:
`FRONTEND_STATIC_DIR=dist/public NODE_ENV=production pm2 start dist/server/server/index.js --name pickntrust-backend --update-env`

- Check status: `pm2 status`
- View logs: `pm2 logs pickntrust-backend`
- Restart after updates: `pm2 restart pickntrust-backend`

### Telegram Bot (Separate Process)

- Ensure environment is set with a valid `MASTER_BOT_TOKEN` (do not commit tokens):
`export MASTER_BOT_TOKEN="<your-token>"`

- Start bot as an isolated PM2 process:
`ENABLE_TELEGRAM_BOT=true pm2 start dist/server/server/telegram-bot.js --name pickntrust-bot --update-env`

- Logs and status:
`pm2 logs pickntrust-bot`
`pm2 restart pickntrust-bot`
`pm2 stop pickntrust-bot`

- Using the ecosystem file (recommended to keep both processes in sync):
`MASTER_BOT_TOKEN="<your-token>" pm2 start ecosystem.config.cjs --only pickntrust-bot --update-env`
`pm2 restart ecosystem.config.cjs --only pickntrust-bot --update-env`

## Health Checks

- Backend: `http://<server-ip>:5000/health`
- API status: `http://<server-ip>:5000/api/status`

## Notes

- Static assets are built to `dist/public` by Vite.
- Server output is at `dist/server/server/index.js` via TypeScript.
- If `FRONTEND_STATIC_DIR` is not set, the server falls back to `../public` relative to the compiled server, so keep the default or pass the env explicitly as above.
 - Bot runs independently of the web server; any bot errors are contained to `pickntrust-bot` PM2 process and will not crash the website.