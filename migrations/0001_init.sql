CREATE TABLE IF NOT EXISTS affiliate_networks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  tracking_params TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT 1,
  join_url TEXT
);

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
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  image_url TEXT NOT NULL,
  affiliate_url TEXT NOT NULL,
  affiliate_network_id INTEGER REFERENCES affiliate_networks(id),
  category TEXT NOT NULL,
  gender TEXT,
  rating DECIMAL(2,1) NOT NULL,
  review_count INTEGER NOT NULL,
  discount INTEGER,
  is_new BOOLEAN DEFAULT 0,
  is_featured BOOLEAN DEFAULT 0,
  has_timer BOOLEAN DEFAULT 0,
  timer_duration INTEGER,
  timer_start_time DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blog_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT NOT NULL,
  image_url TEXT NOT NULL,
  video_url TEXT,
  published_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  read_time TEXT NOT NULL,
  slug TEXT NOT NULL,
  has_timer BOOLEAN DEFAULT 0,
  timer_duration INTEGER,
  timer_start_time DATETIME
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  reset_token TEXT,
  reset_token_expiry DATETIME,
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT 1
);

CREATE TABLE IF NOT EXISTS announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message TEXT NOT NULL,
  is_active BOOLEAN DEFAULT 1,
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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
