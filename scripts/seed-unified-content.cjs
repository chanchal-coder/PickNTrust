const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

function resolveDbPath() {
  // Prefer DATABASE_URL if provided (support file: prefix)
  const envUrl = process.env.DATABASE_URL;
  if (envUrl && envUrl.length > 0) {
    if (envUrl.startsWith('file:')) {
      const p = envUrl.replace(/^file:/, '');
      return path.isAbsolute(p) ? p : path.join(process.cwd(), p);
    }
    return path.isAbsolute(envUrl) ? envUrl : path.join(process.cwd(), envUrl);
  }

  // Mirror server/config/database.ts behavior: prefer project root database.sqlite
  const cwdDb = path.join(process.cwd(), 'database.sqlite');
  const distRootFromServer = path.join(__dirname, '..', 'database.sqlite');
  const candidates = [
    cwdDb,
    distRootFromServer,
    path.join(process.cwd(), 'server', 'database.sqlite'),
    path.join(process.cwd(), 'sqlite.db')
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
    } catch (_) {}
  }
  return cwdDb; // default to root
}

function ensureUnifiedContentTable(db) {
  // Create a superset schema that satisfies storage-fixed-api.ts filters
  db.exec(`
    CREATE TABLE IF NOT EXISTS unified_content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      price TEXT,
      original_price TEXT,
      currency TEXT,
      image_url TEXT NOT NULL,
      affiliate_url TEXT NOT NULL,
      content_type TEXT,
      page_type TEXT,
      category TEXT,
      subcategory TEXT,
      source_type TEXT,
      source_id TEXT,
      affiliate_platform TEXT,
      rating TEXT,
      review_count INTEGER,
      discount INTEGER,
      visibility TEXT,
      processing_status TEXT,
      is_active INTEGER DEFAULT 1,
      is_featured INTEGER DEFAULT 0,
      display_order INTEGER DEFAULT 0,
      display_pages TEXT DEFAULT '["home"]',
      has_timer INTEGER DEFAULT 0,
      timer_duration INTEGER,
      timer_start_time INTEGER,
      status TEXT DEFAULT 'active',
      source_channel TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);
}

function seedProducts(db) {
  const rows = [
    {
      title: 'Prime Picks: Wireless Earbuds Pro',
      description: 'Noise-cancelling, long battery, Bluetooth 5.3',
      price: '₹2,999',
      original_price: '₹4,999',
      currency: 'INR',
      image_url: 'https://images.unsplash.com/photo-1585386959984-a41552231658?w=800',
      affiliate_url: 'https://www.amazon.in/dp/B0CXYZEAR?tag=primepicks-21',
      content_type: 'product',
      page_type: 'prime-picks',
      category: 'Audio',
      source_type: 'telegram',
      source_id: 'prime-picks',
      affiliate_platform: 'amazon',
      rating: '4.6',
      review_count: 2100,
      discount: 40,
      visibility: 'public',
      processing_status: 'processed',
      is_active: 1,
      is_featured: 1,
      display_pages: '["home","prime-picks"]',
      status: 'active'
    },
    {
      title: 'Value Picks: Smartwatch 2024',
      description: 'SpO2, GPS, 7-day battery, AMOLED',
      price: '₹3,499',
      original_price: '₹5,499',
      currency: 'INR',
      image_url: 'https://images.unsplash.com/photo-1518443907821-7953f5221aa2?w=800',
      affiliate_url: 'https://www.flipkart.com/item/B0CXYZWATCH?affid=primepicks-21',
      content_type: 'product',
      page_type: 'value-picks',
      category: 'Fitness',
      source_type: 'telegram',
      source_id: 'value-picks',
      affiliate_platform: 'flipkart',
      rating: '4.5',
      review_count: 980,
      discount: 36,
      visibility: 'public',
      processing_status: 'processed',
      is_active: 1,
      is_featured: 0,
      display_pages: '["home","value-picks"]',
      status: 'active'
    },
    {
      title: 'Cue Picks: Mechanical Keyboard',
      description: 'RGB, Blue switches, hot-swappable',
      price: '₹4,199',
      original_price: '₹6,499',
      currency: 'INR',
      image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
      affiliate_url: 'https://www.amazon.in/dp/B0CKEYBRD?tag=primepicks-21',
      content_type: 'product',
      page_type: 'cue-picks',
      category: 'Electronics',
      source_type: 'telegram',
      source_id: 'cue-picks',
      affiliate_platform: 'amazon',
      rating: '4.7',
      review_count: 1250,
      discount: 35,
      visibility: 'public',
      processing_status: 'processed',
      is_active: 1,
      is_featured: 1,
      display_pages: '["home","cue-picks"]',
      status: 'active'
    },
    {
      title: 'Home Picks: Air Fryer XL',
      description: 'Rapid heat tech, 6.5L, easy clean',
      price: '₹5,499',
      original_price: '₹8,999',
      currency: 'INR',
      image_url: 'https://images.unsplash.com/photo-1526318472351-c75fd1fc5c0f?w=800',
      affiliate_url: 'https://www.amazon.in/dp/B0CAFRYER?tag=primepicks-21',
      content_type: 'product',
      page_type: 'home-picks',
      category: 'Home',
      source_type: 'telegram',
      source_id: 'home-picks',
      affiliate_platform: 'amazon',
      rating: '4.4',
      review_count: 760,
      discount: 39,
      visibility: 'public',
      processing_status: 'processed',
      is_active: 1,
      is_featured: 0,
      display_pages: '["home","home-picks"]',
      status: 'active'
    }
  ];

  const insert = db.prepare(`
    INSERT INTO unified_content (
      title, description, price, original_price, currency,
      image_url, affiliate_url, content_type, page_type, category,
      source_type, source_id, affiliate_platform, rating, review_count,
      discount, visibility, processing_status, is_active, is_featured,
      display_pages, status, created_at, updated_at
    ) VALUES (
      @title, @description, @price, @original_price, @currency,
      @image_url, @affiliate_url, @content_type, @page_type, @category,
      @source_type, @source_id, @affiliate_platform, @rating, @review_count,
      @discount, @visibility, @processing_status, @is_active, @is_featured,
      @display_pages, @status, strftime('%s','now'), strftime('%s','now')
    )
  `);

  let inserted = 0;
  const txn = db.transaction((items) => {
    for (const item of items) {
      insert.run(item);
      inserted += 1;
    }
  });
  txn(rows);
  return inserted;
}

function main() {
  const dbPath = resolveDbPath();
  console.log('📦 Using database at:', dbPath);
  const db = new Database(dbPath);
  ensureUnifiedContentTable(db);
  const before = db.prepare('SELECT COUNT(*) as c FROM unified_content').get().c;
  const inserted = seedProducts(db);
  const after = db.prepare('SELECT COUNT(*) as c FROM unified_content').get().c;
  const sample = db.prepare(`SELECT id, title, category, is_featured as isFeatured FROM unified_content ORDER BY id DESC LIMIT 2`).all();
  db.close();
  console.log(`✅ Inserted ${inserted} products. Count before=${before}, after=${after}`);
  console.log('📝 Sample rows:', sample);
}

main();