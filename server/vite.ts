import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { type Server } from "http";
import { nanoid } from "nanoid";
import { fileURLToPath, pathToFileURL } from "url";
import { createRequire } from "module";

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
    // Resolve Vite and its plugins from the client workspace to avoid requiring
    // dev deps at the repo root. This fixes 'Cannot find module "vite"' when
    // vite is only installed in client/node_modules.
    const clientPkgJsonPath = path.resolve(__dirname, '..', 'client', 'package.json');
    const clientDir = path.dirname(clientPkgJsonPath);
    const repoRoot = path.resolve(__dirname, '..');
    const requireFromClient = createRequire(clientPkgJsonPath);

    // Resolve the actual Vite package entry, avoiding accidental resolution of the repo's root vite.js stub.
    const resolveViteEntry = (): string => {
      const candidates = [
        path.join(clientDir, 'node_modules', 'vite', 'dist', 'node', 'index.js'),
        path.join(repoRoot, 'node_modules', 'vite', 'dist', 'node', 'index.js'),
      ];
      for (const p of candidates) {
        if (fs.existsSync(p)) return p;
      }
      // Fallback to module resolver; guard against picking the repo's vite.js
      try {
        const r1 = requireFromClient.resolve('vite/dist/node/index.js');
        if (r1 && !/[/\\]PickNTrust[/\\]vite\.js$/i.test(r1)) return r1;
      } catch {}
      try {
        const r2 = requireFromClient.resolve('vite');
        if (r2 && !/[/\\]PickNTrust[/\\]vite\.js$/i.test(r2)) return r2;
      } catch {}
      throw new Error('Unable to resolve Vite package entry');
    };

    const viteResolvedFsPath = resolveViteEntry();
    const vitePath = pathToFileURL(viteResolvedFsPath).href;
    console.log('[vite setup] resolved vite path:', vitePath);
    const viteMod: any = await import(vitePath);
    console.log('[vite setup] vite module keys:', Object.keys(viteMod || {}));
    const createViteServer = (
      (viteMod && (viteMod as any).createServer)
      || ((viteMod && (viteMod as any).default && (viteMod as any).default.createServer))
    );
    if (typeof createViteServer !== 'function') {
      throw new TypeError('Vite createServer API not available');
    }

    // Inline minimal dev config to avoid importing external vite.config
    const vite = await createViteServer({
      configFile: false,
      root: path.resolve(__dirname, "..", "client"),
      plugins: [
        (
          (await import(
            pathToFileURL(requireFromClient.resolve('@vitejs/plugin-react')).href
          )) as any
        ).default?.() ?? (
          (await import(
            pathToFileURL(requireFromClient.resolve('@vitejs/plugin-react')).href
          )) as any
        )(),
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '..', 'client', 'src'),
          '@shared': path.resolve(__dirname, '..', 'shared'),
          '@assets': path.resolve(__dirname, '..', 'attached_assets'),
        },
        dedupe: ['react', 'react-dom']
      },
      server: {
        middlewareMode: true,
        hmr: { port: 24678, host: 'localhost' },
        proxy: {
          '/api': {
            target: 'http://127.0.0.1:' + (process.env.PORT || 5000),
            changeOrigin: true,
            secure: false,
            ws: true,
          },
          '/uploads': {
            target: 'http://127.0.0.1:' + (process.env.PORT || 5000),
            changeOrigin: true,
            secure: false,
          },
        },
      },
      appType: 'custom',
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
  // When running in production, compiled server is in dist/server/server
  // and static files are in dist/public. Resolve robustly.
  const distPathCandidates = [
    // Correct relative from compiled dist/server/server -> dist/public
    path.resolve(__dirname, "..", "..", "public"),
    // Fallback if running from dist/server (single level)
    path.resolve(__dirname, "..", "public"),
    // Fallback relative to CWD
    path.resolve(process.cwd(), "dist", "public"),
  ];

  const distPath = distPathCandidates.find(p => {
    try {
      return fs.existsSync(p) && fs.existsSync(path.join(p, 'index.html'));
    } catch { return false; }
  }) || distPathCandidates[0];

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

  // Fall through to index.html for missing routes on GET only
  app.get("*", (req, res, next) => {
    // Do NOT serve SPA for API or health endpoints
    const url = req.originalUrl || req.url || "";
    if (url.startsWith('/api/') || url === '/api' || url === '/health') {
      return next();
    }

    // Skip static files (files with extensions)
    if (path.extname(req.path)) {
      return next();
    }

    res.setHeader('Cache-Control', 'no-store, must-revalidate');
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
