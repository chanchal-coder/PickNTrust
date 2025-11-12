const Database = require('better-sqlite3');
const fs = require('fs');

console.log('🔧 Fixing Database Schema Issues Properly...');

function fixDatabase() {
  // Check which database file exists
  const dbFile = fs.existsSync('database.sqlite') ? 'database.sqlite' : 'sqlite.db';
  console.log(`Using database file: ${dbFile}`);
  
  const db = new Database(dbFile);
  
  try {
    console.log('📋 Current tables:');
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    tables.forEach(t => console.log(`  - ${t.name}`));
    
    // Create missing tables first
    console.log('\n🏗️ Creating missing tables...');
    
    // Create blogPosts table
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS blogPosts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          excerpt TEXT,
          content TEXT NOT NULL,
          category TEXT,
          tags TEXT,
          imageUrl TEXT,
          videoUrl TEXT,
          publishedAt INTEGER,
          createdAt INTEGER DEFAULT (strftime('%s', 'now')),
          readTime INTEGER,
          slug TEXT UNIQUE,
          hasTimer INTEGER DEFAULT 0,
          timerDuration INTEGER,
          timerStartTime INTEGER
        )
      `);
      console.log('✅ Created blogPosts table');
    } catch (e) {
      console.log('⚠️ blogPosts table already exists or error:', e.message);
    }
    
    // Create newsletterSubscribers table
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS newsletterSubscribers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          subscribedAt INTEGER DEFAULT (strftime('%s', 'now'))
        )
      `);
      console.log('✅ Created newsletterSubscribers table');
    } catch (e) {
      console.log('⚠️ newsletterSubscribers table already exists or error:', e.message);
    }
    
    // Create affiliateNetworks table
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS affiliateNetworks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          description TEXT,
          commissionRate REAL,
          trackingParams TEXT,
          logoUrl TEXT,
          isActive INTEGER DEFAULT 1,
          joinUrl TEXT
        )
      `);
      console.log('✅ Created affiliateNetworks table');
    } catch (e) {
      console.log('⚠️ affiliateNetworks table already exists or error:', e.message);
    }
    
    // Create adminUsers table
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS adminUsers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          passwordHash TEXT NOT NULL,
          role TEXT DEFAULT 'admin',
          isActive INTEGER DEFAULT 1,
          lastLogin INTEGER,
          createdAt INTEGER DEFAULT (strftime('%s', 'now'))
        )
      `);
      console.log('✅ Created adminUsers table');
    } catch (e) {
      console.log('⚠️ adminUsers table already exists or error:', e.message);
    }
    
    // Create videoContent table
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS videoContent (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          videoUrl TEXT NOT NULL,
          thumbnailUrl TEXT,
          category TEXT,
          tags TEXT,
          duration INTEGER,
          viewCount INTEGER DEFAULT 0,
          isActive INTEGER DEFAULT 1,
          createdAt INTEGER DEFAULT (strftime('%s', 'now'))
        )
      `);
      console.log('✅ Created videoContent table');
    } catch (e) {
      console.log('⚠️ videoContent table already exists or error:', e.message);
    }
    
    // Add missing columns to existing tables
    console.log('\n🔧 Adding missing columns to existing tables...');
    
    // Check if products table exists and add missing columns
    const productsExists = tables.some(t => t.name === 'products');
    if (productsExists) {
      const productColumns = db.prepare("PRAGMA table_info(products)").all();
      const existingColumns = productColumns.map(col => col.name);
      
      const requiredColumns = [
        { name: 'subcategory', type: 'TEXT' },
        { name: 'currency', type: "TEXT DEFAULT 'INR'" },
        { name: 'originalPrice', type: 'TEXT' },
        { name: 'imageUrl', type: 'TEXT' },
        { name: 'affiliateUrl', type: 'TEXT' },
        { name: 'affiliateNetworkId', type: 'INTEGER' },
        { name: 'reviewCount', type: 'INTEGER' },
        { name: 'isNew', type: 'INTEGER DEFAULT 0' },
        { name: 'isFeatured', type: 'INTEGER DEFAULT 0' },
        { name: 'isService', type: 'INTEGER DEFAULT 0' },
        { name: 'customFields', type: 'TEXT' },
        { name: 'pricingType', type: 'TEXT' },
        { name: 'monthlyPrice', type: 'TEXT' },
        { name: 'yearlyPrice', type: 'TEXT' },
        { name: 'isFree', type: 'INTEGER DEFAULT 0' },
        { name: 'priceDescription', type: 'TEXT' },
        { name: 'hasTimer', type: 'INTEGER DEFAULT 0' },
        { name: 'timerDuration', type: 'INTEGER' },
        { name: 'timerStartTime', type: 'INTEGER' },
        { name: 'createdAt', type: 'INTEGER DEFAULT (strftime(\'%s\', \'now\'))' }
      ];
      
      for (const col of requiredColumns) {
        if (!existingColumns.includes(col.name)) {
          try {
            db.exec(`ALTER TABLE products ADD COLUMN ${col.name} ${col.type}`);
            console.log(`✅ Added ${col.name} to products table`);
          } catch (e) {
            console.log(`⚠️ Failed to add ${col.name}:`, e.message);
          }
        }
      }
    }
    
    // Check if announcements table exists and add missing columns
    const announcementsExists = tables.some(t => t.name === 'announcements');
    if (announcementsExists) {
      const announcementColumns = db.prepare("PRAGMA table_info(announcements)").all();
      const existingColumns = announcementColumns.map(col => col.name);
      
      const requiredColumns = [
        { name: 'isActive', type: 'INTEGER DEFAULT 1' },
        { name: 'textColor', type: 'TEXT' },
        { name: 'backgroundColor', type: 'TEXT' },
        { name: 'fontSize', type: 'TEXT' },
        { name: 'fontWeight', type: 'TEXT' },
        { name: 'textDecoration', type: 'TEXT' },
        { name: 'fontStyle', type: 'TEXT' },
        { name: 'animationSpeed', type: 'TEXT' },
        { name: 'textBorderWidth', type: 'TEXT' },
        { name: 'textBorderStyle', type: 'TEXT' },
        { name: 'textBorderColor', type: 'TEXT' },
        { name: 'bannerBorderWidth', type: 'TEXT' },
        { name: 'bannerBorderStyle', type: 'TEXT' },
        { name: 'bannerBorderColor', type: 'TEXT' },
        { name: 'createdAt', type: 'INTEGER DEFAULT (strftime(\'%s\', \'now\'))' }
      ];
      
      for (const col of requiredColumns) {
        if (!existingColumns.includes(col.name)) {
          try {
            db.exec(`ALTER TABLE announcements ADD COLUMN ${col.name} ${col.type}`);
            console.log(`✅ Added ${col.name} to announcements table`);
          } catch (e) {
            console.log(`⚠️ Failed to add ${col.name}:`, e.message);
          }
        }
      }
    }
    
    console.log('\n✅ Database schema fix completed successfully!');
    
    // Verify the fixes
    console.log('\n📋 Final table list:');
    const finalTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    finalTables.forEach(t => console.log(`  - ${t.name}`));
    
  } catch (error) {
    console.error('❌ Error fixing database schema:', error);
  } finally {
    db.close();
  }
}

// Run the fix
fixDatabase();