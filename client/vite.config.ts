// @ts-nocheck
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  appType: 'spa',
  root: path.resolve(__dirname, '.'),
  plugins: [react()],
  optimizeDeps: {
    include: [
      'react-hook-form',
      '@hookform/resolvers/zod',
      'zod'
    ]
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "../shared"),
    },
    // Ensure a single React instance across all imports
    // Include jsx runtime modules which can otherwise get bundled separately
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
    ],
  },
  build: {
    outDir: path.resolve(__dirname, "../dist/public"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
      output: {
        manualChunks: {
          // Make sure React and its runtimes are isolated into a single vendor chunk
          vendor: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
          query: ['@tanstack/react-query'],
          radix: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          utils: ['date-fns', 'clsx', 'class-variance-authority'],
          icons: ['lucide-react'],
          // Split page components into separate chunks
          'pages-main': [
            './src/pages/home.tsx',
            './src/pages/category.tsx',
            './src/pages/search.tsx'
          ],
          'pages-picks': [
            './src/pages/top-picks.tsx',
            './src/pages/prime-picks.tsx',
            './src/pages/value-picks.tsx',
            './src/pages/cue-picks.tsx',
            './src/pages/click-picks.tsx',
            './src/pages/global-picks.tsx'
          ],
          'pages-travel': [
            './src/pages/travel-picks.tsx',
            './src/pages/flights.tsx',
            './src/pages/hotels.tsx'
          ],
          'pages-other': [
            './src/pages/deals-hub.tsx',
            './src/pages/loot-box.tsx',
            './src/pages/apps.tsx',
            './src/pages/services.tsx',
            './src/pages/videos.tsx'
          ]
        }
      }
    }
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    cors: true,
    fs: { strict: false, deny: [] },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        ws: true,
        timeout: 60000,
        proxyTimeout: 60000,
        followRedirects: true,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, Content-Length, X-Requested-With'
        },
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Proxy error:', err.message);
            if (res && !res.headersSent) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Proxy connection failed' }));
            }
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.setHeader('Origin', 'http://localhost:5173');
          });
        },
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        ws: false,
        followRedirects: true,
      },
    },
  },
});
