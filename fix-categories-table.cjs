/**
 * Fix Categories Table - Create the missing categories table
 */

const Database = require('better-sqlite3');
const path = require('path');

console.log('🔧 FIXING CATEGORIES TABLE');
console.log('='.repeat(40));

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

try {
  console.log('📋 Creating categories table...');
  
  // Create categories table
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT 'fas fa-tag',
      color TEXT NOT NULL DEFAULT '#3b82f6',
      description TEXT NOT NULL DEFAULT '',
      parent_id INTEGER REFERENCES categories(id),
      is_for_products INTEGER DEFAULT 1,
      is_for_services INTEGER DEFAULT 0,
      is_for_ai_apps INTEGER DEFAULT 0,
      display_order INTEGER DEFAULT 0
    )
  `);
  
  console.log('✅ Categories table created successfully');
  
  // Insert default categories
  console.log('📝 Inserting default categories...');
  
  const insertCategory = db.prepare(`
    INSERT OR IGNORE INTO categories (name, icon, color, description, display_order)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const defaultCategories = [
    ['Electronics', 'fas fa-laptop', '#3b82f6', 'Electronic devices and gadgets', 1],
    ['Fashion', 'fas fa-tshirt', '#ec4899', 'Clothing and fashion accessories', 2],
    ['Home & Garden', 'fas fa-home', '#10b981', 'Home improvement and garden items', 3],
    ['Sports & Fitness', 'fas fa-dumbbell', '#f59e0b', 'Sports equipment and fitness gear', 4],
    ['Books & Media', 'fas fa-book', '#8b5cf6', 'Books, movies, and media content', 5]
  ];
  
  defaultCategories.forEach(category => {
    try {
      insertCategory.run(...category);
      console.log(`   ✅ Added category: ${category[0]}`);
    } catch (error) {
      console.log(`   ⚠️  Category ${category[0]} already exists`);
    }
  });
  
  // Verify table exists
  console.log('\n🔍 Verifying categories table...');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='categories'").all();
  
  if (tables.length > 0) {
    console.log('✅ Categories table exists');
    
    const categoryCount = db.prepare("SELECT COUNT(*) as count FROM categories").get();
    console.log(`📊 Categories table has ${categoryCount.count} entries`);
  } else {
    console.log('❌ Categories table still missing');
  }
  
  console.log('\n✅ Categories table fix completed!');
  
} catch (error) {
  console.error('❌ Error creating categories table:', error);
  process.exit(1);
} finally {
  db.close();
}