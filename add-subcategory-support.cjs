const Database = require('better-sqlite3');
const fs = require('fs');

console.log('🔧 Adding subcategory support to categories table...');

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
  
  // Check if parent_id column already exists
  const tableInfo = db.prepare(`PRAGMA table_info(categories)`).all();
  const hasParentId = tableInfo.some(col => col.name === 'parent_id');
  
  if (hasParentId) {
    console.log('✅ parent_id column already exists');
  } else {
    console.log('➕ Adding parent_id column...');
    
    // Add the parent_id column
    db.prepare(`ALTER TABLE categories ADD COLUMN parent_id INTEGER REFERENCES categories(id)`).run();
    
    console.log('✅ parent_id column added successfully');
  }
  
  // Show current categories structure
  console.log('\n📋 Current categories structure:');
  const categories = db.prepare(`
    SELECT id, name, parent_id, 
           CASE WHEN parent_id IS NULL THEN 'Main Category' ELSE 'Subcategory' END as type
    FROM categories 
    ORDER BY COALESCE(parent_id, id), parent_id IS NULL DESC, id
  `).all();
  
  categories.forEach(cat => {
    const indent = cat.parent_id ? '  └─ ' : '';
    console.log(`  ${indent}${cat.id}. ${cat.name} (${cat.type})`);
  });
  
  console.log('\n✅ Subcategory support added successfully!');
  console.log('\n📝 You can now:');
  console.log('   - Create subcategories by setting parent_id to an existing category ID');
  console.log('   - Main categories have parent_id = NULL');
  console.log('   - Subcategories have parent_id = <parent_category_id>');
  
  db.close();
  
} catch (error) {
  console.error('❌ Error adding subcategory support:', error.message);
  process.exit(1);
}