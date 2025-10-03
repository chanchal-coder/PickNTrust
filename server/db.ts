// server/db.ts
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
// Avoid static import of schema which breaks in production when dist/shared isn't shipped
// We'll attempt dynamic imports and gracefully proceed without schema if not found
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { getDatabasePath } from './config/database.js';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config();

// Centralized database path resolution
const dbFile = getDatabasePath();
console.log(`Using SQLite database: ${dbFile}`);

const sqlite = new Database(dbFile);
// Configure SQLite to reduce lock errors and improve concurrency
try {
  // Wait up to 3 seconds when the database is busy instead of failing immediately
  sqlite.pragma('busy_timeout = 3000');
  // Ensure WAL mode which is better for concurrent reads/writes
  sqlite.pragma('journal_mode = WAL');
  // Keep foreign keys consistent
  sqlite.pragma('foreign_keys = ON');
  console.log('SQLite PRAGMAs set: busy_timeout=3000, journal_mode=WAL, foreign_keys=ON');
} catch (pragmaErr) {
  console.warn('Failed to set SQLite PRAGMAs:', pragmaErr);
}
// Try to load schema dynamically from common locations; fallback to no schema
let loadedSchema: any | undefined = undefined;
const tryDynamicImport = async (relPath: string) => {
  try {
    // Use variable-based import path to avoid TS static resolution errors
    return await import(relPath as string);
  } catch {
    return undefined;
  }
};
loadedSchema = (await tryDynamicImport('../shared/sqlite-schema.js'))
  || (await tryDynamicImport('../../shared/sqlite-schema.js'))
  || undefined;
if (loadedSchema) {
  console.log('Loaded schema module dynamically');
} else {
  console.warn('Schema module not found. Proceeding without type-safe schema.');
}

export const db = loadedSchema ? drizzle(sqlite, { schema: loadedSchema }) : drizzle(sqlite);
export const sqliteDb = sqlite; // Export raw sqlite instance for direct queries

// Initialize database schema if it doesn't exist
try {
  // Check if tables exist by querying a simple statement
  sqlite.prepare('SELECT 1 FROM categories LIMIT 1').run();
  console.log('Database tables already exist');
  
  // Check and add missing columns for announcements table safely
  try {
    const tableExists = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='announcements'").get();
    if (!tableExists) {
      console.log('Announcements table not found; skipping column updates');
    } else {
      try {
        // Try to select the 'page' column - if it fails, the column doesn't exist
        sqlite.prepare('SELECT page FROM announcements LIMIT 1').run();
        console.log('Announcements table schema is up to date');
      } catch (columnError) {
        console.log('Adding missing columns to announcements table...');
        try {
          const existingCols = sqlite.prepare("PRAGMA table_info(announcements)").all().map((c: any) => c.name);
          if (!existingCols.includes('page')) {
            sqlite.exec('ALTER TABLE announcements ADD COLUMN page TEXT');
          }
          if (!existingCols.includes('is_global')) {
            sqlite.exec('ALTER TABLE announcements ADD COLUMN is_global INTEGER DEFAULT 1');
          }
          sqlite.exec('UPDATE announcements SET is_global = 1 WHERE is_global IS NULL');
          console.log('✅ Successfully added missing columns to announcements table');
        } catch (alterError) {
          console.error('Error adding columns to announcements table:', alterError);
        }
      }
    }
  } catch (checkError) {
    console.error('Error checking announcements table presence:', checkError);
  }
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
          -- Page targeting properties (added to match Drizzle schema)
          page TEXT,
          is_global INTEGER DEFAULT 1,
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
        const existingSettings = sqlite.prepare('SELECT COUNT(*) as count FROM canva_settings').get() as { count: number };
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
          `).run(
            0, // is_enabled = false initially
            1, // auto_generate_captions = true
            1, // auto_generate_hashtags = true
            'Deal Amazing {category} Alert! Special {title} Price Price: ₹{price} Link Get the best deals at PickNTrust!',
            '#PickNTrust #Deals #Shopping #BestPrice #Sale #Discount #OnlineShopping #India',
            JSON.stringify(['instagram', 'facebook']), // default platforms
            'immediate',
            0,
            Math.floor(Date.now() / 1000), // created_at timestamp
            Math.floor(Date.now() / 1000)  // updated_at timestamp
          );
          console.log('Success Created default Canva settings');
        }
      } catch (settingsError) {
        console.log('Note: Could not create default Canva settings, will be created on first use');
      }
      
      console.log('Basic database schema created successfully');
      
      // Insert sample data for travel categories if empty
      try {
        const categoryCount = sqlite.prepare('SELECT COUNT(*) as count FROM travel_categories').get() as { count: number };
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
      } catch (categoryError) {
        console.log('Note: Could not insert travel categories, will be created on first use');
      }
    }
  } catch (migrationError) {
    console.error('Error initializing database schema:', migrationError);
  }
}

// Ensure rss_feeds table exists (fixes SqliteError: no such table: rss_feeds)
try {
  const rssTable = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='rss_feeds'").get();
  if (!rssTable) {
    console.log('Creating rss_feeds table...');
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS rss_feeds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        url TEXT NOT NULL UNIQUE,
        description TEXT,
        category TEXT,
        update_frequency INTEGER DEFAULT 60,
        last_fetched DATETIME,
        is_active INTEGER DEFAULT 1,
        auto_import INTEGER DEFAULT 1,
        content_filter TEXT,
        affiliate_replace INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ rss_feeds table created');
  }
} catch (rssError) {
  console.error('Error ensuring rss_feeds table exists:', rssError);
}

// Ensure meta_tags table exists and seed a default record if empty
try {
  const metaTable = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='meta_tags'").get();
  if (!metaTable) {
    console.log('Creating meta_tags table...');
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS meta_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        content TEXT NOT NULL,
        provider TEXT NOT NULL,
        purpose TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      );
    `);
    console.log('✅ meta_tags table created');
  }
  const metaCount = sqlite.prepare('SELECT COUNT(*) as count FROM meta_tags').get() as { count: number };
  if (metaCount.count === 0) {
    console.log('Seeding default meta tag...');
    sqlite.prepare(`
      INSERT INTO meta_tags (name, content, provider, purpose, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, 1, strftime('%s','now'), strftime('%s','now'))
    `).run(
      'google-site-verification',
      'verify-token',
      'Google',
      'Site Verification'
    );
    console.log('✅ Default meta tag seeded');
  }
} catch (metaError) {
  console.error('Error ensuring meta_tags table exists:', metaError);
}

