// Minimal environment loader to avoid startup errors in local development
// This function can be expanded to load .env files if needed.
import { createRequire } from 'module';
export function loadEnv() {
  try {
    // No-op: rely on existing process.env
    // Optionally, integrate dotenv if present without hard requirement
    const dotenvPath = process.env.DOTENV_PATH;
    if (dotenvPath) {
      try {
        const require = createRequire(import.meta.url);
        const dotenv = require('dotenv');
        if (dotenv && typeof dotenv.config === 'function') {
          dotenv.config({ path: dotenvPath });
        }
      } catch (_) {
        // dotenv not installed or load failed; ignore
      }
    }
  } catch (_) {
    // Swallow any env initialization errors to keep server running
  }
}