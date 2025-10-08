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
  // Wait up to 10 seconds when the database is busy instead of failing immediately
  sqlite.pragma('busy_timeout = 10000');
  // Ensure WAL mode which is better for concurrent reads/writes
  sqlite.pragma('journal_mode = WAL');
  // Keep foreign keys consistent
  sqlite.pragma('foreign_keys = ON');
  console.log('SQLite PRAGMAs set: busy_timeout=10000, journal_mode=WAL, foreign_keys=ON');
} catch (pragmaErr) {
  console.warn('Failed to set SQLite PRAGMAs:', pragmaErr);
}

// Ensure required tables exist to avoid runtime 500s when DB is missing or incomplete
try {
  // unified_content table (minimal schema covering active routes)
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS unified_content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      price REAL,
      original_price REAL,
      image_url TEXT,
      affiliate_url TEXT,
      affiliate_urls TEXT,
      content_type TEXT,
      page_type TEXT,
      category TEXT,
      subcategory TEXT,
      tags TEXT,
      brand TEXT,
      source_platform TEXT,
      media_urls TEXT,
      is_active INTEGER DEFAULT 1,
      is_featured INTEGER DEFAULT 0,
      is_service INTEGER DEFAULT 0,
      is_ai_app INTEGER DEFAULT 0,
      display_pages TEXT DEFAULT '["home"]',
      status TEXT,
      visibility TEXT,
      processing_status TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // categories table used by browse endpoints
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT,
      icon TEXT,
      color TEXT DEFAULT '#3B82F6',
      description TEXT,
      parent_id INTEGER,
      is_for_products INTEGER DEFAULT 1,
      is_for_services INTEGER DEFAULT 0,
      is_for_ai_apps INTEGER DEFAULT 0,
      display_order INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (parent_id) REFERENCES categories(id)
    );
  `);

  // Enforce case-insensitive uniqueness on category names to prevent duplicates
  try {
    sqlite.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_name_nocase
      ON categories(name COLLATE NOCASE);
    `);
    console.log('Ensured case-insensitive unique index on categories.name');
  } catch (idxErr) {
    console.warn('Failed to ensure NOCASE unique index for categories.name:', idxErr);
  }

  // Add missing columns on unified_content if DB exists with older schema
  const colExists = (name: string) => {
    const rows = sqlite.prepare("PRAGMA table_info(unified_content)").all();
    return rows.some((r: any) => r.name === name);
  };
  const alterIfMissing = (name: string, def: string) => {
    if (!colExists(name)) {
      sqlite.exec(`ALTER TABLE unified_content ADD COLUMN ${def}`);
    }
  };
  alterIfMissing('processing_status', 'processing_status TEXT');
  alterIfMissing('visibility', 'visibility TEXT');
  alterIfMissing('is_service', 'is_service INTEGER DEFAULT 0');
  alterIfMissing('is_ai_app', 'is_ai_app INTEGER DEFAULT 0');

  console.log('Database schema ensured: unified_content and categories present');
} catch (schemaErr) {
  console.warn('Failed to ensure database schema:', schemaErr);
}
// Ensure social media posting tables exist and have required columns
try {
  // Create canva_posts base table if missing
  sqlite.exec(`
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
  `);

  const canvaCols = sqlite.prepare("PRAGMA table_info(canva_posts)").all().map((c: any) => c.name);
  const ensureCol = (name: string, ddl: string) => {
    if (!canvaCols.includes(name)) {
      sqlite.exec(`ALTER TABLE canva_posts ADD COLUMN ${ddl}`);
    }
  };
  ensureCol('social_media_post_id', 'social_media_post_id TEXT');
  ensureCol('error_message', 'error_message TEXT');
  ensureCol('platform', 'platform TEXT');
  ensureCol('image_url', 'image_url TEXT');
  console.log('Ensured canva_posts table and columns for social media features');
} catch (canvaEnsureErr) {
  console.warn('Failed to ensure canva_posts table/columns:', canvaEnsureErr);
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

      // Ensure canva_posts has required columns used by social-media modules
      try {
        const canvaCols = sqlite.prepare("PRAGMA table_info(canva_posts)").all().map((c: any) => c.name);
        const ensureCol = (name: string, ddl: string) => {
          if (!canvaCols.includes(name)) {
            sqlite.exec(`ALTER TABLE canva_posts ADD COLUMN ${ddl}`);
          }
        };
        // Add tracking and error fields
        ensureCol('social_media_post_id', 'social_media_post_id TEXT');
        ensureCol('error_message', 'error_message TEXT');
        // Add platform and image reference fields expected by poster/routes
        ensureCol('platform', 'platform TEXT');
        ensureCol('image_url', 'image_url TEXT');
        // posted_at exists as INTEGER in some DBs; allow TEXT if missing (kept if present)
        // Note: SQLite is type-flexible; we keep existing posted_at if present.
        console.log('Ensured canva_posts columns for social media: platform, image_url, social_media_post_id, error_message');
      } catch (canvaEnsureErr) {
        console.warn('Failed to ensure canva_posts columns:', canvaEnsureErr);
      }
      
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

// Ensure nav_tabs table exists for navigation management
try {
  const navTabsTable = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='nav_tabs'").get();
  if (!navTabsTable) {
    console.log('Creating nav_tabs table...');
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS nav_tabs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        icon TEXT,
        color_from TEXT,
        color_to TEXT,
        color_style TEXT DEFAULT 'solid',
        display_order INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        is_system INTEGER DEFAULT 0,
        description TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      );
      CREATE INDEX IF NOT EXISTS idx_nav_tabs_active_order ON nav_tabs(is_active, display_order);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_nav_tabs_slug ON nav_tabs(slug);
    `);
    console.log('✅ nav_tabs table created');
  }

  // Ensure default system tabs exist (idempotent upsert based on slug)
  try {
    const defaultTabs = [
      { name: 'Prime Picks', slug: 'prime-picks', icon: 'fas fa-crown', color_from: '#8B5CF6', color_to: '#7C3AED', color_style: 'gradient', description: 'Premium curated products' },
      { name: 'Cue Picks', slug: 'cue-picks', icon: 'fas fa-bullseye', color_from: '#06B6D4', color_to: '#0891B2', color_style: 'gradient', description: 'Smart selections curated with precision' },
      { name: 'Value Picks', slug: 'value-picks', icon: 'fas fa-gem', color_from: '#F59E0B', color_to: '#D97706', color_style: 'gradient', description: 'Best value for money products' },
      { name: 'Click Picks', slug: 'click-picks', icon: 'fas fa-mouse-pointer', color_from: '#3B82F6', color_to: '#1D4ED8', color_style: 'gradient', description: 'Most popular and trending products' },
      { name: 'Global Picks', slug: 'global-picks', icon: 'fas fa-globe', color_from: '#10B981', color_to: '#059669', color_style: 'gradient', description: 'International products and brands' },
      { name: 'Travel Picks', slug: 'travel-picks', icon: 'fas fa-plane', color_from: '#3B82F6', color_to: '#1D4ED8', color_style: 'gradient', description: 'Travel essentials and accessories' },
      { name: 'Deals Hub', slug: 'deals-hub', icon: 'fas fa-fire', color_from: '#EF4444', color_to: '#DC2626', color_style: 'gradient', description: 'Hot deals and discounts' },
      { name: 'Loot Box', slug: 'loot-box', icon: 'fas fa-gift', color_from: '#F59E0B', color_to: '#D97706', color_style: 'gradient', description: 'Mystery boxes with amazing surprises' }
    ];

    const getMaxOrderStmt = sqlite.prepare(`SELECT COALESCE(MAX(display_order), 0) as maxOrder FROM nav_tabs`);
    const existsStmt = sqlite.prepare(`SELECT id FROM nav_tabs WHERE slug = ?`);
    const insertStmt = sqlite.prepare(`
      INSERT INTO nav_tabs (name, slug, icon, color_from, color_to, color_style, display_order, is_active, is_system, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, ?, strftime('%s','now'), strftime('%s','now'))
    `);

    let { maxOrder } = getMaxOrderStmt.get() as any;
    for (const tab of defaultTabs) {
      const existing = existsStmt.get(tab.slug) as any;
      if (!existing) {
        maxOrder = (maxOrder || 0) + 1;
        insertStmt.run(tab.name, tab.slug, tab.icon, tab.color_from, tab.color_to, tab.color_style, maxOrder, tab.description || '');
      }
    }
  } catch (seedError) {
    console.error('Error seeding default nav_tabs:', seedError);
  }
} catch (navTabsError) {
  console.error('Error ensuring nav_tabs table exists:', navTabsError);
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
  // Add body column if missing for widgets
  if (!names.has('body')) {
    console.log('Adding body column to widgets table...');
    sqlite.exec(`ALTER TABLE widgets ADD COLUMN body TEXT;`);
    console.log('✅ body column added to widgets');
  }
} catch (widgetsColumnError) {
  console.error('Error ensuring external_link column exists on widgets:', widgetsColumnError);
}

// Seed default widgets if none exist to avoid dev fallbacks
try {
  const allowSeeding = (process.env.SEED_DEFAULT_WIDGETS === 'true') || (process.env.NODE_ENV !== 'production');
  const countRow = sqlite.prepare('SELECT COUNT(*) as count FROM widgets').get() as { count: number };
  if (allowSeeding && countRow.count === 0) {
    console.log('Seeding default widgets (env-controlled)...');
    const insert = sqlite.prepare(`
      INSERT INTO widgets (
        name, description, body, code, target_page, position, is_active, display_order,
        max_width, custom_css, show_on_mobile, show_on_desktop, external_link,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, strftime('%s','now'), strftime('%s','now'))
    `);

    const defaults = [
      {
        name: 'Header Top Welcome',
        description: 'Simple welcome note on header top',
        body: '<div style="padding:8px 12px;background:#0ea5e9;color:white;border-radius:8px;font-weight:600">Welcome to PickNTrust</div>',
        code: '',
        target_page: 'home',
        position: 'header-top',
        is_active: 1,
        display_order: 0,
        max_width: null,
        custom_css: null,
        show_on_mobile: 1,
        show_on_desktop: 1,
        external_link: null,
      },
      {
        name: 'Header Bottom Teaser',
        description: 'Teaser below banner',
        body: '<div style="padding:8px 12px;background:#111;color:#fff;border:1px solid #333;border-radius:8px">Latest picks curated daily</div>',
        code: '',
        target_page: 'home',
        position: 'header-bottom',
        is_active: 1,
        display_order: 2,
        max_width: null,
        custom_css: null,
        show_on_mobile: 1,
        show_on_desktop: 1,
        external_link: null,
      },
      {
        name: 'Banner Top Promo',
        description: 'Basic banner area promo',
        body: '<div style="padding:10px;background:#111;color:#fff;border:1px solid #333;border-radius:8px">Discover featured picks below</div>',
        code: '',
        target_page: 'home',
        position: 'banner-top',
        is_active: 1,
        display_order: 1,
        max_width: '1024px',
        custom_css: null,
        show_on_mobile: 1,
        show_on_desktop: 1,
        external_link: null,
      },
      {
        name: 'Banner Bottom Info',
        description: 'Info below main content banner area',
        body: '<div style="padding:10px;background:#0ea5e9;color:#fff;border-radius:8px">Stay tuned for more</div>',
        code: '',
        target_page: 'home',
        position: 'banner-bottom',
        is_active: 1,
        display_order: 2,
        max_width: '1024px',
        custom_css: null,
        show_on_mobile: 1,
        show_on_desktop: 1,
        external_link: null,
      },
      {
        name: 'Footer Note',
        description: 'Simple footer note',
        body: '<div style="padding:8px 12px;background:#0f172a;color:#e2e8f0;border-radius:8px">Trusted picks, curated for you.</div>',
        code: '',
        target_page: 'home',
        position: 'footer-top',
        is_active: 1,
        display_order: 0,
        max_width: null,
        custom_css: null,
        show_on_mobile: 1,
        show_on_desktop: 1,
        external_link: null,
      },
      {
        name: 'Footer Links',
        description: 'CTA in footer',
        body: '<div style="padding:8px 12px;background:#111;color:#fff;border:1px solid #333;border-radius:8px"><a href="/apps" style="color:#93c5fd">Explore apps</a></div>',
        code: '',
        target_page: 'home',
        position: 'footer-bottom',
        is_active: 1,
        display_order: 1,
        max_width: null,
        custom_css: null,
        show_on_mobile: 1,
        show_on_desktop: 1,
        external_link: '/apps',
      }
    ];

    const insertMany = sqlite.transaction((rows: any[]) => {
      for (const r of rows) {
        insert.run(
          r.name,
          r.description,
          r.body,
          r.code,
          r.target_page,
          r.position,
          r.is_active,
          r.display_order,
          r.max_width,
          r.custom_css,
          r.show_on_mobile,
          r.show_on_desktop,
          r.external_link
        );
      }
    });
    insertMany(defaults);
    console.log('✅ Default widgets seeded');
  } else {
    console.log(`Widgets present: ${countRow.count} rows; seeding allowed=${allowSeeding}`);
  }
} catch (seedErr) {
  console.error('Error seeding default widgets:', seedErr);
}

// Ensure at least one active widget exists for key home positions
try {
  const allowEnsureDefaults = (process.env.ENSURE_DEFAULT_WIDGETS === 'true') || (process.env.NODE_ENV !== 'production');
  if (!allowEnsureDefaults) {
    console.log('Skipping default widget ensures in production (set ENSURE_DEFAULT_WIDGETS=true to enable)');
  }
  const requiredPositions = [
    'header-top',
    'header-bottom',
    'banner-top',
    'banner-bottom',
    'footer-top',
    'footer-bottom'
  ];
  const checkStmt = sqlite.prepare('SELECT COUNT(*) as count FROM widgets WHERE target_page = ? AND position = ? AND is_active = 1');
  const insertStmt = sqlite.prepare(`
    INSERT INTO widgets (
      name, description, body, code, target_page, position, is_active, display_order,
      max_width, custom_css, show_on_mobile, show_on_desktop, external_link,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 1, 0, ?, ?, 1, 1, ?, strftime('%s','now'), strftime('%s','now'))
  `);

  for (const pos of requiredPositions) {
    const c = checkStmt.get('home', pos) as { count: number };
    if (allowEnsureDefaults && c.count === 0) {
      let body = '';
      let name = '';
      let external_link: string | null = null;
      let max_width: string | null = null;

      switch (pos) {
        case 'header-top':
          name = 'Header Top Welcome';
          body = '<div style="padding:8px 12px;background:#0ea5e9;color:white;border-radius:8px;font-weight:600">Welcome to PickNTrust</div>';
          break;
        case 'header-bottom':
          name = 'Header Bottom Teaser';
          body = '<div style="padding:8px 12px;background:#111;color:#fff;border:1px solid #333;border-radius:8px">Latest picks curated daily</div>';
          break;
        case 'banner-top':
          name = 'Banner Top Promo';
          body = '<div style="padding:10px;background:#111;color:#fff;border:1px solid #333;border-radius:8px">Discover featured picks below</div>';
          max_width = '1024px';
          break;
        case 'banner-bottom':
          name = 'Banner Bottom Info';
          body = '<div style="padding:10px;background:#0ea5e9;color:#fff;border-radius:8px">Stay tuned for more</div>';
          max_width = '1024px';
          break;
        case 'footer-top':
          name = 'Footer Note';
          body = '<div style="padding:8px 12px;background:#0f172a;color:#e2e8f0;border-radius:8px">Trusted picks, curated for you.</div>';
          break;
        case 'footer-bottom':
          name = 'Footer Links';
          body = '<div style="padding:8px 12px;background:#111;color:#fff;border:1px solid #333;border-radius:8px"><a href="/apps" style="color:#93c5fd">Explore apps</a></div>';
          external_link = '/apps';
          break;
      }

      insertStmt.run(
        name,
        `${pos} default`,
        body,
        '',
        'home',
        pos,
        max_width,
        null,
        external_link
      );
      console.log(`✅ Inserted default widget for home/${pos}`);
    }
  }
} catch (ensureErr) {
  console.error('Error ensuring default widgets per position:', ensureErr);
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
        showHomeLink INTEGER DEFAULT 1,
        homeLinkText TEXT DEFAULT 'Back to Home',
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
  if (!names.has('showHomeLink')) {
    addColumn("ALTER TABLE banners ADD COLUMN showHomeLink INTEGER DEFAULT 1", 'showHomeLink');
  }
  if (!names.has('homeLinkText')) {
    addColumn("ALTER TABLE banners ADD COLUMN homeLinkText TEXT DEFAULT 'Back to Home'", 'homeLinkText');
  }
} catch (styleErr) {
  console.error('Error ensuring banners style columns exist:', styleErr);
}

// Optional compatibility exports
export { db as dbInstance };
export default db;
