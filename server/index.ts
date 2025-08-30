import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { setupRoutes } from "./routes";
import { serveStatic, log } from "./vite";
import path from "path";
import { fileURLToPath } from "url";

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
  
  // Initialize affiliate automation system
  const { initializeAffiliateAutomation, setupAffiliateRoutes } = await import('./routes');
  
  // Set up affiliate routes
  setupAffiliateRoutes(app);
  
  // Initialize affiliate automation service
  console.log('🚀 Initializing affiliate automation system...');
  const affiliateInitialized = await initializeAffiliateAutomation();
  
  if (affiliateInitialized) {
    console.log('✅ Affiliate automation system ready');
  } else {
    console.log('⚠️ Affiliate automation system disabled (check configuration)');
  }
  
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
  
  app.use((err: Error & { status?: number; statusCode?: number }, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Backend server on port 5000
  const port = parseInt(process.env.PORT || '5000', 10);
  const server = app.listen(port, '0.0.0.0', () => {
    log(`Backend server running on port ${port}`);
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
    
    console.log(`Looking for frontend files at: ${publicPath}`);
    console.log(`Server __dirname: ${__dirname}`);
    console.log(`Resolved public path: ${publicPath}`);
    
    if (fs.existsSync(publicPath) && fs.existsSync(path.join(publicPath, 'index.html'))) {
      console.log(`✅ Found frontend files at: ${publicPath}`);
      
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
      console.error(`❌ Frontend build files not found at: ${publicPath}`);
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
  }
})();
