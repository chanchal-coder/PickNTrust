const Database = require('better-sqlite3');
const fs = require('fs');

console.log('Search Checking Apps and AI Apps categories and subcategories...');

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
  
  // Get all categories related to Apps
  console.log('\nMobile Apps and AI Apps related categories:');
  const appsCategories = db.prepare(`
    SELECT id, name, parent_id,
           CASE WHEN parent_id IS NULL THEN 'Main Category' ELSE 'Subcategory' END as type
    FROM categories 
    WHERE name LIKE '%Apps%' OR name LIKE '%AI%'
    ORDER BY COALESCE(parent_id, id), parent_id IS NULL DESC, id
  `).all();
  
  if (appsCategories.length === 0) {
    console.log('  Error No Apps or AI Apps categories found');
  } else {
    appsCategories.forEach(cat => {
      const indent = cat.parent_id ? '  └─ ' : '';
      const parentInfo = cat.parent_id ? ` (parent: ${cat.parent_id})` : '';
      console.log(`  ${indent}${cat.id}. ${cat.name} (${cat.type})${parentInfo}`);
    });
  }
  
  // Check for any existing subcategories
  console.log('\nLink All existing subcategories in database:');
  const allSubcategories = db.prepare(`
    SELECT s.id, s.name as subcategory_name, s.parent_id, p.name as parent_name
    FROM categories s
    JOIN categories p ON s.parent_id = p.id
    ORDER BY s.parent_id, s.id
  `).all();
  
  if (allSubcategories.length === 0) {
    console.log('  Error No subcategories found in database');
  } else {
    console.log(`  Success Found ${allSubcategories.length} subcategories:`);
    let currentParent = null;
    allSubcategories.forEach(sub => {
      if (currentParent !== sub.parent_id) {
        console.log(`\n  Upload ${sub.parent_name} (ID: ${sub.parent_id}):`);
        currentParent = sub.parent_id;
      }
      console.log(`    └─ ${sub.id}. ${sub.subcategory_name}`);
    });
  }
  
  // Check specific Apps & AI Apps category
  console.log('\nAI Checking "Apps & AI Apps" category specifically:');
  const appsAICategory = db.prepare(`
    SELECT id, name, parent_id FROM categories 
    WHERE name = 'Apps & AI Apps'
  `).get();
  
  if (appsAICategory) {
    console.log(`  Success Found: ${appsAICategory.id}. ${appsAICategory.name}`);
    
    // Check for its subcategories
    const subcats = db.prepare(`
      SELECT id, name FROM categories WHERE parent_id = ?
    `).all(appsAICategory.id);
    
    if (subcats.length > 0) {
      console.log(`  📋 Subcategories (${subcats.length}):`);
      subcats.forEach(sub => {
        console.log(`    └─ ${sub.id}. ${sub.name}`);
      });
    } else {
      console.log('  Error No subcategories found for "Apps & AI Apps"');
    }
  } else {
    console.log('  Error "Apps & AI Apps" category not found');
  }
  
  db.close();
  
} catch (error) {
  console.error('Error Error checking categories:', error.message);
  process.exit(1);
}