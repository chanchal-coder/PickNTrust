// Bridge loader for server-side TypeScript imports
// Re-exports the root config/env-loader.js to satisfy server imports
import { loadEnv as rootLoadEnv } from '../../config/env-loader.js';

export function loadEnv() {
  return rootLoadEnv();
}