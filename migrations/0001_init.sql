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
  page TEXT,
  is_global INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS travel_products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  price TEXT,
  original_price TEXT,
  currency TEXT DEFAULT 'INR',
  image_url TEXT,
  affiliate_url TEXT NOT NULL,
  category TEXT,
  rating TEXT,
  review_count TEXT,
  discount TEXT,
  is_featured INTEGER DEFAULT 0,
  processing_status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS travel_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  description TEXT,
  isActive INTEGER DEFAULT 1,
  displayOrder INTEGER DEFAULT 0,
  createdAt INTEGER DEFAULT (strftime('%s', 'now')),
  updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS featured_products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  price TEXT,
  original_price TEXT,
  currency TEXT DEFAULT 'INR',
  image_url TEXT,
  affiliate_url TEXT NOT NULL,
  category TEXT,
  rating TEXT,
  review_count TEXT,
  discount TEXT,
  is_featured INTEGER DEFAULT 1,
  is_new INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  has_timer INTEGER DEFAULT 0,
  timer_duration INTEGER,
  timer_start_time INTEGER,
  has_limited_offer INTEGER DEFAULT 0,
  limited_offer_text TEXT,
  display_order INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  source TEXT DEFAULT 'manual',
  affiliate_network TEXT DEFAULT 'generic'
);

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
  pages TEXT DEFAULT '[]',
  show_on_homepage INTEGER DEFAULT 1,
  cta_text TEXT,
  cta_url TEXT,
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
  default_title TEXT,
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
  design_id TEXT,
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

CREATE TABLE IF NOT EXISTS currency_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  default_currency TEXT DEFAULT 'INR',
  enabled_currencies TEXT DEFAULT '["INR","USD","EUR","GBP","JPY","CAD","AUD","SGD","CNY","KRW"]',
  auto_update_rates INTEGER DEFAULT 1,
  last_rate_update INTEGER,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS exchange_rates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate DECIMAL(10,6) NOT NULL,
  last_updated INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS top_picks_products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  price TEXT,
  original_price TEXT,
  currency TEXT DEFAULT 'INR',
  image_url TEXT,
  affiliate_url TEXT NOT NULL,
  original_url TEXT,
  category TEXT,
  subcategory TEXT,
  rating TEXT,
  review_count TEXT,
  discount TEXT,
  is_featured INTEGER DEFAULT 0,
  is_new INTEGER DEFAULT 1,
  has_timer INTEGER DEFAULT 0,
  timer_duration INTEGER,
  timer_start_time INTEGER,
  has_limited_offer INTEGER DEFAULT 0,
  limited_offer_text TEXT,
  affiliate_network TEXT DEFAULT 'top-picks',
  affiliate_network_id INTEGER,
  affiliate_tag_applied INTEGER DEFAULT 1,
  commission_rate REAL,
  telegram_message_id INTEGER,
  telegram_channel_id TEXT,
  processing_status TEXT DEFAULT 'active',
  message_group_id TEXT,
  product_sequence INTEGER DEFAULT 1,
  total_in_group INTEGER DEFAULT 1,
  click_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now')),
  expires_at INTEGER,
  display_pages TEXT DEFAULT 'top-picks',
  display_order INTEGER DEFAULT 0,
  gender TEXT,
  content_type TEXT DEFAULT 'product',
  source TEXT DEFAULT 'telegram'
);

CREATE TABLE IF NOT EXISTS apps_products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  price TEXT,
  original_price TEXT,
  currency TEXT DEFAULT 'INR',
  image_url TEXT,
  affiliate_url TEXT NOT NULL,
  category TEXT,
  rating TEXT,
  review_count TEXT,
  discount TEXT,
  is_featured INTEGER DEFAULT 0,
  processing_status TEXT DEFAULT 'active',
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now')),
  display_pages TEXT DEFAULT 'apps',
  source TEXT DEFAULT 'telegram'
);

CREATE TABLE IF NOT EXISTS loot_box_products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  price TEXT,
  original_price TEXT,
  currency TEXT DEFAULT 'INR',
  image_url TEXT,
  affiliate_url TEXT NOT NULL,
  category TEXT,
  rating TEXT,
  review_count TEXT,
  discount TEXT,
  is_featured INTEGER DEFAULT 0,
  processing_status TEXT DEFAULT 'active',
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now')),
  display_pages TEXT DEFAULT 'loot-box',
  source TEXT DEFAULT 'telegram'
);

CREATE TABLE IF NOT EXISTS deals_hub_products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  price TEXT,
  original_price TEXT,
  currency TEXT DEFAULT 'INR',
  image_url TEXT,
  affiliate_url TEXT NOT NULL,
  category TEXT,
  rating TEXT,
  review_count TEXT,
  discount TEXT,
  is_featured INTEGER DEFAULT 0,
  processing_status TEXT DEFAULT 'active',
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now')),
  display_pages TEXT DEFAULT 'deals-hub',
  source TEXT DEFAULT 'telegram'
);

CREATE TABLE IF NOT EXISTS amazon_products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  price TEXT DEFAULT '0',
  original_price TEXT,
  currency TEXT DEFAULT 'INR',
  image_url TEXT DEFAULT 'https://via.placeholder.com/300x300',
  affiliate_url TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  rating TEXT DEFAULT '4.0',
  review_count INTEGER DEFAULT 0,
  discount INTEGER DEFAULT 0,
  is_featured INTEGER DEFAULT 0,
  source TEXT DEFAULT 'telegram-prime-picks',
  telegram_message_id INTEGER,
  expires_at INTEGER,
  affiliate_link TEXT,
  display_pages TEXT DEFAULT '["prime-picks"]',
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS global_picks_products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  price TEXT,
  original_price TEXT,
  currency TEXT DEFAULT 'INR',
  image_url TEXT,
  affiliate_url TEXT NOT NULL,
  original_url TEXT,
  category TEXT,
  subcategory TEXT,
  rating TEXT,
  review_count TEXT,
  discount TEXT,
  is_featured INTEGER DEFAULT 0,
  is_new INTEGER DEFAULT 1,
  has_timer INTEGER DEFAULT 0,
  timer_duration INTEGER,
  timer_start_time INTEGER,
  has_limited_offer INTEGER DEFAULT 0,
  limited_offer_text TEXT,
  affiliate_network TEXT DEFAULT 'global-picks',
  affiliate_network_id INTEGER,
  affiliate_tag_applied INTEGER DEFAULT 1,
  commission_rate REAL,
  telegram_message_id INTEGER,
  telegram_channel_id TEXT,
  processing_status TEXT DEFAULT 'active',
  message_group_id TEXT,
  product_sequence INTEGER DEFAULT 1,
  total_in_group INTEGER DEFAULT 1,
  click_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now')),
  expires_at INTEGER,
  display_pages TEXT DEFAULT 'global-picks',
  display_order INTEGER DEFAULT 0,
  gender TEXT,
  content_type TEXT DEFAULT 'product',
  source TEXT DEFAULT 'telegram'
);
