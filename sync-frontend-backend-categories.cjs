const Database = require('better-sqlite3');
const fs = require('fs');

console.log('🔄 Syncing frontend and backend categories...');

// Find the database file
let dbPath = 'database.sqlite';
if (!fs.existsSync(dbPath)) {
  dbPath = 'sqlite.db';
  if (!fs.existsSync(dbPath)) {
    console.error('❌ Database file not found!');
    process.exit(1);
  }
}

console.log(`📂 Using database: ${dbPath}`);

try {
  const db = new Database(dbPath);
  
  // Categories visible in the frontend image
  const frontendCategories = [
    'AI Apps',
    'Productivity Apps',
    'Developer Tools',
    'Design Apps',
    'Writing Tools',
    'Image Generation',
    'Video Editing',
    'Audio Tools',
    'Data Analysis',
    'Automation Tools',
    'Business Intelligence',
    'Machine Learning',
    'Natural Language Processing',
    'Computer Vision'
  ];
  
  console.log('\n📱 Frontend categories from image:');
  frontendCategories.forEach((cat, index) => {
    console.log(`  ${index + 1}. ${cat}`);
  });
  
  // Find the main "Apps & AI Apps" category
  const mainAppsCategory = db.prepare(`
    SELECT id, name FROM categories WHERE name = 'Apps & AI Apps'
  `).get();
  
  if (!mainAppsCategory) {
    console.log('❌ "Apps & AI Apps" main category not found!');
    db.close();
    return;
  }
  
  console.log(`\n✅ Found main category: ${mainAppsCategory.id}. ${mainAppsCategory.name}`);
  
  // Get current backend subcategories
  console.log('\n🔍 Current backend subcategories:');
  const currentSubcategories = db.prepare(`
    SELECT id, name FROM categories 
    WHERE parent_id = ?
    ORDER BY name
  `).all(mainAppsCategory.id);
  
  console.log(`  Found ${currentSubcategories.length} subcategories:`);
  currentSubcategories.forEach(sub => {
    console.log(`    - ${sub.id}. ${sub.name}`);
  });
  
  // Find categories to delete (exist in backend but not in frontend)
  const categoriesToDelete = currentSubcategories.filter(backendCat => 
    !frontendCategories.some(frontendCat => 
      frontendCat.toLowerCase() === backendCat.name.toLowerCase() ||
      backendCat.name.toLowerCase().includes(frontendCat.toLowerCase()) ||
      frontendCat.toLowerCase().includes(backendCat.name.toLowerCase())
    )
  );
  
  // Find categories to add (exist in frontend but not in backend)
  const categoriesToAdd = frontendCategories.filter(frontendCat => 
    !currentSubcategories.some(backendCat => 
      frontendCat.toLowerCase() === backendCat.name.toLowerCase() ||
      backendCat.name.toLowerCase().includes(frontendCat.toLowerCase()) ||
      frontendCat.toLowerCase().includes(backendCat.name.toLowerCase())
    )
  );
  
  console.log('\n🗑️  Categories to delete from backend:');
  if (categoriesToDelete.length === 0) {
    console.log('  ✅ No categories need to be deleted');
  } else {
    categoriesToDelete.forEach(cat => {
      console.log(`    - ${cat.id}. ${cat.name}`);
    });
  }
  
  console.log('\n➕ Categories to add to backend:');
  if (categoriesToAdd.length === 0) {
    console.log('  ✅ No categories need to be added');
  } else {
    categoriesToAdd.forEach(cat => {
      console.log(`    - ${cat}`);
    });
  }
  
  // Delete extra categories
  if (categoriesToDelete.length > 0) {
    console.log('\n🗑️  Deleting extra backend categories...');
    const deleteStmt = db.prepare('DELETE FROM categories WHERE id = ?');
    
    categoriesToDelete.forEach(cat => {
      try {
        const result = deleteStmt.run(cat.id);
        if (result.changes > 0) {
          console.log(`  ✅ Deleted: ${cat.name} (ID: ${cat.id})`);
        }
      } catch (error) {
        console.log(`  ❌ Error deleting ${cat.name}: ${error.message}`);
      }
    });
  }
  
  // Add missing categories
  if (categoriesToAdd.length > 0) {
    console.log('\n➕ Adding missing categories...');
    const insertStmt = db.prepare(`
      INSERT INTO categories (name, description, icon, color, parent_id, is_for_products, is_for_services, is_for_ai_apps, display_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    // Icon and color mappings for different category types
    const categoryMappings = {
      'AI Apps': { icon: 'fas fa-robot', color: '#10B981', description: 'AI-powered applications' },
      'Productivity Apps': { icon: 'fas fa-tasks', color: '#6366F1', description: 'Boost your productivity' },
      'Developer Tools': { icon: 'fas fa-code', color: '#8B5CF6', description: 'Development utilities' },
      'Design Apps': { icon: 'fas fa-palette', color: '#EC4899', description: 'Creative design tools' },
      'Writing Tools': { icon: 'fas fa-pen', color: '#F59E0B', description: 'Content creation aids' },
      'Image Generation': { icon: 'fas fa-image', color: '#EF4444', description: 'AI image creators' },
      'Video Editing': { icon: 'fas fa-video', color: '#06B6D4', description: 'Video production tools' },
      'Audio Tools': { icon: 'fas fa-music', color: '#84CC16', description: 'Audio processing apps' },
      'Data Analysis': { icon: 'fas fa-chart-line', color: '#F97316', description: 'Analytics platforms' },
      'Automation Tools': { icon: 'fas fa-cogs', color: '#8B5CF6', description: 'Workflow automation' },
      'Business Intelligence': { icon: 'fas fa-briefcase', color: '#EF4444', description: 'Business analytics' },
      'Machine Learning': { icon: 'fas fa-brain', color: '#10B981', description: 'ML platforms' },
      'Natural Language Processing': { icon: 'fas fa-comments', color: '#8B5CF6', description: 'Text processing AI' },
      'Computer Vision': { icon: 'fas fa-eye', color: '#EC4899', description: 'Image recognition tools' }
    };
    
    categoriesToAdd.forEach((catName, index) => {
      const mapping = categoryMappings[catName] || {
        icon: 'fas fa-tag',
        color: '#6B7280',
        description: `${catName} applications`
      };
      
      try {
        const result = insertStmt.run(
          catName,
          mapping.description,
          mapping.icon,
          mapping.color,
          mainAppsCategory.id,
          0, // is_for_products
          0, // is_for_services
          1, // is_for_ai_apps
          (index + 1) * 10 // display_order
        );
        console.log(`  ✅ Added: ${catName} (ID: ${result.lastInsertRowid})`);
      } catch (error) {
        console.log(`  ❌ Error adding ${catName}: ${error.message}`);
      }
    });
  }
  
  // Show final structure
  console.log('\n📋 Final "Apps & AI Apps" structure:');
  const finalSubcategories = db.prepare(`
    SELECT id, name FROM categories 
    WHERE parent_id = ?
    ORDER BY name
  `).all(mainAppsCategory.id);
  
  console.log(`  📁 ${mainAppsCategory.name} (${finalSubcategories.length} subcategories):`);
  finalSubcategories.forEach(sub => {
    console.log(`    └─ ${sub.id}. ${sub.name}`);
  });
  
  console.log('\n✅ Frontend-Backend category sync completed!');
  console.log('\n📝 Summary:');
  console.log(`   🗑️  Categories deleted: ${categoriesToDelete.length}`);
  console.log(`   ➕ Categories added: ${categoriesToAdd.length}`);
  console.log(`   📊 Total subcategories: ${finalSubcategories.length}`);
  
  db.close();
  
} catch (error) {
  console.error('❌ Error syncing categories:', error.message);
  process.exit(1);
}