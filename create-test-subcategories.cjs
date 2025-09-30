const Database = require('better-sqlite3');
const fs = require('fs');

console.log('🔧 Creating test subcategories...');

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
  
  // First, let's see what main categories we have
  console.log('\n📋 Current main categories:');
  const mainCategories = db.prepare(`
    SELECT id, name FROM categories WHERE parent_id IS NULL ORDER BY name
  `).all();
  
  mainCategories.forEach(cat => {
    console.log(`  ${cat.id}. ${cat.name}`);
  });
  
  // Find Electronics & Gadgets category
  const electronicsCategory = mainCategories.find(cat => cat.name.includes('Electronics'));
  
  if (!electronicsCategory) {
    console.log('\nError Electronics category not found. Available categories:');
    mainCategories.forEach(cat => console.log(`  - ${cat.name}`));
    db.close();
    return;
  }
  
  console.log(`\nTarget Found Electronics category: ${electronicsCategory.name} (ID: ${electronicsCategory.id})`);
  
  // Check if subcategories already exist
  const existingSubcategories = db.prepare(`
    SELECT id, name FROM categories WHERE parent_id = ?
  `).all(electronicsCategory.id);
  
  if (existingSubcategories.length > 0) {
    console.log('\nSuccess Existing subcategories:');
    existingSubcategories.forEach(sub => {
      console.log(`  - ${sub.name} (ID: ${sub.id})`);
    });
  } else {
    console.log('\n➕ Creating subcategories for Electronics...');
    
    const subcategories = [
      {
        name: 'Phones',
        icon: 'fas fa-mobile-alt',
        color: '#3B82F6',
        description: 'Smartphones and mobile devices'
      },
      {
        name: 'Laptops',
        icon: 'fas fa-laptop',
        color: '#8B5CF6',
        description: 'Laptops and notebooks'
      },
      {
        name: 'Headphones',
        icon: 'fas fa-headphones',
        color: '#EF4444',
        description: 'Headphones and audio devices'
      },
      {
        name: 'Cameras',
        icon: 'fas fa-camera',
        color: '#10B981',
        description: 'Digital cameras and accessories'
      },
      {
        name: 'Gaming',
        icon: 'fas fa-gamepad',
        color: '#F59E0B',
        description: 'Gaming consoles and accessories'
      }
    ];
    
    const insertSubcategory = db.prepare(`
      INSERT INTO categories (name, icon, color, description, parent_id, is_for_products, is_for_services, display_order)
      VALUES (?, ?, ?, ?, ?, 1, 0, ?)
    `);
    
    subcategories.forEach((subcat, index) => {
      try {
        const result = insertSubcategory.run(
          subcat.name,
          subcat.icon,
          subcat.color,
          subcat.description,
          electronicsCategory.id,
          (index + 1) * 10
        );
        console.log(`  Success Created: ${subcat.name} (ID: ${result.lastInsertRowid})`);
      } catch (error) {
        console.log(`  Error Failed to create ${subcat.name}: ${error.message}`);
      }
    });
  }
  
  // Show final hierarchical structure
  console.log('\n🌳 Final hierarchical structure:');
  const allCategories = db.prepare(`
    SELECT id, name, parent_id FROM categories ORDER BY COALESCE(parent_id, id), parent_id IS NULL DESC, name
  `).all();
  
  let currentParent = null;
  allCategories.forEach(cat => {
    if (!cat.parent_id) {
      console.log(`\nUpload ${cat.name} (ID: ${cat.id})`);
      currentParent = cat.id;
    } else if (cat.parent_id === currentParent) {
      console.log(`  └─ ${cat.name} (ID: ${cat.id})`);
    }
  });
  
  db.close();
  console.log('\nSuccess Test subcategories created successfully!');
  
} catch (error) {
  console.error('Error Error creating test subcategories:', error.message);
  process.exit(1);
}