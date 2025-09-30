
// ENHANCED CATEGORY SYSTEM WITH VIBRANT COLORS AND FONTAWESOME ICONS
// Updated with vibrant colors and FontAwesome icons for better UI

const Database = require('better-sqlite3');

// Vibrant category icon mapping for auto-creation (NO GREY COLORS)
const vibrantCategoryIconMap = {
  // Product categories with vibrant colors
  'home': { icon: 'fas fa-home', color: '#FF6B6B', name: 'Home & Kitchen' },
  'kitchen': { icon: 'fas fa-home', color: '#FF6B6B', name: 'Home & Kitchen' },
  'electronics': { icon: 'fas fa-mobile-alt', color: '#4ECDC4', name: 'Electronics & Gadgets' },
  'gadgets': { icon: 'fas fa-mobile-alt', color: '#4ECDC4', name: 'Electronics & Gadgets' },
  'fashion': { icon: 'fas fa-tshirt', color: '#45B7D1', name: 'Fashion & Clothing' },
  'clothing': { icon: 'fas fa-tshirt', color: '#45B7D1', name: 'Fashion & Clothing' },
  'health': { icon: 'fas fa-heart', color: '#FF69B4', name: 'Health & Beauty' },
  'beauty': { icon: 'fas fa-heart', color: '#FF69B4', name: 'Health & Beauty' },
  'sports': { icon: 'fas fa-dumbbell', color: '#32CD32', name: 'Sports & Fitness' },
  'fitness': { icon: 'fas fa-dumbbell', color: '#32CD32', name: 'Sports & Fitness' },
  'books': { icon: 'fas fa-book', color: '#9370DB', name: 'Books & Education' },
  'education': { icon: 'fas fa-book', color: '#9370DB', name: 'Books & Education' },
  'toys': { icon: 'fas fa-gamepad', color: '#FFB347', name: 'Toys & Games' },
  'games': { icon: 'fas fa-gamepad', color: '#FFB347', name: 'Toys & Games' },
  'automotive': { icon: 'fas fa-car', color: '#1E90FF', name: 'Automotive' },
  'travel': { icon: 'fas fa-plane', color: '#FF4500', name: 'Travel & Luggage' },
  'pet': { icon: 'fas fa-paw', color: '#228B22', name: 'Pet Supplies' },
  'office': { icon: 'fas fa-briefcase', color: '#DC143C', name: 'Office Supplies' },
  'garden': { icon: 'fas fa-leaf', color: '#00CED1', name: 'Garden & Outdoor' },
  'mystery': { icon: 'fas fa-box', color: '#FF8C00', name: 'Mystery Box' },
  
  // Service categories with vibrant colors
  'financial': { icon: 'fas fa-dollar-sign', color: '#FFD700', name: 'Financial Services' },
  'digital': { icon: 'fas fa-laptop', color: '#20B2AA', name: 'Digital Services' },
  'ai': { icon: 'fas fa-robot', color: '#8A2BE2', name: 'AI & Productivity' },
  'productivity': { icon: 'fas fa-robot', color: '#8A2BE2', name: 'AI & Productivity' }
};

// Vibrant color palette (avoiding grey)
const vibrantColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FF69B4', '#32CD32',
  '#9370DB', '#FFB347', '#1E90FF', '#FF4500', '#228B22',
  '#DC143C', '#00CED1', '#FF8C00', '#FFD700', '#20B2AA',
  '#8A2BE2', '#FF1493', '#00FF7F', '#FF6347', '#4169E1'
];

// FontAwesome icons for different categories
const fontAwesomeIcons = [
  'fas fa-home', 'fas fa-mobile-alt', 'fas fa-tshirt', 'fas fa-heart',
  'fas fa-dumbbell', 'fas fa-book', 'fas fa-gamepad', 'fas fa-car',
  'fas fa-plane', 'fas fa-paw', 'fas fa-briefcase', 'fas fa-leaf',
  'fas fa-box', 'fas fa-dollar-sign', 'fas fa-laptop', 'fas fa-robot',
  'fas fa-music', 'fas fa-camera', 'fas fa-utensils', 'fas fa-tools'
];

// Enhanced category detection with vibrant colors
function detectCategoryWithVibrantUI(productName, productDescription = '', isService = false) {
  const text = (productName + ' ' + productDescription).toLowerCase();
  
  // Check for specific keywords
  for (const [keyword, categoryInfo] of Object.entries(vibrantCategoryIconMap)) {
    if (text.includes(keyword)) {
      return categoryInfo;
    }
  }
  
  // Default categories with vibrant colors (NO GREY)
  if (isService) {
    return { icon: 'fas fa-laptop', color: '#20B2AA', name: 'Digital Services' };
  } else {
    return { icon: 'fas fa-home', color: '#FF6B6B', name: 'Home & Kitchen' };
  }
}

// Enhanced ensureCategoryExists with vibrant colors and FontAwesome icons
function ensureCategoryExistsWithVibrantUI(categoryName, productName = '', productDescription = '', isService = false) {
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
    
    // Auto-detect category info with vibrant UI standards
    const categoryInfo = detectCategoryWithVibrantUI(productName, productDescription, isService);
    
    // Use detected info or provided name
    const finalName = categoryInfo.name || categoryName;
    const icon = categoryInfo.icon;
    const color = categoryInfo.color;
    
    // Temporarily disable foreign keys for category creation
    db.prepare('PRAGMA foreign_keys = OFF').run();
    
    // Create new category with vibrant UI standards
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
    
    console.log(`🎨 Auto-created vibrant category: ${icon} "${finalName}" (${color})`);
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
  ensureCategoryExistsWithVibrantUI,
  detectCategoryWithVibrantUI,
  vibrantCategoryIconMap,
  vibrantColors,
  fontAwesomeIcons
};
