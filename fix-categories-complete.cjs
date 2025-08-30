const Database = require('better-sqlite3');

console.log('🔧 Complete Categories Database Fix...\n');

function fixCategoriesTable(dbFile) {
  console.log(`📁 Fixing ${dbFile}...`);
  
  if (!require('fs').existsSync(dbFile)) {
    console.log(`❌ ${dbFile} does not exist!`);
    return false;
  }
  
  const db = new Database(dbFile);
  
  try {
    // Get current table schema
    const schema = db.prepare("PRAGMA table_info(categories)").all();
    const existingColumns = schema.map(col => col.name);
    
    console.log(`📋 Current columns in ${dbFile}:`, existingColumns);
    
    // Define required columns with their SQL definitions
    const requiredColumns = {
      'displayOrder': 'INTEGER DEFAULT 0',
      'isForProducts': 'INTEGER DEFAULT 1',
      'isForServices': 'INTEGER DEFAULT 0'
    };
    
    // Add missing columns
    let columnsAdded = 0;
    for (const [columnName, columnDef] of Object.entries(requiredColumns)) {
      if (!existingColumns.includes(columnName)) {
        console.log(`➕ Adding ${columnName} column...`);
        try {
          db.prepare(`ALTER TABLE categories ADD COLUMN ${columnName} ${columnDef}`).run();
          columnsAdded++;
          console.log(`✅ Added ${columnName} column`);
        } catch (error) {
          console.log(`❌ Failed to add ${columnName}:`, error.message);
        }
      } else {
        console.log(`✅ ${columnName} column already exists`);
      }
    }
    
    // Update existing categories with proper values
    if (columnsAdded > 0) {
      console.log(`🔄 Updating existing categories...`);
      
      // Set displayOrder based on ID
      const categories = db.prepare("SELECT id FROM categories ORDER BY id").all();
      categories.forEach((cat, index) => {
        const displayOrder = (index + 1) * 10;
        db.prepare("UPDATE categories SET displayOrder = ? WHERE id = ?").run(displayOrder, cat.id);
      });
      
      // Set isForProducts = 1 and isForServices = 0 for all existing categories
      db.prepare("UPDATE categories SET isForProducts = 1, isForServices = 0 WHERE isForProducts IS NULL OR isForServices IS NULL").run();
      
      console.log(`✅ Updated ${categories.length} categories with proper values`);
    }
    
    // Verify the fix
    const count = db.prepare("SELECT COUNT(*) as count FROM categories").get();
    console.log(`📊 Total categories in ${dbFile}: ${count.count}`);
    
    if (count.count === 0) {
      console.log(`❌ No categories found! Need to populate categories.`);
      
      // Add some basic categories if none exist
      const basicCategories = [
        { name: 'Electronics & Gadgets', icon: 'fas fa-laptop', color: '#6366F1', description: 'Latest technology and smart devices', displayOrder: 10 },
        { name: 'Fashion & Clothing', icon: 'fas fa-tshirt', color: '#EC4899', description: 'Trendy clothing and accessories', displayOrder: 20 },
        { name: 'Home & Living', icon: 'fas fa-home', color: '#10B981', description: 'Home decor and living essentials', displayOrder: 30 },
        { name: 'Beauty & Personal Care', icon: 'fas fa-heart', color: '#F59E0B', description: 'Beauty products and personal care', displayOrder: 40 },
        { name: 'Sports & Fitness', icon: 'fas fa-dumbbell', color: '#EF4444', description: 'Sports equipment and fitness gear', displayOrder: 50 }
      ];
      
      console.log(`➕ Adding basic categories...`);
      for (const cat of basicCategories) {
        try {
          db.prepare(`
            INSERT INTO categories (name, icon, color, description, displayOrder, isForProducts, isForServices)
            VALUES (?, ?, ?, ?, ?, 1, 0)
          `).run(cat.name, cat.icon, cat.color, cat.description, cat.displayOrder);
          console.log(`✅ Added: ${cat.name}`);
        } catch (error) {
          console.log(`❌ Failed to add ${cat.name}:`, error.message);
        }
      }
    }
    
    // Test the final result
    try {
      const testQuery = db.prepare(`
        SELECT id, name, displayOrder, isForProducts, isForServices 
        FROM categories 
        ORDER BY displayOrder 
        LIMIT 5
      `).all();
      
      console.log(`✅ Sample categories from ${dbFile}:`);
      testQuery.forEach(cat => {
        console.log(`  ${cat.id}. ${cat.name} (Order: ${cat.displayOrder}, Products: ${cat.isForProducts}, Services: ${cat.isForServices})`);
      });
      
      // Check for Fashion & Clothing specifically
      const fashionCategory = db.prepare("SELECT * FROM categories WHERE name LIKE '%Fashion%'").get();
      if (fashionCategory) {
        console.log(`\n👕 Fashion Category Details:`);
        console.log(`  ID: ${fashionCategory.id}, Name: ${fashionCategory.name}`);
        console.log(`  Display Order: ${fashionCategory.displayOrder}`);
        console.log(`  For Products: ${fashionCategory.isForProducts}, For Services: ${fashionCategory.isForServices}`);
      }
      
    } catch (error) {
      console.log(`❌ Test query failed:`, error.message);
    }
    
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
  const result = fixCategoriesTable(dbFile);
  if (!result) success = false;
  console.log(''); // Add spacing
}

if (success) {
  console.log('🎉 Categories database completely fixed!');
  console.log('✅ All required columns added');
  console.log('✅ Categories populated with proper values');
  console.log('✅ Fashion & Clothing category available for gender testing');
  console.log('\n📝 Next steps:');
  console.log('1. Restart your development server (npm run dev)');
  console.log('2. Check frontend categories display');
  console.log('3. Test admin category management');
  console.log('4. Test gender categorization with Fashion products');
} else {
  console.log('❌ Some issues remain. Check the errors above.');
}
