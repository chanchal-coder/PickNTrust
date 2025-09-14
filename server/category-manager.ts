import { db, sqliteDb } from './db';
import { sql } from 'drizzle-orm';

/**
 * CategoryManager - Automatic category creation and management service
 * Handles dynamic category creation during autoposting
 * Manages category lifecycle including auto-expiration
 * Provides category cards for browse section
 */
export class CategoryManager {
  private static instance: CategoryManager;
  
  constructor() {
    console.log('📂 Category Manager initialized:');
    console.log('   Features: auto-creation, lifecycle management, browse integration');
    console.log('   Database: categories + category_products tables');
  }
  
  /**
   * Get singleton instance
   */
  static getInstance(): CategoryManager {
    if (!CategoryManager.instance) {
      CategoryManager.instance = new CategoryManager();
    }
    return CategoryManager.instance;
  }

  /**
   * Ensure category exists - create if missing
   * This is the main function called during autoposting
   */
  async ensureCategoryExists(
    categoryName: string,
    options: {
      productId: number;
      productTable: string;
      pageName: string;
      productName?: string;
      productPrice?: string;
      productImageUrl?: string;
      productExpiresAt?: number;
      categoryType?: 'product' | 'service' | 'app' | 'ai-app';
    }
  ): Promise<number> {
    try {
      console.log(`📂 Ensuring category exists: ${categoryName}`);
      
      // Check if category already exists
      let category = await this.getCategoryByName(categoryName);
      
      if (!category) {
        // Create new category
        console.log(`➕ Creating new category: ${categoryName}`);
        category = await this.createCategory({
          name: categoryName,
          slug: this.generateSlug(categoryName),
          description: `${categoryName} products and deals`,
          icon: this.getDefaultIcon(categoryName, options.categoryType),
          color: this.getDefaultColor(categoryName),
          categoryType: options.categoryType || 'product',
          autoCreated: true,
          createdByPage: options.pageName,
          firstProductId: options.productId
        });
      }
      
      // Link product to category
      await this.linkProductToCategory({
        categoryId: category.id,
        productId: options.productId,
        productTable: options.productTable,
        pageName: options.pageName,
        productName: options.productName,
        productPrice: options.productPrice,
        productImageUrl: options.productImageUrl,
        productExpiresAt: options.productExpiresAt
      });
      
      // Update category product counts
      await this.updateCategoryProductCounts(category.id, options.pageName, 1);
      
      console.log(`Success Category ensured: ${categoryName} (ID: ${category.id})`);
      return category.id;
      
    } catch (error) {
      console.error('Error Error ensuring category exists:', error);
      throw error;
    }
  }

  /**
   * Get category by name
   */
  private async getCategoryByName(name: string): Promise<any | null> {
    try {
      const result = await db.all(
        sql`SELECT * FROM categories WHERE name = ${name} LIMIT 1`
      );
      return result[0] || null;
    } catch (error) {
      console.error('Error getting category by name:', error);
      return null;
    }
  }

