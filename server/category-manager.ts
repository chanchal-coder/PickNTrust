import { db } from './db.js';
import { sql } from 'drizzle-orm';

export interface CategoryCounts {
  prime_picks_count: number;
  click_picks_count: number;
  cue_picks_count: number;
  value_picks_count: number;
  global_picks_count: number;
  deals_hub_count: number;
  loot_box_count: number;
  apps_count: number;
  services_count: number;
}

export class CategoryManager {
  async getCategoryProductCounts(categoryName: string): Promise<CategoryCounts> {
    const counts: CategoryCounts = {
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

    try {
      // Count products for each page type from the main products table
      const pageTypes = [
        'prime-picks',
        'click-picks', 
        'cue-picks',
        'value-picks',
        'global-picks',
        'deals-hub',
        'loot-box',
        'apps',
        'services'
      ];

      for (const pageType of pageTypes) {
        try {
          const result = await db.all(
            sql`SELECT COUNT(*) as count FROM products 
                WHERE category = ${categoryName} 
                AND display_pages LIKE '%' || ${pageType} || '%'
                AND processing_status = 'active'`
          ) as Array<{count: number}>;
          
          const count = result[0]?.count || 0;
          const fieldName = pageType.replace('-', '_') + '_count' as keyof CategoryCounts;
          counts[fieldName] = count;
        } catch (error) {
          console.error(`Error counting ${pageType} products:`, error);
        }
      }

      return counts;
    } catch (error) {
      console.error('Error getting category product counts:', error);
      return counts;
    }
  }

  async getAllCategories(): Promise<string[]> {
    try {
      const result = await db.all(
        sql`SELECT DISTINCT category FROM products 
            WHERE category IS NOT NULL 
            AND category != '' 
            AND processing_status = 'active'
            ORDER BY category`
      ) as Array<{category: string}>;
      
      return result.map(row => row.category);
    } catch (error) {
      console.error('Error getting all categories:', error);
      return [];
    }
  }

  async getCategoriesForPage(page: string): Promise<string[]> {
    try {
      const result = await db.all(
        sql`SELECT DISTINCT category FROM products 
            WHERE display_pages LIKE '%' || ${page} || '%'
            AND category IS NOT NULL 
            AND category != '' 
            AND processing_status = 'active'
            ORDER BY category`
      ) as Array<{category: string}>;
      
      return result.map(row => row.category);
    } catch (error) {
      console.error(`Error getting categories for page ${page}:`, error);
      return [];
    }
  }

  async getProductCountForCategory(category: string, page?: string): Promise<number> {
    try {
      let query = sql`SELECT COUNT(*) as count FROM products 
                     WHERE category = ${category} 
                     AND processing_status = 'active'`;
      
      if (page) {
        query = sql`SELECT COUNT(*) as count FROM products 
                   WHERE category = ${category} 
                   AND display_pages LIKE '%' || ${page} || '%'
                   AND processing_status = 'active'`;
      }
      
      const result = await db.all(query) as Array<{count: number}>;
      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error getting product count for category:', error);
      return 0;
    }
  }
}

export const categoryManager = new CategoryManager();
