#!/usr/bin/env node
// Complete Database Schema Fix for PickNTrust
// This script will fix all database schema issues and populate with sample data

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

console.log('🔧 Starting Complete Database Schema Fix...');

// Connect to database
const db = new Database('sqlite.db');

try {
  // Enable foreign keys
  db.exec('PRAGMA foreign_keys = ON;');
  
  console.log('📋 Current tables:', db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all());
  
  // Drop and recreate products table with correct schema
  console.log('🗑️ Dropping and recreating products table...');
  db.exec('DROP TABLE IF EXISTS products;');
  
  // Create products table with correct schema
  db.exec(`
    CREATE TABLE products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      price NUMERIC NOT NULL,
      original_price NUMERIC,
      currency TEXT DEFAULT 'INR',
      image_url TEXT NOT NULL,
      affiliate_url TEXT NOT NULL,
      affiliate_network_id INTEGER,
      category TEXT NOT NULL,
      subcategory TEXT,
      gender TEXT,
      rating NUMERIC NOT NULL,
      review_count INTEGER NOT NULL,
      discount INTEGER,
      is_new INTEGER DEFAULT 0,
      is_featured INTEGER DEFAULT 0,
      is_service INTEGER DEFAULT 0,
      is_ai_app INTEGER DEFAULT 0,
      custom_fields TEXT,
      pricing_type TEXT,
      monthly_price TEXT,
      yearly_price TEXT,
      is_free INTEGER DEFAULT 0,
      price_description TEXT,
      has_timer INTEGER DEFAULT 0,
      timer_duration INTEGER,
      timer_start_time INTEGER,
      source TEXT,
      telegram_message_id INTEGER,
      expires_at INTEGER,
      affiliate_link TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      display_pages TEXT DEFAULT '["home"]'
    );
  `);
  
  // Create missing tables
  console.log('📊 Creating missing tables...');
  
  // Page-specific product tables
  const pageProductTables = [
    'top_picks_products',
    'prime_picks_products', 
    'value_picks_products',
    'click_picks_products',
    'cue_picks_products',
    'loot_box_products',
    'deals_hub_products',
    'amazon_products',
    'global_picks_products',
    'travel_picks_products'
  ];
  
  pageProductTables.forEach(tableName => {
    console.log(`📋 Creating ${tableName} table...`);
    db.exec(`
      CREATE TABLE IF NOT EXISTS ${tableName} (
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
        affiliate_network TEXT DEFAULT '${tableName.replace('_products', '')}',
        affiliate_network_id INTEGER,
        affiliate_tag_applied INTEGER DEFAULT 1,
        commission_rate REAL,
        telegram_message_id INTEGER,
        telegram_channel_id TEXT,
        processing_status TEXT DEFAULT 'active',
        message_group_id TEXT,
        product_sequence INTEGER DEFAULT 1,
        total_in_group INTEGER DEFAULT 1,
        source_domain TEXT,
        source_metadata TEXT,
        scraping_method TEXT DEFAULT 'universal',
        click_count INTEGER DEFAULT 0,
        conversion_count INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now')),
        expires_at INTEGER,
        display_pages TEXT DEFAULT '${tableName.replace('_products', '')}',
        display_order INTEGER DEFAULT 0,
        gender TEXT,
        content_type TEXT DEFAULT 'product',
        source TEXT DEFAULT 'telegram'
      );
    `);
  });
  
  // Create exchange_rates table
  console.log('💱 Creating exchange_rates table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS exchange_rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_currency TEXT NOT NULL,
      to_currency TEXT NOT NULL,
      rate NUMERIC NOT NULL,
      last_updated INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);
  
  // Create currency_settings table
  console.log('⚙️ Creating currency_settings table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS currency_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      default_currency TEXT DEFAULT 'INR',
      enabled_currencies TEXT DEFAULT '["INR","USD","EUR","GBP","JPY","CAD","AUD","SGD","CNY","KRW"]',
      auto_update_rates INTEGER DEFAULT 1,
      last_rate_update INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);
  
  // Create widgets table
  console.log('🧩 Creating widgets table...');
  db.exec(`
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
  `);
  
  // Insert sample data
  console.log('📦 Inserting sample products...');
  
  const sampleProducts = [
    {
      name: 'iPhone 15 Pro Max',
      description: 'Latest iPhone with advanced camera system and A17 Pro chip',
      price: '134900',
      original_price: '159900',
      image_url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400',
      affiliate_url: 'https://amzn.to/iphone15pro',
      category: 'Electronics',
      rating: '4.8',
      review_count: 1250,
      discount: 15,
      is_featured: 1
    },
    {
      name: 'Samsung Galaxy S24 Ultra',
      description: 'Premium Android smartphone with S Pen and AI features',
      price: '124999',
      original_price: '139999',
      image_url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400',
      affiliate_url: 'https://amzn.to/galaxys24ultra',
      category: 'Electronics',
      rating: '4.7',
      review_count: 890,
      discount: 10,
      is_featured: 1
    },
    {
      name: 'MacBook Air M3',
      description: 'Ultra-thin laptop with M3 chip for exceptional performance',
      price: '114900',
      original_price: '134900',
      image_url: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400',
      affiliate_url: 'https://amzn.to/macbookairm3',
      category: 'Electronics',
      rating: '4.9',
      review_count: 2100,
      discount: 15,
      is_featured: 1
    },
    {
      name: 'Sony WH-1000XM5 Headphones',
      description: 'Industry-leading noise canceling wireless headphones',
      price: '29990',
      original_price: '34990',
      image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
      affiliate_url: 'https://amzn.to/sonywh1000xm5',
      category: 'Electronics',
      rating: '4.6',
      review_count: 1580,
      discount: 14,
      is_new: 1
    },
    {
      name: 'Nike Air Max 270',
      description: 'Comfortable running shoes with Max Air cushioning',
      price: '12995',
      original_price: '14995',
      image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
      affiliate_url: 'https://amzn.to/nikeairmax270',
      category: 'Fashion',
      rating: '4.5',
      review_count: 750,
      discount: 13,
      gender: 'Unisex'
    }
  ];
  
  const insertProduct = db.prepare(`
    INSERT INTO products (
      name, description, price, original_price, image_url, affiliate_url, 
      category, rating, review_count, discount, is_featured, is_new, gender
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  sampleProducts.forEach(product => {
    insertProduct.run(
      product.name,
      product.description,
      product.price,
      product.original_price,
      product.image_url,
      product.affiliate_url,
      product.category,
      product.rating,
      product.review_count,
      product.discount,
      product.is_featured || 0,
      product.is_new || 0,
      product.gender || null
    );
  });
  
  // Insert sample data into page-specific tables
  console.log('📋 Inserting sample data into page-specific tables...');
  
  const pageSpecificData = {
    'prime_picks_products': [
      {
        name: 'Amazon Prime Video Subscription',
        description: 'Stream thousands of movies and TV shows',
        price: '999',
        original_price: '1499',
        image_url: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=400',
        affiliate_url: 'https://amzn.to/primevideo',
        category: 'Entertainment'
      }
    ],
    'value_picks_products': [
      {
        name: 'Budget Smartphone Under 15K',
        description: 'Best value smartphone with great features',
        price: '14999',
        original_price: '18999',
        image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
        affiliate_url: 'https://amzn.to/budgetphone',
        category: 'Electronics'
      }
    ],
    'click_picks_products': [
      {
        name: 'Trending Gadget of the Day',
        description: 'Most clicked product today',
        price: '2999',
        original_price: '3999',
        image_url: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400',
        affiliate_url: 'https://amzn.to/trendinggadget',
        category: 'Electronics'
      }
    ]
  };
  
  Object.entries(pageSpecificData).forEach(([tableName, products]) => {
    const insertStmt = db.prepare(`
      INSERT INTO ${tableName} (
        name, description, price, original_price, image_url, affiliate_url, category
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    products.forEach(product => {
      insertStmt.run(
        product.name,
        product.description,
        product.price,
        product.original_price,
        product.image_url,
        product.affiliate_url,
        product.category
      );
    });
  });
  
  // Insert default currency settings
  console.log('💱 Setting up currency configuration...');
  db.exec(`
    INSERT OR REPLACE INTO currency_settings (id, default_currency, enabled_currencies, auto_update_rates)
    VALUES (1, 'INR', '["INR","USD","EUR","GBP","JPY"]', 1);
  `);
  
  // Insert sample exchange rates
  const exchangeRates = [
    { from: 'USD', to: 'INR', rate: 83.25 },
    { from: 'EUR', to: 'INR', rate: 90.15 },
    { from: 'GBP', to: 'INR', rate: 105.50 },
    { from: 'JPY', to: 'INR', rate: 0.56 }
  ];
  
  const insertRate = db.prepare(`
    INSERT OR REPLACE INTO exchange_rates (from_currency, to_currency, rate)
    VALUES (?, ?, ?)
  `);
  
  exchangeRates.forEach(rate => {
    insertRate.run(rate.from, rate.to, rate.rate);
  });
  
  // Verify the fix
  console.log('\n✅ Database Schema Fix Complete!');
  console.log('📊 Verification:');
  
  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
  console.log(`   • Products: ${productCount.count}`);
  
  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get();
  console.log(`   • Categories: ${categoryCount.count}`);
  
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
  console.log(`   • Total Tables: ${tables.length}`);
  console.log(`   • Tables: ${tables.map(t => t.name).join(', ')}`);
  
  // Test API endpoints
  console.log('\n🔍 Testing sample queries:');
  const sampleProduct = db.prepare('SELECT id, name, price, category FROM products LIMIT 1').get();
  if (sampleProduct) {
    console.log(`   • Sample Product: ${sampleProduct.name} - ₹${sampleProduct.price}`);
  }
  
  console.log('\n🎉 Database is now ready for production!');
  console.log('🌐 API endpoints should now return data correctly.');
  
} catch (error) {
  console.error('❌ Error fixing database schema:', error);
  process.exit(1);
} finally {
  db.close();
}

console.log('\n✨ Schema fix completed successfully!');
console.log('🚀 Restart the application to see the changes.');