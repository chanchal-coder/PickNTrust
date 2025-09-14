/**
 * Simplified Category Validation System (JavaScript)
 * Prevents business reputation damage from incorrect product categorization
 * Ultimate fallback: "Curated Picks"
 */

import Database from 'better-sqlite3';

// Standard category whitelist - ONLY these are allowed
const STANDARD_CATEGORIES = [
  'Electronics & Gadgets',
  'Fashion & Clothing',
  'Home & Kitchen',
  'Health & Beauty',
  'Sports & Fitness',
  'Books & Education',
  'Toys & Games',
  'Automotive',
  'Travel & Luggage',
  'Pet Supplies',
  'Food & Beverages',
  'Jewelry & Watches',
  'Music & Instruments',
  'Office Supplies',
  'Outdoor & Recreation',
  'Arts & Crafts',
  'Tools & Hardware',
  'Photography',
  'Kitchen & Dining',
  'Furniture',
  'Lighting',
  'Cleaning Supplies',
  'Party Supplies',
  'Collectibles',
  'Industrial & Scientific',
  'Cards & Services',
  'AI Apps',
  'Apps & AI Apps',
  'Mystery Box',
  'Curated Picks'
];

// Ultimate fallback category
const FALLBACK_CATEGORY = 'Curated Picks';

// Comprehensive keyword mapping for smart detection
const CATEGORY_KEYWORDS = {
  'Electronics & Gadgets': {
    high: ['mouse', 'keyboard', 'headphone', 'laptop', 'computer', 'phone', 'smartphone', 'tablet', 'camera', 'speaker', 'charger', 'cable', 'adapter', 'monitor', 'tv', 'television', 'gaming', 'console', 'processor', 'graphics', 'memory', 'storage', 'ssd', 'hdd', 'motherboard', 'gpu', 'cpu', 'ram', 'bluetooth', 'wireless', 'usb', 'hdmi', 'electronic', 'digital', 'smart', 'tech', 'gadget', 'razer', 'logitech'],
    medium: ['device', 'portable', 'rechargeable', 'battery', 'power', 'led', 'lcd', 'screen', 'display', 'audio', 'video', 'data', 'signal', 'network', 'wifi', 'internet'],
    low: ['modern', 'advanced', 'premium', 'professional', 'high-tech']
  },
  'Fashion & Clothing': {
    high: ['shirt', 'dress', 'jeans', 'pants', 'shoes', 'boots', 'sneakers', 'jacket', 'coat', 'sweater', 'hoodie', 'tshirt', 't-shirt', 'blouse', 'skirt', 'shorts', 'socks', 'underwear', 'bra', 'lingerie', 'hat', 'cap', 'scarf', 'gloves', 'belt', 'bag', 'purse', 'wallet', 'fashion', 'clothing', 'apparel', 'wear', 'outfit', 'style'],
    medium: ['cotton', 'leather', 'denim', 'silk', 'wool', 'polyester', 'fabric', 'textile', 'size', 'fit', 'color', 'pattern'],
    low: ['trendy', 'stylish', 'casual', 'formal', 'elegant', 'comfortable']
  },
  'Home & Kitchen': {
    high: ['kitchen', 'cooking', 'cookware', 'pot', 'pan', 'knife', 'cutting', 'board', 'plate', 'bowl', 'cup', 'mug', 'glass', 'spoon', 'fork', 'utensil', 'appliance', 'microwave', 'oven', 'refrigerator', 'dishwasher', 'blender', 'mixer', 'toaster', 'coffee', 'maker', 'kettle', 'home', 'house', 'decor', 'furniture', 'chair', 'table', 'bed', 'sofa', 'lamp', 'curtain', 'pillow', 'blanket', 'towel'],
    medium: ['dining', 'living', 'bedroom', 'bathroom', 'storage', 'organization', 'cleaning', 'maintenance'],
    low: ['domestic', 'household', 'indoor', 'cozy', 'comfortable']
  },
  'Health & Beauty': {
    high: ['skincare', 'makeup', 'cosmetic', 'beauty', 'health', 'wellness', 'cream', 'lotion', 'serum', 'moisturizer', 'cleanser', 'toner', 'mask', 'shampoo', 'conditioner', 'soap', 'perfume', 'fragrance', 'cologne', 'deodorant', 'toothbrush', 'toothpaste', 'vitamin', 'supplement', 'medicine', 'medical', 'healthcare'],
    medium: ['personal', 'care', 'hygiene', 'treatment', 'therapy', 'natural', 'organic'],
    low: ['healthy', 'beautiful', 'fresh', 'clean', 'pure']
  },
  'Sports & Fitness': {
    high: ['sports', 'fitness', 'gym', 'exercise', 'workout', 'training', 'athletic', 'running', 'jogging', 'cycling', 'swimming', 'yoga', 'pilates', 'weightlifting', 'cardio', 'strength', 'muscle', 'protein', 'supplement', 'equipment', 'dumbbell', 'barbell', 'treadmill', 'bike', 'bicycle', 'ball', 'football', 'basketball', 'soccer', 'tennis', 'golf', 'baseball', 'volleyball'],
    medium: ['outdoor', 'recreation', 'activity', 'competition', 'team', 'player', 'coach', 'performance'],
    low: ['active', 'physical', 'energetic', 'competitive']
  }
};

