const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

console.log('🔧 Auto-Category Creator System');
console.log('=' .repeat(50));

// Category mapping for intelligent categorization
const categoryMappings = {
  'Home Decor': {
    parent: 'Home & Garden',
    icon: 'fas fa-home',
    color: '#8B4513',
    description: 'Decorative items for home styling',
    subcategories: ['Vases & Planters', 'Wall Art', 'Sculptures', 'Candles & Holders']
  },
  'Electronics': {
    parent: 'Electronics & Gadgets',
    icon: 'fas fa-microchip',
    color: '#4169E1',
    description: 'Electronic devices and gadgets'
  },
  'Fashion': {
    parent: 'Fashion & Clothing',
    icon: 'fas fa-tshirt',
    color: '#FF69B4',
    description: 'Clothing and fashion accessories'
  },
  'Beauty': {
    parent: 'Health & Beauty',
    icon: 'fas fa-spa',
    color: '#FFB6C1',
    description: 'Beauty and personal care products'
  },
  'Kitchen': {
    parent: 'Kitchen & Dining',
    icon: 'fas fa-utensils',
    color: '#FF6347',
    description: 'Kitchen appliances and dining items'
  }
};

// Enhanced function to create or find category with proper matching
function createOrFindCategory(categoryName, isSubcategory = false, parentName = null) {
  try {
    if (!categoryName || typeof categoryName !== 'string') {
      return null;
    }
    
    // Normalize the input - proper capitalization
    const normalizedName = properCapitalize(categoryName.trim());
    
    // First, try exact match (case-insensitive)
    const exactMatch = db.prepare(`
      SELECT id, name FROM categories 
      WHERE LOWER(name) = LOWER(?)
      LIMIT 1
    `).get(normalizedName);
    
    if (exactMatch) {
      console.log(`Success Category "${normalizedName}" found as "${exactMatch.name}" (ID: ${exactMatch.id})`);
      return exactMatch.id;
    }
    
    // Try partial matching for subcategories
    // If input is "Home", try to find "Home & Kitchen", "Home & Living", etc.
    const partialMatches = db.prepare(`
      SELECT id, name FROM categories 
      WHERE LOWER(name) LIKE LOWER(?) 
      ORDER BY LENGTH(name) ASC
      LIMIT 5
    `).all(`%${normalizedName}%`);
    
    if (partialMatches.length > 0) {
      // Prefer more specific matches that start with the input
      const bestMatch = partialMatches.find(match => 
        match.name.toLowerCase().startsWith(normalizedName.toLowerCase())
      ) || partialMatches[0];
      
      console.log(`📍 Partial match: "${normalizedName}" → "${bestMatch.name}" (ID: ${bestMatch.id})`);
      return bestMatch.id;
    }
    
    console.log(`Refresh Creating new category: "${normalizedName}"`);
    
    let parentId = null;
    let categoryData = {
      icon: 'fas fa-tag',
      color: '#6B7280',
      description: `${normalizedName} products and services`
    };
    
    // Use normalized name for all operations
    const finalCategoryName = normalizedName;
    
    // If it's a subcategory, find or create parent
    if (isSubcategory && parentName) {
      const parentCategory = db.prepare(`
        SELECT id FROM categories WHERE name = ?
      `).get(parentName);
      
      if (parentCategory) {
        parentId = parentCategory.id;
      } else {
        // Create parent category first
        parentId = createOrFindCategory(parentName, false);
      }
    }
    
    // Check if we have predefined mapping for this category
    if (categoryMappings[finalCategoryName]) {
      const mapping = categoryMappings[finalCategoryName];
      categoryData = {
        icon: mapping.icon,
        color: mapping.color,
        description: mapping.description
      };
      
      // If mapping specifies a parent, find or create it
      if (mapping.parent && !parentId) {
        const mappedParent = db.prepare(`
          SELECT id FROM categories WHERE name = ?
        `).get(mapping.parent);
        
        if (mappedParent) {
          parentId = mappedParent.id;
        } else {
          parentId = createOrFindCategory(mapping.parent, false);
        }
      }
    }
    
    // Get next display order
    const maxOrder = db.prepare(`
      SELECT MAX(display_order) as max_order FROM categories
    `).get();
    
    const displayOrder = (maxOrder.max_order || 0) + 10;
    
    // Insert new category
    const insertResult = db.prepare(`
      INSERT INTO categories (
        name, description, icon, color, 
        is_for_products, is_for_services, 
        display_order, parent_id
      ) VALUES (?, ?, ?, ?, 1, 0, ?, ?)
    `).run(
      finalCategoryName,
      categoryData.description,
      categoryData.icon,
      categoryData.color,
      displayOrder,
      parentId
    );
    
    const newCategoryId = insertResult.lastInsertRowid;
    console.log(`Success Created category "${finalCategoryName}" with ID: ${newCategoryId}`);
    
    // If this category has predefined subcategories, create them
    if (categoryMappings[finalCategoryName] && categoryMappings[finalCategoryName].subcategories) {
      console.log(`Refresh Creating subcategories for "${finalCategoryName}"...`);
      categoryMappings[finalCategoryName].subcategories.forEach(subcat => {
        createOrFindCategory(subcat, true, finalCategoryName);
      });
    }
    
    return newCategoryId;
    
  } catch (error) {
    console.error(`Error Error creating category "${finalCategoryName || categoryName}":`, error.message);
    return null;
  }
}

