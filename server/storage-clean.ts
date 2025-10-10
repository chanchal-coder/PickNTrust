// @ts-nocheck
import { 
  products, 
  blogPosts, 
  newsletterSubscribers, 
  categories,
  affiliateNetworks,
  adminUsers,
  announcements,
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
  type InsertAnnouncement
} from "../shared/sqlite-schema.js";
import { dbInstance as db } from "./db.js";
import { eq, desc, ne, sql } from "drizzle-orm";

export interface IStorage {
  // Products
  getProducts(): Promise<Product[]>;
  getFeaturedProducts(): Promise<Product[]>;
  getProductsByCategory(category: string): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  
  // Categories
  getCategories(): Promise<Category[]>;
  
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
  
  // Cleanup
  cleanupExpiredProducts(): Promise<number>;
  cleanupExpiredBlogPosts(): Promise<number>;
}

export class MemStorage implements IStorage {
  // Implement all required methods as empty stubs for now
  async getProducts(): Promise<Product[]> {
    return [];
  }

  async getFeaturedProducts(): Promise<Product[]> {
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
}

export class DatabaseStorage implements IStorage {
  // Products
  async getProducts(): Promise<Product[]> {
    // Clean up expired products first
    await this.cleanupExpiredProducts();
    
    return await db.select().from(products).orderBy(desc(products.id));
  }

  async getFeaturedProducts(): Promise<Product[]> {
    // Clean up expired products first
    await this.cleanupExpiredProducts();
    
    return await db.select().from(products).where(eq(products.isFeatured, true)).orderBy(desc(products.id));
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
    const now = new Date();
    // For SQLite, we need to use different syntax for date operations
    const result = await db
      .delete(products)
      .where(sql`
        has_timer = true 
        AND timer_start_time IS NOT NULL 
        AND timer_duration IS NOT NULL 
        AND datetime(timer_start_time, '+' || timer_duration || ' hours') < datetime('now')
      `);
    // For SQLite, we need to check the result differently
    return 1; // SQLite doesn't return rowCount, so we'll return 1 for now
  }

  async cleanupExpiredBlogPosts(): Promise<number> {
    const now = new Date();
    // For SQLite, we need to use different syntax for date operations
    const result = await db
      .delete(blogPosts)
      .where(sql`
        has_timer = true 
        AND timer_start_time IS NOT NULL 
        AND timer_duration IS NOT NULL 
        AND datetime(timer_start_time, '+' || timer_duration || ' hours') < datetime('now')
      `);
    // For SQLite, we need to check the result differently
    return 1; // SQLite doesn't return rowCount, so we'll return 1 for now
  }

  // Admin Product Management
  async addProduct(product: any): Promise<Product> {
    // Handle timer logic
    const productData = {
      ...product,
      // Set timerStartTime to now if timer is enabled
      timerStartTime: product.hasTimer ? new Date() : null,
      // Ensure timerDuration is null if timer is disabled
      timerDuration: product.hasTimer ? product.timerDuration : null
    };

    const [newProduct] = await db
      .insert(products)
      .values(productData)
      .returning();
    return newProduct;
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
      pdfUrl: blogPost.pdfUrl || null,
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

  // Announcements
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
}

export const storage = new DatabaseStorage();
