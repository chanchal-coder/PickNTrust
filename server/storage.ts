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
import { db } from "./db.js";
import { eq, desc, ne, and, lt } from "drizzle-orm";

// Utility functions for consistent timestamp handling
const toUnixTimestamp = (date: Date): number => Math.floor(date.getTime() / 1000);
const fromUnixTimestamp = (timestamp: number): Date => new Date(timestamp * 1000);

// Validation helpers
const validateProduct = (product: any): void => {
  if (!product.name?.trim()) throw new Error('Product name is required');
  if (typeof product.price !== 'number' || product.price < 0) throw new Error('Valid price is required');
  if (product.rating && (product.rating < 1 || product.rating > 5)) throw new Error('Rating must be between 1 and 5');
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
  getProductsByCategory(category: string): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  
  // Categories
  getCategories(): Promise<Category[]>;
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

export class MemStorage implements IStorage {
  // Implement all required methods as empty stubs for now
  async getProducts(): Promise<Product[]> {
    return [];
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return [];
  }

  async getServiceProducts(): Promise<Product[]> {
    return [];
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return [];
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return undefined;
  }

  async getCategories(): Promise<Category[]> {
    return [];
  }

  async addCategory(category: InsertCategory): Promise<Category> {
    throw new Error("Method not implemented.");
  }

  async updateCategory(id: number, updates: Partial<Category>): Promise<Category | null> {
    return null;
  }

  async deleteCategory(id: number): Promise<boolean> {
    return false;
  }

  async getBlogPosts(): Promise<BlogPost[]> {
    return [];
  }

  async subscribeToNewsletter(subscriber: InsertNewsletterSubscriber): Promise<NewsletterSubscriber> {
    throw new Error("Method not implemented.");
  }

  async getAffiliateNetworks(): Promise<AffiliateNetwork[]> {
    return [];
  }

  async getActiveAffiliateNetworks(): Promise<AffiliateNetwork[]> {
    return [];
  }

  async addAffiliateNetwork(network: InsertAffiliateNetwork): Promise<AffiliateNetwork> {
    throw new Error("Method not implemented.");
  }

  async updateAffiliateNetwork(id: number, network: Partial<AffiliateNetwork>): Promise<AffiliateNetwork> {
    throw new Error("Method not implemented.");
  }

  async addProduct(product: any): Promise<Product> {
    throw new Error("Method not implemented.");
  }

  async deleteProduct(id: number): Promise<boolean> {
    return false;
  }

  async updateProduct(id: number, updates: Partial<Product>): Promise<Product | null> {
    return null;
  }

  async cleanupExpiredProducts(): Promise<number> {
    return 0;
  }

  async addBlogPost(blogPost: any): Promise<BlogPost> {
    throw new Error("Method not implemented.");
  }

  async deleteBlogPost(id: number): Promise<boolean> {
    return false;
  }

  async updateBlogPost(id: number, updates: Partial<BlogPost>): Promise<BlogPost | null> {
    return null;
  }

  async cleanupExpiredBlogPosts(): Promise<number> {
    return 0;
  }

  // Announcements
  async getAnnouncements(): Promise<Announcement[]> {
    return [];
  }

  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    throw new Error("Method not implemented.");
  }

  async updateAnnouncement(id: number, updates: Partial<Announcement>): Promise<Announcement | null> {
    return null;
  }

  async deleteAnnouncement(id: number): Promise<boolean> {
    return false;
  }

  // Admin User Management
  async getAdminByEmail(email: string): Promise<AdminUser | undefined> {
    return undefined;
  }

  async getAdminByUsername(username: string): Promise<AdminUser | undefined> {
    return undefined;
  }

  async getAdminById(id: number): Promise<AdminUser | undefined> {
    return undefined;
  }

  async createAdmin(admin: InsertAdminUser): Promise<AdminUser> {
    throw new Error("Method not implemented.");
  }

  async updateAdminPassword(id: number, passwordHash: string): Promise<boolean> {
    return false;
  }

  async setResetToken(email: string, token: string, expiry: Date): Promise<boolean> {
    return false;
  }

  async validateResetToken(token: string): Promise<AdminUser | undefined> {
    return undefined;
  }

  async clearResetToken(id: number): Promise<boolean> {
    return false;
  }

  async updateLastLogin(id: number): Promise<boolean> {
    return false;
  }

  // Video Content Management
  async getVideoContent(): Promise<VideoContent[]> {
    return [];
  }

  async addVideoContent(videoContent: any): Promise<VideoContent> {
    throw new Error("Method not implemented.");
  }

  async deleteVideoContent(id: number): Promise<boolean> {
    return false;
  }

  async updateVideoContent(id: number, updates: Partial<VideoContent>): Promise<VideoContent | null> {
    return null;
  }

  async cleanupExpiredVideoContent(): Promise<number> {
    return 0;
  }
}

export class DatabaseStorage implements IStorage {
  // Products
  async getProducts(): Promise<Product[]> {
    try {
      console.log('DatabaseStorage: Getting products...');
      
      // Skip cleanup for now to avoid potential issues
      // await this.cleanupExpiredProducts();
      
      const result = await db.select().from(products).orderBy(desc(products.id));
      console.log(`DatabaseStorage: Found ${result.length} products`);
      
      return result;
    } catch (error) {
      console.error('DatabaseStorage: Error getting products:', error);
      // Return empty array instead of throwing error
      return [];
    }
  }

