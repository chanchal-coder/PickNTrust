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
    // Default to cwd database
    if (cwdPath) {
      return cwdPath;
    }
    // Fallbacks for compiled environments
    const distServerPath = path.join(__dirname, '..', '..', 'database.sqlite'); // dist/server/database.sqlite
    const distRootPath = path.join(__dirname, '..', '..', '..', 'database.sqlite'); // dist/database.sqlite
    // Prefer dist/server over dist root if present
    return distServerPath || distRootPath;
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