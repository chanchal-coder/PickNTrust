import { 
  products, 
  blogPosts, 
  newsletterSubscribers, 
  categories,
  affiliateNetworks,
  adminUsers,
  announcements,
  videoContent,
  canvaSettings,
  canvaPosts,
  canvaTemplates,
  type Product, 
  type InsertProduct,
  type BlogPost,
  type InsertBlogPost,
  type NewsletterSubscriber,
  type InsertNewsletterSubscriber,
  type Category,
  type InsertCategory,
  type AffiliateNetwork,
  type InsertAffiliateNetwork,
  type AdminUser,
  type InsertAdminUser,
  type Announcement,
  type InsertAnnouncement,
  type VideoContent,
  type InsertVideoContent,
  type CanvaSettings,
  type InsertCanvaSettings,
  type CanvaPost,
  type InsertCanvaPost,
  type CanvaTemplate,
  type InsertCanvaTemplate
} from "../shared/sqlite-schema.js";
import { db } from "./db.js";
import { eq, desc, ne, and, lt } from "drizzle-orm";
import fs from 'fs';

// Utility functions for consistent timestamp handling
const toUnixTimestamp = (date: Date): number => Math.floor(date.getTime() / 1000);
const fromUnixTimestamp = (timestamp: number): Date => new Date(timestamp * 1000);

// Validation helpers
const validateProduct = (product: any): void => {
  if (!product.name?.trim()) throw new Error('Product name is required');
  
  // For services, price validation is more flexible
  if (product.isService) {
    // Services can be free or have flexible pricing
    if (product.isFree) {
      // Free services don't need price validation
    } else {
      // Non-free services should have some pricing information
      const parsedPrice = typeof product.price === 'string' ? parseFloat(product.price.replace(/[^\d.]/g, '')) : product.price;
      const hasMonthlyPrice = product.monthlyPrice && parseFloat(product.monthlyPrice.toString()) > 0;
      const hasYearlyPrice = product.yearlyPrice && parseFloat(product.yearlyPrice.toString()) > 0;
      
      if (!hasMonthlyPrice && !hasYearlyPrice && (isNaN(parsedPrice) || parsedPrice < 0)) {
        throw new Error('Services must have valid pricing information (price, monthly price, or yearly price)');
      }
    }
  } else {
    // Regular products need valid price
    const parsedPrice = typeof product.price === 'string' ? parseFloat(product.price.replace(/[^\d.]/g, '')) : product.price;
    if (isNaN(parsedPrice) || parsedPrice < 0) throw new Error('Valid price is required');
  }
  
  if (product.rating) {
    const parsedRating = typeof product.rating === 'string' ? parseFloat(product.rating) : product.rating;
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) throw new Error('Rating must be between 1 and 5');
  }
};

const validateVideoContent = (video: any): void => {
  if (!video.title?.trim()) throw new Error('Video title is required');
  if (!video.videoUrl?.trim()) throw new Error('Video URL is required');
  if (!video.platform?.trim()) throw new Error('Platform is required');
};

const validateBlogPost = (blog: any): void => {
  if (!blog.title?.trim()) throw new Error('Blog title is required');
  if (!blog.content?.trim()) throw new Error('Blog content is required');
};

