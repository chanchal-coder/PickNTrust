const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'database.sqlite');
console.log('Checking categories structure at:', dbPath);

try {
  const db = new Database(dbPath);
  
  // Check if categories table exists
  console.log('\n=== CHECKING CATEGORIES TABLE ===');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  const categoriesTableExists = tables.some(t => t.name === 'categories');
  console.log('Categories table exists:', categoriesTableExists);
  
  if (categoriesTableExists) {
    // Get categories table schema
    console.log('\n=== CATEGORIES TABLE SCHEMA ===');
    const schema = db.prepare("PRAGMA table_info(categories)").all();
    console.log('Columns in categories table:', schema.length);
    schema.forEach(col => {
      console.log(`- ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
    });
    
    // Count categories
    const totalCount = db.prepare("SELECT COUNT(*) as count FROM categories").get();
    console.log('\nTotal categories:', totalCount.count);
    
    if (totalCount.count > 0) {
      // Get all categories with parent-child relationships
      console.log('\n=== ALL CATEGORIES ===');
      const allCategories = db.prepare(`
        SELECT id, name, slug, parent_id, description, created_at, updated_at
        FROM categories 
        ORDER BY parent_id, name
      `).all();
      
      allCategories.forEach(cat => {
        console.log(`ID: ${cat.id}, Name: ${cat.name}, Slug: ${cat.slug}`);
        console.log(`  Parent ID: ${cat.parent_id || 'NULL (root category)'}`);
        console.log(`  Description: ${cat.description || 'No description'}`);
        console.log('');
      });
      
      // Check parent-child relationships
      console.log('\n=== PARENT-CHILD RELATIONSHIPS ===');
      const parentCategories = allCategories.filter(cat => !cat.parent_id);
      console.log('Root categories:', parentCategories.length);
      
      parentCategories.forEach(parent => {
        console.log(`\n📁 ${parent.name} (ID: ${parent.id})`);
        const children = allCategories.filter(cat => cat.parent_id === parent.id);
        if (children.length > 0) {
          children.forEach(child => {
            console.log(`  └── ${child.name} (ID: ${child.id})`);
          });
        } else {
          console.log('  └── No child categories');
        }
      });
      
      // Check categories with products
      console.log('\n=== CATEGORIES WITH PRODUCTS ===');
      const categoriesWithProducts = db.prepare(`
        SELECT c.name, c.slug, COUNT(uc.id) as product_count
        FROM categories c
        LEFT JOIN unified_content uc ON uc.category = c.name OR uc.category = c.slug
        WHERE uc.processing_status IN ('completed', 'active') 
        AND uc.visibility IN ('public') 
        AND uc.status IN ('published', 'active')
        GROUP BY c.id, c.name, c.slug
        ORDER BY product_count DESC
      `).all();
      
      categoriesWithProducts.forEach(cat => {
        console.log(`${cat.name}: ${cat.product_count} products`);
      });
    }
  } else {
    console.log('\n❌ Categories table does not exist!');
    
    // Check if we have categories in unified_content
    console.log('\n=== CHECKING CATEGORIES FROM UNIFIED_CONTENT ===');
    const uniqueCategories = db.prepare(`
      SELECT DISTINCT category, COUNT(*) as count
      FROM unified_content 
      WHERE category IS NOT NULL AND category != ''
      GROUP BY category
      ORDER BY count DESC
    `).all();
    
    console.log('Unique categories from products:', uniqueCategories.length);
    uniqueCategories.forEach(cat => {
      console.log(`- ${cat.category}: ${cat.count} products`);
    });
  }
  
  db.close();
  console.log('\n=== CATEGORIES CHECK COMPLETE ===');
  
} catch (error) {
  console.error('Error checking categories:', error.message);
  console.error('Stack:', error.stack);
}