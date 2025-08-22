const Database = require('better-sqlite3');
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'database.sqlite');

async function addCategoryTypeFields() {
  console.log('🔄 Adding category type fields to database...');
  
  const db = new Database(dbPath);
  
  try {
    // Check if columns already exist
    const tableInfo = db.prepare("PRAGMA table_info(categories)").all();
    const hasIsForProducts = tableInfo.some(col => col.name === 'is_for_products');
    const hasIsForServices = tableInfo.some(col => col.name === 'is_for_services');
    
    if (hasIsForProducts && hasIsForServices) {
      console.log('✅ Category type fields already exist');
      return;
    }
    
    // Add is_for_products column if it doesn't exist
    if (!hasIsForProducts) {
      console.log('➕ Adding is_for_products column...');
      db.exec(`
        ALTER TABLE categories 
        ADD COLUMN is_for_products INTEGER DEFAULT 1;
      `);
    }
    
    // Add is_for_services column if it doesn't exist
    if (!hasIsForServices) {
      console.log('➕ Adding is_for_services column...');
      db.exec(`
        ALTER TABLE categories 
        ADD COLUMN is_for_services INTEGER DEFAULT 0;
      `);
    }
    
    // Update existing categories to have proper defaults
    console.log('🔄 Setting default values for existing categories...');
    db.exec(`
      UPDATE categories 
      SET is_for_products = 1, is_for_services = 0 
      WHERE is_for_products IS NULL OR is_for_services IS NULL;
    `);
    
    console.log('✅ Successfully added category type fields');
    
    // Verify the changes
    const updatedTableInfo = db.prepare("PRAGMA table_info(categories)").all();
    console.log('📋 Updated categories table structure:');
    updatedTableInfo.forEach(col => {
      console.log(`  - ${col.name}: ${col.type} (default: ${col.dflt_value})`);
    });
    
    // Show current categories
    const categories = db.prepare("SELECT * FROM categories").all();
    console.log(`\n📊 Current categories (${categories.length} total):`);
    categories.forEach(cat => {
      console.log(`  - ${cat.name}: Products=${cat.is_for_products}, Services=${cat.is_for_services}`);
    });
    
  } catch (error) {
    console.error('❌ Error adding category type fields:', error);
    throw error;
  } finally {
    db.close();
  }
}

// Run the migration
addCategoryTypeFields()
  .then(() => {
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
