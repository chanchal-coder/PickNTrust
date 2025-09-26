/**
 * Start Frontend Dev Server
 * This script starts the Vite frontend development server
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 STARTING FRONTEND DEV SERVER');
console.log('='.repeat(60));

// Change to client directory and start Vite dev server
const clientDir = path.join(__dirname, 'client');

console.log(`📁 Client directory: ${clientDir}`);
console.log('🔄 Starting Vite dev server...');

const viteProcess = spawn('npm', ['run', 'dev'], {
  cwd: clientDir,
  stdio: 'inherit',
  shell: true
});

viteProcess.on('error', (error) => {
  console.error('❌ Failed to start Vite dev server:', error);
});

viteProcess.on('close', (code) => {
  console.log(`🔴 Vite dev server exited with code ${code}`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping frontend dev server...');
  viteProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Stopping frontend dev server...');
  viteProcess.kill('SIGTERM');
  process.exit(0);
});