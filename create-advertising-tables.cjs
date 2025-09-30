const Database = require('better-sqlite3');
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, 'server', 'database.sqlite');
const db = new Database(dbPath);

console.log('🗄️ Creating advertising system tables...\n');

try {
  // 1. Advertisers Table
  console.log('Creating advertisers table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS advertisers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT NOT NULL,
      contact_person TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      website_url TEXT,
      business_type TEXT,
      registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'suspended')),
      payment_method TEXT,
      billing_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. Ad Placements Table
  console.log('Creating ad_placements table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS ad_placements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      placement_name TEXT NOT NULL,
      placement_type TEXT NOT NULL,
      page_location TEXT NOT NULL,
      dimensions TEXT NOT NULL,
      pricing_cpm DECIMAL(10,2),
      pricing_cpc DECIMAL(10,2),
      max_ads_per_slot INTEGER DEFAULT 1,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 3. Ad Campaigns Table
  console.log('Creating ad_campaigns table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS ad_campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      advertiser_id INTEGER NOT NULL,
      campaign_name TEXT NOT NULL,
      campaign_type TEXT NOT NULL CHECK (campaign_type IN ('banner', 'native', 'sponsored_product')),
      budget_total DECIMAL(10,2),
      budget_daily DECIMAL(10,2),
      start_date DATE,
      end_date DATE,
      status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
      targeting_options TEXT, -- JSON string
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (advertiser_id) REFERENCES advertisers(id)
    )
  `);

  // 4. Ad Creatives Table
  console.log('Creating ad_creatives table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS ad_creatives (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER NOT NULL,
      ad_title TEXT NOT NULL,
      ad_description TEXT,
      image_url TEXT,
      click_url TEXT NOT NULL,
      ad_size TEXT NOT NULL,
      ad_type TEXT NOT NULL CHECK (ad_type IN ('banner', 'native', 'video')),
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (campaign_id) REFERENCES ad_campaigns(id)
    )
  `);

  // 5. Ad Performance Table
  console.log('Creating ad_performance table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS ad_performance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      creative_id INTEGER NOT NULL,
      placement_id INTEGER NOT NULL,
      impressions INTEGER DEFAULT 0,
      clicks INTEGER DEFAULT 0,
      conversions INTEGER DEFAULT 0,
      revenue DECIMAL(10,2) DEFAULT 0,
      date DATE NOT NULL,
      hour INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (creative_id) REFERENCES ad_creatives(id),
      FOREIGN KEY (placement_id) REFERENCES ad_placements(id)
    )
  `);

  // 6. Advertiser Payments Table
  console.log('Creating advertiser_payments table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS advertiser_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      advertiser_id INTEGER NOT NULL,
      campaign_id INTEGER,
      amount DECIMAL(10,2) NOT NULL,
      payment_method TEXT,
      transaction_id TEXT,
      payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
      payment_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (advertiser_id) REFERENCES advertisers(id),
      FOREIGN KEY (campaign_id) REFERENCES ad_campaigns(id)
    )
  `);

  // Insert default ad placements
  console.log('Inserting default ad placements...');
  const insertPlacements = db.prepare(`
    INSERT OR IGNORE INTO ad_placements 
    (placement_name, placement_type, page_location, dimensions, pricing_cpm, pricing_cpc, max_ads_per_slot)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const placements = [
    ['Homepage Hero Banner', 'banner', 'homepage_top', '728x90', 5.00, 0.50, 1],
    ['Sidebar Banner', 'banner', 'sidebar', '300x250', 3.00, 0.30, 2],
    ['Category Top Banner', 'banner', 'category_top', '728x90', 4.00, 0.40, 1],
    ['Product Page Banner', 'banner', 'product_page', '300x250', 3.50, 0.35, 1],
    ['Native Content Slot', 'native', 'content_feed', 'responsive', 8.00, 0.80, 3],
    ['Footer Banner', 'banner', 'footer', '728x90', 2.00, 0.20, 1]
  ];

  placements.forEach(placement => {
    insertPlacements.run(...placement);
  });

  // Create indexes for better performance
  console.log('Creating indexes...');
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_advertisers_email ON advertisers(email);
    CREATE INDEX IF NOT EXISTS idx_advertisers_status ON advertisers(status);
    CREATE INDEX IF NOT EXISTS idx_campaigns_advertiser ON ad_campaigns(advertiser_id);
    CREATE INDEX IF NOT EXISTS idx_campaigns_status ON ad_campaigns(status);
    CREATE INDEX IF NOT EXISTS idx_creatives_campaign ON ad_creatives(campaign_id);
    CREATE INDEX IF NOT EXISTS idx_performance_date ON ad_performance(date);
    CREATE INDEX IF NOT EXISTS idx_performance_creative ON ad_performance(creative_id);
    CREATE INDEX IF NOT EXISTS idx_payments_advertiser ON advertiser_payments(advertiser_id);
  `);

  console.log('\n✅ All advertising tables created successfully!');
  
  // Show table counts
  const tables = ['advertisers', 'ad_placements', 'ad_campaigns', 'ad_creatives', 'ad_performance', 'advertiser_payments'];
  console.log('\n📊 Table Summary:');
  tables.forEach(table => {
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
    console.log(`${table}: ${count.count} records`);
  });

} catch (error) {
  console.error('❌ Error creating tables:', error.message);
} finally {
  db.close();
}