// Brand-based category hints
const BRAND_CATEGORIES = {
  'apple': 'Electronics & Gadgets',
  'samsung': 'Electronics & Gadgets',
  'sony': 'Electronics & Gadgets',
  'lg': 'Electronics & Gadgets',
  'dell': 'Electronics & Gadgets',
  'hp': 'Electronics & Gadgets',
  'lenovo': 'Electronics & Gadgets',
  'asus': 'Electronics & Gadgets',
  'razer': 'Electronics & Gadgets',
  'logitech': 'Electronics & Gadgets',
  'nike': 'Fashion & Clothing',
  'adidas': 'Fashion & Clothing',
  'puma': 'Fashion & Clothing'
};

class CategoryValidator {
  constructor(databasePath = 'database.sqlite') {
    this.db = new Database(databasePath);
    this.ensureFallbackCategoryExists();
  }

  /**
   * Ensure the fallback category exists in the database
   */
  ensureFallbackCategoryExists() {
    try {
      const existingCategory = this.db.prepare(
        'SELECT id FROM categories WHERE name = ?'
      ).get(FALLBACK_CATEGORY);

      if (!existingCategory) {
        console.log(`Target Creating fallback category: ${FALLBACK_CATEGORY}`);
        
        this.db.prepare(`
          INSERT INTO categories (
            name, description, icon, color, 
            is_for_products, is_for_services, display_order
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          FALLBACK_CATEGORY,
          'Hand-selected premium products curated by our experts',
          'fas fa-star',
          '#FFD700', // Gold color for premium feel
          1, // is_for_products
          0, // is_for_services
          999 // display_order (last)
        );

        console.log(`Success Created fallback category: ${FALLBACK_CATEGORY}`);
      }
    } catch (error) {
      console.error('Error Error ensuring fallback category exists:', error);
    }
  }

  /**
   * Validate and assign category with robust fallback
   */
  validateAndAssignCategory(productData) {
    let finalCategory = FALLBACK_CATEGORY;
    let confidence = 100;
    let method = 'fallback';
    let needsReview = true;
    const originalCategory = productData.category;

    try {
      // Step 1: If product already has a category, validate it
      if (productData.category) {
        const validatedCategory = this.validateCategory(productData.category);
        
        if (validatedCategory !== FALLBACK_CATEGORY) {
          finalCategory = validatedCategory;
          confidence = 90;
          method = 'validation';
          needsReview = false;
          
          console.log(`Success Validated existing category: "${productData.category}" → "${validatedCategory}"`);
        } else {
          console.log(`Warning  Invalid category "${productData.category}" detected, proceeding with detection...`);
        }
      }

      // Step 2: If no valid category yet, use smart detection
      if (finalCategory === FALLBACK_CATEGORY) {
        const detectionResult = this.detectCategory({
          name: productData.name,
          description: productData.description,
          url: productData.url,
          price: productData.price,
          brand: productData.brand
        });

        if (detectionResult.confidence >= 70 && detectionResult.category !== FALLBACK_CATEGORY) {
          finalCategory = detectionResult.category;
          confidence = detectionResult.confidence;
          method = detectionResult.method;
          needsReview = detectionResult.needsReview;
          
          console.log(`Target Detected category: "${finalCategory}" (${confidence}% confidence via ${method})`);
        } else {
          console.log(`Experience Using fallback category: "${FALLBACK_CATEGORY}" for "${productData.name}"`);
        }
      }

      // Step 3: Ensure the final category exists in database
      this.ensureCategoryExists(finalCategory);

    } catch (error) {
      console.error('Error Error in category validation:', error);
      finalCategory = FALLBACK_CATEGORY;
      confidence = 100;
      method = 'error_fallback';
      needsReview = true;
    }

    return {
      finalCategory,
      confidence,
      method,
      needsReview,
      originalCategory
    };
  }

  /**
   * Smart category detection
   */
  detectCategory(productInfo) {
    // Try keyword-based detection first
    const keywordResult = this.detectByKeywords(productInfo);
    if (keywordResult && keywordResult.confidence >= 70) {
      return keywordResult;
    }

    // Try brand-based detection
    const brandResult = this.detectByBrand(productInfo);
    if (brandResult && brandResult.confidence >= 70) {
      return brandResult;
    }

    // Return best result or fallback
    const bestResult = keywordResult || brandResult;
    if (bestResult) {
      return bestResult;
    }

    return {
      category: FALLBACK_CATEGORY,
      confidence: 100,
      method: 'fallback',
      needsReview: true
    };
  }

  /**
   * Keyword-based detection
   */
  detectByKeywords(productInfo) {
    const text = `${productInfo.name} ${productInfo.description || ''}`.toLowerCase();
    let bestMatch = { category: '', confidence: 0 };

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      let confidence = 0;

      // High confidence keywords
      for (const keyword of keywords.high) {
        if (text.includes(keyword)) {
          confidence += 30;
        }
      }

      // Medium confidence keywords
      for (const keyword of keywords.medium) {
        if (text.includes(keyword)) {
          confidence += 15;
        }
      }

      // Low confidence keywords
      for (const keyword of keywords.low) {
        if (text.includes(keyword)) {
          confidence += 5;
        }
      }

      // Cap confidence at 95
      confidence = Math.min(confidence, 95);

      if (confidence > bestMatch.confidence) {
        bestMatch = { category, confidence };
      }
    }

    if (bestMatch.confidence >= 30) {
      return {
        category: bestMatch.category,
        confidence: bestMatch.confidence,
        method: 'keywords',
        needsReview: bestMatch.confidence < 70
      };
    }

    return null;
  }

  /**
   * Brand-based detection
   */
  detectByBrand(productInfo) {
    const text = `${productInfo.name} ${productInfo.brand || ''}`.toLowerCase();
    
    for (const [brand, category] of Object.entries(BRAND_CATEGORIES)) {
      if (text.includes(brand)) {
        return {
          category,
          confidence: 75,
          method: 'brand',
          needsReview: false
        };
      }
    }

    return null;
  }

  /**
   * Validate and standardize category name
   */
  validateCategory(category) {
    // Check if it's a standard category
    if (STANDARD_CATEGORIES.includes(category)) {
      return category;
    }

    // Try to map common variations
    const categoryMap = {
      'electronics': 'Electronics & Gadgets',
      'gadgets': 'Electronics & Gadgets',
      'tech': 'Electronics & Gadgets',
      'technology': 'Electronics & Gadgets',
      'fashion': 'Fashion & Clothing',
      'clothing': 'Fashion & Clothing',
      'apparel': 'Fashion & Clothing',
      'home': 'Home & Kitchen',
      'kitchen': 'Home & Kitchen',
      'house': 'Home & Kitchen',
      'beauty': 'Health & Beauty',
      'health': 'Health & Beauty',
      'cosmetics': 'Health & Beauty',
      'sports': 'Sports & Fitness',
      'fitness': 'Sports & Fitness',
      'gym': 'Sports & Fitness',
      'books': 'Books & Education',
      'education': 'Books & Education',
      'learning': 'Books & Education',
      'toys': 'Toys & Games',
      'games': 'Toys & Games',
      'gaming': 'Electronics & Gadgets', // Gaming products are electronics!
      'auto': 'Automotive',
      'car': 'Automotive',
      'vehicle': 'Automotive',
      'travel': 'Travel & Luggage',
      'luggage': 'Travel & Luggage',
      'pets': 'Pet Supplies',
      'animals': 'Pet Supplies',
      'food': 'Food & Beverages',
      'beverages': 'Food & Beverages',
      'drinks': 'Food & Beverages',
      'jewelry': 'Jewelry & Watches',
      'watches': 'Jewelry & Watches',
      'music': 'Music & Instruments',
      'instruments': 'Music & Instruments',
      'office': 'Office Supplies',
      'supplies': 'Office Supplies',
      'outdoor': 'Outdoor & Recreation',
      'recreation': 'Outdoor & Recreation',
      'arts': 'Arts & Crafts',
      'crafts': 'Arts & Crafts',
      'tools': 'Tools & Hardware',
      'hardware': 'Tools & Hardware',
      'photography': 'Photography',
      'camera': 'Electronics & Gadgets',
      'furniture': 'Furniture',
      'lighting': 'Lighting',
      'cleaning': 'Cleaning Supplies',
      'party': 'Party Supplies',
      'collectibles': 'Collectibles',
      'industrial': 'Industrial & Scientific',
      'scientific': 'Industrial & Scientific',
      'services': 'Cards & Services',
      'cards': 'Cards & Services',
      'ai': 'AI Apps',
      'apps': 'Apps & AI Apps',
      'mystery': 'Mystery Box'
    };

    const lowerCategory = category.toLowerCase();
    if (categoryMap[lowerCategory]) {
      return categoryMap[lowerCategory];
    }

    // If no mapping found, return fallback
    return FALLBACK_CATEGORY;
  }

  /**
   * Ensure a category exists in the database
   */
  ensureCategoryExists(categoryName) {
    try {
      const existingCategory = this.db.prepare(
        'SELECT id FROM categories WHERE name = ?'
      ).get(categoryName);

      if (!existingCategory && categoryName !== FALLBACK_CATEGORY) {
        if (STANDARD_CATEGORIES.includes(categoryName)) {
          console.log(`🏗️  Creating missing standard category: ${categoryName}`);
          
          this.db.prepare(`
            INSERT INTO categories (
              name, description, icon, color, 
              is_for_products, is_for_services, display_order
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
            categoryName,
            `Products in ${categoryName} category`,
            this.getDefaultIcon(categoryName),
            this.getDefaultColor(categoryName),
            1, 0, this.getDefaultDisplayOrder(categoryName)
          );

          console.log(`Success Created category: ${categoryName}`);
        }
      }
    } catch (error) {
      console.error(`Error Error ensuring category exists (${categoryName}):`, error);
    }
  }

