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
// Resolve database path
// Prefer DATABASE_URL env var (supports formats like: file:./database.sqlite or absolute paths)
function resolveDbFile() {
    const envUrl = process.env.DATABASE_URL;
    if (envUrl && envUrl.length > 0) {
        // Handle sqlite URL prefixes like file:./database.sqlite
        if (envUrl.startsWith('file:')) {
            const p = envUrl.replace(/^file:/, '');
            // If relative, resolve relative to process.cwd()
            return path.isAbsolute(p) ? p : path.join(process.cwd(), p);
        }
        // If it's already a path, use as-is (resolve relative to cwd when not absolute)
        return path.isAbsolute(envUrl) ? envUrl : path.join(process.cwd(), envUrl);
    }
    // Fallback: locate database.sqlite one level above compiled server directory
    // When running from dist/server, this points to dist/database.sqlite
    const fallback = path.join(__dirname, '..', 'database.sqlite');
    return fallback;
}
const dbFile = resolveDbFile();
console.log(`Using SQLite database: ${dbFile}`);
const sqlite = new Database(dbFile);
export const db = drizzle(sqlite, { schema });
export const sqliteDb = sqlite; // Export raw sqlite instance for direct queries
// Initialize database schema if it doesn't exist
try {
    // Check if tables exist by querying a simple statement
    sqlite.prepare('SELECT 1 FROM categories LIMIT 1').run();
    console.log('Database tables already exist');
    // Check and add missing columns for announcements table
    try {
        // Try to select the 'page' column - if it fails, the column doesn't exist
        sqlite.prepare('SELECT page FROM announcements LIMIT 1').run();
        console.log('Announcements table schema is up to date');
    }
    catch (columnError) {
        console.log('Adding missing columns to announcements table...');
        try {
            sqlite.exec(`
        ALTER TABLE announcements ADD COLUMN page TEXT;
        ALTER TABLE announcements ADD COLUMN is_global INTEGER DEFAULT 1;
        UPDATE announcements SET is_global = 1 WHERE is_global IS NULL;
      `);
            console.log('✅ Successfully added missing columns to announcements table');
        }
        catch (alterError) {
            console.error('Error adding columns to announcements table:', alterError);
        }
    }
}
catch (error) {
    // If tables don't exist, create them
    console.log('Initializing database schema...');
    try {
        // Read and execute the migration
        const migrationPath = path.join(__dirname, '../migrations');
        if (fs.existsSync(migrationPath)) {
            const migrationFiles = fs.readdirSync(migrationPath).filter(f => f.endsWith('.sql'));
            if (migrationFiles.length > 0) {
                const latestMigration = migrationFiles.sort().pop();
                const migrationSql = fs.readFileSync(path.join(migrationPath, latestMigration), 'utf8');
                sqlite.exec(migrationSql);
                console.log('Database schema initialized successfully from migration');
            }
        }
        else {
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
          is_service INTEGER DEFAULT 0,
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
        
        CREATE TABLE IF NOT EXISTS canva_settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          is_enabled INTEGER DEFAULT 0,
          api_key TEXT,
          api_secret TEXT,
          default_template_id TEXT,
          auto_generate_captions INTEGER DEFAULT 1,
          auto_generate_hashtags INTEGER DEFAULT 1,
          default_caption TEXT,
          default_hashtags TEXT,
          platforms TEXT DEFAULT '[]',
          schedule_type TEXT DEFAULT 'immediate',
          schedule_delay_minutes INTEGER DEFAULT 0,
          created_at INTEGER DEFAULT (strftime('%s', 'now')),
          updated_at INTEGER DEFAULT (strftime('%s', 'now'))
        );
        
        CREATE TABLE IF NOT EXISTS canva_posts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          content_type TEXT NOT NULL,
          content_id INTEGER NOT NULL,
          canva_design_id TEXT,
          template_id TEXT,
          caption TEXT,
          hashtags TEXT,
          platforms TEXT,
          post_urls TEXT,
          status TEXT DEFAULT 'pending',
          scheduled_at INTEGER,
          posted_at INTEGER,
          expires_at INTEGER,
          created_at INTEGER DEFAULT (strftime('%s', 'now')),
          updated_at INTEGER DEFAULT (strftime('%s', 'now'))
        );
        
        CREATE TABLE IF NOT EXISTS canva_templates (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          template_id TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          category TEXT,
          thumbnail_url TEXT,
          is_active INTEGER DEFAULT 1,
          created_at INTEGER DEFAULT (strftime('%s', 'now'))
        );
      `);
            // Insert default Canva settings if they don't exist
            try {
                const existingSettings = sqlite.prepare('SELECT COUNT(*) as count FROM canva_settings').get();
                if (existingSettings.count === 0) {
                    sqlite.prepare(`
            INSERT INTO canva_settings (
              is_enabled, 
              auto_generate_captions, 
              auto_generate_hashtags,
              default_caption,
              default_hashtags,
              platforms, 
              schedule_type, 
              schedule_delay_minutes,
              created_at,
              updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(0, // is_enabled = false initially
                    1, // auto_generate_captions = true
                    1, // auto_generate_hashtags = true
                    'Deal Amazing {category} Alert! Special {title} Price Price: ₹{price} Link Get the best deals at PickNTrust!', '#PickNTrust #Deals #Shopping #BestPrice #Sale #Discount #OnlineShopping #India', JSON.stringify(['instagram', 'facebook']), // default platforms
                    'immediate', 0, Math.floor(Date.now() / 1000), // created_at timestamp
                    Math.floor(Date.now() / 1000) // updated_at timestamp
                    );
                    console.log('Success Created default Canva settings');
                }
            }
            catch (settingsError) {
                console.log('Note: Could not create default Canva settings, will be created on first use');
            }
            console.log('Basic database schema created successfully');
            // Insert sample data for travel categories if empty
            try {
                const categoryCount = sqlite.prepare('SELECT COUNT(*) as count FROM travel_categories').get();
                if (categoryCount.count === 0) {
                    console.log('Inserting sample travel categories...');
                    const insertCategory = sqlite.prepare(`
            INSERT INTO travel_categories (name, slug, icon, color, description, isActive, displayOrder, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
                    const categories = [
                        ['Flights', 'flights', '✈️', '#3B82F6', 'Domestic and International Flight Bookings', 1, 1, Date.now(), Date.now()],
                        ['Hotels', 'hotels', '🏨', '#EF4444', 'Hotel Bookings and Accommodations', 1, 2, Date.now(), Date.now()],
                        ['Packages', 'packages', '📦', '#8B5CF6', 'Travel Packages and Tours', 1, 3, Date.now(), Date.now()],
                        ['Tours', 'tours', '🗺️', '#F59E0B', 'Guided Tours and Experiences', 1, 4, Date.now(), Date.now()],
                        ['Bus', 'bus', '🚌', '#10B981', 'Bus Bookings and Transportation', 1, 5, Date.now(), Date.now()],
                        ['Train', 'train', '🚂', '#6366F1', 'Train Bookings and Rail Travel', 1, 6, Date.now(), Date.now()],
                        ['Car Rental', 'car-rental', '🚗', '#EC4899', 'Car Rentals and Vehicle Hire', 1, 7, Date.now(), Date.now()],
                        ['Cruises', 'cruises', '🚢', '#14B8A6', 'Cruise Bookings and Ocean Travel', 1, 8, Date.now(), Date.now()]
                    ];
                    for (const category of categories) {
                        insertCategory.run(...category);
                    }
                    console.log('✅ Sample travel categories inserted');
                }
            }
            catch (categoryError) {
                console.log('Note: Could not insert travel categories, will be created on first use');
            }
        }
    }
    catch (migrationError) {
        console.error('Error initializing database schema:', migrationError);
    }
}
// Optional compatibility exports
export { db as dbInstance };
export default db;
