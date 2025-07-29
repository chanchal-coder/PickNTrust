import { pgTable, text, serial, integer, boolean, decimal, timestamp, varchar, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const affiliateNetworks = pgTable("affiliate_networks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull(), // percentage
  trackingParams: text("tracking_params"), // URL parameters for tracking
  logoUrl: text("logo_url"),
  isActive: boolean("is_active").default(true),
  joinUrl: text("join_url"), // URL to join the network
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
  imageUrl: text("image_url").notNull(),
  affiliateUrl: text("affiliate_url").notNull(),
  affiliateNetworkId: integer("affiliate_network_id").references(() => affiliateNetworks.id),
  category: text("category").notNull(),
  rating: decimal("rating", { precision: 2, scale: 1 }).notNull(),
  reviewCount: integer("review_count").notNull(),
  discount: integer("discount"), // percentage
  isNew: boolean("is_new").default(false),
  isFeatured: boolean("is_featured").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  tags: text("tags").array().notNull(),
  imageUrl: text("image_url").notNull(),
  videoUrl: text("video_url"),
  publishedAt: timestamp("published_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  readTime: text("read_time").notNull(),
  slug: text("slug").notNull(),
});

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  subscribedAt: timestamp("subscribed_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
  description: text("description").notNull(),
});

export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  passwordHash: text("password_hash").notNull(),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
});

export const insertNewsletterSubscriberSchema = createInsertSchema(newsletterSubscribers).omit({
  id: true,
  subscribedAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
  lastLogin: true,
});

// Password change schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Forgot password schema
export const forgotPasswordSchema = z.object({
  resetMethod: z.enum(['email', 'phone'], { required_error: 'Please select a reset method' }),
  email: z.string().email('Please enter a valid email address').optional(),
  phone: z.string().min(10, 'Please enter a valid phone number').optional(),
}).refine((data) => {
  if (data.resetMethod === 'email' && !data.email) {
    return false;
  }
  if (data.resetMethod === 'phone' && !data.phone) {
    return false;
  }
  return true;
}, {
  message: 'Please provide the required contact information',
  path: ['email'],
});

// Reset password schema
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type Product = typeof products.$inferSelect;
export type BlogPost = typeof blogPosts.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type AffiliateNetwork = typeof affiliateNetworks.$inferSelect;
export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type AdminUser = typeof adminUsers.$inferSelect;

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertAffiliateNetwork = typeof affiliateNetworks.$inferInsert;
export type InsertNewsletterSubscriber = z.infer<typeof insertNewsletterSubscriberSchema>;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type ChangePassword = z.infer<typeof changePasswordSchema>;
export type ForgotPassword = z.infer<typeof forgotPasswordSchema>;
export type ResetPassword = z.infer<typeof resetPasswordSchema>;

export const insertAffiliateNetworkSchema = createInsertSchema(affiliateNetworks).omit({
  id: true,
});

// CMS Pages
export const cmsPages = pgTable('cms_pages', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  metaDescription: text('meta_description'),
  isPublished: boolean('is_published').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// CMS Sections
export const cmsSections = pgTable('cms_sections', {
  id: serial('id').primaryKey(),
  pageId: integer('page_id').references(() => cmsPages.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'hero', 'text', 'image', 'video', 'banner', 'sticky_note'
  title: text('title'),
  content: text('content'),
  imageUrl: text('image_url'),
  videoUrl: text('video_url'),
  videoType: text('video_type'), // 'youtube', 'instagram', 'facebook', 'direct'
  backgroundColor: text('background_color'),
  textColor: text('text_color'),
  isVisible: boolean('is_visible').default(true),
  sortOrder: integer('sort_order').default(0),
  settings: text('settings'), // JSON string for additional section-specific settings
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// CMS Media Library
export const cmsMedia = pgTable('cms_media', {
  id: serial('id').primaryKey(),
  filename: text('filename').notNull(),
  originalName: text('original_name').notNull(),
  mimeType: text('mime_type').notNull(),
  size: integer('size').notNull(),
  url: text('url').notNull(),
  alt: text('alt'),
  createdAt: timestamp('created_at').defaultNow(),
});

export type CmsPage = typeof cmsPages.$inferSelect;
export type InsertCmsPage = typeof cmsPages.$inferInsert;
export type CmsSection = typeof cmsSections.$inferSelect;
export type InsertCmsSection = typeof cmsSections.$inferInsert;
export type CmsMedia = typeof cmsMedia.$inferSelect;
export type InsertCmsMedia = typeof cmsMedia.$inferInsert;

// Zod schemas for validation
export const insertCmsPageSchema = createInsertSchema(cmsPages).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export const insertCmsSectionSchema = createInsertSchema(cmsSections).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export const insertCmsMediaSchema = createInsertSchema(cmsMedia).omit({ 
  id: true, 
  createdAt: true 
});
