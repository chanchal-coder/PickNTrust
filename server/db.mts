import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from "../shared/sqlite-schema.js";
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
console.log('Using database URL:', process.env.DATABASE_URL || 'file:./sqlite.db');

const sqlite = new Database('sqlite.db');
const dbInstance = drizzle(sqlite, { schema });

// Initialize database schema if it doesn't exist
try {
  // Check if tables exist by querying a simple statement
  sqlite.prepare('SELECT 1 FROM affiliate_networks LIMIT 1').run();
  console.log('Database tables already exist');
} catch (error) {
  // If tables don't exist, create them
  console.log('Initializing database schema...');
  try {
    // Read and execute the migration
    const migrationPath = path.join(__dirname, '../migrations/0000_burly_zaladane.sql');
    if (fs.existsSync(migrationPath)) {
      const migrationSql = fs.readFileSync(migrationPath, 'utf8');
      sqlite.exec(migrationSql);
      console.log('Database schema initialized successfully');
    } else {
      console.log('Migration file not found, creating basic schema');
      // Create basic tables if migration file doesn't exist
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS affiliate_networks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          website_url TEXT,
          commission_rate REAL,
          is_active BOOLEAN DEFAULT true,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          price REAL,
          category TEXT,
          image_url TEXT,
          affiliate_url TEXT,
          is_featured BOOLEAN DEFAULT false,
          has_timer BOOLEAN DEFAULT false,
          timer_duration INTEGER,
          timer_start_time DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS blog_posts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          content TEXT,
          excerpt TEXT,
          slug TEXT UNIQUE,
          image_url TEXT,
          category TEXT,
          read_time TEXT,
          published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          has_timer BOOLEAN DEFAULT false,
          timer_duration INTEGER,
          timer_start_time DATETIME
        );
        
        CREATE TABLE IF NOT EXISTS announcements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          content TEXT,
          is_active BOOLEAN DEFAULT false,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS admin_users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          reset_token TEXT,
          reset_token_expiry DATETIME,
          last_login DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS newsletter_subscribers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('Basic database schema created successfully');
    }
  } catch (migrationError) {
    console.error('Error initializing database schema:', migrationError);
  }
}

// Initialize Supabase client for compatibility (but we won't use it)
let supabase = null;
try {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  }
} catch (error) {
  console.log('Supabase not configured, using SQLite only');
}

// Export the supabase client and db instance
export { supabase, dbInstance };
export default dbInstance;
