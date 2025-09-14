const Database = require('better-sqlite3');
const fs = require('fs');

console.log('🔧 Organizing Apps categories into subcategories...');

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
  
  // Find the main "Apps & AI Apps" category
  const mainAppsCategory = db.prepare(`
    SELECT id, name FROM categories WHERE name = 'Apps & AI Apps'
  `).get();
  
  if (!mainAppsCategory) {
    console.log('Error "Apps & AI Apps" main category not found!');
    db.close();
    return;
  }
  
  console.log(`Success Found main category: ${mainAppsCategory.id}. ${mainAppsCategory.name}`);
  
  // Define categories that should be subcategories of "Apps & AI Apps"
  const categoriesToMakeSubcategories = [
    'AI Chatbots',
    'AI Writing Tools', 
    'AI Image Generation',
    'AI Video Tools',
    'AI Code Assistants',
    'AI Data Analysis',
    'AI Productivity',
    'AI Voice & Audio',
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
  
  console.log(`\nRefresh Converting ${categoriesToMakeSubcategories.length} categories to subcategories...`);
  
  const updateStmt = db.prepare(`
    UPDATE categories 
    SET parent_id = ? 
    WHERE name = ? AND parent_id IS NULL
  `);
  
  let updatedCount = 0;
  let duplicatesRemoved = 0;
  
  // Track categories we've seen to handle duplicates
  const seenCategories = new Set();
  
  categoriesToMakeSubcategories.forEach(categoryName => {
    // Check if we've already processed this category name
    if (seenCategories.has(categoryName)) {
      // Find and remove duplicate entries
      const duplicates = db.prepare(`
        SELECT id FROM categories 
        WHERE name = ? AND parent_id IS NULL
        ORDER BY id DESC
      `).all(categoryName);
      
      if (duplicates.length > 1) {
        // Keep the first one, remove the rest
        for (let i = 1; i < duplicates.length; i++) {
          db.prepare('DELETE FROM categories WHERE id = ?').run(duplicates[i].id);
          duplicatesRemoved++;
          console.log(`  🗑️  Removed duplicate: ${categoryName} (ID: ${duplicates[i].id})`);
        }
      }
      return;
    }
    
    seenCategories.add(categoryName);
    
    // First, handle duplicates for this category
    const allInstances = db.prepare(`
      SELECT id FROM categories 
      WHERE name = ? AND parent_id IS NULL
      ORDER BY id ASC
    `).all(categoryName);
    
    if (allInstances.length > 1) {
      // Keep the first one, remove duplicates
      for (let i = 1; i < allInstances.length; i++) {
        db.prepare('DELETE FROM categories WHERE id = ?').run(allInstances[i].id);
        duplicatesRemoved++;
        console.log(`  🗑️  Removed duplicate: ${categoryName} (ID: ${allInstances[i].id})`);
      }
    }
    
    // Now update the remaining category to be a subcategory
    const result = updateStmt.run(mainAppsCategory.id, categoryName);
    if (result.changes > 0) {
      updatedCount++;
      console.log(`  Success ${categoryName} → subcategory of "Apps & AI Apps"`);
    } else {
      console.log(`  Warning  ${categoryName} not found or already a subcategory`);
    }
  });
  
  console.log(`\nStats Summary:`);
  console.log(`  Success Categories converted to subcategories: ${updatedCount}`);
  console.log(`  🗑️  Duplicate categories removed: ${duplicatesRemoved}`);
  
  // Show the updated structure
  console.log('\n📋 Updated "Apps & AI Apps" structure:');
  const subcategories = db.prepare(`
    SELECT id, name FROM categories 
    WHERE parent_id = ?
    ORDER BY name
  `).all(mainAppsCategory.id);
  
  console.log(`  Upload ${mainAppsCategory.name} (${subcategories.length} subcategories):`);
  subcategories.forEach(sub => {
    console.log(`    └─ ${sub.id}. ${sub.name}`);
  });
  
  console.log('\nSuccess Apps categories reorganization completed!');
  console.log('\nBlog Next steps:');
  console.log('   1. Refresh the admin panel to see the hierarchical structure');
  console.log('   2. The "Apps & AI Apps" category now shows all related subcategories');
  
  db.close();
  
} catch (error) {
  console.error('Error Error organizing categories:', error.message);
  process.exit(1);
}