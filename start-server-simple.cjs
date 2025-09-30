const { spawn } = require('child_process');

console.log('Starting PickNTrust server...');

// Set environment variable for development
process.env.NODE_ENV = 'development';

// Start the server with tsx
const server = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NODE_ENV: 'development',
    PORT: '5000'
  }
});

server.on('error', (err) => {
  console.error('Failed to start server:', err);
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  server.kill('SIGINT');
  process.exit(0);
});
