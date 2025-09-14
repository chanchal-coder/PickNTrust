const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

console.log('🔧 Adding isForAIApps field to categories table...');

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
  
  // Check if the column already exists
  const tableInfo = db.prepare("PRAGMA table_info(categories)").all();
  const hasAIAppsColumn = tableInfo.some(col => col.name === 'is_for_ai_apps');
  
  if (hasAIAppsColumn) {
    console.log('Success is_for_ai_apps column already exists!');
  } else {
    console.log('➕ Adding is_for_ai_apps column...');
    
    // Add the new column
    db.exec(`
      ALTER TABLE categories 
      ADD COLUMN is_for_ai_apps INTEGER DEFAULT 0
    `);
    
    console.log('Success Successfully added is_for_ai_apps column!');
  }
  
  // Verify the column was added
  const updatedTableInfo = db.prepare("PRAGMA table_info(categories)").all();
  console.log('\nStats Categories table structure:');
  updatedTableInfo.forEach(col => {
    console.log(`  - ${col.name}: ${col.type} (default: ${col.dflt_value})`);
  });
  
  // Show current categories
  const categories = db.prepare(`
    SELECT id, name, is_for_products, is_for_services, is_for_ai_apps 
    FROM categories 
    ORDER BY id
  `).all();
  
  console.log('\n📋 Current categories:');
  categories.forEach(cat => {
    const types = [];
    if (cat.is_for_products) types.push('Products');
    if (cat.is_for_services) types.push('Services');
    if (cat.is_for_ai_apps) types.push('AI Apps');
    console.log(`  ${cat.id}. ${cat.name} → ${types.join(', ') || 'General'}`);
  });
  
  db.close();
  console.log('\nCelebration Database migration completed successfully!');
  
} catch (error) {
  console.error('Error Migration failed:', error.message);
  process.exit(1);
}