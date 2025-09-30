const Database = require('better-sqlite3');
const fs = require('fs');

console.log('🔧 Restoring original categories and adding proper AI categories...');

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
  
  // Reset categories that were incorrectly marked for AI Apps (except sue and ass)
  console.log('\nRefresh Resetting incorrectly marked categories:');
  
  const categoriesToReset = [
    'Apps & AI Apps',
    'Electronics & Gadgets', 
    'Travel & Lifestyle',
    'Business Tools',
    'Communication Tools',
    'Design Services',
    'Marketing Services'
  ];
  
  const resetStmt = db.prepare(`
    UPDATE categories 
    SET is_for_ai_apps = 0 
    WHERE name = ? AND is_for_ai_apps = 1
  `);
  
  let resetCount = 0;
  
  categoriesToReset.forEach(categoryName => {
    const result = resetStmt.run(categoryName);
    if (result.changes > 0) {
      console.log(`  Success Reset "${categoryName}" (no longer AI Apps category)`);
      resetCount++;
    }
  });
  
  // Add proper AI-specific categories
  console.log('\n➕ Adding proper AI-specific categories:');
  
  const aiCategories = [
    { name: 'AI Chatbots', icon: 'fas fa-comments', color: '#10B981', description: 'AI-powered chatbots and conversational agents' },
    { name: 'AI Writing Tools', icon: 'fas fa-pen-fancy', color: '#8B5CF6', description: 'AI writing assistants and content generators' },
    { name: 'AI Image Generation', icon: 'fas fa-image', color: '#F59E0B', description: 'AI image creation and editing tools' },
    { name: 'AI Video Tools', icon: 'fas fa-video', color: '#EF4444', description: 'AI video editing and generation applications' },
    { name: 'AI Code Assistants', icon: 'fas fa-code', color: '#06B6D4', description: 'AI programming and development tools' },
    { name: 'AI Data Analysis', icon: 'fas fa-chart-bar', color: '#EC4899', description: 'AI data analytics and visualization tools' },
    { name: 'AI Productivity', icon: 'fas fa-tasks', color: '#6366F1', description: 'AI-powered productivity and automation tools' },
    { name: 'AI Voice & Audio', icon: 'fas fa-microphone', color: '#84CC16', description: 'AI voice synthesis and audio processing' }
  ];
  
  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO categories (name, icon, color, description, is_for_products, is_for_services, is_for_ai_apps, display_order)
    VALUES (?, ?, ?, ?, 0, 0, 1, 0)
  `);
  
  let addedCount = 0;
  
  aiCategories.forEach(category => {
    const result = insertStmt.run(category.name, category.icon, category.color, category.description);
    if (result.changes > 0) {
      console.log(`  Success Added "${category.name}" as AI Apps category`);
      addedCount++;
    } else {
      console.log(`  Warning  "${category.name}" already exists`);
    }
  });
  
  // Show final AI Apps categories
  console.log('\nAI Final AI Apps categories:');
  const finalAIApps = db.prepare(`
    SELECT id, name 
    FROM categories 
    WHERE is_for_ai_apps = 1
    ORDER BY name
  `).all();
  
  finalAIApps.forEach(cat => {
    console.log(`  Success ${cat.id}. ${cat.name}`);
  });
  
  db.close();
  
  console.log(`\nCelebration Successfully reset ${resetCount} categories and added ${addedCount} new AI categories!`);
  console.log('\nTip The AI Apps dropdown now shows proper AI-specific categories.');
  console.log('   You may need to refresh the admin page to see the changes.');
  
} catch (error) {
  console.error('Error Update failed:', error.message);
  process.exit(1);
}