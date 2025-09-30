PRAGMA journal_mode=WAL;

-- Meta tags table
CREATE TABLE IF NOT EXISTS meta_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  provider TEXT NOT NULL,
  purpose TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Clear and seed a basic verification tag
DELETE FROM meta_tags;
INSERT INTO meta_tags (name, content, provider, purpose, is_active)
VALUES ('google-site-verification', 'verify-token', 'Google', 'Site Verification', 1);

-- RSS feeds table
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
);

-- Clear and seed a sample RSS feed
DELETE FROM rss_feeds;
INSERT INTO rss_feeds (name, url, description, category, update_frequency, is_active, auto_import, content_filter, affiliate_replace)
VALUES ('Sample Feed', 'https://example.com/rss', 'Example RSS feed', 'general', 60, 1, 1, NULL, 0);