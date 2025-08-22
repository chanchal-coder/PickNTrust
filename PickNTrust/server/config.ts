export const config = {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [
          process.env.FRONTEND_URL || 'https://picktrustdeals.com',
          'http://localhost:3000',
          'http://localhost:5000',
          'http://localhost:5173'
        ]
      : [
          'http://localhost:3000',
          'http://localhost:5000',
          'http://127.0.0.1:5173'
        ]
      : [
          'http://localhost:3000',
          'http://localhost:5000',
          'http://127.0.0.1:5173'
        ]
      : [
          'http://localhost:3000',
          'http://localhost:5000',
          'http://127.0.0.1:5173'
        ]
      : [
          'http://localhost:3000',
          'http://localhost:5000',
          'http://127.0.0.1:5173'
        ]
      : [
          'http://localhost:3000',
          'http://localhost:5000',
          'http://127.0.0.1:5173'
        ]
      : [
          'http://localhost:3000',
          'http://localhost:5000',
          'http://127.0.0.1:5173'
        ]
      : [
          'http://localhost:3000',
          'http://localhost:5000',
          'http://127.0.0.1:5173'
        ]
      : [
          'http://localhost:3000',
          'http://localhost:5000',
          'http://127.0.0.1:5173'
        ]
      : [
          'http://localhost:3000',
          'http://localhost:5000',
          'http://127.0.0.1:5173'
        ]
      : [
          'http://localhost:3000',
          'http://localhost:5000',
          'http://127.0.0.1:5173'
        ]
      : [
          'http://localhost:3000',
          'http://localhost:5000',
          'http://127.0.0.1:5173'
        ]
      : [
          'http://localhost:3000',
          'http://localhost:5000',
          'http://127.0.0.1:5173'
        ]
      : [
          'http://localhost:3000',
          'http://localhost:5000',
          'http://127.0.0.1:5173'
        ]
      : [
          'http://localhost:3000',
          'http://localhost:5000',
          'http://127.0.0.1:5173'
        ]
      : [
          'http://localhost:3000',
          'http://localhost:5000',
          'http://127.0.0.1:5173'
        ]
      : [
          'http://localhost:3000',
          'http://localhost:5000',
          'http://127.0.0.1:5173'
        ]
      : [
          'http://localhost:3000',
          'http://localhost:5000',
          'http://127.0.0.1:5173'
        ]
      : [
          'http://localhost:3000',
          'http://localhost:5000',
          'http://127.0.0.1:5173'
        ]
      : [
          'http://localhost:3000',
          'http://localhost:5000',
          'http://127.0.0.1:5173'
        ]
      : [
          'http://localhost:3000',
          'http://localhost:5000',
          'http://127.0.0.1:5173'
        ]
      : [
          'http://localhost:3000',
          'http://localhost:5000',
          'http://127.0.0.1:5173'
        ]
      : [
          'http://localhost:3000',
          'http://localhost:5000',
          'http://127.0.0.1:5173'
        ]
      : [
          'http://localhost:3000',
          'http://localhost:5000',
          'http://127.0.0.1:5173'
        ]
      : [
          'http://localhost:3000',
          'http://localhost:5000',
          'http://127.0.0.1:5173'
        ]
      : [
          'http://localhost:3000',
          'http://localhost:5000',
          'http://127.0.0.1:5173'
        ]
      : [
          'http://localhost:3000',
          'http://localhost:5000',
          'http://127.0.0.1:5173'
        ]
      : [
          'http://localhost:3000',
          'http://localhost:5000',
          'http://127.0.0.1:5173'
        ]
      : [
          'http://localhost:3000',
          'http://localhost:5000',
          'http://127.0.0.1:5173'
        ]
      : [
          'http://localhost:3000',
          'http://localhost:5000',
          'http://127.0.0.1:5173'
        ]
      : [
          'http://localhost:3000',
          'http://localhost:5000',
          'http://127.0.0.1:5173'
        ]
      : [
          'http://localhost:3000',
          'http://localhost:5000',
          'http://127.0.0.1:5173'
        ]
      : [
          'http://localhost:3000',
          'http://localhost:5000',
          'http://127.0.0.1:5173'
        ]
      : [
          'http://localhost:3000',
          'http://localhost:5000',
          'http://127.0.0.1:5173'
        ]
      : [
          'http://localhost:3000',
          'http://localhost:5000',
          'http://127.0.0.1:5173'
        ]
      : [
          'http://localhost:3000',
          'http://localhost:5000',
          'http://127.0.0.1:5173'
        ]
      : [
          'http://localhost:3000',
          'http://localhost:5000',
          'http://127.0.0.1:5173'
        ]
      : [
          'http://localhost:3000',
          'http://localhost:5000',
          'http://127.0.0.1:5173'
        ]
      : [
          'http://localhost:3000',
          'http://localhost:5000',
          'http://127.0.0.1:5173'
        ]
      : [
<edit_file>
<path>server/index.ts</path>
<content>
<<<<<<< SEARCH
import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { setupRoutes } from "./routes";
import { serveStatic, log } from "./vite";

const app = express();
app.use(cors({
  origin: "http://localhost:3000",
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

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  const server = app.listen(port, '0.0.0.0', () => {
    log(`serving on port ${port}`);
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
    serveStatic(app);
  }
})();
=======
import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { setupRoutes } from "./routes";
import { serveStatic, log } from "./vite";
import { config } from "./config";

const app = express();

app.use(cors(config.cors));
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

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = config.server.port;
  const server = app.listen(port, config.server.host, () => {
    log(`serving on port ${port}`);
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
    serveStatic(app);
  }
})();
