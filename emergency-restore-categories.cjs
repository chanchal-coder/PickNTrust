const Database = require('better-sqlite3');
const path = require('path');

// Connect to database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('Alert EMERGENCY: Restoring categories for website publication...');

// Essential categories for immediate website functionality
const essentialCategories = [
  { name: 'Electronics', icon: 'Mobile', color: '#3B82F6', description: 'Electronic devices and gadgets', display_order: 1 },
  { name: 'Fashion', icon: '👕', color: '#EC4899', description: 'Clothing and accessories', display_order: 2 },
  { name: 'Home & Kitchen', icon: 'Home', color: '#10B981', description: 'Home appliances and kitchen items', display_order: 3 },
  { name: 'Books', icon: '📚', color: '#F59E0B', description: 'Books and educational materials', display_order: 4 },
  { name: 'Sports', icon: '⚽', color: '#EF4444', description: 'Sports and fitness equipment', display_order: 5 },
  { name: 'Beauty', icon: '💄', color: '#8B5CF6', description: 'Beauty and personal care', display_order: 6 },
  { name: 'Toys', icon: '🧸', color: '#06B6D4', description: 'Toys and games', display_order: 7 },
  { name: 'Automotive', icon: 'Car', color: '#6B7280', description: 'Car accessories and parts', display_order: 8 },
  { name: 'Health', icon: '🏥', color: '#DC2626', description: 'Health and wellness products', display_order: 9 },
  { name: 'Travel', icon: 'Flight', color: '#0EA5E9', description: 'Travel accessories and luggage', display_order: 10 }
];

try {
  // Check current categories
  const currentCount = db.prepare('SELECT COUNT(*) as count FROM categories').get().count;
  console.log(`Current categories: ${currentCount}`);
  
  if (currentCount === 0) {
    console.log('Blog Adding essential categories...');
    
    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO categories (name, icon, color, description, display_order, is_for_products, is_for_services, is_for_ai_apps)
      VALUES (?, ?, ?, ?, ?, 1, 0, 0)
    `);
    
    for (const category of essentialCategories) {
      insertStmt.run(
        category.name,
        category.icon,
        category.color,
        category.description,
        category.display_order
      );
    }
    
    console.log('Success Essential categories added successfully!');
  } else {
    console.log('Success Categories already exist, website should be functional');
  }
  
  // Verify categories
  const finalCount = db.prepare('SELECT COUNT(*) as count FROM categories').get().count;
  console.log(`Final category count: ${finalCount}`);
  
  if (finalCount > 0) {
    console.log('Celebration SUCCESS: Website categories restored! Your website is ready for publication.');
  } else {
    console.log('Error FAILED: Categories still missing');
  }
  
} catch (error) {
  console.error('Error Emergency restore failed:', error.message);
} finally {
  db.close();
}