// Creates unified_content table in database.sqlite with required columns
const Database = require('better-sqlite3');

const DB_PATH = './database.sqlite';
const db = new Database(DB_PATH);

const ddl = `
CREATE TABLE IF NOT EXISTS unified_content (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  price REAL,
  original_price REAL,
  image_url TEXT,
  affiliate_url TEXT,
  affiliate_urls TEXT,
  content_type TEXT NOT NULL, -- e.g., 'service' | 'app' | 'product'
  page_type TEXT,             -- optional page grouping
  category TEXT,
  subcategory TEXT,
  tags TEXT,
  brand TEXT,
  source_platform TEXT,
  media_urls TEXT,
  is_active INTEGER DEFAULT 1,
  is_featured INTEGER DEFAULT 0,
  display_pages TEXT DEFAULT '["home"]',
  status TEXT,                -- legacy status if some scripts rely on it
  visibility TEXT,            -- legacy visibility if some scripts rely on it
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
`;

db.exec(ddl);

// Ensure minimal seed so APIs return data
const seed = db.prepare(`
INSERT INTO unified_content (
  title, description, price, image_url, affiliate_url,
  content_type, category, is_active, display_pages
) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
`);

// Seed service
seed.run(
  'Sample Home Cleaning',
  'Professional home cleaning service',
  49.99,
  'https://via.placeholder.com/300x200?text=Service',
  'https://example.com/cleaning',
  'service',
  'Home Services',
  JSON.stringify(['home','services'])
);

// Seed app
seed.run(
  'Budget Tracker App',
  'Track expenses and savings easily',
  0.0,
  'https://via.placeholder.com/300x200?text=App',
  'https://example.com/budget-app',
  'app',
  'Finance',
  JSON.stringify(['home','apps'])
);

console.log('✅ unified_content table ensured and sample rows inserted.');