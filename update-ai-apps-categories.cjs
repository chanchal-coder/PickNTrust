const Database = require('better-sqlite3');
const fs = require('fs');

console.log('🔧 Updating categories to be available for AI Apps...');

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
  
  // Show current AI Apps categories
  console.log('\nAI Current AI Apps categories:');
  const currentAIApps = db.prepare(`
    SELECT id, name 
    FROM categories 
    WHERE is_for_ai_apps = 1
    ORDER BY name
  `).all();
  
  currentAIApps.forEach(cat => {
    console.log(`  Success ${cat.id}. ${cat.name}`);
  });
  
  // Categories that should also be available for AI Apps
  const categoriesToUpdate = [
    'Apps & AI Apps',
    'Electronics & Gadgets', 
    'Travel & Lifestyle',
    'Business Tools',
    'Communication Tools',
    'Design Services',
    'Marketing Services',
    'Productivity Apps',
    'Developer Tools',
    'Software & Apps'
  ];
  
  console.log('\nRefresh Updating categories to include AI Apps:');
  
  const updateStmt = db.prepare(`
    UPDATE categories 
    SET is_for_ai_apps = 1 
    WHERE name = ? AND is_for_ai_apps = 0
  `);
  
  let updatedCount = 0;
  
  categoriesToUpdate.forEach(categoryName => {
    const result = updateStmt.run(categoryName);
    if (result.changes > 0) {
      console.log(`  Success Updated "${categoryName}" to be available for AI Apps`);
      updatedCount++;
    } else {
      console.log(`  Warning  "${categoryName}" not found or already enabled for AI Apps`);
    }
  });
  
  // Show updated AI Apps categories
  console.log('\nAI Updated AI Apps categories:');
  const updatedAIApps = db.prepare(`
    SELECT id, name 
    FROM categories 
    WHERE is_for_ai_apps = 1
    ORDER BY name
  `).all();
  
  updatedAIApps.forEach(cat => {
    console.log(`  Success ${cat.id}. ${cat.name}`);
  });
  
  db.close();
  
  console.log(`\nCelebration Successfully updated ${updatedCount} categories!`);
  console.log('\nTip The AI Apps dropdown should now show more categories.');
  console.log('   You may need to refresh the admin page to see the changes.');
  
} catch (error) {
  console.error('Error Update failed:', error.message);
  process.exit(1);
}