  /**
   * Get default icon for category
   */
  getDefaultIcon(categoryName) {
    const iconMap = {
      'Electronics & Gadgets': 'fas fa-laptop',
      'Fashion & Clothing': 'fas fa-tshirt',
      'Home & Kitchen': 'fas fa-home',
      'Health & Beauty': 'fas fa-heart',
      'Sports & Fitness': 'fas fa-dumbbell',
      'Books & Education': 'fas fa-book',
      'Toys & Games': 'fas fa-gamepad',
      'Automotive': 'fas fa-car',
      'Travel & Luggage': 'fas fa-suitcase',
      'Pet Supplies': 'fas fa-paw',
      'Curated Picks': 'fas fa-star'
    };
    return iconMap[categoryName] || 'fas fa-tag';
  }

  /**
   * Get default color for category
   */
  getDefaultColor(categoryName) {
    const colorMap = {
      'Electronics & Gadgets': '#4ECDC4',
      'Fashion & Clothing': '#45B7D1',
      'Home & Kitchen': '#FF6B6B',
      'Health & Beauty': '#FF69B4',
      'Sports & Fitness': '#32CD32',
      'Books & Education': '#9370DB',
      'Toys & Games': '#FFB347',
      'Automotive': '#1E90FF',
      'Travel & Luggage': '#FF4500',
      'Pet Supplies': '#228B22',
      'Curated Picks': '#FFD700'
    };
    return colorMap[categoryName] || '#6366F1';
  }

  /**
   * Get default display order for category
   */
  getDefaultDisplayOrder(categoryName) {
    const orderMap = {
      'Electronics & Gadgets': 10,
      'Fashion & Clothing': 20,
      'Home & Kitchen': 30,
      'Health & Beauty': 40,
      'Sports & Fitness': 50,
      'Books & Education': 60,
      'Toys & Games': 70,
      'Automotive': 80,
      'Travel & Luggage': 90,
      'Pet Supplies': 100,
      'Curated Picks': 999
    };
    return orderMap[categoryName] || 500;
  }

  /**
   * Close database connection
   */
  close() {
    this.db.close();
  }
}

// Static helper functions for easy use
function validateProductCategory(productData) {
  const validator = new CategoryValidator();
  const result = validator.validateAndAssignCategory(productData);
  validator.close();
  return result.finalCategory;
}

function ensureCategoryExists(categoryName) {
  const validator = new CategoryValidator();
  validator.ensureCategoryExists(categoryName);
  validator.close();
}

export {
  CategoryValidator,
  validateProductCategory,
  ensureCategoryExists,
  STANDARD_CATEGORIES,
  FALLBACK_CATEGORY
};