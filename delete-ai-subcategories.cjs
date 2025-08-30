const Database = require('better-sqlite3');
const fs = require('fs');

console.log('🗑️  Deleting AI subcategories...');

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
  
  // First, find all AI subcategories
  console.log('\n🔍 Finding AI subcategories to delete...');
  const aiSubcategories = db.prepare(`
    SELECT id, name, parent_id FROM categories 
    WHERE name LIKE 'AI %' AND parent_id IS NOT NULL
    ORDER BY name
  `).all();
  
  if (aiSubcategories.length === 0) {
    console.log('  ❌ No AI subcategories found to delete');
    db.close();
    return;
  }
  
  console.log(`  ✅ Found ${aiSubcategories.length} AI subcategories:`);
  aiSubcategories.forEach(cat => {
    console.log(`    - ${cat.id}. ${cat.name} (parent: ${cat.parent_id})`);
  });
  
  // Delete the AI subcategories
  console.log('\n🗑️  Deleting AI subcategories...');
  const deleteStmt = db.prepare('DELETE FROM categories WHERE id = ?');
  
  let deletedCount = 0;
  aiSubcategories.forEach(cat => {
    try {
      const result = deleteStmt.run(cat.id);
      if (result.changes > 0) {
        deletedCount++;
        console.log(`  ✅ Deleted: ${cat.name} (ID: ${cat.id})`);
      } else {
        console.log(`  ⚠️  Failed to delete: ${cat.name} (ID: ${cat.id})`);
      }
    } catch (error) {
      console.log(`  ❌ Error deleting ${cat.name}: ${error.message}`);
    }
  });
  
  console.log(`\n📊 Summary:`);
  console.log(`  🗑️  AI subcategories deleted: ${deletedCount}`);
  
  // Show the updated Apps & AI Apps structure
  console.log('\n📋 Updated "Apps & AI Apps" structure:');
  const appsCategory = db.prepare(`
    SELECT id, name FROM categories WHERE name = 'Apps & AI Apps'
  `).get();
  
  if (appsCategory) {
    const remainingSubcategories = db.prepare(`
      SELECT id, name FROM categories 
      WHERE parent_id = ?
      ORDER BY name
    `).all(appsCategory.id);
    
    console.log(`  📁 ${appsCategory.name} (${remainingSubcategories.length} subcategories):`);
    if (remainingSubcategories.length > 0) {
      remainingSubcategories.forEach(sub => {
        console.log(`    └─ ${sub.id}. ${sub.name}`);
      });
    } else {
      console.log('    └─ (No subcategories remaining)');
    }
  }
  
  console.log('\n✅ AI subcategories deletion completed!');
  console.log('\n📝 Next steps:');
  console.log('   1. Refresh the admin panel to see the updated structure');
  console.log('   2. The AI-related subcategories have been removed');
  
  db.close();
  
} catch (error) {
  console.error('❌ Error deleting AI subcategories:', error.message);
  process.exit(1);
}