// @ts-nocheck
import { 
  products, 
  blogPosts, 
  newsletterSubscribers, 
  categories,
  affiliateNetworks,
  adminUsers,
  announcements,
  videoContent,
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
  type InsertVideoContent
} from "../shared/sqlite-schema.js";
import { db, sqliteDb } from "./db.js";
import { eq, desc, ne, and, lt } from "drizzle-orm";

// Utility functions for consistent timestamp handling
const toUnixTimestamp = (date: Date): number => Math.floor(date.getTime() / 1000);
const fromUnixTimestamp = (timestamp: number): Date => new Date(timestamp * 1000);

// Validation helpers
const validateProduct = (product: any): void => {
  if (!product.name?.trim()) throw new Error('Product name is required');
  const parsedPrice = typeof product.price === 'string' ? parseFloat(product.price.replace(/[^\d.]/g, '')) : product.price;
  if (isNaN(parsedPrice) || parsedPrice < 0) throw new Error('Valid price is required');
  
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
  const hasContent = !!blog.content && !!blog.content.trim();
  const hasPdf = !!blog.pdfUrl && !!String(blog.pdfUrl).trim();
  if (!hasContent && !hasPdf) throw new Error('Blog content or PDF is required');
};

export interface IStorage {
  // Products
  getProducts(): Promise<Product[]>;
  getFeaturedProducts(): Promise<Product[]>;
  getServiceProducts(): Promise<Product[]>;
  getProductsByCategory(category: string): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  
  // Categories
  getCategories(): Promise<Category[]>;
  getProductCategories(): Promise<Category[]>;
  getServiceCategories(): Promise<Category[]>;
  addCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, updates: Partial<Category>): Promise<Category | null>;
  deleteCategory(id: number): Promise<boolean>;
  
  // Blog Posts
  getBlogPosts(): Promise<BlogPost[]>;
  
  // Newsletter
  subscribeToNewsletter(subscriber: InsertNewsletterSubscriber): Promise<NewsletterSubscriber>;
  
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
}

export class DatabaseStorage implements IStorage {
  // Products
  async getProducts(): Promise<Product[]> {
    try {
      console.log('DatabaseStorage: Getting products...');
      const result = await db.select().from(products).orderBy(desc(products.id));
      console.log(`DatabaseStorage: Found ${result.length} products`);
      return result;
    } catch (error) {
      console.error('DatabaseStorage: Error getting products:', error);
      return [];
    }
  }

