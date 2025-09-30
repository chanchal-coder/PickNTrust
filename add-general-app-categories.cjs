const Database = require('better-sqlite3');
const fs = require('fs');

console.log('🔧 Adding general app categories to AI Apps section...');

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
  
  // Add general app categories that should also be available for AI Apps
  console.log('\n➕ Adding general app categories to AI Apps:');
  
  const generalAppCategories = [
    'Mobile Apps',
    'Web Apps', 
    'Desktop Apps',
    'Browser Extensions',
    'Productivity Apps',
    'Entertainment Apps',
    'Social Media Apps',
    'Gaming Apps',
    'Educational Apps',
    'Health & Fitness Apps',
    'Finance Apps',
    'Shopping Apps',
    'Travel Apps',
    'News Apps',
    'Photo & Video Apps',
    'Music Apps',
    'Developer Tools',
    'Business Apps',
    'Utility Apps',
    'Communication Apps'
  ];
  
  // First, try to update existing categories
  const updateStmt = db.prepare(`
    UPDATE categories 
    SET is_for_ai_apps = 1 
    WHERE name = ? AND is_for_ai_apps = 0
  `);
  
  let updatedCount = 0;
  let toCreateCount = 0;
  
  generalAppCategories.forEach(categoryName => {
    const result = updateStmt.run(categoryName);
    if (result.changes > 0) {
      console.log(`  Success Updated existing "${categoryName}" to include AI Apps`);
      updatedCount++;
    } else {
      toCreateCount++;
    }
  });
  
  // Create new categories that don't exist
  console.log('\n➕ Creating new app categories:');
  
  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO categories (name, icon, color, description, is_for_products, is_for_services, is_for_ai_apps, display_order)
    VALUES (?, ?, ?, ?, 0, 0, 1, 0)
  `);
  
  const newCategories = [
    { name: 'Mobile Apps', icon: 'fas fa-mobile-alt', color: '#10B981', description: 'Mobile applications for smartphones and tablets' },
    { name: 'Web Apps', icon: 'fas fa-globe', color: '#3B82F6', description: 'Web-based applications and services' },
    { name: 'Desktop Apps', icon: 'fas fa-desktop', color: '#6366F1', description: 'Desktop applications for computers' },
    { name: 'Browser Extensions', icon: 'fas fa-puzzle-piece', color: '#8B5CF6', description: 'Browser extensions and add-ons' },
    { name: 'Productivity Apps', icon: 'fas fa-tasks', color: '#F59E0B', description: 'Apps for productivity and task management' },
    { name: 'Entertainment Apps', icon: 'fas fa-play-circle', color: '#EF4444', description: 'Entertainment and media applications' },
    { name: 'Social Media Apps', icon: 'fas fa-share-alt', color: '#EC4899', description: 'Social networking and communication apps' },
    { name: 'Gaming Apps', icon: 'fas fa-gamepad', color: '#06B6D4', description: 'Games and gaming applications' },
    { name: 'Educational Apps', icon: 'fas fa-graduation-cap', color: '#84CC16', description: 'Educational and learning applications' },
    { name: 'Health & Fitness Apps', icon: 'fas fa-heartbeat', color: '#EF4444', description: 'Health, fitness, and wellness apps' },
    { name: 'Finance Apps', icon: 'fas fa-dollar-sign', color: '#10B981', description: 'Financial and banking applications' },
    { name: 'Shopping Apps', icon: 'fas fa-shopping-cart', color: '#F59E0B', description: 'E-commerce and shopping applications' },
    { name: 'Travel Apps', icon: 'fas fa-plane', color: '#3B82F6', description: 'Travel and navigation applications' },
    { name: 'News Apps', icon: 'fas fa-newspaper', color: '#6B7280', description: 'News and information applications' },
    { name: 'Photo & Video Apps', icon: 'fas fa-camera', color: '#EC4899', description: 'Photo and video editing applications' },
    { name: 'Music Apps', icon: 'fas fa-music', color: '#8B5CF6', description: 'Music and audio applications' },
    { name: 'Developer Tools', icon: 'fas fa-code', color: '#06B6D4', description: 'Development and programming tools' },
    { name: 'Business Apps', icon: 'fas fa-briefcase', color: '#374151', description: 'Business and enterprise applications' },
    { name: 'Utility Apps', icon: 'fas fa-wrench', color: '#6B7280', description: 'System utilities and tools' },
    { name: 'Communication Apps', icon: 'fas fa-comments', color: '#10B981', description: 'Communication and messaging apps' }
  ];
  
  let addedCount = 0;
  
  newCategories.forEach(category => {
    const result = insertStmt.run(category.name, category.icon, category.color, category.description);
    if (result.changes > 0) {
      console.log(`  Success Added "${category.name}" as new AI Apps category`);
      addedCount++;
    } else {
      console.log(`  Warning  "${category.name}" already exists`);
    }
  });
  
  // Show final AI Apps categories
  console.log('\nAI Final AI Apps categories (Apps + AI Apps):');
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
  
  console.log(`\nCelebration Successfully updated ${updatedCount} existing categories and added ${addedCount} new categories!`);
  console.log(`\nStats Total AI Apps categories: ${finalAIApps.length}`);
  console.log('\nTip The AI Apps dropdown now includes both general app categories and AI-specific categories.');
  console.log('   You may need to refresh the admin page to see the changes.');
  
} catch (error) {
  console.error('Error Update failed:', error.message);
  process.exit(1);
}