export interface IStorage {
  // Products
  getProducts(): Promise<Product[]>;
  getFeaturedProducts(): Promise<Product[]>;
  getServiceProducts(): Promise<Product[]>;
  getAIAppsProducts(): Promise<Product[]>;
  getProductsByCategory(category: string): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  
  // Categories
  getCategories(): Promise<Category[]>;
  getCategoriesWithSubcategories(): Promise<Category[]>;
  getMainCategories(): Promise<Category[]>;
  getSubcategories(parentId: number): Promise<Category[]>;
  getProductCategories(): Promise<Category[]>;
  getServiceCategories(): Promise<Category[]>;
  getAIAppCategories(): Promise<Category[]>;
  addCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, updates: Partial<Category>): Promise<Category | null>;
  deleteCategory(id: number): Promise<boolean>;
  
  // Blog Posts
  getBlogPosts(): Promise<BlogPost[]>;
  
  // Newsletter
  subscribeToNewsletter(subscriber: InsertNewsletterSubscriber): Promise<NewsletterSubscriber>;
  getNewsletterSubscribers(): Promise<NewsletterSubscriber[]>;
  
  // Affiliate Networks
  getAffiliateNetworks(): Promise<AffiliateNetwork[]>;
  getActiveAffiliateNetworks(): Promise<AffiliateNetwork[]>;
  addAffiliateNetwork(network: InsertAffiliateNetwork): Promise<AffiliateNetwork>;
  updateAffiliateNetwork(id: number, network: Partial<AffiliateNetwork>): Promise<AffiliateNetwork>;
  
  // Admin
  addProduct(product: any): Promise<Product>;
  deleteProduct(id: number): Promise<boolean>;
  updateProduct(id: number, updates: Partial<Product>): Promise<Product | null>;
  
  // Blog Management
  addBlogPost(blogPost: any): Promise<BlogPost>;
  deleteBlogPost(id: number): Promise<boolean>;
  updateBlogPost(id: number, updates: Partial<BlogPost>): Promise<BlogPost | null>;

  // Announcements
  getAnnouncements(): Promise<Announcement[]>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  updateAnnouncement(id: number, updates: Partial<Announcement>): Promise<Announcement | null>;
  deleteAnnouncement(id: number): Promise<boolean>;
  
  // Admin User Management
  getAdminByEmail(email: string): Promise<AdminUser | undefined>;
  getAdminByUsername(username: string): Promise<AdminUser | undefined>;
  getAdminById(id: number): Promise<AdminUser | undefined>;
  createAdmin(admin: InsertAdminUser): Promise<AdminUser>;
  updateAdminPassword(id: number, passwordHash: string): Promise<boolean>;
  setResetToken(email: string, token: string, expiry: Date): Promise<boolean>;
  validateResetToken(token: string): Promise<AdminUser | undefined>;
  clearResetToken(id: number): Promise<boolean>;
  updateLastLogin(id: number): Promise<boolean>;
  
  // Video Content Management
  getVideoContent(): Promise<VideoContent[]>;
  addVideoContent(videoContent: any): Promise<VideoContent>;
  deleteVideoContent(id: number): Promise<boolean>;
  updateVideoContent(id: number, updates: Partial<VideoContent>): Promise<VideoContent | null>;
  
  // Cleanup
  cleanupExpiredProducts(): Promise<number>;
  cleanupExpiredBlogPosts(): Promise<number>;
  cleanupExpiredVideoContent(): Promise<number>;
  
  // Canva Automation
  getCanvaSettings(): Promise<CanvaSettings | null>;
  updateCanvaSettings(settings: Partial<CanvaSettings>): Promise<CanvaSettings>;
  getCanvaPosts(): Promise<CanvaPost[]>;
  addCanvaPost(post: InsertCanvaPost): Promise<CanvaPost>;
  updateCanvaPost(id: number, updates: Partial<CanvaPost>): Promise<CanvaPost | null>;
  deleteCanvaPost(id: number): Promise<boolean>;
  getCanvaTemplates(): Promise<CanvaTemplate[]>;
  addCanvaTemplate(template: InsertCanvaTemplate): Promise<CanvaTemplate>;
  updateCanvaTemplate(id: number, updates: Partial<CanvaTemplate>): Promise<CanvaTemplate | null>;
  deleteCanvaTemplate(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Products
  async getProducts(): Promise<Product[]> {
    try {
      console.log('DatabaseStorage: Getting products...');
      const result = await db.select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        originalPrice: products.originalPrice,
        currency: products.currency,
        imageUrl: products.imageUrl,
        affiliateUrl: products.affiliateUrl,
        affiliateNetworkId: products.affiliateNetworkId,
        category: products.category,
        gender: products.gender,
        rating: products.rating,
        reviewCount: products.reviewCount,
        discount: products.discount,
        isNew: products.isNew,
        isFeatured: products.isFeatured,
        isService: products.isService,
        isAIApp: products.isAIApp,
        customFields: products.customFields,
        pricingType: products.pricingType,
        monthlyPrice: products.monthlyPrice,
        yearlyPrice: products.yearlyPrice,
        isFree: products.isFree,
        priceDescription: products.priceDescription,
        hasTimer: products.hasTimer,
        timerDuration: products.timerDuration,
        timerStartTime: products.timerStartTime,
        createdAt: products.createdAt
      }).from(products).orderBy(desc(products.id));
      console.log(`DatabaseStorage: Found ${result.length} products`);
      return result;
    } catch (error) {
      console.error('DatabaseStorage: Error getting products:', error);
      return [];
    }
  }

  async getFeaturedProducts(): Promise<Product[]> {
    try {
      return await db.select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        originalPrice: products.originalPrice,
        currency: products.currency,
        imageUrl: products.imageUrl,
        affiliateUrl: products.affiliateUrl,
        affiliateNetworkId: products.affiliateNetworkId,
        category: products.category,
        gender: products.gender,
        rating: products.rating,
        reviewCount: products.reviewCount,
        discount: products.discount,
        isNew: products.isNew,
        isFeatured: products.isFeatured,
        isService: products.isService,
        isAIApp: products.isAIApp,
        customFields: products.customFields,
        pricingType: products.pricingType,
        monthlyPrice: products.monthlyPrice,
        yearlyPrice: products.yearlyPrice,
        isFree: products.isFree,
        priceDescription: products.priceDescription,
        hasTimer: products.hasTimer,
        timerDuration: products.timerDuration,
        timerStartTime: products.timerStartTime,
        createdAt: products.createdAt
      }).from(products).where(eq(products.isFeatured, true)).orderBy(desc(products.id));
    } catch (error) {
      console.log('DatabaseStorage: Featured products query failed, trying raw SQL fallback...');
      try {
        // Use raw SQL with proper column mapping
        const Database = (await import('better-sqlite3')).default;
        const dbFile = fs.existsSync('database.sqlite') ? 'database.sqlite' : 'sqlite.db';
        const rawDb = new Database(dbFile);
        
        const result = rawDb.prepare(`
          SELECT id, name, description, price, 
                 original_price as originalPrice,
                 currency,
                 image_url as imageUrl,
                 affiliate_url as affiliateUrl,
                 affiliate_network_id as affiliateNetworkId,
                 category, gender, rating,
                 review_count as reviewCount,
                 discount,
                 COALESCE(is_new, 0) as isNew,
                 COALESCE(is_featured, 0) as isFeatured,
                 COALESCE(is_service, 0) as isService,
                 custom_fields as customFields,
                 pricing_type as pricingType,
                 monthly_price as monthlyPrice,
                 yearly_price as yearlyPrice,
                 COALESCE(is_free, 0) as isFree,
                 price_description as priceDescription,
                 COALESCE(has_timer, 0) as hasTimer,
                 timer_duration as timerDuration,
                 timer_start_time as timerStartTime,
                 created_at as createdAt
          FROM products 
          WHERE COALESCE(is_featured, 0) = 1
          ORDER BY id DESC
        `).all();
        
        rawDb.close();
        return result as Product[];
      } catch (fallbackError) {
        console.log('DatabaseStorage: Featured products fallback failed, returning empty array');
        return [];
      }
    }
  }

  async getServiceProducts(): Promise<Product[]> {
    try {
      return await db.select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        originalPrice: products.originalPrice,
        currency: products.currency,
        imageUrl: products.imageUrl,
        affiliateUrl: products.affiliateUrl,
        affiliateNetworkId: products.affiliateNetworkId,
        category: products.category,
        gender: products.gender,
        rating: products.rating,
        reviewCount: products.reviewCount,
        discount: products.discount,
        isNew: products.isNew,
        isFeatured: products.isFeatured,
        isService: products.isService,
        isAIApp: products.isAIApp,
        customFields: products.customFields,
        // Advanced pricing fields (mapped from schema)
        pricingType: products.pricingType,
        monthlyPrice: products.monthlyPrice,
        yearlyPrice: products.yearlyPrice,
        isFree: products.isFree,
        priceDescription: products.priceDescription,
        // Timer fields
        hasTimer: products.hasTimer,
        timerDuration: products.timerDuration,
        timerStartTime: products.timerStartTime,
        createdAt: products.createdAt
      }).from(products).where(eq(products.isService, true)).orderBy(desc(products.id));
    } catch (error) {
      console.log('DatabaseStorage: Service products query failed, returning empty array');
      return [];
    }
  }

  async getAIAppsProducts(): Promise<Product[]> {
    try {
      return await db.select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        originalPrice: products.originalPrice,
        currency: products.currency,
        imageUrl: products.imageUrl,
        affiliateUrl: products.affiliateUrl,
        affiliateNetworkId: products.affiliateNetworkId,
        category: products.category,
        gender: products.gender,
        rating: products.rating,
        reviewCount: products.reviewCount,
        discount: products.discount,
        isNew: products.isNew,
        isFeatured: products.isFeatured,
        isService: products.isService,
        isAIApp: products.isAIApp,
        customFields: products.customFields,
        // Advanced pricing fields (mapped from schema)
        pricingType: products.pricingType,
        monthlyPrice: products.monthlyPrice,
        yearlyPrice: products.yearlyPrice,
        isFree: products.isFree,
        priceDescription: products.priceDescription,
        // Timer fields
        hasTimer: products.hasTimer,
        timerDuration: products.timerDuration,
        timerStartTime: products.timerStartTime,
        createdAt: products.createdAt
      }).from(products).where(eq(products.isAIApp, true)).orderBy(desc(products.id));
    } catch (error) {
      console.log('DatabaseStorage: AI Apps products query failed, returning empty array');
      return [];
    }
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    try {
      return await db.select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        originalPrice: products.originalPrice,
        currency: products.currency,
        imageUrl: products.imageUrl,
        affiliateUrl: products.affiliateUrl,
        affiliateNetworkId: products.affiliateNetworkId,
        category: products.category,
        gender: products.gender,
        rating: products.rating,
        reviewCount: products.reviewCount,
        discount: products.discount,
        isNew: products.isNew,
        isFeatured: products.isFeatured,
        isService: products.isService,
        isAIApp: products.isAIApp,
        customFields: products.customFields,
        pricingType: products.pricingType,
        monthlyPrice: products.monthlyPrice,
        yearlyPrice: products.yearlyPrice,
        isFree: products.isFree,
        priceDescription: products.priceDescription,
        hasTimer: products.hasTimer,
        timerDuration: products.timerDuration,
        timerStartTime: products.timerStartTime,
        createdAt: products.createdAt
      }).from(products).where(eq(products.category, category)).orderBy(desc(products.id));
    } catch (error) {
      console.log('DatabaseStorage: Products by category query failed, trying raw SQL fallback...');
      try {
        const Database = (await import('better-sqlite3')).default;
        const dbFile = fs.existsSync('database.sqlite') ? 'database.sqlite' : 'sqlite.db';
        const rawDb = new Database(dbFile);
        
        const result = rawDb.prepare(`
          SELECT id, name, description, price, 
                 original_price as originalPrice,
                 currency,
                 image_url as imageUrl,
                 affiliate_url as affiliateUrl,
                 affiliate_network_id as affiliateNetworkId,
                 category, gender, rating,
                 review_count as reviewCount,
                 discount,
                 COALESCE(is_new, 0) as isNew,
                 COALESCE(is_featured, 0) as isFeatured,
                 COALESCE(is_service, 0) as isService,
                 custom_fields as customFields,
                 pricing_type as pricingType,
                 monthly_price as monthlyPrice,
                 yearly_price as yearlyPrice,
                 COALESCE(is_free, 0) as isFree,
                 price_description as priceDescription,
                 COALESCE(has_timer, 0) as hasTimer,
                 timer_duration as timerDuration,
                 timer_start_time as timerStartTime,
                 created_at as createdAt
          FROM products 
          WHERE category = ?
          ORDER BY id DESC
        `).all(category);
        
        rawDb.close();
        return result as Product[];
      } catch (fallbackError) {
        console.log('DatabaseStorage: Products by category fallback failed, returning empty array');
        return [];
      }
    }
  }

  async getProduct(id: number): Promise<Product | undefined> {
    try {
      const [product] = await db.select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        originalPrice: products.originalPrice,
        currency: products.currency,
        imageUrl: products.imageUrl,
        affiliateUrl: products.affiliateUrl,
        affiliateNetworkId: products.affiliateNetworkId,
        category: products.category,
        gender: products.gender,
        rating: products.rating,
        reviewCount: products.reviewCount,
        discount: products.discount,
        isNew: products.isNew,
        isFeatured: products.isFeatured,
        isService: products.isService,
        isAIApp: products.isAIApp,
        customFields: products.customFields,
        pricingType: products.pricingType,
        monthlyPrice: products.monthlyPrice,
        yearlyPrice: products.yearlyPrice,
        isFree: products.isFree,
        priceDescription: products.priceDescription,
        hasTimer: products.hasTimer,
        timerDuration: products.timerDuration,
        timerStartTime: products.timerStartTime,
        createdAt: products.createdAt
      }).from(products).where(eq(products.id, id));
      return product || undefined;
    } catch (error) {
      console.log('DatabaseStorage: Get product failed, returning undefined');
      return undefined;
    }
  }

  // Categories with comprehensive fallback handling
  async getCategories(): Promise<Category[]> {
    try {
      // Use raw SQL directly to ensure we get displayOrder values
      const Database = (await import('better-sqlite3')).default;
      const dbFile = fs.existsSync('sqlite.db') ? 'sqlite.db' : 'database.sqlite';
      const rawDb = new Database(dbFile);
      
      const result = rawDb.prepare(`
        SELECT id, name, icon, color, description,
               parent_id as parentId,
               COALESCE(is_for_products, 1) as isForProducts,
               COALESCE(is_for_services, 0) as isForServices,
               COALESCE(is_for_ai_apps, 0) as isForAIApps,
               COALESCE(display_order, 0) as displayOrder
        FROM categories 
        ORDER BY COALESCE(parent_id, 0), COALESCE(display_order, id * 10)
      `).all();
      
      rawDb.close();
      return result as Category[];
    } catch (error) {
      console.log('DatabaseStorage: Raw SQL failed, trying Drizzle fallback...');
      try {
        // Fallback to Drizzle query
        return await db.select().from(categories).orderBy(categories.displayOrder);
      } catch (drizzleError) {
        console.log('DatabaseStorage: All category queries failed, returning empty array');
        return [];
      }
    }
  }

  async getProductCategories(): Promise<Category[]> {
    try {
      return await db.select().from(categories)
        .where(eq(categories.isForProducts, true))
        .orderBy(categories.displayOrder, categories.name);
    } catch (error) {
      console.log('DatabaseStorage: Product categories query failed, using fallback');
      const allCategories = await this.getCategories();
      return allCategories.filter(cat => cat.isForProducts);
    }
  }

  async getServiceCategories(): Promise<Category[]> {
    try {
      return await db.select().from(categories)
        .where(eq(categories.isForServices, true))
        .orderBy(categories.displayOrder, categories.name);
    } catch (error) {
      console.log('DatabaseStorage: Service categories query failed, using fallback');
      const allCategories = await this.getCategories();
      return allCategories.filter(cat => cat.isForServices);
    }
  }

  async getAIAppCategories(): Promise<Category[]> {
    try {
      return await db.select().from(categories)
        .where(eq(categories.isForAIApps, true))
        .orderBy(categories.displayOrder, categories.name);
    } catch (error) {
      console.log('DatabaseStorage: AI App categories query failed, using fallback');
      const allCategories = await this.getCategories();
      return allCategories.filter(cat => cat.isForAIApps);
    }
  }

  async getCategoriesWithSubcategories(): Promise<Category[]> {
    try {
      const Database = (await import('better-sqlite3')).default;
      const dbFile = fs.existsSync('sqlite.db') ? 'sqlite.db' : 'database.sqlite';
      const rawDb = new Database(dbFile);
      
      const result = rawDb.prepare(`
        SELECT id, name, icon, color, description,
               parent_id as parentId,
               COALESCE(is_for_products, 1) as isForProducts,
               COALESCE(is_for_services, 0) as isForServices,
               COALESCE(is_for_ai_apps, 0) as isForAIApps,
               COALESCE(display_order, 0) as displayOrder
        FROM categories 
        ORDER BY COALESCE(parent_id, 0), COALESCE(display_order, id * 10)
      `).all();
      
      rawDb.close();
      return result as Category[];
    } catch (error) {
      console.log('DatabaseStorage: getCategoriesWithSubcategories failed, using fallback');
      return await this.getCategories();
    }
  }

  async getMainCategories(): Promise<Category[]> {
    try {
      const Database = (await import('better-sqlite3')).default;
      const dbFile = fs.existsSync('sqlite.db') ? 'sqlite.db' : 'database.sqlite';
      const rawDb = new Database(dbFile);
      
      const result = rawDb.prepare(`
        SELECT id, name, icon, color, description,
               parent_id as parentId,
               COALESCE(is_for_products, 1) as isForProducts,
               COALESCE(is_for_services, 0) as isForServices,
               COALESCE(is_for_ai_apps, 0) as isForAIApps,
               COALESCE(display_order, 0) as displayOrder
        FROM categories 
        WHERE parent_id IS NULL
        ORDER BY COALESCE(display_order, id * 10)
      `).all();
      
      rawDb.close();
      return result as Category[];
    } catch (error) {
      console.log('DatabaseStorage: getMainCategories failed, using fallback');
      const allCategories = await this.getCategories();
      return allCategories.filter(cat => !cat.parentId);
    }
  }

  async getSubcategories(parentId: number): Promise<Category[]> {
    try {
      const Database = (await import('better-sqlite3')).default;
      const dbFile = fs.existsSync('sqlite.db') ? 'sqlite.db' : 'database.sqlite';
      const rawDb = new Database(dbFile);
      
      const result = rawDb.prepare(`
        SELECT id, name, icon, color, description,
               parent_id as parentId,
               COALESCE(is_for_products, 1) as isForProducts,
               COALESCE(is_for_services, 0) as isForServices,
               COALESCE(is_for_ai_apps, 0) as isForAIApps,
               COALESCE(display_order, 0) as displayOrder
        FROM categories 
        WHERE parent_id = ?
        ORDER BY COALESCE(display_order, id * 10)
      `).all(parentId);
      
      rawDb.close();
      return result as Category[];
    } catch (error) {
      console.log('DatabaseStorage: getSubcategories failed, using fallback');
      const allCategories = await this.getCategories();
      return allCategories.filter(cat => cat.parentId === parentId);
    }
  }

  async addCategory(category: InsertCategory): Promise<Category> {
    try {
      const [newCategory] = await db
        .insert(categories)
        .values(category)
        .returning();
      return newCategory;
    } catch (error) {
      console.log('DatabaseStorage: Add category failed, trying raw SQL fallback...');
      try {
        // Use raw SQL with proper column handling
        const Database = (await import('better-sqlite3')).default;
        const dbFile = fs.existsSync('sqlite.db') ? 'sqlite.db' : 'database.sqlite';
        const rawDb = new Database(dbFile);
        
        // Insert with proper column mapping and defaults
        const insertResult = rawDb.prepare(`
          INSERT INTO categories (name, icon, color, description, is_for_products, is_for_services, is_for_ai_apps, display_order)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          category.name,
          category.icon,
          category.color,
          category.description,
          category.isForProducts !== undefined ? (category.isForProducts ? 1 : 0) : 1,
          category.isForServices !== undefined ? (category.isForServices ? 1 : 0) : 0,
          category.isForAIApps !== undefined ? (category.isForAIApps ? 1 : 0) : 0,
          category.displayOrder || 0
        );
        
        // Get the inserted category
        const newCategory = rawDb.prepare(`
          SELECT id, name, icon, color, description,
                 is_for_products as isForProducts,
                 is_for_services as isForServices,
                 is_for_ai_apps as isForAIApps,
                 display_order as displayOrder
          FROM categories WHERE id = ?
        `).get(insertResult.lastInsertRowid);
        
        rawDb.close();
        return newCategory as Category;
      } catch (fallbackError: unknown) {
        console.log('DatabaseStorage: Add category fallback failed:', fallbackError);
        const errorMessage = fallbackError instanceof Error ? fallbackError.message : 'Unknown error';
        throw new Error(`Failed to add category: ${errorMessage}`);
      }
    }
  }

  async updateCategory(id: number, updates: Partial<Category>): Promise<Category | null> {
    try {
      console.log(`DatabaseStorage: updateCategory called with id=${id}, updates=`, updates);
      
      // Use raw SQL for reliable updates
      const Database = (await import('better-sqlite3')).default;
      const dbFile = fs.existsSync('sqlite.db') ? 'sqlite.db' : 'database.sqlite';
      const rawDb = new Database(dbFile);
      
      // First check if category exists
      const existingCategory = rawDb.prepare('SELECT id FROM categories WHERE id = ?').get(id);
      if (!existingCategory) {
        console.log(`DatabaseStorage: Category with id=${id} not found`);
        rawDb.close();
        return null;
      }
      
      // Handle displayOrder update specifically (most common case)
      if (updates.displayOrder !== undefined && Object.keys(updates).length === 1) {
        console.log(`DatabaseStorage: Updating displayOrder for id=${id} to ${updates.displayOrder}`);
        
        const updateResult = rawDb.prepare(`
          UPDATE categories 
          SET display_order = ? 
          WHERE id = ?
        `).run(updates.displayOrder, id);
        
        console.log(`DatabaseStorage: Update result:`, updateResult);
        
        if (updateResult.changes === 0) {
          console.log(`DatabaseStorage: No rows updated for id=${id}`);
          rawDb.close();
          return null;
        }
        
        // Fetch and return the updated category
        const updatedCategory = rawDb.prepare(`
          SELECT id, name, icon, color, description,
                 COALESCE(is_for_products, 1) as isForProducts,
                 COALESCE(is_for_services, 0) as isForServices,
                 COALESCE(is_for_ai_apps, 0) as isForAIApps,
                 COALESCE(display_order, 0) as displayOrder
          FROM categories 
          WHERE id = ?
        `).get(id);
        
        rawDb.close();
        console.log(`DatabaseStorage: Returning updated category:`, updatedCategory);
        return updatedCategory as Category;
      }
      
      // Handle other field updates (fallback to original logic)
      const setClauses = [];
      const values = [];
      
      if (updates.name !== undefined) {
        setClauses.push('name = ?');
        values.push(updates.name);
      }
      if (updates.description !== undefined) {
        setClauses.push('description = ?');
        values.push(updates.description);
      }
      if (updates.icon !== undefined) {
        setClauses.push('icon = ?');
        values.push(updates.icon);
      }
      if (updates.color !== undefined) {
        setClauses.push('color = ?');
        values.push(updates.color);
      }
      if (updates.isForProducts !== undefined) {
        setClauses.push('is_for_products = ?');
        values.push(updates.isForProducts ? 1 : 0);
      }
      if (updates.isForServices !== undefined) {
        setClauses.push('is_for_services = ?');
        values.push(updates.isForServices ? 1 : 0);
      }
      if (updates.isForAIApps !== undefined) {
        setClauses.push('is_for_ai_apps = ?');
        values.push(updates.isForAIApps ? 1 : 0);
      }
      if (updates.displayOrder !== undefined) {
        setClauses.push('display_order = ?');
        values.push(updates.displayOrder);
      }
      
      if (setClauses.length === 0) {
        console.log(`DatabaseStorage: No valid updates provided`);
        rawDb.close();
        return null;
      }
      
      values.push(id);
      
      const updateResult = rawDb.prepare(`
        UPDATE categories 
        SET ${setClauses.join(', ')} 
        WHERE id = ?
      `).run(...values);
      
      if (updateResult.changes === 0) {
        console.log(`DatabaseStorage: No rows updated for id=${id}`);
        rawDb.close();
        return null;
      }
      
      const updatedCategory = rawDb.prepare(`
        SELECT id, name, icon, color, description,
               COALESCE(is_for_products, 1) as isForProducts,
               COALESCE(is_for_services, 0) as isForServices,
               COALESCE(is_for_ai_apps, 0) as isForAIApps,
               COALESCE(display_order, 0) as displayOrder
        FROM categories 
        WHERE id = ?
      `).get(id);
      
      rawDb.close();
      return updatedCategory as Category;
    } catch (error) {
      console.error('DatabaseStorage: updateCategory failed:', error);
      return null;
    }
  }

  async deleteCategory(id: number): Promise<boolean> {
    await db.delete(categories).where(eq(categories.id, id));
    return true;
  }

  // Blog Posts
  async getBlogPosts(): Promise<BlogPost[]> {
    return await db.select().from(blogPosts).orderBy(desc(blogPosts.publishedAt));
  }

  // Newsletter
  async subscribeToNewsletter(subscriber: InsertNewsletterSubscriber): Promise<NewsletterSubscriber> {
    const [newSubscriber] = await db
      .insert(newsletterSubscribers)
      .values(subscriber)
      .returning();
    return newSubscriber;
  }

  async getNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
    return await db.select().from(newsletterSubscribers).orderBy(desc(newsletterSubscribers.subscribedAt));
  }

  // Affiliate Networks
  async getAffiliateNetworks(): Promise<AffiliateNetwork[]> {
    return await db.select().from(affiliateNetworks).orderBy(affiliateNetworks.name);
  }

  async getActiveAffiliateNetworks(): Promise<AffiliateNetwork[]> {
    return await db.select().from(affiliateNetworks).where(eq(affiliateNetworks.isActive, true)).orderBy(affiliateNetworks.name);
  }

  async addAffiliateNetwork(network: InsertAffiliateNetwork): Promise<AffiliateNetwork> {
    const [newNetwork] = await db
      .insert(affiliateNetworks)
      .values(network)
      .returning();
    return newNetwork;
  }

  async updateAffiliateNetwork(id: number, network: Partial<AffiliateNetwork>): Promise<AffiliateNetwork> {
    const [updatedNetwork] = await db
      .update(affiliateNetworks)
      .set(network)
      .where(eq(affiliateNetworks.id, id))
      .returning();
    return updatedNetwork;
  }

  // Timer cleanup method
  async cleanupExpiredProducts(): Promise<number> {
    try {
      return 0; // Simple cleanup for now
    } catch (error) {
      console.error('Error in cleanupExpiredProducts:', error);
      return 0;
    }
  }

  async cleanupExpiredBlogPosts(): Promise<number> {
    try {
      return 0; // Simple cleanup for now
    } catch (error) {
      console.error('Error in cleanupExpiredBlogPosts:', error);
      return 0;
    }
  }

  // Admin Product Management
  async addProduct(product: InsertProduct): Promise<Product> {
    try {
      console.log('DatabaseStorage: Adding product with data:', product);
      
      // Validate input data
      validateProduct(product);
      
      // Normalize gender values for consistent storage
      const normalizeGender = (g: string | null): string | null => {
        if (!g) return null;
        const genderMap: { [key: string]: string } = {
          'men': 'men',
          'women': 'women', 
          'kids': 'kids',
          'boys': 'boys',
          'girls': 'girls'
        };
        return genderMap[g.toLowerCase()] || g.toLowerCase();
      };
      
      // Normalize numeric values
      const rating = typeof product.rating === 'string' ? parseFloat(product.rating) : product.rating;
      const reviewCount = typeof product.reviewCount === 'string' ? parseInt(product.reviewCount) : product.reviewCount;
      
      // Handle pricing logic differently for services vs products
      let price = 0;
      let originalPrice = null;
      let monthlyPrice = null;
      let yearlyPrice = null;
      let pricingType = null;
      let isFree = Boolean(product.isFree);
      
      // Debug: Check what values we have for isService and isAIApp
      console.log('DatabaseStorage: Checking product flags:', {
        isService: product.isService,
        isAIApp: product.isAIApp,
        isServiceBoolean: Boolean(product.isService),
        isAIAppBoolean: Boolean(product.isAIApp),
        conditionResult: Boolean(product.isService || product.isAIApp)
      });
      
      if (product.isService || product.isAIApp) {
        // For services and AI Apps, handle pricing based on type and available fields
        pricingType = product.pricingType || 'one-time';
        monthlyPrice = product.monthlyPrice?.toString().trim() || null;
        yearlyPrice = product.yearlyPrice?.toString().trim() || null;
        
        console.log('Service/AI App pricing debug:', {
          isService: product.isService,
          isAIApp: product.isAIApp,
          isFree,
          pricingType,
          monthlyPrice,
          yearlyPrice,
          regularPrice: product.price
        });
        
        // Determine pricing based on what's provided - prioritize isFree flag first
        if (isFree || pricingType === 'free') {
          price = 0;
          pricingType = 'free';
          console.log('Setting as free service/AI app');
        } else if (pricingType === 'monthly' && monthlyPrice && monthlyPrice !== '0' && monthlyPrice !== '') {
          // Monthly pricing provided
          price = parseFloat(monthlyPrice.replace(/[^\d.]/g, '')) || 0;
          pricingType = 'monthly';
          console.log('Setting as monthly service/AI app:', price);
        } else if (pricingType === 'yearly' && yearlyPrice && yearlyPrice !== '0' && yearlyPrice !== '') {
          // Yearly pricing provided
          price = parseFloat(yearlyPrice.replace(/[^\d.]/g, '')) || 0;
          pricingType = 'yearly';
          console.log('Setting as yearly service/AI app:', price);
        } else if (pricingType === 'one-time' && product.price && product.price !== '0') {
          // One-time pricing provided
          price = typeof product.price === 'string' ? parseFloat(product.price.replace(/[^\d.]/g, '')) : product.price;
          pricingType = 'one-time';
          console.log('Setting as one-time service/AI app:', price);
        } else {
          // Fallback - use whatever price is available
          price = typeof product.price === 'string' ? parseFloat(product.price.replace(/[^\d.]/g, '')) : (product.price || 0);
          console.log('Fallback pricing:', price, pricingType);
        }
        
        // Handle original price for services and AI Apps
        if (product.originalPrice) {
          originalPrice = typeof product.originalPrice === 'string' ? parseFloat(product.originalPrice.replace(/[^\d.]/g, '')) : product.originalPrice;
        }
      } else {
        // For regular products, use standard pricing
        price = typeof product.price === 'string' ? parseFloat(product.price.replace(/[^\d.]/g, '')) : product.price;
        originalPrice = product.originalPrice ? 
          (typeof product.originalPrice === 'string' ? parseFloat(product.originalPrice.replace(/[^\d.]/g, '')) : product.originalPrice) : null;
      }
      
      // Handle timer logic and data transformation
      const now = new Date();
      const normalizedGender = normalizeGender(product.gender || null);
      
      // Debug pricing variables before productData construction
      console.log('DatabaseStorage: Final pricing variables before DB insert:', {
        pricingType,
        monthlyPrice,
        yearlyPrice,
        isFree,
        priceDescription: product.priceDescription?.trim() || null,
        isService: product.isService,
        isAIApp: product.isAIApp
      });

      const productData = {
        name: product.name.trim(),
        description: product.description?.trim() || '',
        price: (price || 0).toString(),
        originalPrice: originalPrice ? originalPrice.toString() : null,
        currency: product.currency || 'INR',
        imageUrl: product.imageUrl?.trim() || '',
        affiliateUrl: product.affiliateUrl?.trim() || '',
        affiliateNetworkId: product.affiliateNetworkId || null,
        category: product.category || '',
        gender: normalizedGender,
        rating: (rating || 4.5).toString(),
        reviewCount: reviewCount || 100,
        discount: product.discount ? parseInt(product.discount.toString()) : null,
        isNew: Boolean(product.isNew),
        isFeatured: product.isFeatured !== undefined ? Boolean(product.isFeatured) : true,
        isService: Boolean(product.isService),
        isAIApp: Boolean(product.isAIApp),
        customFields: typeof product.customFields === 'object' ? JSON.stringify(product.customFields) : product.customFields,
        
        // Enhanced pricing fields for services and AI Apps
        pricingType: pricingType,
        monthlyPrice: monthlyPrice,
        yearlyPrice: yearlyPrice,
        isFree: isFree,
        priceDescription: product.priceDescription?.trim() || null,
        
        hasTimer: Boolean(product.hasTimer),
        timerDuration: product.hasTimer ? parseInt(product.timerDuration?.toString() || '24') : null,
        timerStartTime: product.hasTimer ? now : null,
        createdAt: now
      };

      console.log('DatabaseStorage: Final productData object:', productData);

      console.log('DatabaseStorage: Transformed product data with normalized gender:', productData);
      console.log(`Gender normalization: "${product.gender}" -> "${normalizedGender}"`);

      const [newProduct] = await db
        .insert(products)
        .values(productData)
        .returning();
        
      console.log('DatabaseStorage: Product added successfully:', newProduct);
      return newProduct;
    } catch (error: any) {
      console.error('DatabaseStorage: Error adding product:', error);
      throw new Error(`Failed to add product: ${error?.message || 'Unknown error'}`);
    }
  }

  async deleteProduct(id: number): Promise<boolean> {
    await db.delete(products).where(eq(products.id, id));
    return true;
  }

  async updateProduct(id: number, updates: Partial<Product>): Promise<Product | null> {
    const [updatedProduct] = await db
      .update(products)
      .set(updates)
      .where(eq(products.id, id))
      .returning();
    return updatedProduct || null;
  }

  // Blog Management
  async addBlogPost(blogPost: any): Promise<BlogPost> {
    const blogPostData = {
      ...blogPost,
      hasTimer: blogPost.hasTimer || false,
      timerDuration: blogPost.hasTimer && blogPost.timerDuration ? parseInt(blogPost.timerDuration.toString()) : null,
      timerStartTime: blogPost.hasTimer ? new Date() : null,
      publishedAt: new Date(blogPost.publishedAt || new Date()),
      slug: blogPost.slug || blogPost.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      excerpt: blogPost.excerpt || '',
      readTime: blogPost.readTime || '5 min read',
      imageUrl: blogPost.imageUrl || '',
      category: blogPost.category || 'General',
      title: blogPost.title || 'Untitled',
      content: blogPost.content || '',
    };
    
    const [newBlogPost] = await db
      .insert(blogPosts)
      .values(blogPostData)
      .returning();
    return newBlogPost;
  }

  async deleteBlogPost(id: number): Promise<boolean> {
    await db.delete(blogPosts).where(eq(blogPosts.id, id));
    return true;
  }

  async updateBlogPost(id: number, updates: Partial<BlogPost>): Promise<BlogPost | null> {
    const [updatedBlogPost] = await db
      .update(blogPosts)
      .set(updates)
      .where(eq(blogPosts.id, id))
      .returning();
    return updatedBlogPost || null;
  }

  async getAnnouncements(): Promise<Announcement[]> {
    return await db.select().from(announcements).orderBy(desc(announcements.createdAt));
  }

  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    if (announcement.isActive) {
      await db.update(announcements).set({ isActive: false });
    }
    const [newAnnouncement] = await db.insert(announcements).values({
      ...announcement,
      createdAt: new Date()
    }).returning();
    return newAnnouncement;
  }

  async updateAnnouncement(id: number, updates: Partial<Announcement>): Promise<Announcement | null> {
    if (updates.isActive) {
      await db.update(announcements)
        .set({ isActive: false })
        .where(ne(announcements.id, id));
    }
    const [updatedAnnouncement] = await db.update(announcements)
      .set(updates)
      .where(eq(announcements.id, id))
      .returning();
    return updatedAnnouncement || null;
  }

  async deleteAnnouncement(id: number): Promise<boolean> {
    await db.delete(announcements).where(eq(announcements.id, id));
    return true;
  }

  // Admin User Management
  async getAdminByEmail(email: string): Promise<AdminUser | undefined> {
    const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
    return admin || undefined;
  }

  async getAdminByUsername(username: string): Promise<AdminUser | undefined> {
    const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
    return admin || undefined;
  }

  async getAdminById(id: number): Promise<AdminUser | undefined> {
    const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
    return admin || undefined;
  }

  async createAdmin(admin: InsertAdminUser): Promise<AdminUser> {
    const [newAdmin] = await db
      .insert(adminUsers)
      .values(admin)
      .returning();
    return newAdmin;
  }

  async updateAdminPassword(id: number, passwordHash: string): Promise<boolean> {
    await db
      .update(adminUsers)
      .set({ passwordHash })
      .where(eq(adminUsers.id, id));
    return true;
  }

  async setResetToken(email: string, token: string, expiry: Date): Promise<boolean> {
    await db
      .update(adminUsers)
      .set({ resetToken: token, resetTokenExpiry: expiry })
      .where(eq(adminUsers.email, email));
    return true;
  }

  async validateResetToken(token: string): Promise<AdminUser | undefined> {
    const [admin] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.resetToken, token));
    
    if (!admin || !admin.resetTokenExpiry || admin.resetTokenExpiry < new Date()) {
      return undefined;
    }
    
    return admin;
  }

  async clearResetToken(id: number): Promise<boolean> {
    await db
      .update(adminUsers)
      .set({ resetToken: null, resetTokenExpiry: null })
      .where(eq(adminUsers.id, id));
    return true;
  }

  async updateLastLogin(id: number): Promise<boolean> {
    await db
      .update(adminUsers)
      .set({ lastLogin: new Date() })
      .where(eq(adminUsers.id, id));
    return true;
  }

  // Video Content Management
  async getVideoContent(): Promise<VideoContent[]> {
    await this.cleanupExpiredVideoContent();
    return await db.select().from(videoContent).orderBy(desc(videoContent.createdAt));
  }

  async addVideoContent(videoContentData: any): Promise<VideoContent> {
    const videoData = {
      ...videoContentData,
      hasTimer: videoContentData.hasTimer || false,
      timerDuration: videoContentData.hasTimer && videoContentData.timerDuration ? parseInt(videoContentData.timerDuration.toString()) : null,
      timerStartTime: videoContentData.hasTimer ? new Date() : null,
      tags: Array.isArray(videoContentData.tags) ? JSON.stringify(videoContentData.tags) : videoContentData.tags,
      createdAt: new Date(),
    };

    const [newVideoContent] = await db
      .insert(videoContent)
      .values(videoData)
      .returning();
    return newVideoContent;
  }

  async deleteVideoContent(id: number): Promise<boolean> {
    await db.delete(videoContent).where(eq(videoContent.id, id));
    return true;
  }

  async updateVideoContent(id: number, updates: Partial<VideoContent>): Promise<VideoContent | null> {
    const [updatedVideoContent] = await db
      .update(videoContent)
      .set(updates)
      .where(eq(videoContent.id, id))
      .returning();
    return updatedVideoContent || null;
  }

  async cleanupExpiredVideoContent(): Promise<number> {
    try {
      return 0; // Simple cleanup for now
    } catch (error) {
      console.error('Error in cleanupExpiredVideoContent:', error);
      return 0;
    }
  }

  // Canva Automation Methods
  async getCanvaSettings(): Promise<CanvaSettings | null> {
    try {
      // Ensure Canva tables exist before trying to query
      await this.ensureCanvaTablesExist();
      
      const [settings] = await db.select().from(canvaSettings).where(eq(canvaSettings.id, 1));
      return settings || null;
    } catch (error) {
      console.error('Error getting Canva settings:', error);
      return null;
    }
  }

  async updateCanvaSettings(settings: Partial<CanvaSettings>): Promise<CanvaSettings> {
    try {
      // Ensure Canva tables exist before trying to update
      await this.ensureCanvaTablesExist();

      // First try to update existing settings
      const [updated] = await db
        .update(canvaSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(canvaSettings.id, 1))
        .returning();

      if (updated) {
        return updated;
      }

      // If no existing settings, create new ones
      const [newSettings] = await db
        .insert(canvaSettings)
        .values({ 
          id: 1, 
          ...settings, 
          createdAt: new Date(), 
          updatedAt: new Date() 
        })
        .returning();

      return newSettings;
    } catch (error) {
      console.error('Error updating Canva settings:', error);
      throw new Error('Failed to update Canva settings');
    }
  }

  // Helper method to ensure Canva tables exist
  public async ensureCanvaTablesExist(): Promise<void> {
    try {
      const Database = (await import('better-sqlite3')).default;
      const dbFile = fs.existsSync('database.sqlite') ? 'database.sqlite' : 'sqlite.db';
      const rawDb = new Database(dbFile);

      // Create canva_settings table if it doesn't exist - matching Drizzle schema exactly
      rawDb.exec(`
        CREATE TABLE IF NOT EXISTS canva_settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          is_enabled INTEGER DEFAULT 0,
          api_key TEXT,
          api_secret TEXT,
          default_template_id TEXT,
          auto_generate_captions INTEGER DEFAULT 1,
          auto_generate_hashtags INTEGER DEFAULT 1,
          default_title TEXT,
          default_caption TEXT,
          default_hashtags TEXT,
          platforms TEXT DEFAULT '[]',
          schedule_type TEXT DEFAULT 'immediate',
          schedule_delay_minutes INTEGER DEFAULT 0,
          created_at INTEGER DEFAULT (strftime('%s', 'now')),
          updated_at INTEGER DEFAULT (strftime('%s', 'now'))
        )
      `);

      // Create canva_posts table if it doesn't exist - matching Drizzle schema exactly
      rawDb.exec(`
        CREATE TABLE IF NOT EXISTS canva_posts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          content_type TEXT NOT NULL,
          content_id INTEGER NOT NULL,
          design_id TEXT,
          template_id TEXT,
          caption TEXT,
          hashtags TEXT,
          platforms TEXT,
          post_urls TEXT,
          status TEXT DEFAULT 'pending',
          scheduled_at INTEGER,
          posted_at INTEGER,
          expires_at INTEGER,
          created_at INTEGER DEFAULT (strftime('%s', 'now')),
          updated_at INTEGER DEFAULT (strftime('%s', 'now'))
        )
      `);

      // Create canva_templates table if it doesn't exist - matching Drizzle schema exactly
      rawDb.exec(`
        CREATE TABLE IF NOT EXISTS canva_templates (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          template_id TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          category TEXT,
          thumbnail_url TEXT,
          is_active INTEGER DEFAULT 1,
          created_at INTEGER DEFAULT (strftime('%s', 'now'))
        )
      `);

      // Check if default settings exist, if not create them
      const existingSettings = rawDb.prepare('SELECT COUNT(*) as count FROM canva_settings').get() as { count: number };
      if (existingSettings.count === 0) {
        rawDb.prepare(`
          INSERT INTO canva_settings (
            is_enabled, 
            auto_generate_captions, 
            auto_generate_hashtags,
            default_title,
            default_caption,
            default_hashtags,
            platforms, 
            schedule_type, 
            schedule_delay_minutes,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          0, // is_enabled = false initially
          1, // auto_generate_captions = true
          1, // auto_generate_hashtags = true
          '🛍️ Amazing {category} Deal: {title}', // default_title
          '🛍️ Amazing {category} Alert! ✨ {title} 💰 Price: ₹{price} 🔗 Get the best deals at PickNTrust!',
          '#PickNTrust #Deals #Shopping #BestPrice #Sale #Discount #OnlineShopping #India',
          JSON.stringify(['instagram', 'facebook']), // default platforms
          'immediate',
          0,
          Math.floor(Date.now() / 1000), // created_at timestamp
          Math.floor(Date.now() / 1000)  // updated_at timestamp
        );
        console.log('✅ Created default Canva settings');
      }

      rawDb.close();
      console.log('✅ Canva tables ensured to exist');
    } catch (error) {
      console.error('Error ensuring Canva tables exist:', error);
      // Don't throw here, let the main method handle the error
    }
  }

  async getCanvaPosts(): Promise<CanvaPost[]> {
    try {
      return await db.select().from(canvaPosts).orderBy(desc(canvaPosts.createdAt));
    } catch (error) {
      console.error('Error getting Canva posts:', error);
      return [];
    }
  }

  async addCanvaPost(post: InsertCanvaPost): Promise<CanvaPost> {
    try {
      const [newPost] = await db
        .insert(canvaPosts)
        .values({ ...post, createdAt: new Date(), updatedAt: new Date() })
        .returning();
      return newPost;
    } catch (error) {
      console.error('Error adding Canva post:', error);
      throw new Error('Failed to add Canva post');
    }
  }

  async updateCanvaPost(id: number, updates: Partial<CanvaPost>): Promise<CanvaPost | null> {
    try {
      const [updated] = await db
        .update(canvaPosts)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(canvaPosts.id, id))
        .returning();
      return updated || null;
    } catch (error) {
      console.error('Error updating Canva post:', error);
      return null;
    }
  }

  async deleteCanvaPost(id: number): Promise<boolean> {
    try {
      await db.delete(canvaPosts).where(eq(canvaPosts.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting Canva post:', error);
      return false;
    }
  }

  async getCanvaTemplates(): Promise<CanvaTemplate[]> {
    try {
      return await db.select().from(canvaTemplates).where(eq(canvaTemplates.isActive, true)).orderBy(canvaTemplates.name);
    } catch (error) {
      console.error('Error getting Canva templates:', error);
      return [];
    }
  }

  async addCanvaTemplate(template: InsertCanvaTemplate): Promise<CanvaTemplate> {
    try {
      const [newTemplate] = await db
        .insert(canvaTemplates)
        .values({ ...template, createdAt: new Date() })
        .returning();
      return newTemplate;
    } catch (error) {
      console.error('Error adding Canva template:', error);
      throw new Error('Failed to add Canva template');
    }
  }

  async updateCanvaTemplate(id: number, updates: Partial<CanvaTemplate>): Promise<CanvaTemplate | null> {
    try {
      const [updated] = await db
        .update(canvaTemplates)
        .set(updates)
        .where(eq(canvaTemplates.id, id))
        .returning();
      return updated || null;
    } catch (error) {
      console.error('Error updating Canva template:', error);
      return null;
    }
  }

  async deleteCanvaTemplate(id: number): Promise<boolean> {
    try {
      await db.delete(canvaTemplates).where(eq(canvaTemplates.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting Canva template:', error);
      return false;
    }
  }
}

export const storage = new DatabaseStorage();
