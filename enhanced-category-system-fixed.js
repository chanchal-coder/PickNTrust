
// ENHANCED CATEGORY AUTO-CREATION SYSTEM WITH BROWSE UI CONSISTENCY
// Updated with foreign key handling and improved category detection

const Database = require('better-sqlite3');

// Category icon mapping for auto-creation
const categoryIconMap = {
  // Product categories
  'home': { icon: 'Home', color: '#FF6B6B', name: 'Home & Kitchen' },
  'kitchen': { icon: 'Home', color: '#FF6B6B', name: 'Home & Kitchen' },
  'electronics': { icon: 'Mobile', color: '#4ECDC4', name: 'Electronics & Gadgets' },
  'gadgets': { icon: 'Mobile', color: '#4ECDC4', name: 'Electronics & Gadgets' },
  'fashion': { icon: '👗', color: '#45B7D1', name: 'Fashion & Clothing' },
  'clothing': { icon: '👗', color: '#45B7D1', name: 'Fashion & Clothing' },
  'health': { icon: '💄', color: '#96CEB4', name: 'Health & Beauty' },
  'beauty': { icon: '💄', color: '#96CEB4', name: 'Health & Beauty' },
  'sports': { icon: '⚽', color: '#FFEAA7', name: 'Sports & Fitness' },
  'fitness': { icon: '⚽', color: '#FFEAA7', name: 'Sports & Fitness' },
  'books': { icon: '📚', color: '#DDA0DD', name: 'Books & Education' },
  'education': { icon: '📚', color: '#DDA0DD', name: 'Books & Education' },
  'toys': { icon: '🎮', color: '#FFB6C1', name: 'Toys & Games' },
  'games': { icon: '🎮', color: '#FFB6C1', name: 'Toys & Games' },
  'automotive': { icon: 'Car', color: '#87CEEB', name: 'Automotive' },
  'travel': { icon: 'Flight', color: '#F0E68C', name: 'Travel & Luggage' },
  'pet': { icon: '🐕', color: '#98FB98', name: 'Pet Supplies' },
  'office': { icon: 'Blog', color: '#D3D3D3', name: 'Office Supplies' },
  'garden': { icon: '🌱', color: '#90EE90', name: 'Garden & Outdoor' },
  'mystery': { icon: 'Products', color: '#FF8C00', name: 'Mystery Box' },
  
  // Service categories
  'financial': { icon: 'Price', color: '#FFD700', name: 'Financial Services' },
  'digital': { icon: '💻', color: '#20B2AA', name: 'Digital Services' },
  'ai': { icon: 'AI', color: '#9370DB', name: 'AI & Productivity' },
  'productivity': { icon: 'AI', color: '#9370DB', name: 'AI & Productivity' }
};

// Enhanced category detection function
function detectCategoryWithUI(productName, productDescription = '', isService = false) {
  const text = (productName + ' ' + productDescription).toLowerCase();
  
  // Check for specific keywords
  for (const [keyword, categoryInfo] of Object.entries(categoryIconMap)) {
    if (text.includes(keyword)) {
      return categoryInfo;
    }
  }
  
  // Default categories based on type
  if (isService) {
    return { icon: '💻', color: '#20B2AA', name: 'Digital Services' };
  } else {
    return { icon: 'Home', color: '#FF6B6B', name: 'Home & Kitchen' };
  }
}

// Enhanced ensureCategoryExists function with foreign key handling
function ensureCategoryExistsWithUI(categoryName, productName = '', productDescription = '', isService = false) {
  try {
    const db = new Database('database.sqlite');
    
    // Check if category already exists
    const existingCategory = db.prepare(
      'SELECT id FROM categories WHERE name = ?'
    ).get(categoryName);
    
    if (existingCategory) {
      console.log(`Success Category "${categoryName}" already exists (ID: ${existingCategory.id})`);
      db.close();
      return existingCategory.id;
    }
    
    // Auto-detect category info with UI standards
    const categoryInfo = detectCategoryWithUI(productName, productDescription, isService);
    
    // Use detected info or provided name
    const finalName = categoryInfo.name || categoryName;
    const icon = categoryInfo.icon;
    const color = categoryInfo.color;
    
    // Temporarily disable foreign keys for category creation
    db.prepare('PRAGMA foreign_keys = OFF').run();
    
    // Create new category with browse UI standards
    const result = db.prepare(`
      INSERT INTO categories (
        name, description, icon, color, 
        is_for_products, is_for_services, display_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      finalName,
      `Auto-created category for ${isService ? 'services' : 'products'}`,
      icon,
      color,
      isService ? 0 : 1,
      isService ? 1 : 0,
      999 // Auto-created categories get high display order
    );
    
    // Re-enable foreign keys
    db.prepare('PRAGMA foreign_keys = ON').run();
    
    console.log(`🎨 Auto-created category: ${icon} "${finalName}" (ID: ${result.lastInsertRowid})`);
    db.close();
    return result.lastInsertRowid;
    
  } catch (error) {
    console.error('Error Error ensuring category exists:', error);
    // Return a default category ID if creation fails
    const db = new Database('database.sqlite');
    const defaultCategory = db.prepare(
      'SELECT id FROM categories ORDER BY id LIMIT 1'
    ).get();
    db.close();
    return defaultCategory?.id || 1;
  }
}

// Export for use in routes
module.exports = {
  ensureCategoryExistsWithUI,
  detectCategoryWithUI,
  categoryIconMap
};
