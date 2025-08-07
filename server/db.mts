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

// Use SQLite for development, PostgreSQL for production
const isDevelopment = process.env.NODE_ENV !== 'production';
let dbInstance;
let supabase = null;

// Initialize database connection
if (isDevelopment) {
  // Use SQLite for development
  const sqlite = new Database('sqlite.db');
  dbInstance = drizzle(sqlite, { schema });
  
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
      const migrationPath = path.join(__dirname, '../migrations/0001_init.sql');
      if (fs.existsSync(migrationPath)) {
        const migrationSql = fs.readFileSync(migrationPath, 'utf8');
        sqlite.exec(migrationSql);
        console.log('Database schema initialized successfully');
      } else {
        console.log('Migration file not found, using default schema');
      }
    } catch (migrationError) {
      console.error('Error initializing database schema:', migrationError);
    }
  }
} else {
  // Use PostgreSQL for production
  if (!process.env.DATABASE_URL || !process.env.SUPABASE_ANON_KEY || !process.env.SUPABASE_URL) {
    throw new Error(
      "DATABASE_URL, SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env",
    );
  }
  
  // Clean the DATABASE_URL to remove any "DATABASE_URL=" prefix
  let databaseUrl = process.env.DATABASE_URL.trim();
  if (databaseUrl.includes('DATABASE_URL=')) {
    const urlMatch = databaseUrl.match(/DATABASE_URL=(.+)/);
    if (urlMatch && urlMatch[1]) {
      databaseUrl = urlMatch[1].trim();
    }
  }
  
  // Validate the URL format
  try {
    new URL(databaseUrl);
  } catch (error) {
    throw new Error(`Invalid DATABASE_URL format: ${databaseUrl}`);
  }
  
  console.log('Using database URL:', databaseUrl.substring(0, 50) + '...');
  
  // Initialize Supabase client
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  
  // Initialize Postgres client for Drizzle ORM
  import('postgres').then(({ default: postgres }) => {
    const sql = postgres(databaseUrl, {
      ssl: { rejectUnauthorized: false }
    });
    
    console.log('Successfully connected to PostgreSQL database');
    
    // @ts-ignore
    dbInstance = drizzle(sql, { schema });
  }).catch(error => {
    console.error('Error connecting to PostgreSQL database:', error);
    throw error;
  });
}

// Export the supabase client and db instance
export { supabase, dbInstance };
export default dbInstance;
