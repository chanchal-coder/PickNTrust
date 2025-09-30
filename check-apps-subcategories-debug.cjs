const Database = require('better-sqlite3');
const fs = require('fs');

console.log('Search Checking Apps & AI Apps subcategories...');

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
  
  // Find Apps & AI Apps category
  console.log('\nMobile Looking for Apps & AI Apps category...');
  const appsCategory = db.prepare(`
    SELECT id, name FROM categories WHERE name = 'Apps & AI Apps'
  `).get();
  
  if (!appsCategory) {
    console.log('Error Apps & AI Apps category not found!');
    
    // Show all categories to help debug
    console.log('\n📋 All categories in database:');
    const allCategories = db.prepare('SELECT id, name, parent_id FROM categories ORDER BY name').all();
    allCategories.forEach(cat => {
      const type = cat.parent_id ? 'Subcategory' : 'Main Category';
      console.log(`  ${cat.id}. ${cat.name} (${type})`);
    });
    
    db.close();
    return;
  }
  
  console.log(`Success Found: ${appsCategory.id}. ${appsCategory.name}`);
  
  // Get all subcategories
  console.log('\nLink Checking subcategories...');
  const subcategories = db.prepare(`
    SELECT id, name, parent_id FROM categories 
    WHERE parent_id = ?
    ORDER BY name
  `).all(appsCategory.id);
  
  if (subcategories.length === 0) {
    console.log('Error No subcategories found for Apps & AI Apps');
  } else {
    console.log(`Success Found ${subcategories.length} subcategories:`);
    subcategories.forEach(sub => {
      console.log(`  └─ ${sub.id}. ${sub.name} (parent: ${sub.parent_id})`);
    });
  }
  
  // Check if there are any recently added categories
  console.log('\nDate Recently added categories (last 10):');
  const recentCategories = db.prepare(`
    SELECT id, name, parent_id, 
           CASE WHEN parent_id IS NULL THEN 'Main Category' ELSE 'Subcategory' END as type
    FROM categories 
    ORDER BY id DESC 
    LIMIT 10
  `).all();
  
  recentCategories.forEach(cat => {
    const parentInfo = cat.parent_id ? ` (parent: ${cat.parent_id})` : '';
    console.log(`  ${cat.id}. ${cat.name} (${cat.type})${parentInfo}`);
  });
  
  // Check API endpoint response
  console.log('\nGlobal Testing API endpoint simulation...');
  const apiResponse = db.prepare(`
    SELECT id, name, parent_id FROM categories 
    ORDER BY COALESCE(parent_id, 0), COALESCE(display_order, id * 10)
  `).all();
  
  console.log(`API would return ${apiResponse.length} total categories`);
  
  const mainCategories = apiResponse.filter(cat => !cat.parent_id);
  const subcategoriesMap = apiResponse.reduce((acc, cat) => {
    if (cat.parent_id) {
      if (!acc[cat.parent_id]) acc[cat.parent_id] = [];
      acc[cat.parent_id].push(cat);
    }
    return acc;
  }, {});
  
  console.log(`Main categories: ${mainCategories.length}`);
  console.log(`Subcategories map:`, Object.keys(subcategoriesMap).map(key => `${key}: ${subcategoriesMap[key].length} subcats`));
  
  if (subcategoriesMap[appsCategory.id]) {
    console.log(`\nSuccess Apps & AI Apps has ${subcategoriesMap[appsCategory.id].length} subcategories in API response`);
  } else {
    console.log('\nError Apps & AI Apps has no subcategories in API response');
  }
  
  db.close();
  
} catch (error) {
  console.error('Error Error checking subcategories:', error.message);
  process.exit(1);
}