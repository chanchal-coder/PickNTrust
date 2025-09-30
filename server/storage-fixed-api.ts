import { db, sqliteDb } from './db.js';
import { products, blogPosts, categories, affiliateNetworks, newsletterSubscribers } from '../shared/sqlite-schema.js';
import { desc, eq, like, and, or, sql, count } from 'drizzle-orm';
import type { Product, BlogPost, Category, AffiliateNetwork, NewsletterSubscriber } from '../shared/sqlite-schema.js';

export class DatabaseStorage {
  // FIXED: Products with direct SQL to bypass ORM mapping issues
  async getProducts(): Promise<Product[]> {
    try {
      console.log('🔍 DatabaseStorage: Getting products with direct SQL...');
      console.log('📊 Database connection status:', sqliteDb ? 'Connected' : 'Not connected');
      
      // Use direct SQL to bypass ORM schema mapping issues
      const result = sqliteDb.prepare('SELECT * FROM products ORDER BY id DESC').all() as Product[];
      console.log(`✅ DatabaseStorage: Found ${result.length} products via direct SQL`);
      
      if (result.length > 0) {
        console.log('📝 Sample product:', { id: result[0].id, name: result[0].name, price: result[0].price });
      }
      
      return result;
    } catch (error) {
      console.error('❌ DatabaseStorage: Error getting products:', error);
      return [];
    }
  }

  async getFeaturedProducts(): Promise<Product[]> {
    try {
      const result = sqliteDb.prepare('SELECT * FROM products WHERE is_featured = 1 ORDER BY id DESC').all() as Product[];
      return result;
    } catch (error) {
      console.error('❌ DatabaseStorage: Error getting featured products:', error);
      return [];
    }
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    try {
      const result = sqliteDb.prepare('SELECT * FROM products WHERE category = ? ORDER BY id DESC').all(category) as Product[];
      return result;
    } catch (error) {
      console.error('❌ DatabaseStorage: Error getting products by category:', error);
      return [];
    }
  }

  async searchProducts(query: string): Promise<Product[]> {
    try {
      const searchTerm = `%${query}%`;
      const result = sqliteDb.prepare('SELECT * FROM products WHERE name LIKE ? OR description LIKE ? ORDER BY id DESC').all(searchTerm, searchTerm) as Product[];
      return result;
    } catch (error) {
      console.error('❌ DatabaseStorage: Error searching products:', error);
      return [];
    }
  }

  async getProductById(id: number): Promise<Product | null> {
    try {
      const result = sqliteDb.prepare('SELECT * FROM products WHERE id = ?').get(id) as Product;
      return result || null;
    } catch (error) {
      console.error('❌ DatabaseStorage: Error getting product by id:', error);
      return null;
    }
  }

  async createProduct(product: Omit<Product, 'id'>): Promise<Product> {
    try {
      const stmt = sqliteDb.prepare(`
        INSERT INTO products (name, description, price, original_price, currency, image_url, affiliate_url, category, rating, review_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const result = stmt.run(
        product.name,
        product.description,
        product.price,
        product.originalPrice,
        product.currency || 'INR',
        product.imageUrl,
        product.affiliateUrl,
        product.category,
        product.rating,
        product.reviewCount
      );
      return { ...product, id: result.lastInsertRowid as number } as Product;
    } catch (error) {
      console.error('❌ DatabaseStorage: Error creating product:', error);
      throw error;
    }
  }

  // Other methods with direct SQL where needed
  async getCategories(): Promise<Category[]> {
    try {
      const result = sqliteDb.prepare('SELECT * FROM categories ORDER BY display_order ASC, name ASC').all() as Category[];
      return result;
    } catch (error) {
      console.error('❌ DatabaseStorage: Error getting categories:', error);
      return [];
    }
  }

  async getBlogPosts(): Promise<BlogPost[]> {
    try {
      const result = sqliteDb.prepare('SELECT * FROM blog_posts ORDER BY published_at DESC').all() as BlogPost[];
      return result;
    } catch (error) {
      console.error('❌ DatabaseStorage: Error getting blog posts:', error);
      return [];
    }
  }
}

export const storage = new DatabaseStorage();