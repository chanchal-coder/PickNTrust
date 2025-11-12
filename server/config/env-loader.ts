import { createRequire } from 'module';

// Lightweight environment loader used by server-side processes (bot, scripts)
// Safely loads dotenv if available; otherwise, leaves process.env as-is.
export function loadEnv(): void {
  try {
    const require = createRequire(import.meta.url);
    let dotenv: any = null;
    try {
      dotenv = require('dotenv');
    } catch (_) {
      // dotenv not installed; skip
    }

    const explicitPath = process.env.DOTENV_PATH;
    if (dotenv && typeof dotenv.config === 'function') {
      try {
        if (explicitPath) {
          dotenv.config({ path: explicitPath });
        } else {
          dotenv.config();
        }
      } catch (_) {
        // ignore load errors to avoid impacting runtime
      }
    }
  } catch (_) {
    // swallow any initialization errors
  }
}