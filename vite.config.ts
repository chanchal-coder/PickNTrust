// @ts-nocheck
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
  ],
  optimizeDeps: {
    include: [
      'react-hook-form',
      '@hookform/resolvers/zod',
      'zod'
    ]
  },
  resolve: {
    alias: {
      // Force single React resolution from client node_modules to avoid duplicates
      react: path.resolve(__dirname, 'client/node_modules/react'),
      'react-dom': path.resolve(__dirname, 'client/node_modules/react-dom'),
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
    // Ensure a single React instance to prevent hooks dispatcher mismatch
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(__dirname, "client"),
  build: {
    // Build directly to dist/public for consistent path
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    cssCodeSplit: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor';
              }
              if (id.includes('@radix-ui')) {
                return 'radix';
              }
              if (id.includes('@tanstack/react-query')) {
                return 'query';
              }
              if (id.includes('lucide-react')) {
                return 'icons';
              }
              if (id.includes('date-fns') || id.includes('clsx') || id.includes('class-variance-authority')) {
                return 'utils';
              }
              return 'vendor';
            }
          }
        }
      }
  },
  server: {
    allowedHosts: ["pickntrust.com", "www.pickntrust.com", "51.21.112.211", "localhost", "127.0.0.1"],
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
    fs: {
      strict: false,
      deny: [],
    },
  },
  css: {
    postcss: "./postcss.config.js"
  }
});
