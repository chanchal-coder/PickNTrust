const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

console.log('🔧 Initializing database with all required tables and columns...');

// Create the blog_posts table if it doesn't exist
db.exec(`
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
`);

// Create other necessary tables
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    description TEXT NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC NOT NULL,
    original_price NUMERIC,
    image_url TEXT NOT NULL,
    affiliate_url TEXT NOT NULL,
    affiliate_network_id INTEGER,
    category TEXT NOT NULL,
    gender TEXT,
    rating NUMERIC NOT NULL,
    review_count INTEGER NOT NULL,
    discount INTEGER,
    is_new INTEGER DEFAULT 0,
    is_featured INTEGER DEFAULT 0,
    is_service INTEGER DEFAULT 0,
    custom_fields TEXT,
    has_timer INTEGER DEFAULT 0,
    timer_duration INTEGER,
    timer_start_time INTEGER,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  );
  
  CREATE TABLE IF NOT EXISTS video_content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    platform TEXT NOT NULL DEFAULT 'YouTube',
    category TEXT,
    tags TEXT,
    duration INTEGER,
    view_count INTEGER DEFAULT 0,
    is_featured INTEGER DEFAULT 0,
    has_timer INTEGER DEFAULT 0,
    timer_duration INTEGER,
    timer_start_time INTEGER,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER
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
  
  CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    subscribed_at INTEGER DEFAULT (strftime('%s', 'now'))
  );
  
  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    reset_token TEXT,
    reset_token_expiry INTEGER,
    last_login INTEGER,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    is_active INTEGER DEFAULT 1
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
`);

// Add missing columns to existing tables if they don't exist
console.log('🔧 Adding missing columns to existing tables...');

try {
  // Check if is_service column exists
  const columns = db.prepare("PRAGMA table_info(products)").all();
  const hasIsService = columns.find(col => col.name === 'is_service');
  
  if (!hasIsService) {
    db.exec('ALTER TABLE products ADD COLUMN is_service INTEGER DEFAULT 0');
    console.log('✅ Added is_service column to products table');
  }
  
  const hasCustomFields = columns.find(col => col.name === 'custom_fields');
  if (!hasCustomFields) {
    db.exec('ALTER TABLE products ADD COLUMN custom_fields TEXT');
    console.log('✅ Added custom_fields column to products table');
  }
  
  const hasHasTimer = columns.find(col => col.name === 'has_timer');
  if (!hasHasTimer) {
    db.exec('ALTER TABLE products ADD COLUMN has_timer INTEGER DEFAULT 0');
    console.log('✅ Added has_timer column to products table');
  }
  
  const hasTimerDuration = columns.find(col => col.name === 'timer_duration');
  if (!hasTimerDuration) {
    db.exec('ALTER TABLE products ADD COLUMN timer_duration INTEGER');
    console.log('✅ Added timer_duration column to products table');
  }
  
  const hasTimerStartTime = columns.find(col => col.name === 'timer_start_time');
  if (!hasTimerStartTime) {
    db.exec('ALTER TABLE products ADD COLUMN timer_start_time INTEGER');
    console.log('✅ Added timer_start_time column to products table');
  }
  
} catch (error) {
  console.log('⚠️  Some columns may already exist:', error.message);
}

console.log('✅ Database initialized successfully with all required tables and columns!');
console.log('📋 Tables created/updated:');
console.log('   - blog_posts (with timer support)');
console.log('   - categories');
console.log('   - products (with is_service, custom_fields, timer columns)');
console.log('   - video_content (complete table)');
console.log('   - affiliate_networks');
console.log('   - newsletter_subscribers');
console.log('   - admin_users');
console.log('   - announcements');

db.close();
