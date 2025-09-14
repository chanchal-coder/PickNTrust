-- Fix Missing Database Tables for Telegram Bots
-- Run this SQL script to create missing tables identified by diagnostic

-- Create prime_picks_products table
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
);

-- Create cue_picks_products table
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
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prime_picks_created_at ON prime_picks_products(createdAt);
CREATE INDEX IF NOT EXISTS idx_prime_picks_category ON prime_picks_products(category);
CREATE INDEX IF NOT EXISTS idx_prime_picks_featured ON prime_picks_products(isFeatured);
CREATE INDEX IF NOT EXISTS idx_prime_picks_active ON prime_picks_products(processingStatus);

CREATE INDEX IF NOT EXISTS idx_cue_picks_created_at ON cue_picks_products(createdAt);
CREATE INDEX IF NOT EXISTS idx_cue_picks_category ON cue_picks_products(category);
CREATE INDEX IF NOT EXISTS idx_cue_picks_featured ON cue_picks_products(isFeatured);
CREATE INDEX IF NOT EXISTS idx_cue_picks_active ON cue_picks_products(processingStatus);

-- Verify tables were created
SELECT 'Tables created successfully:' as status;
SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%_picks_products';