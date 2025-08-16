import { sqliteTable, text, integer, real, numeric } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const affiliateNetworks = sqliteTable("affiliate_networks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  commissionRate: numeric("commission_rate").notNull(), // percentage
  trackingParams: text("tracking_params"), // URL parameters for tracking
  logoUrl: text("logo_url"),
  isActive: integer("is_active", { mode: 'boolean' }).default(true),
  joinUrl: text("join_url"), // URL to join the network
});

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: numeric("price").notNull(),
  originalPrice: numeric("original_price"),
  imageUrl: text("image_url").notNull(),
  affiliateUrl: text("affiliate_url").notNull(),
  affiliateNetworkId: integer("affiliate_network_id").references(() => affiliateNetworks.id),
  category: text("category").notNull(),
  gender: text("gender"), // "Men", "Women", "Kids", or null for general products
  rating: numeric("rating").notNull(),
  reviewCount: integer("review_count").notNull(),
  discount: integer("discount"), // percentage
  isNew: integer("is_new", { mode: 'boolean' }).default(false),
  isFeatured: integer("is_featured", { mode: 'boolean' }).default(false),
  isService: integer("is_service", { mode: 'boolean' }).default(false), // Whether to show in Cards, Apps & Services section
  customFields: text("custom_fields"), // JSON string for service-specific fields (serviceType, provider, features, etc.)
  hasTimer: integer("has_timer", { mode: 'boolean' }).default(false), // Whether to show timer
  timerDuration: integer("timer_duration"), // Duration in hours (null = no timer)
  timerStartTime: integer("timer_start_time", { mode: 'timestamp' }), // When the timer started (null = no timer)
  createdAt: integer("created_at", { mode: 'timestamp' }).default(new Date()),
});

export const blogPosts = sqliteTable("blog_posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  tags: text("tags"), // Store as JSON string
  imageUrl: text("image_url").notNull(),
  videoUrl: text("video_url"),
  publishedAt: integer("published_at", { mode: 'timestamp' }).notNull(),
  createdAt: integer("created_at", { mode: 'timestamp' }).default(new Date()),
  readTime: text("read_time").notNull(),
  slug: text("slug").notNull(),
  hasTimer: integer("has_timer", { mode: 'boolean' }).default(false),
  timerDuration: integer("timer_duration"),
  timerStartTime: integer("timer_start_time", { mode: 'timestamp' }),
});

export const newsletterSubscribers = sqliteTable("newsletter_subscribers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  subscribedAt: integer("subscribed_at", { mode: 'timestamp' }).default(new Date()),
});

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
  description: text("description").notNull(),
});

export const adminUsers = sqliteTable("admin_users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  resetToken: text("reset_token"),
  resetTokenExpiry: integer("reset_token_expiry", { mode: 'timestamp' }),
  lastLogin: integer("last_login", { mode: 'timestamp' }),
  createdAt: integer("created_at", { mode: 'timestamp' }).default(new Date()),
  isActive: integer("is_active", { mode: 'boolean' }).default(true),
});

export const announcements = sqliteTable("announcements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  message: text("message").notNull(),
  isActive: integer("is_active", { mode: 'boolean' }).default(true),
  textColor: text("text_color").default('#ffffff'),
  backgroundColor: text("background_color").default('#3b82f6'),
  fontSize: text("font_size").default('16px'),
  fontWeight: text("font_weight").default('normal'),
  textDecoration: text("text_decoration").default('none'),
  fontStyle: text("font_style").default('normal'),
  animationSpeed: text("animation_speed").default('30'),
  // Text border options
  textBorderWidth: text("text_border_width").default('0px'),
  textBorderStyle: text("text_border_style").default('solid'),
  textBorderColor: text("text_border_color").default('#000000'),
  // Banner border options
  bannerBorderWidth: text("banner_border_width").default('0px'),
  bannerBorderStyle: text("banner_border_style").default('solid'),
  bannerBorderColor: text("banner_border_color").default('#000000'),
  createdAt: integer("created_at", { mode: 'timestamp' }).default(new Date()),
});

export const videoContent = sqliteTable("video_content", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  videoUrl: text("video_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  platform: text("platform").notNull(), // youtube, vimeo, tiktok, etc.
  category: text("category").notNull(),
  tags: text("tags"), // Store as JSON string
  duration: text("duration"), // e.g., "5:30"
  hasTimer: integer("has_timer", { mode: 'boolean' }).default(false),
  timerDuration: integer("timer_duration"), // Duration in hours
  timerStartTime: integer("timer_start_time", { mode: 'timestamp' }),
  createdAt: integer("created_at", { mode: 'timestamp' }).default(new Date()),
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

export const insertAffiliateNetworkSchema = createInsertSchema(affiliateNetworks).omit({
  id: true,
});

export const insertVideoContentSchema = createInsertSchema(videoContent).omit({
  id: true,
  createdAt: true,
});

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({
  id: true,
  createdAt: true,
});

export type Product = typeof products.$inferSelect;
export type BlogPost = typeof blogPosts.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type AffiliateNetwork = typeof affiliateNetworks.$inferSelect;
export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type AdminUser = typeof adminUsers.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type VideoContent = typeof videoContent.$inferSelect;

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertAffiliateNetwork = z.infer<typeof insertAffiliateNetworkSchema>;
export type InsertNewsletterSubscriber = z.infer<typeof insertNewsletterSubscriberSchema>;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type InsertVideoContent = z.infer<typeof insertVideoContentSchema>;
