import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { setupRoutes } from "./routes";
import { serveStatic, log } from "./vite";
import path from "path";
import { fileURLToPath } from "url";

// Initialize Image Proxy Service for authentic product images
import { imageProxyService } from './image-proxy-service';

// Initialize Category Cleanup Service for automatic category management
import { CategoryCleanupService } from './category-cleanup-service';

// Import admin routes for bot management
import botAdminRoutes from './bot-admin-routes';

// Banner routes for dynamic banner management
import bannerRoutes from './banner-routes';

// Import credential management routes
import credentialRoutes from './credential-routes';

// Import webhook routes for Telegram bots
import { setupWebhookRoutes, webhookManager } from './webhook-routes';

// Individual bot imports for direct initialization
import { primePicksBot } from './prime-picks-bot';
import { cuePicksBot } from './cue-picks-bot';
import { valuePicksBot } from './value-picks-bot';
import { clickPicksBot } from './click-picks-bot';
import { lootBoxBot } from './loot-box-bot';
import { travelPicksBot } from './travel-picks-bot';

// Import remaining bots
import './dealshub-bot';
import './global-picks-bot';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow localhost on any port for development
    if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      return callback(null, true);
    }

    // Allow your domain and www subdomain
    if (origin && (origin.includes('pickntrust.com') || origin.includes('www.pickntrust.com'))) {
      return callback(null, true);
    }

    // Allow EC2 IP address
    if (origin && origin.includes('51.21.253.229')) {
      return callback(null, true);
    }

    // Reject other origins
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
// Increase request size limits to handle image uploads (50MB limit)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
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
  const { DatabaseStorage } = await import("./storage");
  const storage = new DatabaseStorage();
  
  setupRoutes(app, storage);
  
  // Setup bot admin routes for 8-bot management
  app.use(botAdminRoutes);
  app.use(bannerRoutes); // Re-enabled for dynamic banner management
  app.use(credentialRoutes);
  console.log('🎛️ Bot admin panel routes initialized');
  console.log('🔐 Credential management routes initialized');
  
  // Setup webhook routes for Telegram bots
  setupWebhookRoutes(app);
  console.log('📡 Webhook routes initialized for all bots');
  
  // Setup image proxy routes for authentic product images
  imageProxyService.setupRoutes(app);
  console.log('🖼️ Image proxy service initialized for authentic product images');
  
  // Cleanup disabled to prevent database errors
  // setInterval(async () => {
  //   try {
  //     const removedProductsCount = await storage.cleanupExpiredProducts();
  //     const removedBlogPostsCount = await storage.cleanupExpiredBlogPosts();
  //     
  //      if (removedProductsCount > 0) {
  //        log(`Cleaned up ${removedProductsCount} expired products`);
  //      }
  //      if (removedBlogPostsCount > 0) {
  //        log(`Cleaned up ${removedBlogPostsCount} expired blog posts`);
  //      }
  //   } catch (error) {
  //     console.error('Error during automatic cleanup:', error);
  //   }
  // }, 5 * 60 * 1000); // 5 minutes
  
  // Serve static files first
  const fs = await import('fs');
  const publicPath = path.resolve(__dirname, '../public');
  if (fs.existsSync(publicPath)) {
    console.log(`📁 Setting up static file serving from: ${publicPath}`);
    app.use(express.static(publicPath, {
      maxAge: '1d',
      etag: false,
      lastModified: false
    }));
  }
  
  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  // SPA fallback middleware - serve React app for all non-API routes (must be last)
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`🔍 SPA middleware triggered for: ${req.path} (method: ${req.method})`);
    
    // Skip API routes and webhooks
    if (req.path.startsWith('/api/') || req.path.startsWith('/webhook/') || req.method !== 'GET') {
      console.log(`⏭️ Skipping SPA for API/webhook: ${req.path}`);
      return next();
    }
    
    // Skip static file requests (files with extensions)
    if (req.path.includes('.') && !req.path.endsWith('/')) {
      console.log(`⏭️ Skipping SPA for static file: ${req.path}`);
      return next();
    }
    
    // Serve React app for client-side routes
    const indexPath = path.join(publicPath, 'index.html');
    
    if (fs.existsSync(indexPath)) {
      console.log(`🎯 SPA fallback: serving React app for ${req.path}`);
      res.sendFile(indexPath);
    } else {
      console.log(`❌ SPA fallback: index.html not found at ${indexPath}`);
      res.status(404).send('Frontend files not found');
    }
  });
  
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Backend server on port 5000
  const port = parseInt(process.env.PORT || '5000', 10);
  const server = app.listen(port, '0.0.0.0', async () => {
    log(`Backend server running on port ${port}`);
    
    
// Bot health check endpoint
app.get('/api/bots/health', async (req, res) => {
  const botStatus = {
    'prime-picks': primePicksBot.getStatus(),
    'cue-picks': cuePicksBot.getStatus(), 
    'value-picks': valuePicksBot.getStatus(),
    'click-picks': clickPicksBot.getStatus(),
    'loot-box': lootBoxBot.getStatus()
  };
  
  const healthySummary = {
    totalBots: Object.keys(botStatus).length,
    healthyBots: Object.values(botStatus).filter(status => status.initialized).length,
    bots: botStatus,
    timestamp: new Date().toISOString()
  };
  
  res.json(healthySummary);
});

  // Initialize individual Telegram bots directly
    // CRITICAL: Verify each bot has loaded its unique token
    console.log('🔍 VERIFYING BOT TOKEN ISOLATION...');
    
    const tokenCheck = {
      'Prime Picks': process.env.TELEGRAM_BOT_TOKEN || 'NOT_LOADED',
      'Cue Picks': 'WILL_LOAD_INDIVIDUALLY', 
      'Value Picks': 'WILL_LOAD_INDIVIDUALLY',
      'Click Picks': 'WILL_LOAD_INDIVIDUALLY',
      'Loot Box': 'WILL_LOAD_INDIVIDUALLY'
    };
    
    console.log('📋 Token Status:');
    Object.entries(tokenCheck).forEach(([bot, token]) => {
      const tokenDisplay = typeof token === 'string' && token.length > 10 
        ? token.substring(0, 10) + '...' 
        : token;
      console.log(`   ${bot}: ${tokenDisplay}`);
    });
    
    // Each bot will load its own token when initialized
    console.log('✅ Token isolation system active - each bot loads its own .env file');


    console.log('🤖 Starting individual Telegram bots...');
    
    const bots = [
      { name: 'Prime Picks', bot: primePicksBot },
      { name: 'Cue Picks', bot: cuePicksBot },
      { name: 'Value Picks', bot: valuePicksBot },
      { name: 'Click Picks', bot: clickPicksBot },
      { name: 'Loot Box', bot: lootBoxBot }
    ];
    
    
    // Validate bot tokens to prevent conflicts
    console.log('🔍 Validating bot tokens for conflicts...');
    const usedTokens = new Set();
    const tokenConflicts = [];
    
    bots.forEach(({ name, bot }) => {
      try {
        const status = bot.getStatus();
        // Extract token from bot status or environment
        const botToken = process.env.TELEGRAM_BOT_TOKEN; // This will be different for each bot
        
        if (usedTokens.has(botToken)) {
          tokenConflicts.push(name);
        } else {
          usedTokens.add(botToken);
        }
      } catch (error) {
        console.log(`⚠️  Could not validate token for ${name}`);
      }
    });
    
    if (tokenConflicts.length > 0) {
      console.log(`🚨 Token conflicts detected: ${tokenConflicts.join(', ')}`);
      console.log('🔧 Each bot must use a unique Telegram bot token!');
    } else {
      console.log('✅ All bot tokens are unique - no conflicts detected');
    }

    // Sequential bot initialization to prevent 409 conflicts
    for (let i = 0; i < bots.length; i++) {
      const { name, bot } = bots[i];
      try {
        console.log(`🚀 Initializing ${name} bot (${i + 1}/${bots.length})...`);
        
        // Wait between bot initializations to prevent conflicts
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        await bot.initialize();
        console.log(`✅ ${name} bot initialized successfully`);
        
        // Verify bot is working
        const status = bot.getStatus();
        if (status.initialized) {
          console.log(`🔍 ${name} bot status: Ready`);
        }
        
      } catch (error) {
        console.error(`❌ Failed to initialize ${name} bot:`, error.message);
        // Continue with other bots even if one fails
      }
    }

    // Initialize Travel Picks Hybrid Bot for automated travel deal discovery
    try {
      console.log('Flight Starting Travel Picks Hybrid Bot...');
      await travelPicksBot.start();
      console.log('Success Travel Picks Hybrid Bot initialized successfully');
      console.log('Target Telegram monitoring, website scraping, and AI detection are now ACTIVE!');
    } catch (error) {
      console.error('Error Failed to initialize Travel Picks Bot:', error);
    }

    // Initialize Category Cleanup Service for automatic category management
    try {
      console.log('Cleanup Starting Category Cleanup Service...');
      CategoryCleanupService.initializeOnServerStart();
      console.log('Success Category cleanup service initialized with 1-minute intervals for immediate updates');
    } catch (error) {
      console.error('Error Failed to initialize Category Cleanup Service:', error);
    }

    // Setup webhooks for all registered bots
    try {
      console.log('📡 Setting up webhooks for all bots...');
      const baseUrl = process.env.WEBHOOK_BASE_URL || `http://localhost:${port}`;
      await webhookManager.setupWebhooks(baseUrl);
      console.log('✅ All bot webhooks configured successfully');
      console.log(`🔗 Webhook base URL: ${baseUrl}`);
    } catch (error) {
      console.error('❌ Failed to setup webhooks:', error);
      console.log('⚠️ Bots will continue without webhooks (may cause 409 conflicts)');
    }

    // Legacy bot initialization (keeping for compatibility) - temporarily disabled
    /*try {
      console.log('Target Initializing CueLinks Telegram bot...');
      await cueLinksBot.initialize();
      console.log('Success CueLinks bot initialized successfully');
    } catch (error) {
      console.error('Error Failed to initialize CueLinks bot:', error);
    }*/
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "development") {
    // Setup Vite in development
    const { setupVite } = await import("./vite");
    setupVite(app, server);
  } else {
    // Serve static files in production
    const fs = await import('fs');
    
    // In production, server is in dist/server and static files are in dist/public
    const publicPath = path.resolve(__dirname, '../public');
    
    console.log(`🔍 Looking for frontend files at: ${publicPath}`);
    console.log(`📁 Server __dirname: ${__dirname}`);
    console.log(`📂 Resolved public path: ${publicPath}`);
    
    // Check paths explicitly
    const publicExists = fs.existsSync(publicPath);
    const indexExists = fs.existsSync(path.join(publicPath, 'index.html'));
    console.log(`📋 Public path exists: ${publicExists}`);
    console.log(`📄 Index.html exists: ${indexExists}`);
    
    if (publicExists && indexExists) {
      console.log(`Success Found frontend files at: ${publicPath}`);
      
      // Serve static files with proper headers
      app.use(express.static(publicPath, {
        maxAge: '1d',
        etag: false,
        lastModified: false
      }));
      
      // Health check endpoint
      app.get('/health', (_req: Request, res: Response) => {
        res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
      });
      
      // SPA fallback - serve index.html for all non-API routes
      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.resolve(publicPath, 'index.html'));
      });
    } else {
      console.error(`Error Frontend build files not found at: ${publicPath}`);
      console.error('Please run: npm run build');
      
      // List what's actually in the directory
      try {
        const parentDir = path.dirname(publicPath);
        console.log(`Contents of ${parentDir}:`);
        const contents = fs.readdirSync(parentDir);
        contents.forEach(item => {
          const itemPath = path.join(parentDir, item);
          const isDir = fs.statSync(itemPath).isDirectory();
          console.log(`  ${isDir ? '[DIR]' : '[FILE]'} ${item}`);
        });
      } catch (e) {
        console.error('Could not list directory contents:', e);
      }
      
      app.use('*', (_req: Request, res: Response) => {
        res.status(500).send(`
          <html>
            <head><title>PickNTrust - Build Error</title></head>
            <body>
              <h1>PickNTrust Backend Running</h1>
              <p><strong>Error:</strong> Frontend build files not found.</p>
              <p><strong>Expected path:</strong> ${publicPath}</p>
              <p><strong>Solution:</strong> Run <code>npm run build</code> to build the frontend.</p>
              <p><strong>Server directory:</strong> ${__dirname}</p>
            </body>
          </html>
        `);
      });
    }
    
    // Graceful shutdown handling
    const gracefulShutdown = async (signal: string) => {
      console.log(`\nStop Received ${signal}, shutting down gracefully...`);
      
      try {
        // Shutdown individual Telegram bots
        console.log('🔄 Shutting down Telegram bots...');
        
        const bots = [
          { name: 'Prime Picks', bot: primePicksBot },
          { name: 'Cue Picks', bot: cuePicksBot },
          { name: 'Value Picks', bot: valuePicksBot },
          { name: 'Click Picks', bot: clickPicksBot },
          { name: 'Loot Box', bot: lootBoxBot }
        ];
        
        for (const { name, bot } of bots) {
          try {
            await bot.shutdown();
            console.log(`✅ ${name} bot shutdown complete`);
          } catch (error) {
            console.error(`❌ Error shutting down ${name} bot:`, error);
          }
        }
        
        console.log('Success All Telegram bots shutdown complete');
        
        // Close server
        server.close(() => {
          console.log('Success HTTP server closed');
          process.exit(0);
        });
        
        // Force exit after 10 seconds
        setTimeout(() => {
          console.log('Warning Forcing exit after timeout');
          process.exit(1);
        }, 10000);
        
      } catch (error) {
        console.error('Error Error during shutdown:', error);
        process.exit(1);
      }
    };
    
    // Register shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // nodemon restart
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Error Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Error Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });
  }
})();
