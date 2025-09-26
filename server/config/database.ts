// server/config/database.ts
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Centralized database configuration
 * This ensures all services use the same database path
 */
export const DATABASE_CONFIG = {
  // Main database file path - always points to root database.sqlite
  DATABASE_PATH: path.join(__dirname, '..', '..', '..', 'database.sqlite'),
  
  // Connection options
  CONNECTION_OPTIONS: {
    verbose: console.log, // Enable verbose logging in development
    fileMustExist: false, // Create database if it doesn't exist
  },
  
  // Backup and migration paths
  BACKUP_PATH: path.join(__dirname, '..', '..', '..', 'backups'),
  MIGRATION_PATH: path.join(__dirname, '..', 'migrations'),
} as const;

/**
 * Get the database path for use in services
 * @returns {string} The absolute path to the database file
 */
export function getDatabasePath(): string {
  return DATABASE_CONFIG.DATABASE_PATH;
}

/**
 * Get database connection options
 * @returns {object} Connection options for better-sqlite3
 */
export function getDatabaseOptions() {
  return DATABASE_CONFIG.CONNECTION_OPTIONS;
}

export default DATABASE_CONFIG;