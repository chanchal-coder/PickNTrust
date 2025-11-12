import express from 'express';
import { loadEnv } from './config/env-loader.js';
// Load environment variables from .env early so webhook auth works
loadEnv();
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { setupVite, serveStatic } from './vite.js';
import { storage } from './storage.js';
import { setupRoutes as setupAdminRoutes } from './routes-final.js';
import advertiserRoutes from './advertiser-routes.js';
import adRequestRoutes from './ad-request-routes.js';
import { TelegramBotManager } from './telegram-bot.js';
import { travelPicksBot } from './travel-picks-bot.js';

// Routers
import pagesRouter from './routes/pages-routes.js';
import currencyRouter from './routes/currency.js';
import widgetRouter from './widget-routes.js';
import bannerRouter from './banner-routes.js';
import staticBannerRouter from './static-banner-routes.js';
import imageProxyRouter from './image-proxy.js';
import metaTagsRouter from './meta-tags-routes.js';
import canvaAdminRouter from './canva-admin-routes.js';

// ESM dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = Number(process.env.PORT || 5000);
const NODE_ENV = process.env.NODE_ENV || 'development';

async function start() {
  const app = express();

  // Core middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Health endpoint
  app.get('/health', (req, res) => {
    res.json({ ok: true, env: NODE_ENV, port: PORT });
  });

  // API health endpoint (explicit under /api to avoid SPA fallthrough)
  app.get('/api/health', (req, res) => {
    res.json({ ok: true, env: NODE_ENV, port: PORT });
  });

  // API status endpoint with runtime details
  app.get('/api/status', (req, res) => {
    res.json({
      ok: true,
      env: NODE_ENV,
      port: PORT,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });
  });

  // Uploads static (used by various routes)
  // Prefer serving from built public directory so Nginx can also serve `/uploads`
  const uploadDirCandidates = [
    process.env.UPLOAD_DIR ? path.resolve(process.env.UPLOAD_DIR) : '',
    path.resolve(process.cwd(), 'dist', 'public', 'uploads'),
    path.resolve(__dirname, '..', 'public', 'uploads'),
    path.resolve(__dirname, '..', 'uploads'), // fallback
  ].filter(Boolean);
  const fs = await import('fs');
  let uploadDir = uploadDirCandidates.find(p => {
    try { return fs.existsSync(path.dirname(p)); } catch { return false; }
  }) || uploadDirCandidates[uploadDirCandidates.length - 1];
  try { if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true }); } catch {}
  app.use('/uploads', express.static(uploadDir));

  // Mount API routers
  app.use('/api/pages', pagesRouter);
  app.use('/api/currency', currencyRouter);
  app.use(widgetRouter); // defines /api/widgets and /api/admin/widgets
  app.use(bannerRouter); // defines /api/banners
  app.use(staticBannerRouter); // defines /api/banners/static
  app.use(imageProxyRouter); // defines /api/image-proxy
  app.use(metaTagsRouter); // defines /api/meta-tags
  // Canva admin routes (settings, test, etc.)
  app.use(canvaAdminRouter);

  // Lightweight placeholder image endpoint (SVG)
  // Keeps UI stable when image URLs are missing
  app.get('/api/placeholder/:width/:height', (req, res) => {
    try {
      const width = Math.max(parseInt(String(req.params.width || '300'), 10) || 300, 1);
      const height = Math.max(parseInt(String(req.params.height || '300'), 10) || 300, 1);
      const text = String((req.query as any).text || 'No Image');
      const bg = String((req.query as any).bg || '#e5e7eb'); // Tailwind gray-200
      const fg = String((req.query as any).fg || '#6b7280'); // Tailwind gray-500

      res.setHeader('Content-Type', 'image/svg+xml');
      const fontSize = Math.max(Math.min(Math.floor(width / 10), 24), 12);
      res.send(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="${bg}"/>
  <g fill="${fg}" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" text-anchor="middle">
    <text x="50%" y="50%" dominant-baseline="middle">${text}</text>
  </g>
</svg>`);
    } catch (err) {
      console.error('Error generating placeholder image:', err);
      res.status(500).end();
    }
  });

  // Announcements are provided by admin routes; avoid fallback endpoints that shadow real handlers

  // Advertiser and Explore ads routes
  // Mount advertiser management and public ads under /api/advertisers
  app.use('/api/advertisers', advertiserRoutes);
  // Mount ad requests and Explore ads config (absolute paths inside the router)
  app.use(adRequestRoutes);

  // Mount admin/product routes to support admin product creation and related endpoints
  try {
    setupAdminRoutes(app as any, storage as any);
    console.log('🔧 Admin routes mounted');
  } catch (e) {
    console.error('Failed to mount admin routes:', e);
  }

  // Telegram webhook endpoint (master and travel bots share this path)
  app.post('/webhook/master/:token', async (req, res) => {
    try {
      const update = req.body || {};
      const token = String(req.params.token || '');

      // Basic telemetry
      console.log('📥 Telegram webhook hit', {
        tokenPrefix: token.substring(0, 10) + '...',
        hasMessage: !!update.message,
        hasChannelPost: !!update.channel_post,
        hasEditedChannelPost: !!update.edited_channel_post
      });

      // Authorization: accept master token, allowed list, or dev bypass in non-production
      const expectedToken = process.env.MASTER_BOT_TOKEN;
      const allowedTokensEnv = (process.env.ALLOWED_BOT_TOKENS || '')
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);
      const additionalEnvTokens = [
        process.env.VALUE_PICKS_BOT_TOKEN,
        process.env.PRIME_PICKS_BOT_TOKEN,
        process.env.CUE_PICKS_BOT_TOKEN,
        process.env.CLICK_PICKS_BOT_TOKEN,
        process.env.GLOBAL_PICKS_BOT_TOKEN,
        process.env.DEALS_HUB_BOT_TOKEN,
        process.env.LOOT_BOX_BOT_TOKEN,
        process.env.TRAVEL_PICKS_BOT_TOKEN
      ].filter(Boolean) as string[];
      const allowedTokensSet = new Set<string>([...allowedTokensEnv, ...additionalEnvTokens]);
      const isDevMode = (process.env.NODE_ENV || 'development') !== 'production';
      const devToken = process.env.DEV_WEBHOOK_TOKEN || 'dev';
      const allowAnyToken = process.env.ALLOW_ANY_BOT_TOKEN === 'true';
      const isAuthorized = allowAnyToken || token === expectedToken || allowedTokensSet.has(token) || (isDevMode && token === devToken);
      if (!isAuthorized) {
        console.error('❌ Invalid webhook token: not in allowed list');
        return res.status(401).json({ error: 'Invalid token' });
      }

      const botManager = TelegramBotManager.getInstance();
      let handled = false;

      // Prefer channel_post updates; fall back to message/edited_channel_post
      const post = update.channel_post || update.message || update.edited_channel_post;
      if (post && post.chat && post.chat.id) {
        const chatId = String(post.chat.id);
        const travelStatus = travelPicksBot.getStatus();

        if (chatId === travelStatus.channelId) {
          // Route Travel Picks channel posts to travel bot
          await travelPicksBot.processMessage(post);
          handled = true;
        } else {
          // Route all other posts/messages to master bot manager
          await botManager.processMessage(post);
          handled = true;
        }
      }

      // Acknowledge quickly; processing is synchronous above but guarded
      return res.status(200).json({ ok: true, handled });
    } catch (err: any) {
      console.error('❌ Telegram webhook error:', err?.message || err);
      return res.status(200).json({ ok: true, handled: false });
    }
  });

  // Start HTTP server (bind explicitly to IPv4 localhost to avoid ::1-only binding on Windows)
  const server = app.listen(PORT, '127.0.0.1', () => {
    console.log(`🚀 Server listening on http://127.0.0.1:${PORT}`);
  });

  // Extra diagnostics: log server errors immediately
  server.on('error', (err) => {
    console.error('❌ HTTP server error:', err);
  });

  // Frontend dev/prod serving
  if (NODE_ENV !== 'production') {
    try {
      await setupVite(app, server as any);
      console.log('🎯 Vite dev middleware active');
    } catch (e) {
      console.error('Vite setup failed:', e);
    }
  } else {
    try {
      serveStatic(app);
      console.log('📦 Serving static client from dist/public');
    } catch (e) {
      console.error('Static serving failed:', e);
    }
  }
}

// Run
start().catch((err) => {
  console.error('Fatal server start error:', err);
  process.exit(1);
});