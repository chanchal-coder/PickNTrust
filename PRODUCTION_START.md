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

## Health Checks

- Backend: `http://<server-ip>:5000/health`
- API status: `http://<server-ip>:5000/api/status`

## Notes

- Static assets are built to `dist/public` by Vite.
- Server output is at `dist/server/server/index.js` via TypeScript.
- If `FRONTEND_STATIC_DIR` is not set, the server falls back to `../public` relative to the compiled server, so keep the default or pass the env explicitly as above.