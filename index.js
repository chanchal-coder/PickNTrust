import { fetch as undiciFetch, Headers as UndiciHeaders, Request as UndiciRequest, Response as UndiciResponse, FormData as UndiciFormData } from "undici";
// Provide global fetch & Web APIs if missing, and a minimal File shim
const g = globalThis;
if (!g.fetch)
    g.fetch = undiciFetch;
if (!g.Headers)
    g.Headers = UndiciHeaders;
if (!g.Request)
    g.Request = UndiciRequest;
if (!g.Response)
    g.Response = UndiciResponse;
if (!g.FormData)
    g.FormData = UndiciFormData;
if (typeof g.File === "undefined") {
    class FileShim {
        name;
        lastModified;
        constructor(_bits, name, options = {}) {
            this.name = String(name);
            this.lastModified = options?.lastModified ?? Date.now();
        }
    }
    g.File = FileShim;
}
import express from "express";
import { loadEnv } from './config/env-loader.js';
// Load environment variables from multiple candidate locations (robust on EC2)
loadEnv();
import cors from "cors";
import { setupRoutes } from "./routes.js";
import { log } from "./vite.js";
import path from "path";
import { fileURLToPath } from "url";
// Initialize Telegram bot module unconditionally; it will self-guard on env/token
import('./telegram-bot.js').then(() => {
    console.log('🤖 Telegram bot module loaded');
}).catch(err => {
    console.warn('⚠️ Failed to load Telegram bot module:', err?.message || err);
});
import { sqliteDb } from "./db.js";
// Initialize URL Processing Routes for manual URL processing
import { setupURLProcessingRoutes } from './url-processing-routes.js';
// Initialize Image Proxy Service for authentic product images
import { imageProxyService } from './image-proxy-service.js';
// Initialize Category Cleanup Service for automatic category management
import { CategoryCleanupService } from './category-cleanup-service.js';
// Banner routes for dynamic banner management
import bannerRoutes from './banner-routes.js';
// Import credential management routes
import credentialRoutes from './credential-routes.js';
import metaTagsRoutes from './meta-tags-routes.js';
import rssFeedsRoutes from './rss-feeds-routes.js';
import aggregationService from './rss-aggregation-service.js';
// Import advertiser routes for advertising system
import advertiserRoutes from './advertiser-routes.js';
import paymentRoutes from './payment-routes.js';
import pagesRoutes from './routes/pages-routes.js';
import widgetRoutes from './widget-routes.js';
import adRequestRoutes from './ad-request-routes.js';
import { setupSocialMediaRoutes } from './social-media-routes.js';
import botStatusRoutes from './bot-status-routes.js';
import botProcessingRoutes from './bot-processing-routes.js';
// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
// Comprehensive CORS configuration
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        // In production, check against allowed origins
        if (process.env.NODE_ENV === 'production') {
            const allowedOrigins = [
                'https://picktrustdeals.com',
                'https://www.picktrustdeals.com',
                'https://pickntrust.com',
                'https://www.pickntrust.com',
                'http://localhost:3000',
                'http://localhost:5000',
                'http://localhost:5173',
                'http://127.0.0.1:5000',
                'http://127.0.0.1:5173'
            ];
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            else {
                return callback(null, false);
            }
        }
        else {
            // In development, allow all origins
            return callback(null, true);
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Accept",
        "Origin",
        "Cache-Control",
        "X-File-Name",
        "X-HTTP-Method-Override",
        "If-Modified-Since",
        "X-Forwarded-For",
        "X-Real-IP",
        "x-admin-password",
        "X-Admin-Password"
    ],
    exposedHeaders: ["Content-Length", "X-Foo", "X-Bar"],
    credentials: true,
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 200
}));
// Additional CORS headers for maximum compatibility
app.use((req, res, next) => {
    const origin = req.headers.origin;
    // Set origin header based on request
    if (origin) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    else {
        res.header('Access-Control-Allow-Origin', '*');
    }
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH,HEAD');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, Accept, Origin, Cache-Control, X-File-Name, X-HTTP-Method-Override, If-Modified-Since, X-Forwarded-For, X-Real-IP, x-admin-password, X-Admin-Password');
    res.header('Access-Control-Expose-Headers', 'Content-Length, X-Foo, X-Bar');
    res.header('Access-Control-Max-Age', '86400');
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    next();
});
// Tolerant body parsing for admin-auth to avoid JSON SyntaxError
// Parse admin-auth body as text so route can safely JSON.parse or fall back
app.use('/api/admin/auth', express.text({ type: '*/*', limit: '1mb' }));
// Increase request size limits to handle image uploads (50MB limit)
app.use(express.json({
    limit: '50mb',
    verify: (req, _res, buf) => {
        try {
            req.__rawBody = buf ? buf.toString() : '';
        }
        catch {
            req.__rawBody = '';
        }
    }
}));
app.use(express.urlencoded({
    extended: false,
    limit: '50mb',
    verify: (req, _res, buf) => {
        try {
            req.__rawBody = buf ? buf.toString() : '';
        }
        catch {
            req.__rawBody = '';
        }
    }
}));
// Ensure admin-auth sees a string body if raw is available
app.use('/api/admin/auth', (req, _res, next) => {
    if (typeof req.body !== 'string' && typeof req.__rawBody === 'string' && req.__rawBody.length > 0) {
        req.body = req.__rawBody;
    }
    next();
});
// Tolerant body parsing for admin nav-tabs to avoid JSON SyntaxError
// Only parse JSON payloads as text so urlencoded requests remain handled by express.urlencoded
app.use('/api/admin/nav-tabs', express.text({ type: 'application/json', limit: '1mb' }));
app.use('/api/admin/nav-tabs', (req, _res, next) => {
    try {
        if (typeof req.body === 'string' && req.body.length > 0) {
            try {
                req.body = JSON.parse(req.body);
            }
            catch {
                // If parsing fails, fall back to rawBody if available
                const raw = req.__rawBody;
                if (typeof raw === 'string' && raw.length > 0) {
                    try {
                        req.body = JSON.parse(raw);
                    }
                    catch {
                        req.body = {};
                    }
                }
                else {
                    req.body = {};
                }
            }
        }
        else if (typeof req.body !== 'object') {
            // When body is not an object, attempt to parse rawBody
            const raw = req.__rawBody;
            if (typeof raw === 'string' && raw.length > 0) {
                try {
                    req.body = JSON.parse(raw);
                }
                catch {
                    req.body = {};
                }
            }
            else {
                req.body = {};
            }
        }
    }
    catch {
        // Ensure body is an object so route handlers don't crash
        req.body = {};
    }
    next();
});
app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse = undefined;
    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
        capturedJsonResponse = bodyJson;
        return originalResJson.apply(res, [bodyJson, ...args]);
    };
    res.on("finish", () => {
        const duration = Date.now() - start;
        if (path.startsWith("/api")) {
            // Extra diagnostics for admin auth password parsing on EC2
            if (path === "/api/admin/auth") {
                try {
                    const headerPwd = req.headers["x-admin-password"] || null;
                    const queryPwd = typeof req.query?.password === 'string' ? req.query.password : null;
                    const ct = req.headers["content-type"] || null;
                    console.log('[admin-auth][pre] details', { headerPwd, queryPwd, ct, method: req.method });
                }
                catch { }
            }
            let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
            if (capturedJsonResponse) {
                logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
            }
            if (logLine.length > 80) {
                logLine = logLine.slice(0, 79) + "…";
            }
            log(logLine);
        }
    });
    next();
});
(async () => {
    const { DatabaseStorage } = await import("./storage.js");
    const storage = new DatabaseStorage();
    await setupRoutes(app);
    // Setup URL processing routes for manual URL processing
    setupURLProcessingRoutes(app);
    console.log('🔗 URL processing routes initialized');
    app.use(bannerRoutes); // Re-enabled for dynamic banner management
    app.use(credentialRoutes);
    app.use(metaTagsRoutes);
    app.use(rssFeedsRoutes);
    app.use('/api/advertisers', advertiserRoutes); // Advertising system routes
    app.use('/api/payments', paymentRoutes); // Payment and checkout routes
    app.use('/api/pages', pagesRoutes); // Dynamic pages API routes
    app.use(widgetRoutes); // Widget management and retrieval routes
    app.use(adRequestRoutes); // Ad requests + Explore ads config routes
    app.use(botStatusRoutes); // Bot status monitoring endpoint
    app.use(botProcessingRoutes); // Admin toggle for global bot processing
    // Admin routes for social media posting and credential checks
    setupSocialMediaRoutes(app);
    console.log('📣 Social media admin routes initialized');
    console.log('🔐 Credential management routes initialized');
    console.log('🏷️ Meta tags management routes initialized');
    console.log('📡 RSS feeds management routes initialized');
    console.log('📢 Advertiser management routes initialized');
    console.log('💳 Payment routes initialized');
    console.log('📄 Pages routes initialized');
    console.log('🧩 Widget routes initialized');
    console.log('🤖 Bot status route initialized');
    console.log('⚙️ Bot processing admin routes initialized');
    // Setup image proxy routes for authentic product images
    imageProxyService.setupRoutes(app);
    console.log('🖼️ Image proxy service initialized for authentic product images');
    // Root route: Always fall through to SPA fallback for meta tag injection and client routing
    app.get('/', (_req, _res, next) => {
        return next();
    });
    // Health check endpoint
    app.get('/health', (_req, res) => {
        res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            services: {
                database: 'connected'
            }
        });
    });
    // API status endpoint
    app.get('/api/status', (_req, res) => {
        res.json({
            status: 'operational',
            version: '1.0.0',
            uptime: process.uptime(),
            memory: process.memoryUsage()
        });
    });
    // Bot status endpoint (explicit mounting to ensure full fields are returned)
    app.get('/api/bot/status', async (_req, res) => {
        try {
            const env = process.env.NODE_ENV || 'unknown';
            const token = process.env.MASTER_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || '';
            const hasToken = Boolean(token);
            let initialized = false;
            let webhook;
            if (hasToken) {
                try {
                    const apiUrl = `https://api.telegram.org/bot${token}/getWebhookInfo`;
                    const resp = await fetch(apiUrl);
                    if (resp.ok) {
                        const data = await resp.json();
                        const info = data?.result || {};
                        webhook = {
                            url: info?.url,
                            pending_update_count: info?.pending_update_count,
                        };
                        initialized = Boolean(info?.url);
                    }
                    else {
                        console.warn('⚠️ Telegram API getWebhookInfo failed:', resp.status, resp.statusText);
                    }
                }
                catch (err) {
                    console.warn('⚠️ Failed to query Telegram API for status:', err?.message || err);
                }
            }
            res.json({ initialized, hasToken, env, webhook });
        }
        catch (e) {
            console.warn('⚠️ /api/bot/status failed:', e?.message || e);
            res.json({ initialized: false });
        }
    });
    // Debug: list mounted routes for troubleshooting
    app.get('/api/debug/routes', (_req, res) => {
        const routes = [];
        const stack = app._router?.stack || [];
        for (const layer of stack) {
            if (layer.route && layer.route.path) {
                const methods = Object.keys(layer.route.methods || {});
                for (const m of methods) {
                    routes.push({ method: m.toUpperCase(), path: layer.route.path });
                }
            }
        }
        res.json({ count: routes.length, routes });
    });
    app.use((err, req, res, _next) => {
        const isJsonParseError = err instanceof SyntaxError && err.status === 400 && 'body' in err;
        const status = isJsonParseError ? 400 : (err.status || err.statusCode || 500);
        const message = isJsonParseError ? 'Invalid JSON payload' : (err.message || "Internal Server Error");
        // Log structured error details for debugging
        console.error('Request Error:', {
            url: req.url,
            method: req.method,
            status,
            message,
            headers: req.headers
        });
        res.status(status).json({ message });
    });
    // Environment configuration
    const isDevelopment = process.env.NODE_ENV !== 'production';
    // Enable background services (cleanup, RSS aggregation) only in production unless explicitly enabled
    const ENABLE_BACKGROUND_SERVICES = process.env.ENABLE_BACKGROUND_SERVICES === 'true' || process.env.NODE_ENV === 'production';
    const PORT = process.env.PORT || 5000;
    const FRONTEND_URL = process.env.FRONTEND_URL || (isDevelopment ? 'http://localhost:5173' : '');
    // Log environment information
    console.log(`🌍 Environment: ${isDevelopment ? 'Development' : 'Production'}`);
    console.log(`🚀 Server will start on port: ${PORT}`);
    if (isDevelopment) {
        console.log(`🎨 Frontend URL: ${FRONTEND_URL}`);
    }
    // Backend server startup
    const port = parseInt(process.env.PORT || '5000', 10);
    const server = app.listen(port, '0.0.0.0', async () => {
        console.log(`✅ Backend server running on http://localhost:${port}`);
        console.log(`📊 Health check: http://localhost:${port}/health`);
        console.log(`🔧 API status: http://localhost:${port}/api/status`);
        if (isDevelopment) {
            console.log(`\n🎯 Development Mode Active:`);
            console.log(`   • Backend API: http://localhost:${port}`);
            console.log(`   • Frontend: Integrated with backend (or run separately on port 5173)`);
            console.log(`   • Use 'npm run dev:separate' for separate frontend server`);
        }
        else {
            console.log(`\n🏭 Production Mode Active:`);
            console.log(`   • Serving static frontend files`);
            console.log(`   • All requests handled by this server`);
        }
        // Setup development or production mode after server is created
        if (isDevelopment) {
            // Setup Vite in development - this handles all static assets and SPA routing
            import("./vite.js").then(async ({ setupVite }) => {
                console.log('🔧 Setting up Vite development server...');
                try {
                    await setupVite(app, server);
                    console.log('✅ Vite development server configured');
                    console.log(`🌐 Frontend available at: http://localhost:${port}`);
                    console.log('🔧 For separate frontend dev server, run: cd client && npm run dev');
                }
                catch (error) {
                    console.error('❌ Failed to setup Vite:', error);
                    console.log('💡 Fallback: You can run frontend separately with: cd client && npm run dev');
                }
            }).catch(error => {
                console.error('❌ Failed to import Vite module:', error);
                console.log('💡 Fallback: You can run frontend separately with: cd client && npm run dev');
            });
        }
        else {
            // Production mode - serve static files and handle SPA routing
            const fs = await import('fs');
            // In production, compiled server lives at dist/server/server/index.js
            // Static client assets live at dist/public. Resolve accordingly.
            const publicPath = process.env.FRONTEND_STATIC_DIR
                ? path.resolve(process.env.FRONTEND_STATIC_DIR)
                : path.resolve(__dirname, "../../public");
            console.log(`📁 Frontend static dir resolved to: ${publicPath}`);
            if (fs.existsSync(publicPath)) {
                console.log(`📁 Setting up static file serving from: ${publicPath}`);
                // Set proper MIME types for JavaScript files
                // Important: Disable default index.html serving so SPA fallback can inject meta tags
                app.use(express.static(publicPath, {
                    index: false,
                    setHeaders: (res, filePath) => {
                        // Content-Type hints to avoid incorrect MIME on some proxies
                        if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) {
                            res.setHeader('Content-Type', 'application/javascript');
                            // Strong cache for hashed assets to prevent partial update mismatches
                            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
                        }
                        else if (filePath.endsWith('.css')) {
                            res.setHeader('Content-Type', 'text/css');
                            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
                        }
                        else if (/[.-](png|jpg|jpeg|gif|webp|svg|ico|woff2|woff|ttf)$/i.test(filePath)) {
                            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
                        }
                    }
                }));
                // SPA fallback - serve index.html for client-side routes
                app.get('*', (req, res, next) => {
                    // Skip API routes
                    if ((req.path && req.path.startsWith('/api/')) || (req.url && req.url.startsWith('/api/'))) {
                        return next();
                    }
                    // Skip static files (files with extensions)
                    if (path.extname(req.path)) {
                        return next();
                    }
                    const indexPath = path.join(publicPath, 'index.html');
                    if (fs.existsSync(indexPath)) {
                        try {
                            // Read static HTML and inject active meta tags into <head>
                            let html = fs.readFileSync(indexPath, 'utf-8');
                            const activeTags = sqliteDb.prepare(`SELECT name, content FROM meta_tags WHERE is_active = 1 ORDER BY provider ASC`).all();
                            const injection = activeTags
                                .map(t => `<meta name="${t.name}" content="${t.content}" data-injected="server" />`)
                                .join('\n');
                            // Insert right after the opening <head> tag to satisfy verification crawlers
                            if (html.includes('<head>')) {
                                html = html.replace('<head>', `<head>\n${injection}\n`);
                            }
                            else if (html.includes('<head ')) {
                                // Handle cases like <head lang="en">
                                html = html.replace(/<head[^>]*>/i, (match) => `${match}\n${injection}\n`);
                            }
                            // index.html must never be cached to ensure latest hashed assets are referenced
                            res.setHeader('Content-Type', 'text/html; charset=utf-8');
                            res.setHeader('Cache-Control', 'no-store, must-revalidate');
                            return res.send(html);
                        }
                        catch (err) {
                            console.error('Error injecting meta tags into index.html:', err);
                            res.setHeader('Cache-Control', 'no-store, must-revalidate');
                            return res.sendFile(indexPath);
                        }
                    }
                    else {
                        res.status(404).json({ error: 'Frontend not built. Run npm run build first.' });
                    }
                });
            }
            else {
                console.warn('⚠️ Public directory not found. Frontend may not be built.');
            }
        }
        if (ENABLE_BACKGROUND_SERVICES) {
            // Initialize Category Cleanup Service for automatic category management
            try {
                console.log('Cleanup Starting Category Cleanup Service...');
                CategoryCleanupService.initializeOnServerStart();
                console.log('Success Category cleanup service initialized');
            }
            catch (error) {
                console.error('Error Failed to initialize Category Cleanup Service:', error);
            }
            // Initialize RSS Aggregation Service for automatic RSS feed processing
            try {
                console.log('📡 Starting RSS Aggregation Service...');
                aggregationService.start();
                console.log('✅ RSS aggregation service initialized with automatic scheduling');
            }
            catch (error) {
                console.error('❌ Failed to initialize RSS Aggregation Service:', error);
            }
        }
        else {
            console.log('⏸️ Skipping background services in development (set ENABLE_BACKGROUND_SERVICES=true to enable).');
        }
    });
    // Graceful shutdown handling
    const gracefulShutdown = (signal) => {
        console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
        server.close((err) => {
            if (err) {
                console.error('❌ Error during server shutdown:', err);
                process.exit(1);
            }
            console.log('✅ Server closed successfully');
            console.log('👋 Goodbye!');
            process.exit(0);
        });
        // Force shutdown after 10 seconds
        setTimeout(() => {
            console.error('⚠️  Forced shutdown after timeout');
            process.exit(1);
        }, 10000);
    };
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    // Handle uncaught exceptions and rejections
    process.on('uncaughtException', (error) => {
        console.error('Uncaught Exception:', error);
        // Do not exit; keep server alive to avoid downtime
    });
    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        // Do not exit; keep server alive to avoid downtime
    });
})();

