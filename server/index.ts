import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { setupRoutes } from "./routes.js";
import { serveStatic, log } from "./vite.js";
import path from "path";
import { fileURLToPath } from "url";
import './telegram-bot.js'; // Initialize Telegram bot

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



// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Comprehensive CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In production, check against allowed origins
    if (process.env.NODE_ENV === 'production') {
      const allowedOrigins = [
        'https://picktrustdeals.com',
        'https://www.picktrustdeals.com',
        'http://localhost:3000',
        'http://localhost:5000',
        'http://localhost:5173',
        'http://127.0.0.1:5000',
        'http://127.0.0.1:5173'
      ];
      
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(null, false);
      }
    } else {
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
    "X-Real-IP"
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
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH,HEAD');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, Accept, Origin, Cache-Control, X-File-Name, X-HTTP-Method-Override, If-Modified-Since, X-Forwarded-For, X-Real-IP');
  res.header('Access-Control-Expose-Headers', 'Content-Length, X-Foo, X-Bar');
  res.header('Access-Control-Max-Age', '86400');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

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
  console.log('🔐 Credential management routes initialized');
  console.log('🏷️ Meta tags management routes initialized');
  console.log('📡 RSS feeds management routes initialized');
  
  // Setup image proxy routes for authentic product images
  imageProxyService.setupRoutes(app);
  console.log('🖼️ Image proxy service initialized for authentic product images');
  
  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
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
  app.get('/api/status', (_req: Request, res: Response) => {
    res.json({ 
      status: 'operational',
      version: '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Environment configuration
  const isDevelopment = process.env.NODE_ENV !== 'production';
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
    } else {
      console.log(`\n🏭 Production Mode Active:`);
      console.log(`   • Serving static frontend files`);
      console.log(`   • All requests handled by this server`);
    }

    // Setup development or production mode after server is created
    if (process.env.NODE_ENV === "development") {
      // Setup Vite in development - this handles all static assets and SPA routing
      import("./vite.js").then(async ({ setupVite }) => {
        console.log('🔧 Setting up Vite development server...');
        try {
          await setupVite(app, server);
          console.log('✅ Vite development server configured');
          console.log('🌐 Frontend available at: http://localhost:5000');
          console.log('🔧 For separate frontend dev server, run: cd client && npm run dev');
        } catch (error) {
          console.error('❌ Failed to setup Vite:', error);
          console.log('💡 Fallback: You can run frontend separately with: cd client && npm run dev');
        }
      }).catch(error => {
        console.error('❌ Failed to import Vite module:', error);
        console.log('💡 Fallback: You can run frontend separately with: cd client && npm run dev');
      });
    } else {
      // Production mode - serve static files and handle SPA routing
      const fs = await import('fs');
      const publicPath = path.resolve(__dirname, '../../../dist/public');
      
      if (fs.existsSync(publicPath)) {
        console.log(`📁 Setting up static file serving from: ${publicPath}`);
        
        // Set proper MIME types for JavaScript files
        app.use(express.static(publicPath, {
          maxAge: '1d',
          setHeaders: (res, path) => {
            if (path.endsWith('.js') || path.endsWith('.mjs')) {
              res.setHeader('Content-Type', 'application/javascript');
            } else if (path.endsWith('.css')) {
              res.setHeader('Content-Type', 'text/css');
            }
          }
        }));
        
        // SPA fallback - serve index.html for client-side routes
        app.get('*', (req, res, next) => {
          // Skip API routes
          if (req.path.startsWith('/api/')) {
            return next();
          }
          
          // Skip static files (files with extensions)
          if (path.extname(req.path)) {
            return next();
          }
          
          const indexPath = path.join(publicPath, 'index.html');
          if (fs.existsSync(indexPath)) {
            res.sendFile(indexPath);
          } else {
            res.status(404).json({ error: 'Frontend not built. Run npm run build first.' });
          }
        });
      } else {
        console.warn('⚠️ Public directory not found. Frontend may not be built.');
      }
    }

    // Initialize Category Cleanup Service for automatic category management
    try {
      console.log('Cleanup Starting Category Cleanup Service...');
      CategoryCleanupService.initializeOnServerStart();
      console.log('Success Category cleanup service initialized with 1-minute intervals for immediate updates');
    } catch (error) {
      console.error('Error Failed to initialize Category Cleanup Service:', error);
    }

    // Initialize RSS Aggregation Service for automatic RSS feed processing
    try {
      console.log('📡 Starting RSS Aggregation Service...');
      aggregationService.start();
      console.log('✅ RSS aggregation service initialized with automatic scheduling');
    } catch (error) {
      console.error('❌ Failed to initialize RSS Aggregation Service:', error);
    }
  });

  // Graceful shutdown handling
  const gracefulShutdown = (signal: string) => {
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
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });
})();