  async getFeaturedProducts(): Promise<Product[]> {
    try {
      return await db.select().from(products).where(eq(products.isFeatured, true)).orderBy(desc(products.id));
    } catch (error) {
      console.log('DatabaseStorage: Featured products query failed, trying raw SQL fallback...');
      try {
        // Use raw SQL with proper column mapping
        const Database = require('better-sqlite3');
        const dbFile = 'database.sqlite';
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
      return await db.select().from(products).where(eq(products.isService, true)).orderBy(desc(products.id));
    } catch (error) {
      console.log('DatabaseStorage: Service products query failed, returning empty array');
      return [];
    }
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    try {
      // Use direct SQL to guarantee case-insensitive matching via LOWER()
      const Database = require('better-sqlite3');
      const dbFile = 'database.sqlite';
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
        WHERE LOWER(category) = LOWER(?)
        ORDER BY id DESC
      `).all(category);

      rawDb.close();
      return result as Product[];
    } catch (error) {
      console.log('DatabaseStorage: Products by category query failed, returning empty array');
      return [];
    }
  }

  async getProduct(id: number): Promise<Product | undefined> {
    try {
      const [product] = await db.select().from(products).where(eq(products.id, id));
      return product || undefined;
    } catch (error) {
      console.log('DatabaseStorage: Get product failed, returning undefined');
      return undefined;
    }
  }

  // Categories with comprehensive fallback handling
  async getCategories(): Promise<Category[]> {
    try {
      // Try the full query first
      return await db.select().from(categories).orderBy(categories.displayOrder);
    } catch (error) {
      console.log('DatabaseStorage: Primary categories query failed, trying fallback...');
      try {
        // Fallback 1: Try without ordering
        return await db.select().from(categories);
      } catch (fallbackError) {
        console.log('DatabaseStorage: Standard fallback failed, trying raw SQL...');
        try {
          // Fallback 2: Use raw SQL to get basic categories
          const Database = require('better-sqlite3');
          const dbFile = 'database.sqlite';
          const rawDb = new Database(dbFile);
          
          const result = rawDb.prepare(`
            SELECT id, name, icon, color, description,
                   COALESCE(is_for_products, 1) as isForProducts,
                   COALESCE(is_for_services, 0) as isForServices,
                   COALESCE(display_order, id * 10) as displayOrder
            FROM categories 
            ORDER BY COALESCE(display_order, id * 10)
          `).all();
          
          rawDb.close();
          return result as Category[];
        } catch (rawError) {
          console.log('DatabaseStorage: Raw SQL failed, trying minimal query...');
          try {
            // Fallback 3: Minimal query with only required columns
            const Database = require('better-sqlite3');
            const dbFile = 'database.sqlite';
            const rawDb = new Database(dbFile);
            
            const result = rawDb.prepare(`
              SELECT id, name, 
                     COALESCE(icon, 'fas fa-tag') as icon,
                     COALESCE(color, '#6366F1') as color,
                     COALESCE(description, name) as description,
                     1 as isForProducts,
                     0 as isForServices,
                     id * 10 as displayOrder
              FROM categories 
              ORDER BY id
            `).all();
            
            rawDb.close();
            return result as Category[];
          } catch (minimalError) {
            console.log('DatabaseStorage: All category queries failed, returning empty array');
            return [];
          }
        }
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

  async addCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db
      .insert(categories)
      .values(category)
      .returning() as Category[];
    return newCategory;
  }

  async updateCategory(id: number, updates: Partial<Category>): Promise<Category | null> {
    const [updatedCategory] = await db
      .update(categories)
      .set(updates)
      .where(eq(categories.id, id))
      .returning() as Category[];
    return updatedCategory || null;
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
  async addProduct(product: any): Promise<Product> {
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
      const price = typeof product.price === 'string' ? parseFloat(product.price.replace(/[^\d.]/g, '')) : product.price;
      const originalPrice = product.originalPrice ? 
        (typeof product.originalPrice === 'string' ? parseFloat(product.originalPrice.replace(/[^\d.]/g, '')) : product.originalPrice) : null;
      const rating = typeof product.rating === 'string' ? parseFloat(product.rating) : product.rating;
      const reviewCount = typeof product.reviewCount === 'string' ? parseInt(product.reviewCount) : product.reviewCount;
      
      // Handle timer logic and data transformation
      const now = new Date();
      const normalizedGender = normalizeGender(product.gender);
      
      const productData = {
        name: product.name.trim(),
        description: product.description?.trim() || '',
        price: price || 0,
        originalPrice: originalPrice,
        currency: product.currency || 'INR',
        imageUrl: product.imageUrl?.trim() || '',
        affiliateUrl: product.affiliateUrl?.trim() || '',
        affiliateNetworkId: product.affiliateNetworkId || null,
        category: product.category || '',
        gender: normalizedGender,
        rating: rating || 4.5,
        reviewCount: reviewCount || 100,
        discount: product.discount ? parseInt(product.discount.toString()) : null,
        isNew: Boolean(product.isNew),
        isFeatured: product.isFeatured !== undefined ? Boolean(product.isFeatured) : true,
        isService: Boolean(product.isService),
        isAIApp: Boolean(product.isAIApp),
        customFields: typeof product.customFields === 'object' ? JSON.stringify(product.customFields) : product.customFields,
        
        // Enhanced pricing fields for services
        pricingType: product.pricingType || (product.isService ? 'one-time' : null),
        monthlyPrice: product.monthlyPrice || null,
        yearlyPrice: product.yearlyPrice || null,
        isFree: Boolean(product.isFree),
        priceDescription: product.priceDescription?.trim() || null,
        
        hasTimer: Boolean(product.hasTimer),
        timerDuration: product.hasTimer ? parseInt(product.timerDuration?.toString() || '24') : null,
        timerStartTime: product.hasTimer ? now : null,
        createdAt: now
      };

      console.log('DatabaseStorage: Transformed product data with normalized gender:', productData);
      console.log(`Gender normalization: "${product.gender}" -> "${normalizedGender}"`);
      console.log(`Currency field: input="${product.currency}" -> output="${productData.currency}"`);

      const [newProduct] = await db
        .insert(products)
        .values(productData)
        .returning();
        
      console.log('DatabaseStorage: Product added successfully:', newProduct);

      // Mirror into unified_content so displayPages-based sections can show it
      try {
        // Normalize displayPages from the form payload
        const rawPages = (product.displayPages ?? product.display_pages ?? []) as any;
        let displayPagesArr: string[] = [];
        if (Array.isArray(rawPages)) {
          displayPagesArr = rawPages.map((p: any) => String(p).trim()).filter(Boolean);
        } else if (typeof rawPages === 'string' && rawPages.trim()) {
          try {
            const parsed = JSON.parse(rawPages);
            if (Array.isArray(parsed)) displayPagesArr = parsed.map((p: any) => String(p).trim()).filter(Boolean);
          } catch {
            displayPagesArr = rawPages.split(',').map(s => s.trim()).filter(Boolean);
          }
        }

        // Derive minimal required unified_content fields
        const title = product.name?.trim() || '';
        const description = product.description?.trim() || '';
        const priceStr = product.price != null ? String(product.price) : null;
        const originalPriceStr = product.originalPrice != null ? String(product.originalPrice) : null;
        const currency = product.currency || 'INR';
        const imageUrl = product.imageUrl?.trim() || '';
        const affiliateUrl = product.affiliateUrl?.trim() || '';
        const category = product.category || 'General';

        // Choose a page_type: prefer first selected page, otherwise fallback
        const pageType = displayPagesArr[0] || (product.isFeatured ? 'top-picks' : 'home');
        const isFeaturedFlag = productData.isFeatured ? 1 : 0;

        // Use better-sqlite3 to insert, matching existing columns used elsewhere
        const ucInsert = sqliteDb.prepare(`
          INSERT INTO unified_content (
            title, description, price, original_price, currency,
            image_url, affiliate_url, content_type, page_type,
            category, subcategory, tags, is_active, is_featured,
            display_pages, status, visibility, processing_status,
            created_at, updated_at
          ) VALUES (
            ?, ?, ?, ?, ?,
            ?, ?, 'product', ?,
            ?, NULL, NULL, 1, ?,
            ?, 'active', 'visible', 'active',
            datetime('now'), datetime('now')
          )
        `);

        ucInsert.run(
          title,
          description,
          priceStr,
          originalPriceStr,
          currency,
          imageUrl,
          affiliateUrl,
          pageType,
          category,
          isFeaturedFlag,
          JSON.stringify(displayPagesArr.length ? displayPagesArr : ['home'])
        );

        console.log('DatabaseStorage: Mirrored product into unified_content with display_pages:', displayPagesArr);
      } catch (mirrorErr) {
        console.warn('DatabaseStorage: Could not mirror into unified_content:', (mirrorErr as any)?.message || mirrorErr);
      }

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
      pdfUrl: blogPost.pdfUrl || null,
      category: blogPost.category || 'General',
      title: blogPost.title || 'Untitled',
      content: blogPost.content || '',
    };
    
    const [newBlogPost] = await db
      .insert(blogPosts)
      .values(blogPostData)
      .returning() as BlogPost[];
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
}

export const storage = new DatabaseStorage();
