const Database = require('better-sqlite3');
const fs = require('fs');

console.log('🔧 Fixing AI Apps categories...');

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
  
  // Show current state
  console.log('\n📋 Current categories (recent):');
  const allCategories = db.prepare(`
    SELECT id, name, is_for_products, is_for_services, is_for_ai_apps 
    FROM categories 
    ORDER BY id DESC 
    LIMIT 10
  `).all();
  
  allCategories.forEach(cat => {
    const types = [];
    if (cat.is_for_products) types.push('Products');
    if (cat.is_for_services) types.push('Services');
    if (cat.is_for_ai_apps) types.push('AI Apps');
    console.log(`  ${cat.id}. ${cat.name} → ${types.join(', ') || 'General'}`);
  });
  
  // Find the two most recent categories that might be AI Apps categories
  const recentCategories = db.prepare(`
    SELECT id, name 
    FROM categories 
    WHERE id > 37
    ORDER BY id DESC
  `).all();
  
  if (recentCategories.length === 0) {
    console.log('\nError No recent categories found to update.');
  } else {
    console.log('\nRefresh Updating recent categories to be AI Apps categories:');
    
    const updateStmt = db.prepare(`
      UPDATE categories 
      SET is_for_ai_apps = 1 
      WHERE id = ?
    `);
    
    recentCategories.forEach(cat => {
      updateStmt.run(cat.id);
      console.log(`  Success Updated "${cat.name}" (ID: ${cat.id}) to be an AI Apps category`);
    });
  }
  
  // Verify the changes
  console.log('\nAI AI Apps categories after update:');
  const aiAppCategories = db.prepare(`
    SELECT id, name 
    FROM categories 
    WHERE is_for_ai_apps = 1
    ORDER BY name
  `).all();
  
  if (aiAppCategories.length === 0) {
    console.log('  Error Still no AI Apps categories found');
  } else {
    aiAppCategories.forEach(cat => {
      console.log(`  Success ${cat.id}. ${cat.name}`);
    });
  }
  
  db.close();
  console.log('\nCelebration Categories update completed!');
  console.log('\nTip The AI Apps dropdown should now show these categories.');
  console.log('   You may need to refresh the admin page to see the changes.');
  
} catch (error) {
  console.error('Error Update failed:', error.message);
  process.exit(1);
}