import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Start Vite dev server on port 5173
const vite = spawn('npx', ['vite', '--host', '0.0.0.0', '--port', '5173'], {
  cwd: path.join(__dirname, 'client'),
  stdio: 'inherit'
});

vite.on('close', (code) => {
  console.log(`Frontend process exited with code ${code}`);
});

process.on('SIGINT', () => {
  vite.kill();
  process.exit();
});
