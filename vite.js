export function log(message) {
  try {
    console.log(message);
  } catch (_) {}
}

export async function setupVite(_app, _server) {
  // Minimal stub for local development; real implementation not required here
  console.log('vite.js stub: setupVite called');
}