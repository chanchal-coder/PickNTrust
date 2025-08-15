// server/db.ts
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '../shared/sqlite-schema.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config();

// Always use SQLite for simplicity and reliability
console.log('Using SQLite database: sqlite.db');

const sqlite = new Database('sqlite.db');
export const db = drizzle(sqlite, { schema });

// Initialize database schema if it doesn't exist
try {
  // Check if tables exist by querying a simple statement
  sqlite.prepare('SELECT 1 FROM categories LIMIT 1').run();
  console.log('Database tables already exist');
} catch (error) {
  // If tables don't exist, create them
  console.log('Initializing database schema...');
  try {
    // Read and execute the migration
    const migrationPath = path.join(__dirname, '../migrations');
    if (fs.existsSync(migrationPath)) {
      const migrationFiles = fs.readdirSync(migrationPath).filter(f => f.endsWith('.sql'));
      if (migrationFiles.length > 0) {
        const latestMigration = migrationFiles.sort().pop();
        const migrationSql = fs.readFileSync(path.join(migrationPath, latestMigration!), 'utf8');
        sqlite.exec(migrationSql);
        console.log('Database schema initialized successfully from migration');
      }
    } else {
      console.log('No migration files found, creating basic schema');
      // Create basic tables if migration file doesn't exist
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          icon TEXT NOT NULL,
          color TEXT NOT NULL,
          description TEXT NOT NULL
        );
        
        CREATE TABLE IF NOT EXISTS affiliate_networks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          description TEXT NOT NULL,
          commission_rate NUMERIC NOT NULL,
          tracking_params TEXT,
          logo_url TEXT,
          is_active INTEGER DEFAULT 1,
          join_url TEXT
        );
        
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          price NUMERIC NOT NULL,
          original_price NUMERIC,
          image_url TEXT NOT NULL,
          affiliate_url TEXT NOT NULL,
          affiliate_network_id INTEGER REFERENCES affiliate_networks(id),
          category TEXT NOT NULL,
          gender TEXT,
          rating NUMERIC NOT NULL,
          review_count INTEGER NOT NULL,
          discount INTEGER,
          is_new INTEGER DEFAULT 0,
          is_featured INTEGER DEFAULT 0,
          has_timer INTEGER DEFAULT 0,
          timer_duration INTEGER,
          timer_start_time INTEGER,
          created_at INTEGER DEFAULT (strftime('%s', 'now'))
        );
        
        CREATE TABLE IF NOT EXISTS blog_posts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          excerpt TEXT NOT NULL,
          content TEXT NOT NULL,
          category TEXT NOT NULL,
          tags TEXT,
          image_url TEXT NOT NULL,
          video_url TEXT,
          published_at INTEGER NOT NULL,
          created_at INTEGER DEFAULT (strftime('%s', 'now')),
          read_time TEXT NOT NULL,
          slug TEXT NOT NULL,
          has_timer INTEGER DEFAULT 0,
          timer_duration INTEGER,
          timer_start_time INTEGER
        );
        
        CREATE TABLE IF NOT EXISTS announcements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          message TEXT NOT NULL,
          is_active INTEGER DEFAULT 1,
          text_color TEXT DEFAULT '#ffffff',
          background_color TEXT DEFAULT '#3b82f6',
          font_size TEXT DEFAULT '16px',
          font_weight TEXT DEFAULT 'normal',
          text_decoration TEXT DEFAULT 'none',
          font_style TEXT DEFAULT 'normal',
          animation_speed TEXT DEFAULT '30',
          text_border_width TEXT DEFAULT '0px',
          text_border_style TEXT DEFAULT 'solid',
          text_border_color TEXT DEFAULT '#000000',
          banner_border_width TEXT DEFAULT '0px',
          banner_border_style TEXT DEFAULT 'solid',
          banner_border_color TEXT DEFAULT '#000000',
          created_at INTEGER DEFAULT (strftime('%s', 'now'))
        );
        
        CREATE TABLE IF NOT EXISTS newsletter_subscribers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          subscribed_at INTEGER DEFAULT (strftime('%s', 'now'))
        );
        
        CREATE TABLE IF NOT EXISTS admin_users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          reset_token TEXT,
          reset_token_expiry INTEGER,
          last_login INTEGER,
          created_at INTEGER DEFAULT (strftime('%s', 'now')),
          is_active INTEGER DEFAULT 1
        );
        
        CREATE TABLE IF NOT EXISTS video_content (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          video_url TEXT NOT NULL,
          thumbnail_url TEXT,
          platform TEXT NOT NULL,
          category TEXT NOT NULL,
          tags TEXT,
          duration TEXT,
          has_timer INTEGER DEFAULT 0,
          timer_duration INTEGER,
          timer_start_time INTEGER,
          created_at INTEGER DEFAULT (strftime('%s', 'now'))
        );
      `);
      console.log('Basic database schema created successfully');
    }
  } catch (migrationError) {
    console.error('Error initializing database schema:', migrationError);
  }
}

// Optional compatibility exports
export { db as dbInstance };
export default db;