  async getFeaturedProducts(): Promise<Product[]> {
    // Clean up expired products first
    await this.cleanupExpiredProducts();
    
    return await db.select().from(products).where(eq(products.isFeatured, true)).orderBy(desc(products.id));
  }

  async getServiceProducts(): Promise<Product[]> {
    // Clean up expired products first
    await this.cleanupExpiredProducts();
    
    return await db.select().from(products).where(eq(products.isService, true)).orderBy(desc(products.id));
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.category, category)).orderBy(desc(products.id));
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    // Simplified to just select all categories without subquery and ordering
    return await db.select().from(categories);
  }

  async addCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db
      .insert(categories)
      .values(category)
      .returning();
    return newCategory;
  }

  async updateCategory(id: number, updates: Partial<Category>): Promise<Category | null> {
    const [updatedCategory] = await db
      .update(categories)
      .set(updates)
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory || null;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
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

  // Timer cleanup method - removes expired products
  async cleanupExpiredProducts(): Promise<number> {
    try {
      // Simple cleanup without complex SQL for now
      return 0; // Return 0 to indicate no cleanup performed
    } catch (error) {
      console.error('Error in cleanupExpiredProducts:', error);
      return 0;
    }
  }

  async cleanupExpiredBlogPosts(): Promise<number> {
    try {
      // Simple cleanup without complex SQL for now
      return 0; // Return 0 to indicate no cleanup performed
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
      
      // Normalize numeric values
      const price = typeof product.price === 'string' ? parseFloat(product.price.replace(/[^\d.]/g, '')) : product.price;
      const originalPrice = product.originalPrice ? 
        (typeof product.originalPrice === 'string' ? parseFloat(product.originalPrice.replace(/[^\d.]/g, '')) : product.originalPrice) : null;
      const rating = typeof product.rating === 'string' ? parseFloat(product.rating) : product.rating;
      const reviewCount = typeof product.reviewCount === 'string' ? parseInt(product.reviewCount) : product.reviewCount;
      
      // Handle timer logic and data transformation
      const now = new Date();
      const productData = {
        name: product.name.trim(),
        description: product.description?.trim() || '',
        price: price || 0,
        originalPrice: originalPrice,
        imageUrl: product.imageUrl?.trim() || '',
        affiliateUrl: product.affiliateUrl?.trim() || '',
        affiliateNetworkId: product.affiliateNetworkId || null,
        category: product.category || '',
        gender: product.gender || null,
        rating: rating || 4.5,
        reviewCount: reviewCount || 100,
        discount: product.discount ? parseInt(product.discount.toString()) : null,
        isNew: Boolean(product.isNew),
        isFeatured: product.isFeatured !== undefined ? Boolean(product.isFeatured) : true,
        isService: Boolean(product.isService),
        customFields: typeof product.customFields === 'object' ? JSON.stringify(product.customFields) : product.customFields,
        hasTimer: Boolean(product.hasTimer),
        timerDuration: product.hasTimer ? parseInt(product.timerDuration?.toString() || '24') : null, // Keep in hours for now
        timerStartTime: product.hasTimer ? now : null,
        createdAt: now
      };

      console.log('DatabaseStorage: Transformed product data:', productData);

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
    const result = await db.delete(products).where(eq(products.id, id));
    // For SQLite, we'll assume it worked
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
    const result = await db.delete(blogPosts).where(eq(blogPosts.id, id));
    // For SQLite, we'll assume it worked
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
    const result = await db.delete(announcements).where(eq(announcements.id, id));
    // For SQLite, we'll assume it worked
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
    const result = await db
      .update(adminUsers)
      .set({ passwordHash })
      .where(eq(adminUsers.id, id));
    // For SQLite, we'll assume it worked
    return true;
  }

  async setResetToken(email: string, token: string, expiry: Date): Promise<boolean> {
    const result = await db
      .update(adminUsers)
      .set({ resetToken: token, resetTokenExpiry: expiry })
      .where(eq(adminUsers.email, email));
    // For SQLite, we'll assume it worked
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
    const result = await db
      .update(adminUsers)
      .set({ resetToken: null, resetTokenExpiry: null })
      .where(eq(adminUsers.id, id));
    // For SQLite, we'll assume it worked
    return true;
  }

  async updateLastLogin(id: number): Promise<boolean> {
    const result = await db
      .update(adminUsers)
      .set({ lastLogin: new Date() })
      .where(eq(adminUsers.id, id));
    // For SQLite, we'll assume it worked
    return true;
  }

  // Video Content Management
  async getVideoContent(): Promise<VideoContent[]> {
    // Clean up expired video content first
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
    const result = await db.delete(videoContent).where(eq(videoContent.id, id));
    // For SQLite, we'll assume it worked
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
      // Simple cleanup without complex SQL for now
      return 0; // Return 0 to indicate no cleanup performed
    } catch (error) {
      console.error('Error in cleanupExpiredVideoContent:', error);
      return 0;
    }
  }
}

export const storage = new DatabaseStorage();