// Helper function for proper capitalization
function properCapitalize(str) {
  if (!str) return str;
  
  return str
    .split(' ')
    .map(word => {
      if (word.length === 0) return word;
      
      // Handle special cases like "&", "and", "of", "the"
      const lowerWord = word.toLowerCase();
      if (['&', 'and', 'of', 'the', 'in', 'on', 'at', 'by', 'for', 'with'].includes(lowerWord)) {
        return lowerWord === '&' ? '&' : lowerWord;
      }
      
      // Capitalize first letter, keep rest as is (to preserve acronyms)
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ')
    .replace(/\b(\w)/g, (match, letter, offset) => {
      // Always capitalize first letter of the string
      return offset === 0 ? letter.toUpperCase() : match;
    });
}

// Function to auto-categorize based on product name/description
function intelligentCategorization(productName, productDescription = '') {
  const text = (productName + ' ' + productDescription).toLowerCase();
  
  // Home Decor keywords
  if (text.includes('vase') || text.includes('statue') || text.includes('sculpture') || 
      text.includes('decor') || text.includes('decorative') || text.includes('ornament') ||
      text.includes('figurine') || text.includes('candle') || text.includes('holder')) {
    return 'Home Decor';
  }
  
  // Electronics keywords
  if (text.includes('electronic') || text.includes('gadget') || text.includes('device') ||
      text.includes('phone') || text.includes('tablet') || text.includes('laptop') ||
      text.includes('headphone') || text.includes('speaker') || text.includes('charger')) {
    return 'Electronics';
  }
  
  // Fashion keywords
  if (text.includes('clothing') || text.includes('shirt') || text.includes('dress') ||
      text.includes('shoes') || text.includes('bag') || text.includes('accessory') ||
      text.includes('jewelry') || text.includes('watch')) {
    return 'Fashion';
  }
  
  // Beauty keywords
  if (text.includes('beauty') || text.includes('cosmetic') || text.includes('skincare') ||
      text.includes('makeup') || text.includes('perfume') || text.includes('cream') ||
      text.includes('lotion') || text.includes('shampoo')) {
    return 'Beauty';
  }
  
  // Kitchen keywords
  if (text.includes('kitchen') || text.includes('cooking') || text.includes('utensil') ||
      text.includes('pot') || text.includes('pan') || text.includes('plate') ||
      text.includes('cup') || text.includes('bowl')) {
    return 'Kitchen';
  }
  
  // Default fallback
  return 'Electronics & Gadgets';
}

// Main function to process and create categories
function processProductCategories() {
  console.log('\nSearch Analyzing current products and their categories...');
  
  // Get all unique categories from telegram_products
  const telegramCategories = db.prepare(`
    SELECT DISTINCT category FROM telegram_products 
    WHERE category IS NOT NULL AND category != ''
  `).all();
  
  // Get all unique categories from products
  const regularCategories = db.prepare(`
    SELECT DISTINCT category FROM products 
    WHERE category IS NOT NULL AND category != ''
  `).all();
  
  const allProductCategories = [...new Set([
    ...telegramCategories.map(c => c.category),
    ...regularCategories.map(c => c.category)
  ])];
  
  console.log(`\n📋 Found ${allProductCategories.length} unique product categories:`);
  allProductCategories.forEach(cat => console.log(`  - ${cat}`));
  
  console.log('\nRefresh Creating missing categories...');
  
  allProductCategories.forEach(categoryName => {
    createOrFindCategory(categoryName);
  });
  
  console.log('\nSuccess Category creation process completed!');
}

// Function to update Telegram integration with auto-category creation
function createTelegramIntegrationHelper() {
  const helperCode = `
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
      \`INSERT INTO categories (
        name, description, icon, color, 
        is_for_products, is_for_services, 
        display_order, parent_id
      ) VALUES (?, ?, ?, ?, 1, 0, ?, ?)\`
    ).run(
      categoryName,
      \`\${categoryName} products and services\`,
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
`;
  
  require('fs').writeFileSync('./category-helper.js', helperCode);
  console.log('\nBlog Created category-helper.js for Telegram integration');
}

// Run the main process
try {
  processProductCategories();
  createTelegramIntegrationHelper();
  
  console.log('\nTarget SUMMARY:');
  console.log('Success All missing categories have been created');
  console.log('Success Categories are now available in browse categories');
  console.log('Success Auto-category creation helper created');
  console.log('Success Future products will auto-create categories');
  
  console.log('\n📋 Updated Categories List:');
  const allCategories = db.prepare(`
    SELECT id, name, parent_id, display_order 
    FROM categories 
    ORDER BY display_order, id
  `).all();
  
  allCategories.forEach(cat => {
    const indent = cat.parent_id ? '  └─ ' : '';
    console.log(`${indent}${cat.id}. ${cat.name}`);
  });
  
} catch (error) {
  console.error('Error Error:', error.message);
} finally {
  db.close();
}