// server/config/database.ts
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Centralized database configuration
 * Ensures all services resolve the same database path in dev and production.
 */
export const DATABASE_CONFIG = {
  // Prefer resolving relative to process.cwd() so starting from project root works in both dev and prod
  // Fallbacks are provided for compiled layouts to avoid path-depth issues.
  resolvePath(): string {
    const cwdPath = path.join(process.cwd(), 'database.sqlite');
    // If an env var is provided, honor it (supports file: prefix)
    const envUrl = process.env.DATABASE_URL;
    if (envUrl && envUrl.length > 0) {
      if (envUrl.startsWith('file:')) {
        const p = envUrl.replace(/^file:/, '');
        return path.isAbsolute(p) ? p : path.join(process.cwd(), p);
      }
      return path.isAbsolute(envUrl) ? envUrl : path.join(process.cwd(), envUrl);
    }
    // Candidate locations prioritized to avoid creating DB inside dist.
    // Prefer project root first to keep a single authoritative DB in prod.
    const candidates = [
      cwdPath,                                                   // current working directory (project root when PM2 sets cwd)
      path.join(process.cwd(), '..', 'database.sqlite'),         // parent directory
      path.join(__dirname, '..', '..', '..', 'database.sqlite'), // dist/database.sqlite
      path.join(__dirname, '..', '..', 'database.sqlite'),       // dist/server/database.sqlite
    ];

    for (const p of candidates) {
      try {
        // Prefer an existing database file
        const fs = require('fs');
        if (fs.existsSync(p)) {
          if (process.env.LOG_DB_PATH === 'true') {
            console.log('📦 Using existing database at', p);
          }
          return p;
        }
      } catch {}
    }

    // As a last resort, default to cwd. Avoid placing DB inside dist subpaths in production.
    const isProd = process.env.NODE_ENV === 'production';
    const inDist = __dirname.includes(path.sep + 'dist' + path.sep);
    if (isProd && inDist) {
      // Redirect to project root database path when running from dist
      const rootPath = path.join(__dirname, '..', '..', '..', 'database.sqlite');
      if (process.env.LOG_DB_PATH === 'true') {
        console.log('📦 Defaulting to project root database at', rootPath);
      }
      return rootPath;
    }
    if (process.env.LOG_DB_PATH === 'true') {
      console.log('📦 Defaulting to cwd database at', cwdPath);
    }
    return cwdPath;
  },

  // Connection options
  CONNECTION_OPTIONS: {
    verbose: console.log, // Enable verbose logging in development
    fileMustExist: false, // Create database if it doesn't exist
  },

  // Backup and migration paths
  BACKUP_PATH: path.join(process.cwd(), 'backups'),
  MIGRATION_PATH: path.join(__dirname, '..', 'migrations'),
} as const;

/**
 * Get the database path for use in services
 * @returns {string} The absolute path to the database file
 */
export function getDatabasePath(): string {
  return DATABASE_CONFIG.resolvePath();
}

/**
 * Get database connection options
 * @returns {object} Connection options for better-sqlite3
 */
export function getDatabaseOptions() {
  return DATABASE_CONFIG.CONNECTION_OPTIONS;
}

export default DATABASE_CONFIG;