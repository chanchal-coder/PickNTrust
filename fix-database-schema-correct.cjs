#!/usr/bin/env node
// Complete Database Schema Fix for PickNTrust - CORRECTED VERSION
// This script will fix all database schema issues on the CORRECT database file

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

console.log('🔧 Starting Complete Database Schema Fix (CORRECTED VERSION)...');
console.log('🎯 Target Database: database.sqlite');

// Connect to the CORRECT database file
const db = new Database('database.sqlite');

try {
  // Enable foreign keys
  db.exec('PRAGMA foreign_keys = ON;');
  
  console.log('📋 Current tables:', db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all());
  
  // Create missing page-specific product tables
  const productTables = [
    'amazon_products',
    'cuelinks_products', 
    'value_picks_products',
    'click_picks_products',
    'global_picks_products',
    'deals_hub_products',
    'lootbox_products',
    'travel_products'
  ];

  console.log('🏗️ Creating missing product tables...');
  
  for (const tableName of productTables) {
    console.log(`Creating ${tableName}...`);
    
    db.exec(`
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        price NUMERIC NOT NULL,
        originalPrice NUMERIC,
        discount NUMERIC DEFAULT 0,
        category TEXT NOT NULL,
        subcategory TEXT,
        imageUrl TEXT,
        affiliateUrl TEXT,
        affiliateNetworkId TEXT,
        rating NUMERIC DEFAULT 0,
        reviewCount INTEGER DEFAULT 0,
        isNew INTEGER DEFAULT 0,
        isFeatured INTEGER DEFAULT 0,
        isService INTEGER DEFAULT 0,
        customFields TEXT,
        hasTimer INTEGER DEFAULT 0,
        timerDuration TEXT,
        timerStartTime INTEGER,
        createdAt INTEGER DEFAULT (strftime('%s', 'now')),
        updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);
  }

  // Create other essential tables
  console.log('🏗️ Creating other essential tables...');
  
  // Exchange rates table
  db.exec(`
    CREATE TABLE IF NOT EXISTS exchange_rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_currency TEXT NOT NULL,
      to_currency TEXT NOT NULL,
      rate NUMERIC NOT NULL,
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Currency settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS currency_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      default_currency TEXT DEFAULT 'USD',
      supported_currencies TEXT DEFAULT '["USD", "EUR", "INR"]',
      auto_convert INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Widgets table
  db.exec(`
    CREATE TABLE IF NOT EXISTS widgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      config TEXT,
      is_active INTEGER DEFAULT 1,
      position INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Insert sample data into each product table
  console.log('📝 Inserting sample data...');
  
  const sampleProducts = [
    {
      name: 'Sample Product 1',
      description: 'This is a sample product for testing',
      price: 29.99,
      originalPrice: 39.99,
      discount: 25,
      category: 'Electronics',
      subcategory: 'Gadgets',
      imageUrl: 'https://via.placeholder.com/300x300',
      affiliateUrl: 'https://example.com/product1',
      rating: 4.5,
      reviewCount: 150,
      isFeatured: 1
    },
    {
      name: 'Sample Product 2',
      description: 'Another sample product for testing',
      price: 19.99,
      originalPrice: 24.99,
      discount: 20,
      category: 'Home',
      subcategory: 'Kitchen',
      imageUrl: 'https://via.placeholder.com/300x300',
      affiliateUrl: 'https://example.com/product2',
      rating: 4.2,
      reviewCount: 89,
      isNew: 1
    }
  ];

  for (const tableName of productTables) {
    console.log(`Inserting sample data into ${tableName}...`);
    
    const insertStmt = db.prepare(`
      INSERT INTO ${tableName} (
        name, description, price, originalPrice, discount, category, subcategory,
        imageUrl, affiliateUrl, rating, reviewCount, isFeatured, isNew
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const product of sampleProducts) {
      insertStmt.run(
        product.name,
        product.description,
        product.price,
        product.originalPrice,
        product.discount,
        product.category,
        product.subcategory,
        product.imageUrl,
        product.affiliateUrl,
        product.rating,
        product.reviewCount,
        product.isFeatured || 0,
        product.isNew || 0
      );
    }
  }

  // Insert default currency settings
  db.exec(`
    INSERT OR IGNORE INTO currency_settings (id, default_currency, supported_currencies, auto_convert)
    VALUES (1, 'USD', '["USD", "EUR", "INR", "GBP"]', 1)
  `);

  // Insert sample exchange rates
  const exchangeRates = [
    { from: 'USD', to: 'EUR', rate: 0.85 },
    { from: 'USD', to: 'INR', rate: 83.12 },
    { from: 'USD', to: 'GBP', rate: 0.79 },
    { from: 'EUR', to: 'USD', rate: 1.18 },
    { from: 'INR', to: 'USD', rate: 0.012 }
  ];

  const rateStmt = db.prepare(`
    INSERT OR REPLACE INTO exchange_rates (from_currency, to_currency, rate)
    VALUES (?, ?, ?)
  `);

  for (const rate of exchangeRates) {
    rateStmt.run(rate.from, rate.to, rate.rate);
  }

  // Final verification
  console.log('✅ Schema fix completed successfully!');
  console.log('📊 Final table count:', db.prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'").get().count);
  
  // Show sample data counts
  for (const tableName of productTables) {
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get().count;
    console.log(`📦 ${tableName}: ${count} products`);
  }

  console.log('🎉 Database schema fix completed on database.sqlite!');

} catch (error) {
  console.error('❌ Error during schema fix:', error.message);
  console.error(error.stack);
} finally {
  db.close();
}