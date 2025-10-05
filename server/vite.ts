import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { type Server } from "http";
import { nanoid } from "nanoid";
import { fileURLToPath } from "url";

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lazily load Vite only in development to avoid dev-dependency requirements in production
let viteLogger: any;

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  try {
    const { createServer: createViteServer, createLogger } = await import('vite');
    const configModule: any = await import('../vite.config.js');
    const viteConfig = configModule.default ?? configModule;
    viteLogger = createLogger();

    const vite = await createViteServer({
      ...viteConfig,
      configFile: false,
      customLogger: {
        ...viteLogger,
        error: (msg, options) => {
          viteLogger.error(msg, options);
          // Don't exit process on Vite errors in development
          console.error('Vite error (non-fatal):', msg);
        },
      },
      server: {
        middlewareMode: true,
        hmr: {
          port: 24678,
          host: 'localhost'
        }
      },
      appType: "custom",
    });

    app.use(vite.middlewares);
    
    // Handle all non-API routes for SPA
    app.use("*", async (req, res, next) => {
      // Skip API routes
      if (req.originalUrl.startsWith('/api/')) {
        return next();
      }
      
      const url = req.originalUrl;

      try {
         const clientTemplate = path.resolve(
           __dirname,
           "..",
           "client",
           "index.html",
         );

         // always reload the index.html file from disk incase it changes
         let template = await fs.promises.readFile(clientTemplate, "utf-8");
         template = template.replace(
           'src="/src/main.tsx"',
           'src="/src/main.tsx?v=' + nanoid() + '"'
         );
         const page = await vite.transformIndexHtml(url, template);
         res.status(200).set({ "Content-Type": "text/html" }).end(page);
       } catch (e) {
         vite.ssrFixStacktrace(e as Error);
         next(e);
       }
     });
     
     console.log('✅ Vite middleware setup completed successfully');
     
   } catch (error) {
     console.error('❌ Failed to setup Vite development server:', error);
     throw error;
   }
 }

export function serveStatic(app: Express) {
  // When running in production, the server is in dist/server
  // and the static files are in dist/public
  const distPath = path.resolve(__dirname, "..", "dist", "public");

  if (!fs.existsSync(distPath)) {
    throw new Error("Could not find the build directory: " + distPath + ", make sure to build the client first");
  }

  // Serve static with sensible caching
  app.use(express.static(distPath, {
    index: false,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) {
        res.setHeader('Content-Type', 'application/javascript');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (/[.-](png|jpg|jpeg|gif|webp|svg|ico|woff2|woff|ttf)$/i.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }
  }));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.setHeader('Cache-Control', 'no-store, must-revalidate');
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
