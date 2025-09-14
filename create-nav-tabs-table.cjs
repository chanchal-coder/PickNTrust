const Database = require('better-sqlite3');
const fs = require('fs');

console.log('🔧 Creating navigation tabs table...');

// Find the database file
let dbPath = 'database.sqlite';
if (!fs.existsSync(dbPath)) {
  dbPath = 'sqlite.db';
  if (!fs.existsSync(dbPath)) {
    console.error('Error Database file not found!');
    process.exit(1);
  }
}

console.log(`📂 Using database: ${dbPath}`);

try {
  const db = new Database(dbPath);
  
  // Check if nav_tabs table already exists
  const tableExists = db.prepare(`
    SELECT name FROM sqlite_master WHERE type='table' AND name='nav_tabs'
  `).get();
  
  if (tableExists) {
    console.log('Success nav_tabs table already exists');
  } else {
    console.log('➕ Creating nav_tabs table...');
    
    // Create the nav_tabs table
    db.prepare(`
      CREATE TABLE nav_tabs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        icon TEXT NOT NULL DEFAULT 'fas fa-star',
        color_from TEXT NOT NULL DEFAULT '#3B82F6',
        color_to TEXT NOT NULL DEFAULT '#1D4ED8',
        display_order INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT 1,
        is_system BOOLEAN NOT NULL DEFAULT 0,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    
    console.log('Success nav_tabs table created successfully');
    
    // Insert existing system tabs
    console.log('➕ Adding existing system navigation tabs...');
    
    const systemTabs = [
      {
        name: 'Prime Picks',
        slug: 'prime-picks',
        icon: 'fas fa-crown',
        color_from: '#8B5CF6',
        color_to: '#7C3AED',
        display_order: 1,
        description: 'Premium curated products'
      },
      {
        name: 'Cue Picks',
        slug: 'cue-picks',
        icon: 'fas fa-bullseye',
        color_from: '#06B6D4',
        color_to: '#0891B2',
        display_order: 2,
        description: 'Smart selections curated with precision'
      },
      {
        name: 'Value Picks',
        slug: 'value-picks',
        icon: 'fas fa-gem',
        color_from: '#F59E0B',
        color_to: '#D97706',
        display_order: 3,
        description: 'Best value for money products'
      },
      {
        name: 'Click Picks',
        slug: 'click-picks',
        icon: 'fas fa-mouse-pointer',
        color_from: '#3B82F6',
        color_to: '#1D4ED8',
        display_order: 4,
        description: 'Most popular and trending products'
      },
      {
        name: 'Deals Hub',
        slug: 'deals-hub',
        icon: 'fas fa-fire',
        color_from: '#EF4444',
        color_to: '#DC2626',
        display_order: 5,
        description: 'Hot deals and discounts'
      },
      {
        name: 'Global Picks',
        slug: 'global-picks',
        icon: 'fas fa-globe',
        color_from: '#10B981',
        color_to: '#059669',
        display_order: 6,
        description: 'Trending products from around the world'
      },
      {
        name: 'Loot Box',
        slug: 'loot-box',
        icon: 'fas fa-gift',
        color_from: '#F59E0B',
        color_to: '#D97706',
        display_order: 7,
        description: 'Mystery products and surprise deals'
      }
    ];
    
    const insertTab = db.prepare(`
      INSERT INTO nav_tabs (name, slug, icon, color_from, color_to, display_order, is_system, description)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    `);
    
    systemTabs.forEach(tab => {
      try {
        const result = insertTab.run(
          tab.name,
          tab.slug,
          tab.icon,
          tab.color_from,
          tab.color_to,
          tab.display_order,
          tab.description
        );
        console.log(`  Success Added: ${tab.name} (ID: ${result.lastInsertRowid})`);
      } catch (error) {
        console.log(`  Error Failed to add ${tab.name}: ${error.message}`);
      }
    });
  }
  
  // Show current nav_tabs table structure
  console.log('\n📋 Current nav_tabs table structure:');
  const tableInfo = db.prepare(`PRAGMA table_info(nav_tabs)`).all();
  tableInfo.forEach(col => {
    const nullable = col.notnull ? 'NOT NULL' : 'NULL';
    const defaultVal = col.dflt_value ? ` DEFAULT ${col.dflt_value}` : '';
    console.log(`  - ${col.name}: ${col.type} ${nullable}${defaultVal}`);
  });
  
  // Show existing navigation tabs
  console.log('\n🧭 Current navigation tabs:');
  const navTabs = db.prepare(`
    SELECT id, name, slug, icon, display_order, is_active, is_system
    FROM nav_tabs
    ORDER BY display_order ASC
  `).all();
  
  if (navTabs.length === 0) {
    console.log('  No navigation tabs found');
  } else {
    navTabs.forEach(tab => {
      const status = tab.is_active ? 'Success' : 'Error';
      const type = tab.is_system ? '[SYSTEM]' : '[CUSTOM]';
      console.log(`  ${status} ${tab.display_order}. ${tab.name} (${tab.slug}) ${tab.icon} ${type}`);
    });
  }
  
  db.close();
  console.log('\nSuccess Navigation tabs table setup completed successfully!');
  
} catch (error) {
  console.error('Error Error creating navigation tabs table:', error.message);
  process.exit(1);
}