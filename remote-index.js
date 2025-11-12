import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { setupVite, serveStatic } from './vite.js';
import { storage } from './storage.js';
import { setupRoutes as setupAdminRoutes } from './routes-final.js';
import advertiserRoutes from './advertiser-routes.js';
import adRequestRoutes from './ad-request-routes.js';
// Routers
import pagesRouter from './routes/pages-routes.js';
import currencyRouter from './routes/currency.js';
import widgetRouter from './widget-routes.js';
import bannerRouter from './banner-routes.js';
import staticBannerRouter from './static-banner-routes.js';
import imageProxyRouter from './image-proxy.js';
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
    const uploadDir = process.env.UPLOAD_DIR
        ? path.resolve(process.env.UPLOAD_DIR)
        : path.resolve(__dirname, '..', 'uploads');
    try {
        const fs = await import('fs');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
    }
    catch { }
    app.use('/uploads', express.static(uploadDir));
    // Mount API routers
    app.use('/api/pages', pagesRouter);
    app.use('/api/currency', currencyRouter);
    app.use(widgetRouter); // defines /api/widgets and /api/admin/widgets
    app.use(bannerRouter); // defines /api/banners
    app.use(staticBannerRouter); // defines /api/banners/static
    app.use(imageProxyRouter); // defines /api/image-proxy
    // Announcements are provided by admin routes; avoid fallback endpoints that shadow real handlers
    // Advertiser and Explore ads routes
    // Mount advertiser management and public ads under /api/advertisers
    app.use('/api/advertisers', advertiserRoutes);
    // Mount ad requests and Explore ads config (absolute paths inside the router)
    app.use(adRequestRoutes);
    // Mount admin/product routes to support admin product creation and related endpoints
    try {
        setupAdminRoutes(app, storage);
        console.log('🔧 Admin routes mounted');
    }
    catch (e) {
        console.error('Failed to mount admin routes:', e);
    }
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
            await setupVite(app, server);
            console.log('🎯 Vite dev middleware active');
        }
        catch (e) {
            console.error('Vite setup failed:', e);
        }
    }
    else {
        try {
            serveStatic(app);
            console.log('📦 Serving static client from dist/public');
        }
        catch (e) {
            console.error('Static serving failed:', e);
        }
    }
}
// Run
start().catch((err) => {
    console.error('Fatal server start error:', err);
    process.exit(1);
});