// Ensure widgets table exists (fixes SqliteError: no such table: widgets)
try {
  const widgetsTable = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='widgets'").get();
  if (!widgetsTable) {
    console.log('Creating widgets table...');
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS widgets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT NOT NULL,
        target_page TEXT NOT NULL,
        position TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        display_order INTEGER DEFAULT 0,
        max_width TEXT,
        custom_css TEXT,
        show_on_mobile INTEGER DEFAULT 1,
        show_on_desktop INTEGER DEFAULT 1,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      );
      CREATE INDEX IF NOT EXISTS idx_widgets_page_position ON widgets(target_page, position);
      CREATE INDEX IF NOT EXISTS idx_widgets_active ON widgets(is_active);
    `);
    console.log('✅ widgets table created');
  }
} catch (widgetsError) {
  console.error('Error ensuring widgets table exists:', widgetsError);
}

// Ensure external_link column exists on widgets table
try {
  const columns = sqlite.prepare("PRAGMA table_info(widgets)").all() as any[];
  const names = new Set(columns.map((c: any) => c.name));
  if (!names.has('external_link')) {
    console.log('Adding external_link column to widgets table...');
    sqlite.exec(`ALTER TABLE widgets ADD COLUMN external_link TEXT;`);
    console.log('✅ external_link column added to widgets');
  }
  // Add description column if missing for widgets
  if (!names.has('description')) {
    console.log('Adding description column to widgets table...');
    sqlite.exec(`ALTER TABLE widgets ADD COLUMN description TEXT;`);
    console.log('✅ description column added to widgets');
  }
} catch (widgetsColumnError) {
  console.error('Error ensuring external_link column exists on widgets:', widgetsColumnError);
}

// Ensure banners table exists (fixes SqliteError: no such table: banners)
try {
  const bannersTable = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='banners'").get();
  if (!bannersTable) {
    console.log('Creating banners table...');
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS banners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        subtitle TEXT,
        imageUrl TEXT NOT NULL,
        linkUrl TEXT,
        buttonText TEXT DEFAULT 'Learn More',
        page TEXT NOT NULL,
        display_order INTEGER DEFAULT 1,
        isActive INTEGER DEFAULT 1,
        icon TEXT,
        iconType TEXT DEFAULT 'none',
        iconPosition TEXT DEFAULT 'left',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_banners_page_order ON banners(page, display_order);
      CREATE INDEX IF NOT EXISTS idx_banners_active_page ON banners(page, isActive);
    `);
    console.log('✅ banners table created');
  }
} catch (bannersError) {
  console.error('Error ensuring banners table exists:', bannersError);
}

// Ensure new banner style columns exist for gradient/background options
try {
  const columns = sqlite.prepare("PRAGMA table_info(banners)").all() as any[];
  const names = new Set(columns.map((c: any) => c.name));

  const addColumn = (sql: string, label: string) => {
    try {
      sqlite.exec(sql);
      console.log(`✅ Added banners column: ${label}`);
    } catch (e) {
      // If column already exists or ALTER fails, log and continue
      console.warn(`⚠️ Could not add column ${label}:`, e instanceof Error ? e.message : e);
    }
  };

  if (!names.has('useGradient')) {
    addColumn("ALTER TABLE banners ADD COLUMN useGradient INTEGER DEFAULT 0", 'useGradient');
  }
  if (!names.has('backgroundGradient')) {
    addColumn("ALTER TABLE banners ADD COLUMN backgroundGradient TEXT", 'backgroundGradient');
  }
  if (!names.has('backgroundOpacity')) {
    addColumn("ALTER TABLE banners ADD COLUMN backgroundOpacity INTEGER DEFAULT 100", 'backgroundOpacity');
  }
  if (!names.has('imageDisplayType')) {
    addColumn("ALTER TABLE banners ADD COLUMN imageDisplayType TEXT DEFAULT 'image'", 'imageDisplayType');
  }
  if (!names.has('unsplashQuery')) {
    addColumn("ALTER TABLE banners ADD COLUMN unsplashQuery TEXT", 'unsplashQuery');
  }
} catch (styleErr) {
  console.error('Error ensuring banners style columns exist:', styleErr);
}

// Optional compatibility exports
export { db as dbInstance };
export default db;
