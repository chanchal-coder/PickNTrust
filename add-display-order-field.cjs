const { drizzle } = require('drizzle-orm/better-sqlite3');
const Database = require('better-sqlite3');
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'database.sqlite');

console.log('🔄 Adding display order field to categories...');
console.log('Database path:', dbPath);

try {
  // Connect to database
  const sqlite = new Database(dbPath);
  const db = drizzle(sqlite);

  console.log('✅ Connected to database');

  // Check if display_order column already exists
  console.log('📋 Checking current categories table structure...');
  const tableInfo = sqlite.prepare(`PRAGMA table_info(categories)`).all();
  const existingColumns = tableInfo.map(col => col.name);
  
  console.log('Current columns:', existingColumns);

  if (!existingColumns.includes('display_order')) {
    console.log('📝 Adding display_order column...');
    sqlite.exec(`ALTER TABLE categories ADD COLUMN display_order INTEGER DEFAULT 0;`);
    console.log('✅ display_order column added successfully');
  } else {
    console.log('✅ display_order column already exists');
  }

  // Set initial display order based on current category order (by id)
  console.log('🔄 Setting initial display order values...');
  
  const categories = sqlite.prepare(`
    SELECT id, name FROM categories ORDER BY id
  `).all();

  console.log(`Found ${categories.length} categories to update`);

  categories.forEach((category, index) => {
    const displayOrder = (index + 1) * 10; // Use increments of 10 for easy reordering
    sqlite.prepare(`
      UPDATE categories 
      SET display_order = ? 
      WHERE id = ?
    `).run(displayOrder, category.id);
    
    console.log(`  ✅ ${category.name}: display_order = ${displayOrder}`);
  });

  console.log('✅ Initial display order values set successfully');

  // Verify the changes
  console.log('📋 Verifying updated table structure...');
  const updatedTableInfo = sqlite.prepare(`PRAGMA table_info(categories)`).all();
  const newColumns = updatedTableInfo.map(col => ({ name: col.name, type: col.type, default: col.dflt_value }));
  
  console.table(newColumns);

  // Show categories with their display order
  console.log('📊 Categories with display order:');
  const categoriesWithOrder = sqlite.prepare(`
    SELECT id, name, display_order 
    FROM categories 
    ORDER BY display_order ASC, id ASC
  `).all();

  console.table(categoriesWithOrder);

  sqlite.close();
  console.log('🎉 Display order field migration completed successfully!');

} catch (error) {
  console.error('❌ Migration failed:', error.message);
  console.error('Full error:', error);
  process.exit(1);
}
