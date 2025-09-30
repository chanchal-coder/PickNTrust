
// Auto-category creation helper for Telegram integration
function ensureCategoryExists(categoryName, productName = '', productDescription = '') {
  const Database = require('better-sqlite3');
  const db = new Database('./database.sqlite');
  
  try {
    // Check if category exists
    const existingCategory = db.prepare(
      'SELECT id FROM categories WHERE name = ?'
    ).get(categoryName);
    
    if (existingCategory) {
      db.close();
      return existingCategory.id;
    }
    
    // If category doesn't exist, create it
    console.log('Refresh Auto-creating category:', categoryName);
    
    // Intelligent categorization
    let parentId = null;
    let icon = 'fas fa-tag';
    let color = '#6B7280';
    
    // Category-specific settings
    if (categoryName.includes('Home') || categoryName.includes('Decor')) {
      icon = 'fas fa-home';
      color = '#8B4513';
    } else if (categoryName.includes('Electronics')) {
      icon = 'fas fa-microchip';
      color = '#4169E1';
    } else if (categoryName.includes('Fashion')) {
      icon = 'fas fa-tshirt';
      color = '#FF69B4';
    }
    
    // Get next display order
    const maxOrder = db.prepare(
      'SELECT MAX(display_order) as max_order FROM categories'
    ).get();
    
    const displayOrder = (maxOrder.max_order || 0) + 10;
    
    // Create category
    const result = db.prepare(
      `INSERT INTO categories (
        name, description, icon, color, 
        is_for_products, is_for_services, 
        display_order, parent_id
      ) VALUES (?, ?, ?, ?, 1, 0, ?, ?)`
    ).run(
      categoryName,
      `${categoryName} products and services`,
      icon,
      color,
      displayOrder,
      parentId
    );
    
    console.log('Success Created category:', categoryName, 'with ID:', result.lastInsertRowid);
    db.close();
    return result.lastInsertRowid;
    
  } catch (error) {
    console.error('Error Error creating category:', error.message);
    db.close();
    return null;
  }
}

module.exports = { ensureCategoryExists };
