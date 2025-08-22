const Database = require('better-sqlite3');

console.log('🔧 Fixing Categories Schema...\n');

function fixDatabase(dbFile) {
  console.log(`📁 Fixing ${dbFile}...`);
  
  if (!require('fs').existsSync(dbFile)) {
    console.log(`❌ ${dbFile} does not exist!`);
    return false;
  }
  
  const db = new Database(dbFile);
  
  try {
    // Check if displayOrder column exists
    const schema = db.prepare("PRAGMA table_info(categories)").all();
    const hasDisplayOrder = schema.some(col => col.name === 'displayOrder');
    
    if (hasDisplayOrder) {
      console.log(`✅ displayOrder column already exists in ${dbFile}`);
    } else {
      console.log(`➕ Adding displayOrder column to ${dbFile}...`);
      
      // Add the displayOrder column
      db.prepare(`ALTER TABLE categories ADD COLUMN displayOrder INTEGER DEFAULT 0`).run();
      
      // Update existing categories with display order based on their ID
      const categories = db.prepare("SELECT id FROM categories ORDER BY id").all();
      categories.forEach((cat, index) => {
        const displayOrder = (index + 1) * 10;
        db.prepare("UPDATE categories SET displayOrder = ? WHERE id = ?").run(displayOrder, cat.id);
      });
      
      console.log(`✅ displayOrder column added and populated in ${dbFile}`);
    }
    
    // Check if we have categories
    const count = db.prepare("SELECT COUNT(*) as count FROM categories").get();
    console.log(`📊 Total categories in ${dbFile}: ${count.count}`);
    
    if (count.count === 0) {
      console.log(`❌ No categories found in ${dbFile}! Need to populate categories.`);
      return false;
    }
    
    // Verify the fix worked
    const testQuery = db.prepare("SELECT id, name, displayOrder FROM categories ORDER BY displayOrder LIMIT 5").all();
    console.log(`✅ Sample categories from ${dbFile}:`);
    testQuery.forEach(cat => {
      console.log(`  ${cat.id}. ${cat.name} (Order: ${cat.displayOrder})`);
    });
    
    db.close();
    return true;
    
  } catch (error) {
    console.error(`❌ Error fixing ${dbFile}:`, error.message);
    db.close();
    return false;
  }
}

// Fix both database files
const dbFiles = ['database.sqlite', 'sqlite.db'];
let success = true;

for (const dbFile of dbFiles) {
  const result = fixDatabase(dbFile);
  if (!result) success = false;
  console.log(''); // Add spacing
}

if (success) {
  console.log('🎉 Categories schema fixed successfully!');
  console.log('✅ displayOrder column added to all databases');
  console.log('✅ Categories should now load properly in frontend');
  console.log('\n📝 Next steps:');
  console.log('1. Restart your development server (npm run dev)');
  console.log('2. Check frontend categories display');
  console.log('3. Test admin category management');
} else {
  console.log('❌ Some issues remain. Check the errors above.');
}
