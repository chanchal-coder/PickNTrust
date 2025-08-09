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
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
  
  // Setup automatic cleanup for expired products and blog posts every 5 minutes
  setInterval(async () => {
    try {
      const removedProductsCount = await storage.cleanupExpiredProducts();
      const removedBlogPostsCount = await storage.cleanupExpiredBlogPosts();
      
       if (removedProductsCount > 0) {
         log(`Cleaned up ${removedProductsCount} expired products`);
       }
       if (removedBlogPostsCount > 0) {
         log(`Cleaned up ${removedBlogPostsCount} expired blog posts`);
       }
    } catch (error) {
      console.error('Error during automatic cleanup:', error);
    }
  }, 5 * 60 * 1000); // 5 minutes
  
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
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
  if (app.get("env") === "development") {
    // Setup Vite in development
    const { setupVite } = await import("./vite");
    setupVite(app, server);
  } else {
    // Serve static files in production
    const fs = require('fs');
    const expressStatic = require('express').static;
    
    // Try multiple possible paths for the built frontend
    const possiblePaths = [
      path.resolve(__dirname, '../public'),
      path.resolve(__dirname, '../../public'),
      path.resolve(__dirname, '../dist/public'),
      path.resolve(__dirname, '../../dist/public')
    ];
    
    let publicPath = null;
    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath) && fs.existsSync(path.join(testPath, 'index.html'))) {
        publicPath = testPath;
        console.log(`Found frontend files at: ${publicPath}`);
        break;
      }
    }
    
    if (publicPath) {
      app.use(expressStatic(publicPath));
      app.use('*', (_req, res) => {
        res.sendFile(path.resolve(publicPath, 'index.html'));
      });
    } else {
      console.error('Frontend build files not found. Serving basic response.');
      app.use('*', (_req, res) => {
        res.send(`
          <html>
            <head><title>PickNTrust</title></head>
            <body>
              <h1>PickNTrust Backend Running</h1>
              <p>Frontend build files not found. Please run the build process.</p>
              <p>Available paths checked:</p>
              <ul>
                ${possiblePaths.map(p => `<li>${p} - ${fs.existsSync(p) ? 'exists' : 'not found'}</li>`).join('')}
              </ul>
            </body>
          </html>
        `);
      });
    }
  }
})();
