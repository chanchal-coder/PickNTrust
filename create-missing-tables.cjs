// Create Missing Database Tables for Telegram Bots
const Database = require('better-sqlite3');
const fs = require('fs');

console.log('🔧 Creating missing database tables...');

try {
  const db = new Database('database.sqlite');
  
  console.log('📋 Creating prime_picks_products table...');
  
  // Create prime_picks_products table
  db.exec(`
    CREATE TABLE IF NOT EXISTS prime_picks_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price TEXT,
      originalPrice TEXT,
      currency TEXT DEFAULT 'INR',
      imageUrl TEXT,
      affiliateUrl TEXT NOT NULL,
      originalUrl TEXT,
      category TEXT,
      subcategory TEXT,
      rating TEXT,
      reviewCount TEXT,
      discount TEXT,
      isFeatured INTEGER DEFAULT 0,
      isNew INTEGER DEFAULT 1,
      hasTimer INTEGER DEFAULT 0,
      timerDuration INTEGER,
      timerStartTime INTEGER,
      hasLimitedOffer INTEGER DEFAULT 0,
      limitedOfferText TEXT,
      affiliateNetwork TEXT DEFAULT 'prime-picks',
      affiliateNetworkId INTEGER,
      affiliateTagApplied INTEGER DEFAULT 1,
      commissionRate REAL,
      telegramMessageId INTEGER,
      telegramChannelId TEXT,
      processingStatus TEXT DEFAULT 'active',
      messageGroupId TEXT,
      productSequence INTEGER DEFAULT 1,
      totalInGroup INTEGER DEFAULT 1,
      sourceDomain TEXT,
      sourceMetadata TEXT,
      scrapingMethod TEXT DEFAULT 'universal',
      clickCount INTEGER DEFAULT 0,
      conversionCount INTEGER DEFAULT 0,
      createdAt INTEGER DEFAULT (strftime('%s', 'now')),
      updatedAt INTEGER DEFAULT (strftime('%s', 'now')),
      expiresAt INTEGER,
      displayPages TEXT DEFAULT 'prime-picks',
      displayOrder INTEGER DEFAULT 0,
      gender TEXT,
      contentType TEXT DEFAULT 'product',
      source TEXT DEFAULT 'telegram'
    )
  `);
  
  console.log('📋 Creating cue_picks_products table...');
  
  // Create cue_picks_products table
  db.exec(`
    CREATE TABLE IF NOT EXISTS cue_picks_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price TEXT,
      originalPrice TEXT,
      currency TEXT DEFAULT 'INR',
      imageUrl TEXT,
      affiliateUrl TEXT NOT NULL,
      originalUrl TEXT,
      category TEXT,
      subcategory TEXT,
      rating TEXT,
      reviewCount TEXT,
      discount TEXT,
      isFeatured INTEGER DEFAULT 0,
      isNew INTEGER DEFAULT 1,
      hasTimer INTEGER DEFAULT 0,
      timerDuration INTEGER,
      timerStartTime INTEGER,
      hasLimitedOffer INTEGER DEFAULT 0,
      limitedOfferText TEXT,
      affiliateNetwork TEXT DEFAULT 'cue-picks',
      affiliateNetworkId INTEGER,
      affiliateTagApplied INTEGER DEFAULT 1,
      commissionRate REAL,
      telegramMessageId INTEGER,
      telegramChannelId TEXT,
      processingStatus TEXT DEFAULT 'active',
      messageGroupId TEXT,
      productSequence INTEGER DEFAULT 1,
      totalInGroup INTEGER DEFAULT 1,
      sourceDomain TEXT,
      sourceMetadata TEXT,
      scrapingMethod TEXT DEFAULT 'universal',
      clickCount INTEGER DEFAULT 0,
      conversionCount INTEGER DEFAULT 0,
      createdAt INTEGER DEFAULT (strftime('%s', 'now')),
      updatedAt INTEGER DEFAULT (strftime('%s', 'now')),
      expiresAt INTEGER,
      displayPages TEXT DEFAULT 'cue-picks',
      displayOrder INTEGER DEFAULT 0,
      gender TEXT,
      contentType TEXT DEFAULT 'product',
      source TEXT DEFAULT 'telegram'
    )
  `);
  
  console.log('📋 Creating performance indexes...');
  
  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_prime_picks_created_at ON prime_picks_products(createdAt);
    CREATE INDEX IF NOT EXISTS idx_prime_picks_category ON prime_picks_products(category);
    CREATE INDEX IF NOT EXISTS idx_prime_picks_featured ON prime_picks_products(isFeatured);
    CREATE INDEX IF NOT EXISTS idx_prime_picks_active ON prime_picks_products(processingStatus);
    
    CREATE INDEX IF NOT EXISTS idx_cue_picks_created_at ON cue_picks_products(createdAt);
    CREATE INDEX IF NOT EXISTS idx_cue_picks_category ON cue_picks_products(category);
    CREATE INDEX IF NOT EXISTS idx_cue_picks_featured ON cue_picks_products(isFeatured);
    CREATE INDEX IF NOT EXISTS idx_cue_picks_active ON cue_picks_products(processingStatus);
  `);
  
  // Verify tables were created
  console.log('\n✅ Verifying table creation...');
  const tables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name LIKE '%_picks_products'
    ORDER BY name
  `).all();
  
  console.log('📊 Created tables:');
  tables.forEach(table => {
    console.log(`   ✅ ${table.name}`);
    
    // Check table structure
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
    console.log(`      Records: ${count.count}`);
  });
  
  db.close();
  console.log('\n🎉 Database tables created successfully!');
  console.log('📝 Missing tables issue resolved');
  
} catch (error) {
  console.error('❌ Error creating tables:', error.message);
  process.exit(1);
}