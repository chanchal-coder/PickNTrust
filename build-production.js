#!/usr/bin/env node

/**
 * Production Build Script for PickNTrust
 * This script ensures consistent builds for both local and production environments
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting PickNTrust Production Build...\n');

// Clean previous builds
console.log('🧹 Cleaning previous builds...');
if (fs.existsSync(path.join(__dirname, 'dist'))) {
  fs.rmSync(path.join(__dirname, 'dist'), { recursive: true, force: true });
}

// Build client
console.log('🎨 Building client application...');
try {
  execSync('npm run build:client', { stdio: 'inherit', cwd: __dirname });
  console.log('✅ Client build completed successfully\n');
} catch (error) {
  console.error('❌ Client build failed:', error.message);
  process.exit(1);
}

// Verify client build output
const clientBuildPath = path.join(__dirname, 'dist', 'public');
if (!fs.existsSync(clientBuildPath)) {
  console.error('❌ Client build output not found at:', clientBuildPath);
  process.exit(1);
}

const indexHtmlPath = path.join(clientBuildPath, 'index.html');
if (!fs.existsSync(indexHtmlPath)) {
  console.error('❌ index.html not found in client build output');
  process.exit(1);
}

console.log('✅ Client build verification passed');

// Build server
console.log('🔧 Building server application...');
try {
  execSync('npm run build:server', { stdio: 'inherit', cwd: __dirname });
  console.log('✅ Server build completed successfully\n');
} catch (error) {
  console.error('❌ Server build failed:', error.message);
  process.exit(1);
}

// Verify server build output
const serverBuildPath = path.join(__dirname, 'dist', 'server');
if (!fs.existsSync(serverBuildPath)) {
  console.error('❌ Server build output not found at:', serverBuildPath);
  process.exit(1);
}

const serverIndexPath = path.join(serverBuildPath, 'server', 'index.js');
if (!fs.existsSync(serverIndexPath)) {
  console.error('❌ Server index.js not found in build output');
  process.exit(1);
}

console.log('✅ Server build verification passed');

// Create production info file
const buildInfo = {
  buildTime: new Date().toISOString(),
  clientPath: 'dist/public',
  serverPath: 'dist/server/server',
  startCommand: 'node dist/server/server/index.js',
  version: process.env.npm_package_version || '1.0.0'
};

fs.writeFileSync(
  path.join(__dirname, 'dist', 'build-info.json'),
  JSON.stringify(buildInfo, null, 2)
);

console.log('🎉 Production build completed successfully!');
console.log('📁 Client files: dist/public/');
console.log('📁 Server files: dist/server/');
console.log('🚀 Start command: npm start');
console.log('🌐 Preview URL: http://localhost:5000\n');