/**
 * Category Validation Service (TypeScript)
 * Provides robust category validation and assignment for products
 * Prevents business reputation damage from incorrect categorization
 */

import { db } from '../db';
import { categories } from '../../shared/sqlite-schema';
import { eq } from 'drizzle-orm';

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
] as const;

// Ultimate fallback category
const FALLBACK_CATEGORY = 'Curated Picks';

// Product data interface
interface ProductData {
  id?: number;
  name: string;
  description?: string;
  url?: string;
  price?: string | number;
  category?: string;
}

// Category stats interface
interface CategoryStats {
  category: string;
  product_count: number;
  percentage: number;
}

// Validation result interface
interface ValidationResult {
  finalCategory: string;
  confidence: number;
  reason: string;
}

export class CategoryValidationService {
  /**
   * Validate and assign category for a product
   */
  static validateAndAssignCategory(productData: ProductData): ValidationResult {
    try {
      // If product has a category, validate it
      if (productData.category) {
        // Check if it's already standard
        if (STANDARD_CATEGORIES.includes(productData.category as any)) {
          return {
            finalCategory: productData.category,
            confidence: 100,
            reason: 'Already standard category'
          };
        }

        // Try to map common variations
        const mappedCategory = this.mapCategoryVariation(productData.category);
        if (mappedCategory !== FALLBACK_CATEGORY) {
          return {
            finalCategory: mappedCategory,
            confidence: 90,
            reason: 'Mapped from variation'
          };
        }
      }

      // Detect category from product name and description
      const detectedCategory = this.detectCategoryFromContent(productData);
      if (detectedCategory !== FALLBACK_CATEGORY) {
        return {
          finalCategory: detectedCategory,
          confidence: 80,
          reason: 'Detected from content'
        };
      }

      // Use fallback category
      return {
        finalCategory: FALLBACK_CATEGORY,
        confidence: 50,
        reason: 'Fallback category for manual review'
      };
    } catch (error) {
      console.error('Error Error in category validation:', error);
      return {
        finalCategory: FALLBACK_CATEGORY,
        confidence: 0,
        reason: 'Error occurred, using fallback'
      };
    }
  }

  /**
   * Map common category variations to standard categories
   */
  private static mapCategoryVariation(category: string): string {
    const categoryMap: Record<string, string> = {
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
    return categoryMap[lowerCategory] || FALLBACK_CATEGORY;
  }

  /**
   * Detect category from product content
   */
  private static detectCategoryFromContent(productData: ProductData): string {
    const content = `${productData.name || ''} ${productData.description || ''} ${productData.url || ''}`.toLowerCase();

    // Electronics & Gadgets keywords
    if (/\b(mouse|keyboard|headphone|laptop|computer|phone|smartphone|tablet|camera|speaker|charger|cable|adapter|monitor|tv|television|gaming|console|processor|graphics|memory|storage|ssd|hdd|motherboard|gpu|cpu|ram)\b/.test(content)) {
      return 'Electronics & Gadgets';
    }

    // Fashion & Clothing keywords
    if (/\b(shirt|dress|pants|shoes|jacket|coat|hat|bag|purse|belt|watch|jewelry|fashion|clothing|apparel|wear)\b/.test(content)) {
      return 'Fashion & Clothing';
    }

    // Home & Kitchen keywords
    if (/\b(kitchen|cooking|utensil|pot|pan|plate|cup|mug|bowl|spoon|fork|knife|blender|mixer|oven|microwave|refrigerator|home|house|furniture|decor)\b/.test(content)) {
      return 'Home & Kitchen';
    }

    // Health & Beauty keywords
    if (/\b(health|beauty|cosmetic|skincare|makeup|shampoo|soap|cream|lotion|medicine|vitamin|supplement|fitness|wellness)\b/.test(content)) {
      return 'Health & Beauty';
    }

    // Sports & Fitness keywords
    if (/\b(sport|fitness|gym|exercise|workout|running|cycling|swimming|football|basketball|tennis|golf|yoga|equipment)\b/.test(content)) {
      return 'Sports & Fitness';
    }

    // Books & Education keywords
    if (/\b(book|novel|textbook|education|learning|study|school|college|university|course|tutorial|guide)\b/.test(content)) {
      return 'Books & Education';
    }

    // Toys & Games keywords
    if (/\b(toy|game|puzzle|doll|action figure|board game|card game|video game|children|kids|play)\b/.test(content)) {
      return 'Toys & Games';
    }

    // Automotive keywords
    if (/\b(car|auto|vehicle|motorcycle|bike|tire|engine|brake|oil|battery|automotive|driving|transport)\b/.test(content)) {
      return 'Automotive';
    }

    // Travel & Luggage keywords
    if (/\b(travel|luggage|suitcase|backpack|bag|trip|vacation|journey|flight|hotel|tourism)\b/.test(content)) {
      return 'Travel & Luggage';
    }

    // Pet Supplies keywords
    if (/\b(pet|dog|cat|bird|fish|animal|food|toy|collar|leash|cage|aquarium|veterinary)\b/.test(content)) {
      return 'Pet Supplies';
    }

    return FALLBACK_CATEGORY;
  }

  /**
   * Get category statistics
   */
  static async getCategoryStats(): Promise<CategoryStats[]> {
    try {
      const totalProducts = await db.select().from(categories);
      const stats: CategoryStats[] = [];
      
      for (const category of STANDARD_CATEGORIES) {
        const count = totalProducts.filter(p => p.name === category).length;
        const percentage = totalProducts.length > 0 ? Math.round((count / totalProducts.length) * 100) : 0;
        
        stats.push({
          category,
          product_count: count,
          percentage
        });
      }
      
      return stats.sort((a, b) => b.product_count - a.product_count);
    } catch (error) {
      console.error('Error Error getting category stats:', error);
      return [];
    }
  }

  /**
   * Ensure a category exists in the database
   */
  static async ensureCategoryExists(categoryName: string): Promise<void> {
    try {
      const existingCategory = await db.select().from(categories).where(eq(categories.name, categoryName)).limit(1);
      
      if (existingCategory.length === 0 && categoryName === FALLBACK_CATEGORY) {
        await db.insert(categories).values({
          name: 'Curated Picks',
          description: 'Hand-selected premium products curated by our experts',
          icon: 'fas fa-star',
          color: '#FFD700',
          isForProducts: true,
          isForServices: false,
          displayOrder: 999
        } as any);
        
        console.log('Success Created Curated Picks category');
      }
    } catch (error) {
      console.error('Error Error ensuring category exists:', error);
    }
  }
}

// Export helper functions for easy use
export function validateProductCategory(productData: ProductData): string {
  const result = CategoryValidationService.validateAndAssignCategory(productData);
  return result.finalCategory;
}

export function ensureCategoryExists(categoryName: string): Promise<void> {
  return CategoryValidationService.ensureCategoryExists(categoryName);
}

export { STANDARD_CATEGORIES, FALLBACK_CATEGORY };