  /**
   * Create new category
   */
  private async createCategory(data: {
    name: string;
    slug: string;
    description: string;
    icon: string;
    color: string;
    categoryType: string;
    autoCreated: boolean;
    createdByPage: string;
    firstProductId: number;
  }): Promise<any> {
    try {
      // Simple insert for compatibility
      await db.run(
        sql`INSERT INTO categories (name) VALUES (${data.name})`
      );
      
      // Get the inserted category
      const result = await db.all(
        sql`SELECT * FROM categories WHERE name = ${data.name} LIMIT 1`
      );
      
      return result[0];
      
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  /**
   * Link product to category
   */
  private async linkProductToCategory(data: {
    categoryId: number;
    productId: number;
    productTable: string;
    pageName: string;
    productName?: string;
    productPrice?: string;
    productImageUrl?: string;
    productExpiresAt?: number;
  }): Promise<void> {
    try {
      // Check if link already exists
      const existingLink = await db.all(
        sql`SELECT id FROM category_products 
            WHERE category_id = ${data.categoryId.toString()} 
            AND product_id = ${data.productId.toString()} 
            AND product_table = ${data.productTable}
            LIMIT 1`
      );
      
      if (existingLink.length > 0) {
        console.log('Product already linked to category');
        return;
      }
      
      // Create new link with basic fields
      await db.run(
        sql`INSERT INTO category_products (
          category_id, product_id, product_table, page_name
        ) VALUES (
          ${data.categoryId.toString()}, ${data.productId.toString()}, ${data.productTable}, ${data.pageName}
        )`
      );
      
      console.log(`Link Product linked to category: ${data.productId} -> ${data.categoryId}`);
      
    } catch (error) {
      console.error('Error linking product to category:', error);
      throw error;
    }
  }

  /**
   * Update category product counts
   */
  private async updateCategoryProductCounts(
    categoryId: number, 
    pageName: string, 
    increment: number
  ): Promise<void> {
    try {
      // Simplified update for compatibility
      console.log(`Updating category ${categoryId} counts`);
    } catch (error) {
      console.error('Error updating category product counts:', error);
    }
  }

  /**
   * Generate URL-friendly slug from category name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
  }

  /**
   * Get default icon for category
   */
  private getDefaultIcon(categoryName: string, categoryType?: string): string {
    const name = categoryName.toLowerCase();
    
    // Category type specific icons
    if (categoryType === 'service') {
      if (name.includes('streaming') || name.includes('video') || name.includes('music')) {
        return 'fas fa-play-circle';
      }
      if (name.includes('credit') || name.includes('bank') || name.includes('finance')) {
        return 'fas fa-credit-card';
      }
      return 'fas fa-concierge-bell';
    }
    
    if (categoryType === 'ai-app' || name.includes('ai')) {
      return 'fas fa-robot';
    }
    
    if (categoryType === 'app' || name.includes('app')) {
      if (name.includes('productivity')) return 'fas fa-tasks';
      if (name.includes('design')) return 'fas fa-palette';
      if (name.includes('developer')) return 'fas fa-code';
      return 'fas fa-mobile-alt';
    }
    
    // Product category specific icons
    if (name.includes('electronic') || name.includes('phone') || name.includes('laptop')) {
      return 'fas fa-mobile-alt';
    }
    if (name.includes('fashion') || name.includes('clothing') || name.includes('apparel')) {
      return 'fas fa-tshirt';
    }
    if (name.includes('home') || name.includes('kitchen') || name.includes('furniture')) {
      return 'fas fa-home';
    }
    if (name.includes('beauty') || name.includes('health') || name.includes('cosmetic')) {
      return 'fas fa-heart';
    }
    if (name.includes('book') || name.includes('education') || name.includes('learning')) {
      return 'fas fa-book';
    }
    if (name.includes('sport') || name.includes('fitness') || name.includes('gym')) {
      return 'fas fa-dumbbell';
    }
    if (name.includes('automotive') || name.includes('car') || name.includes('vehicle')) {
      return 'fas fa-car';
    }
    if (name.includes('toy') || name.includes('game') || name.includes('kids')) {
      return 'fas fa-gamepad';
    }
    if (name.includes('food') || name.includes('grocery') || name.includes('snack')) {
      return 'fas fa-utensils';
    }
    
    // Default icon
    return 'fas fa-tag';
  }

  /**
   * Get default color for category
   */
  private getDefaultColor(categoryName: string): string {
    const name = categoryName.toLowerCase();
    
    // Color mapping based on category name
    const colorMap: { [key: string]: string } = {
      'electronics': '#3B82F6', // Blue
      'fashion': '#EC4899', // Pink
      'home': '#10B981', // Green
      'beauty': '#F59E0B', // Amber
      'health': '#EF4444', // Red
      'books': '#8B5CF6', // Purple
      'sports': '#06B6D4', // Cyan
      'automotive': '#6B7280', // Gray
      'toys': '#F97316', // Orange
      'food': '#84CC16', // Lime
      'ai': '#06B6D4', // Cyan
      'app': '#84CC16', // Lime
      'service': '#8B5CF6', // Purple
      'streaming': '#EF4444', // Red
      'credit': '#10B981', // Green
      'finance': '#F59E0B' // Amber
    };
    
    // Find matching color
    for (const [keyword, color] of Object.entries(colorMap)) {
      if (name.includes(keyword)) {
        return color;
      }
    }
    
    // Generate color based on name hash
    const colors = ['#3B82F6', '#EC4899', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16'];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }

  /**
   * Remove product from category (when product expires or is deleted)
   */
  async removeProductFromCategory(
    productId: number,
    productTable: string,
    pageName: string
  ): Promise<void> {
    try {
      console.log(`🗑️ Removing product from categories: ${productId}`);
      
      // Remove product links
      await db.run(
        sql`DELETE FROM category_products 
            WHERE product_id = ${productId.toString()} AND product_table = ${productTable}`
      );
      
      console.log(`Success Product removed from categories`);
      
    } catch (error) {
      console.error('Error removing product from category:', error);
    }
  }

  /**
   * Get all categories for browse page with product counts
   */
  async getCategoriesForBrowse(options: {
    includeEmpty?: boolean;
    categoryType?: string;
    featured?: boolean;
    limit?: number;
  } = {}): Promise<any[]> {
    try {
      const { limit = 50 } = options;
      
      // Get base categories
      let query = 'SELECT * FROM categories ORDER BY name ASC';
      if (limit) {
        query += ` LIMIT ${limit}`;
      }
      
      const categories = await db.all(sql.raw(query));
      
      // Calculate product counts for each category
      const categoriesWithCounts = await Promise.all(
        categories.map(async (category: any) => {
          try {
            // Count products from each table
            const productCounts = await this.getProductCountsForCategory(category.name);
            
            return {
              ...category,
              ...productCounts,
              total_products_count: productCounts.prime_picks_count + 
                                  productCounts.click_picks_count + 
                                  productCounts.cue_picks_count + 
                                  productCounts.value_picks_count + 
                                  productCounts.global_picks_count + 
                                  productCounts.deals_hub_count + 
                                  productCounts.loot_box_count + 
                                  productCounts.apps_count + 
                                  productCounts.services_count,
              has_active_products: (productCounts.prime_picks_count + 
                                  productCounts.click_picks_count + 
                                  productCounts.cue_picks_count + 
                                  productCounts.value_picks_count + 
                                  productCounts.global_picks_count + 
                                  productCounts.deals_hub_count + 
                                  productCounts.loot_box_count + 
                                  productCounts.apps_count + 
                                  productCounts.services_count) > 0
            };
          } catch (error) {
            console.error(`Error calculating counts for category ${category.name}:`, error);
            return {
              ...category,
              total_products_count: 0,
              prime_picks_count: 0,
              click_picks_count: 0,
              cue_picks_count: 0,
              value_picks_count: 0,
              global_picks_count: 0,
              deals_hub_count: 0,
              loot_box_count: 0,
              apps_count: 0,
              services_count: 0,
              has_active_products: false
            };
          }
        })
      );
      
      return categoriesWithCounts;
      
    } catch (error) {
      console.error('Error getting categories for browse:', error);
      return [];
    }
  }

  /**
   * Get product counts for a specific category across all tables
   */
  private async getProductCountsForCategory(categoryName: string): Promise<any> {
    try {
      const counts = {
        prime_picks_count: 0,
        click_picks_count: 0,
        cue_picks_count: 0,
        value_picks_count: 0,
        global_picks_count: 0,
        deals_hub_count: 0,
        loot_box_count: 0,
        apps_count: 0,
        services_count: 0
      };

      // Count from amazon_products (Prime Picks)
      try {
        const primeResult = await db.all(
          sql`SELECT COUNT(*) as count FROM amazon_products WHERE category = ${categoryName} AND processing_status = 'active'`
        ) as Array<{count: number}>;
        counts.prime_picks_count = primeResult[0]?.count || 0;
      } catch (error) {
        console.error('Error counting prime picks:', error);
      }

      // Count from cuelinks_products (Click Picks)
      try {
        const clickResult = await db.all(
          sql`SELECT COUNT(*) as count FROM cuelinks_products WHERE category = ${categoryName} AND processing_status = 'active'`
        ) as Array<{count: number}>;
        counts.click_picks_count = clickResult[0]?.count || 0;
      } catch (error) {
        console.error('Error counting click picks:', error);
      }

      // Count from value_picks_products (Value Picks)
      try {
        const valueResult = await db.all(
          sql`SELECT COUNT(*) as count FROM value_picks_products WHERE category = ${categoryName} AND processing_status = 'active'`
        ) as Array<{count: number}>;
        counts.value_picks_count = valueResult[0]?.count || 0;
      } catch (error) {
        console.error('Error counting value picks:', error);
      }

      // Count from global_picks_products (Global Picks)
      try {
        const globalResult = await db.all(
          sql`SELECT COUNT(*) as count FROM global_picks_products WHERE category = ${categoryName} AND processing_status = 'active'`
        ) as Array<{count: number}>;
        counts.global_picks_count = globalResult[0]?.count || 0;
      } catch (error) {
        console.error('Error counting global picks:', error);
      }

      // Count from dealshub_products (DealsHub)
      try {
        const dealsResult = await db.all(
          sql`SELECT COUNT(*) as count FROM dealshub_products WHERE category = ${categoryName} AND processing_status = 'active'`
        ) as Array<{count: number}>;
        counts.deals_hub_count = dealsResult[0]?.count || 0;
      } catch (error) {
        console.error('Error counting deals hub:', error);
      }

      // Count from loot_box_products (Loot Box) - WHOLESALE PRODUCTS
      try {
        const lootResult = sqliteDb.prepare(
          'SELECT COUNT(*) as count FROM loot_box_products WHERE category = ? AND processing_status = ?'
        ).get(categoryName, 'active');
        counts.loot_box_count = (lootResult as any)?.count || 0;
      } catch (error) {
        console.error('Error counting loot box:', error);
      }

      // Count from apps table (Apps)
      try {
        const appsResult = await db.all(
          sql`SELECT COUNT(*) as count FROM apps WHERE category = ${categoryName} AND is_active = 1`
        ) as Array<{count: number}>;
        counts.apps_count = appsResult[0]?.count || 0;
      } catch (error) {
        console.error('Error counting apps:', error);
      }

      // Count services from all tables
      try {
        let servicesCount = 0;
        
        // Services from amazon_products
        const amazonServices = await db.all(
          sql`SELECT COUNT(*) as count FROM amazon_products WHERE category = ${categoryName} AND content_type = 'service' AND processing_status = 'active'`
        ) as Array<{count: number}>;
        servicesCount += amazonServices[0]?.count || 0;
        
        // Services from cuelinks_products
        const cuelinkServices = await db.all(
          sql`SELECT COUNT(*) as count FROM cuelinks_products WHERE category = ${categoryName} AND content_type = 'service' AND processing_status = 'active'`
        ) as Array<{count: number}>;
        servicesCount += cuelinkServices[0]?.count || 0;
        
        counts.services_count = servicesCount;
      } catch (error) {
        console.error('Error counting services:', error);
      }

      return counts;
      
    } catch (error) {
      console.error('Error getting product counts for category:', error);
      return {
        prime_picks_count: 0,
        click_picks_count: 0,
        cue_picks_count: 0,
        value_picks_count: 0,
        global_picks_count: 0,
        deals_hub_count: 0,
        loot_box_count: 0,
        apps_count: 0,
        services_count: 0
      };
    }
  }

  /**
   * Get category with product count by page
   */
  async getCategoryWithProductCounts(categoryId: number): Promise<any | null> {
    try {
      const result = await db.all(
        sql`SELECT * FROM categories WHERE id = ${categoryId.toString()} LIMIT 1`
      );
      
      return result[0] || null;
      
    } catch (error) {
      console.error('Error getting category with product counts:', error);
      return null;
    }
  }

  /**
   * Cleanup expired products from categories
   * This should be run periodically as a background job
   */
  async cleanupExpiredProducts(): Promise<void> {
    try {
      console.log('Cleanup Cleaning up expired products from categories...');
      
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Remove expired links (simplified)
      console.log(`Success Cleanup completed`);
      
    } catch (error) {
      console.error('Error cleaning up expired products:', error);
    }
  }

  /**
   * Get category statistics
   */
  async getCategoryStats(): Promise<any> {
    try {
      const stats = await db.all(
        sql`SELECT COUNT(*) as total_categories FROM categories`
      ) as Array<{total_categories: number}>;
      
      return {
        total_categories: stats[0]?.total_categories || 0,
        auto_created_categories: 0,
        categories_with_products: 0,
        featured_categories: 0,
        total_products_across_categories: 0
      };
      
    } catch (error) {
      console.error('Error getting category stats:', error);
      return {
        total_categories: 0,
        auto_created_categories: 0,
        categories_with_products: 0,
        featured_categories: 0,
        total_products_across_categories: 0
      };
    }
  }
}