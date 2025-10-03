// @ts-nocheck
import { sqliteTable, text, integer, real, numeric } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
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
  currency: text("currency").default("INR"), // Currency code (INR, USD, EUR, etc.)
  imageUrl: text("image_url").notNull(),
  affiliateUrl: text("affiliate_url").notNull(),
  affiliateNetworkId: integer("affiliate_network_id").references((): any => affiliateNetworks.id),
  category: text("category").notNull(),
  subcategory: text("subcategory"), // Optional subcategory
  gender: text("gender"), // "Men", "Women", "Kids", or null for general products
  rating: numeric("rating").notNull(),
  reviewCount: integer("review_count").notNull(),
  discount: integer("discount"), // percentage
  isNew: integer("is_new", { mode: 'boolean' }).default(false),
  isFeatured: integer("is_featured", { mode: 'boolean' }).default(false),
  isService: integer("is_service", { mode: 'boolean' }).default(false), // Whether to show in Cards, Apps & Services section
  isAIApp: integer("is_ai_app", { mode: 'boolean' }).default(false), // Whether to show in Apps & AI Apps section
  customFields: text("custom_fields"), // JSON string for service-specific fields (serviceType, provider, features, etc.)
  
  // Enhanced pricing fields for services
  pricingType: text("pricing_type"), // "free", "one-time", "monthly", "yearly", "custom"
  monthlyPrice: text("monthly_price"), // price per month
  yearlyPrice: text("yearly_price"), // price per year
  isFree: integer("is_free", { mode: 'boolean' }).default(false),
  priceDescription: text("price_description"), // custom pricing description
  
  hasTimer: integer("has_timer", { mode: 'boolean' }).default(false), // Whether to show timer
  timerDuration: integer("timer_duration"), // Duration in hours (null = no timer)
  timerStartTime: integer("timer_start_time", { mode: 'timestamp' }), // When the timer started (null = no timer)
  
  // Telegram integration fields
  source: text("source"), // Source of the product (e.g., 'telegram-prime-picks', 'manual', etc.)
  telegramMessageId: integer("telegram_message_id"), // Telegram message ID for tracking
  expiresAt: integer("expires_at", { mode: 'timestamp' }), // When the product expires
  affiliateLink: text("affiliate_link"), // Processed affiliate link with tags
  
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  
  // Display pages selection - JSON array of pages where this product should appear
  displayPages: text("display_pages").default('["home"]'), // JSON array: ["home", "prime-picks", "top-picks", etc.]
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
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  readTime: text("read_time").notNull(),
  slug: text("slug").notNull(),
  hasTimer: integer("has_timer", { mode: 'boolean' }).default(false),
  timerDuration: integer("timer_duration"),
  timerStartTime: integer("timer_start_time", { mode: 'timestamp' }),
});

export const newsletterSubscribers = sqliteTable("newsletter_subscribers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  subscribedAt: integer("subscribed_at", { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
  description: text("description").notNull(),
  parentId: integer("parent_id").references((): any => categories.id), // For subcategories
  isForProducts: integer("is_for_products", { mode: 'boolean' }).default(true),
  isForServices: integer("is_for_services", { mode: 'boolean' }).default(false),
  isForAIApps: integer("is_for_ai_apps", { mode: 'boolean' }).default(false),
  displayOrder: integer("display_order").default(0),
});

// Bot-related tables
export const telegramChannels = sqliteTable("telegram_channels", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  channelId: text("channel_id").notNull().unique(), // Telegram channel ID
  name: text("name").notNull(), // Internal name (e.g., 'prime-picks')
  displayName: text("display_name").notNull(), // Display name (e.g., 'Prime Picks')
  affiliatePlatform: text("affiliate_platform").notNull(), // 'amazon', 'cuelinks', etc.
  affiliateTag: text("affiliate_tag"), // Affiliate tag/parameter
  affiliateUrl: text("affiliate_url"), // Base affiliate URL template
  isActive: integer("is_active", { mode: 'boolean' }).default(true),
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const botTransformations = sqliteTable("bot_transformations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  channelId: text("channel_id").notNull().references((): any => telegramChannels.channelId),
  messageId: integer("message_id").notNull(), // Telegram message ID
  originalText: text("original_text").notNull(), // Original message text
  transformedText: text("transformed_text").notNull(), // Transformed message text
  originalUrls: text("original_urls").notNull(), // JSON array of original URLs
  transformedUrls: text("transformed_urls").notNull(), // JSON array of transformed URLs
  affiliatePlatform: text("affiliate_platform").notNull(),
  transformationCount: integer("transformation_count").default(0), // Number of URLs transformed
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const botLogs = sqliteTable("bot_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  level: text("level").notNull(), // 'info', 'warn', 'error'
  message: text("message").notNull(),
  channelId: text("channel_id"), // Optional channel context
  messageId: integer("message_id"), // Optional message context
  error: text("error"), // Error details if level is 'error'
  metadata: text("metadata"), // Additional JSON metadata
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const botStats = sqliteTable("bot_stats", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  channelId: text("channel_id").notNull().references((): any => telegramChannels.channelId),
  date: text("date").notNull(), // YYYY-MM-DD format
  messagesProcessed: integer("messages_processed").default(0),
  urlsTransformed: integer("urls_transformed").default(0),
  errorsCount: integer("errors_count").default(0),
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const adminUsers = sqliteTable("admin_users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  resetToken: text("reset_token"),
  resetTokenExpiry: integer("reset_token_expiry", { mode: 'timestamp' }),
  lastLogin: integer("last_login", { mode: 'timestamp' }),
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
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
  // Page targeting properties
  page: text("page"), // Target page for page-specific announcements
  isGlobal: integer("is_global", { mode: 'boolean' }).default(true), // Global announcement for all pages
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
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
  pages: text("pages").default('[]'), // JSON array of pages where video should appear
  showOnHomepage: integer("show_on_homepage", { mode: 'boolean' }).default(true),
  ctaText: text("cta_text"), // CTA button text
  ctaUrl: text("cta_url"), // CTA button URL
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
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

export const canvaSettings = sqliteTable("canva_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  isEnabled: integer("is_enabled", { mode: 'boolean' }).default(false),
  apiKey: text("api_key"),
  apiSecret: text("api_secret"),
  defaultTemplateId: text("default_template_id"),
  autoGenerateCaptions: integer("auto_generate_captions", { mode: 'boolean' }).default(true),
  autoGenerateHashtags: integer("auto_generate_hashtags", { mode: 'boolean' }).default(true),
  defaultTitle: text("default_title"), // Manual title template
  defaultCaption: text("default_caption"), // Manual caption template
  defaultHashtags: text("default_hashtags"), // Manual hashtags template
  platforms: text("platforms").default('[]'), // JSON array of enabled platforms
  scheduleType: text("schedule_type").default('immediate'), // 'immediate' or 'scheduled'
  scheduleDelayMinutes: integer("schedule_delay_minutes").default(0),
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const canvaPosts = sqliteTable("canva_posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contentType: text("content_type").notNull(), // 'product', 'service', 'blog', 'video'
  contentId: integer("content_id").notNull(),
  designId: text("design_id"), // Changed from canva_design_id to design_id to match diagnosis
  templateId: text("template_id"),
  caption: text("caption"),
  hashtags: text("hashtags"),
  platforms: text("platforms"), // JSON array of platforms posted to
  postUrls: text("post_urls"), // JSON object with platform URLs
  status: text("status").default('pending'), // 'pending', 'posted', 'failed', 'expired'
  scheduledAt: integer("scheduled_at", { mode: 'timestamp' }),
  postedAt: integer("posted_at", { mode: 'timestamp' }),
  expiresAt: integer("expires_at", { mode: 'timestamp' }),
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const canvaTemplates = sqliteTable("canva_templates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  templateId: text("template_id").notNull().unique(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'post', 'story', 'reel', 'short'
  category: text("category"), // 'product', 'service', 'blog', 'video'
  thumbnailUrl: text("thumbnail_url"),
  isActive: integer("is_active", { mode: 'boolean' }).default(true),
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const currencySettings = sqliteTable("currency_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  defaultCurrency: text("default_currency").default("INR"),
  enabledCurrencies: text("enabled_currencies").default('["INR","USD","EUR","GBP","JPY","CAD","AUD","SGD","CNY","KRW"]'), // JSON array
  autoUpdateRates: integer("auto_update_rates", { mode: 'boolean' }).default(true),
  lastRateUpdate: integer("last_rate_update", { mode: 'timestamp' }),
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const exchangeRates = sqliteTable("exchange_rates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fromCurrency: text("from_currency").notNull(),
  toCurrency: text("to_currency").notNull(),
  rate: numeric("rate").notNull(),
  lastUpdated: integer("last_updated", { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const topPicksProducts = sqliteTable("top_picks_products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  price: text("price"),
  originalPrice: text("original_price"),
  currency: text("currency").default("INR"),
  imageUrl: text("image_url"),
  affiliateUrl: text("affiliate_url").notNull(),
  originalUrl: text("original_url"),
  category: text("category"),
  subcategory: text("subcategory"),
  rating: text("rating"),
  reviewCount: text("review_count"),
  discount: text("discount"),
  isFeatured: integer("is_featured", { mode: 'boolean' }).default(false),
  isNew: integer("is_new", { mode: 'boolean' }).default(true),
  hasTimer: integer("has_timer", { mode: 'boolean' }).default(false),
  timerDuration: integer("timer_duration"),
  timerStartTime: integer("timer_start_time"),
  hasLimitedOffer: integer("has_limited_offer", { mode: 'boolean' }).default(false),
  limitedOfferText: text("limited_offer_text"),
  
  // Affiliate system fields
  affiliateNetwork: text("affiliate_network").default("top-picks"),
  affiliateNetworkId: integer("affiliate_network_id"),
  affiliateTagApplied: integer("affiliate_tag_applied", { mode: 'boolean' }).default(true),
  commissionRate: real("commission_rate"),
  
  // Telegram integration fields
  telegramMessageId: integer("telegram_message_id"),
  telegramChannelId: text("telegram_channel_id"),
  processingStatus: text("processing_status").default("active"),
  
  // Bundle support fields
  messageGroupId: text("message_group_id"),
  productSequence: integer("product_sequence").default(1),
  totalInGroup: integer("total_in_group").default(1),
  
  // Today's Top Picks specific fields
  isViral: integer("is_viral", { mode: 'boolean' }).default(false),
  isTrending: integer("is_trending", { mode: 'boolean' }).default(false),
  isLimitedDeal: integer("is_limited_deal", { mode: 'boolean' }).default(false),
  isNewOffer: integer("is_new_offer", { mode: 'boolean' }).default(false),
  trendScore: real("trend_score").default(0.0),
  viralScore: real("viral_score").default(0.0),
  popularityRank: integer("popularity_rank").default(0),
  
  // Trend detection fields
  viewVelocity: real("view_velocity").default(0.0),
  clickVelocity: real("click_velocity").default(0.0),
  shareCount: integer("share_count").default(0),
  wishlistCount: integer("wishlist_count").default(0),
  conversionVelocity: real("conversion_velocity").default(0.0),
  
  // Time-based trending
  trendingStartTime: integer("trending_start_time"),
  trendingDuration: integer("trending_duration"),
  peakPerformanceTime: integer("peak_performance_time"),
  
  // Deal urgency fields
  dealUrgencyLevel: text("deal_urgency_level").default("normal"),
  stockLevel: text("stock_level"),
  dealExpiresAt: integer("deal_expires_at"),
  flashSale: integer("flash_sale", { mode: 'boolean' }).default(false),
  
  // Social proof fields
  recentPurchases: integer("recent_purchases").default(0),
  socialMentions: integer("social_mentions").default(0),
  influencerEndorsed: integer("influencer_endorsed", { mode: 'boolean' }).default(false),
  
  // Quality indicators
  qualityScore: real("quality_score").default(0.0),
  userSatisfaction: real("user_satisfaction").default(0.0),
  returnRate: real("return_rate").default(0.0),
  
  // Source tracking
  sourceDomain: text("source_domain"),
  sourcePage: text("source_page"),
  sourceMetadata: text("source_metadata"),
  scrapingMethod: text("scraping_method").default("telegram"),
  
  // Performance tracking
  clickCount: integer("click_count").default(0),
  conversionCount: integer("conversion_count").default(0),
  viewCount: integer("view_count").default(0),
  shareCountTotal: integer("share_count_total").default(0),
  
  // Timestamps
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  expiresAt: integer("expires_at", { mode: 'timestamp' }),
  lastTrendingCheck: integer("last_trending_check"),
  
  // Display control
  displayPages: text("display_pages").default("top-picks"),
  displayOrder: integer("display_order").default(0),
  priorityLevel: integer("priority_level").default(1),
  
  // Additional fields for compatibility
  gender: text("gender"),
  contentType: text("content_type").default("product"),
  source: text("source").default("telegram"),
  
  // Service/App compatibility
  isService: integer("is_service", { mode: 'boolean' }).default(false),
  isAiApp: integer("is_ai_app", { mode: 'boolean' }).default(false),
  appType: text("app_type"),
  platform: text("platform")
});

export const appsProducts = sqliteTable("apps_products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  price: text("price"),
  originalPrice: text("original_price"),
  currency: text("currency").default("INR"),
  imageUrl: text("image_url"),
  affiliateUrl: text("affiliate_url").notNull(),
  originalUrl: text("original_url"),
  category: text("category"),
  subcategory: text("subcategory"),
  rating: text("rating"),
  reviewCount: text("review_count"),
  discount: text("discount"),
  isFeatured: integer("is_featured", { mode: 'boolean' }).default(false),
  isNew: integer("is_new", { mode: 'boolean' }).default(true),
  hasTimer: integer("has_timer", { mode: 'boolean' }).default(false),
  timerDuration: integer("timer_duration"),
  timerStartTime: integer("timer_start_time"),
  hasLimitedOffer: integer("has_limited_offer", { mode: 'boolean' }).default(false),
  limitedOfferText: text("limited_offer_text"),
  
  // Affiliate system fields
  affiliateNetwork: text("affiliate_network").default("apps"),
  affiliateNetworkId: integer("affiliate_network_id"),
  affiliateTagApplied: integer("affiliate_tag_applied", { mode: 'boolean' }).default(true),
  commissionRate: real("commission_rate"),
  
  // Telegram integration fields
  telegramMessageId: integer("telegram_message_id"),
  telegramChannelId: text("telegram_channel_id"),
  processingStatus: text("processing_status").default("active"),
  
  // Bundle support fields
  messageGroupId: text("message_group_id"),
  productSequence: integer("product_sequence").default(1),
  totalInGroup: integer("total_in_group").default(1),
  
  // Apps & AI Apps specific fields
  isAiApp: integer("is_ai_app", { mode: 'boolean' }).default(false),
  isService: integer("is_service", { mode: 'boolean' }).default(false),
  appType: text("app_type").default("mobile"), // 'mobile', 'web', 'desktop', 'ai', 'service'
  platform: text("platform"), // 'iOS', 'Android', 'Web', 'Windows', 'macOS', 'Cross-platform'
  appSize: text("app_size"), // File size for mobile apps
  appVersion: text("app_version"), // Current version
  developerName: text("developer_name"), // App developer/company
  
  // Pricing fields for apps
  pricingType: text("pricing_type").default("one-time"), // 'free', 'one-time', 'subscription', 'freemium'
  monthlyPrice: text("monthly_price"),
  yearlyPrice: text("yearly_price"),
  isFree: integer("is_free", { mode: 'boolean' }).default(false),
  priceDescription: text("price_description"),
  
  // AI App specific fields
  aiCategory: text("ai_category"), // 'productivity', 'creative', 'business', 'education', 'entertainment'
  aiFeatures: text("ai_features"), // JSON array of AI features
  modelType: text("model_type"), // 'GPT', 'Claude', 'Custom', 'Open Source'
  apiAccess: integer("api_access", { mode: 'boolean' }).default(false),
  
  // App store fields
  appStoreUrl: text("app_store_url"), // iOS App Store URL
  playStoreUrl: text("play_store_url"), // Google Play Store URL
  webAppUrl: text("web_app_url"), // Web app URL
  downloadUrl: text("download_url"), // Direct download URL
  
  // Source tracking
  sourceDomain: text("source_domain"),
  sourceMetadata: text("source_metadata"),
  scrapingMethod: text("scraping_method").default("telegram"),
  
  // Performance tracking
  clickCount: integer("click_count").default(0),
  conversionCount: integer("conversion_count").default(0),
  viewCount: integer("view_count").default(0),
  downloadCount: integer("download_count").default(0),
  
  // Timestamps
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  expiresAt: integer("expires_at", { mode: 'timestamp' }),
  
  // Display control
  displayPages: text("display_pages").default("apps"),
  displayOrder: integer("display_order").default(0),
  
  // Additional fields for compatibility
  gender: text("gender"),
  contentType: text("content_type").default("app"),
  source: text("source").default("telegram")
});

export const lootBoxProducts = sqliteTable("loot_box_products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  price: text("price"),
  originalPrice: text("original_price"),
  currency: text("currency").default("INR"),
  imageUrl: text("image_url"),
  affiliateUrl: text("affiliate_url").notNull(),
  originalUrl: text("original_url"),
  category: text("category"),
  subcategory: text("subcategory"),
  rating: text("rating"),
  reviewCount: text("review_count"),
  discount: text("discount"),
  isFeatured: integer("is_featured", { mode: 'boolean' }).default(false),
  isNew: integer("is_new", { mode: 'boolean' }).default(true),
  hasTimer: integer("has_timer", { mode: 'boolean' }).default(false),
  timerDuration: integer("timer_duration"),
  timerStartTime: integer("timer_start_time"),
  hasLimitedOffer: integer("has_limited_offer", { mode: 'boolean' }).default(false),
  limitedOfferText: text("limited_offer_text"),
  
  // Affiliate system fields
  affiliateNetwork: text("affiliate_network").default("deodap"),
  affiliateNetworkId: integer("affiliate_network_id"),
  affiliateTagApplied: integer("affiliate_tag_applied", { mode: 'boolean' }).default(true),
  commissionRate: real("commission_rate"),
  
  // Telegram integration fields
  telegramMessageId: integer("telegram_message_id"),
  telegramChannelId: text("telegram_channel_id"),
  processingStatus: text("processing_status").default("active"),
  
  // Bundle support fields
  messageGroupId: text("message_group_id"),
  productSequence: integer("product_sequence").default(1),
  totalInGroup: integer("total_in_group").default(1),
  
  // Loot Box specific fields (DeoDap products/services)
  productType: text("product_type").default("product"), // 'product', 'service', 'digital', 'course'
  deodapCategory: text("deodap_category"), // DeoDap specific categories
  isService: integer("is_service", { mode: 'boolean' }).default(false),
  isDigital: integer("is_digital", { mode: 'boolean' }).default(false),
  isCourse: integer("is_course", { mode: 'boolean' }).default(false),
  serviceDuration: text("service_duration"), // For services (e.g., '1 month', '3 months')
  accessType: text("access_type"), // 'lifetime', 'subscription', 'one-time'
  
  // DeoDap specific fields
  deodapProductId: text("deodap_product_id"),
  deodapSeller: text("deodap_seller"),
  deodapTags: text("deodap_tags"), // JSON array of tags
  
  // Source tracking
  sourceDomain: text("source_domain").default("deodap.in"),
  sourceMetadata: text("source_metadata"),
  scrapingMethod: text("scraping_method").default("telegram"),
  
  // Performance tracking
  clickCount: integer("click_count").default(0),
  conversionCount: integer("conversion_count").default(0),
  viewCount: integer("view_count").default(0),
  
  // Timestamps
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  expiresAt: integer("expires_at", { mode: 'timestamp' }),
  
  // Display control
  displayPages: text("display_pages").default("loot-box"),
  displayOrder: integer("display_order").default(0),
  
  // Additional fields for compatibility
  gender: text("gender"),
  contentType: text("content_type").default("product"),
  source: text("source").default("telegram")
});

export const dealsHubProducts = sqliteTable("deals_hub_products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  price: text("price"),
  originalPrice: text("original_price"),
  currency: text("currency").default("INR"),
  imageUrl: text("image_url"),
  affiliateUrl: text("affiliate_url").notNull(),
  originalUrl: text("original_url"),
  category: text("category"),
  subcategory: text("subcategory"),
  rating: text("rating"),
  reviewCount: text("review_count"),
  discount: text("discount"),
  isFeatured: integer("is_featured", { mode: 'boolean' }).default(false),
  isNew: integer("is_new", { mode: 'boolean' }).default(true),
  hasTimer: integer("has_timer", { mode: 'boolean' }).default(false),
  timerDuration: integer("timer_duration"),
  timerStartTime: integer("timer_start_time"),
  hasLimitedOffer: integer("has_limited_offer", { mode: 'boolean' }).default(false),
  limitedOfferText: text("limited_offer_text"),
  
  // Affiliate system fields
  affiliateNetwork: text("affiliate_network").default("deals-hub"),
  affiliateNetworkId: integer("affiliate_network_id"),
  affiliateTagApplied: integer("affiliate_tag_applied", { mode: 'boolean' }).default(true),
  commissionRate: real("commission_rate"),
  
  // Telegram integration fields
  telegramMessageId: integer("telegram_message_id"),
  telegramChannelId: text("telegram_channel_id"),
  processingStatus: text("processing_status").default("active"),
  
  // Bundle support fields
  messageGroupId: text("message_group_id"),
  productSequence: integer("product_sequence").default(1),
  totalInGroup: integer("total_in_group").default(1),
  
  // Deals Hub specific fields
  dealType: text("deal_type").default("general"), // 'flash', 'daily', 'weekly', 'clearance', 'general'
  dealPriority: integer("deal_priority").default(0), // Higher number = higher priority
  dealStartTime: integer("deal_start_time"),
  dealEndTime: integer("deal_end_time"),
  stockQuantity: integer("stock_quantity"),
  maxQuantityPerUser: integer("max_quantity_per_user").default(1),
  
  // Source tracking
  sourceDomain: text("source_domain"),
  sourceMetadata: text("source_metadata"),
  scrapingMethod: text("scraping_method").default("telegram"),
  
  // Performance tracking
  clickCount: integer("click_count").default(0),
  conversionCount: integer("conversion_count").default(0),
  viewCount: integer("view_count").default(0),
  
  // Timestamps
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  expiresAt: integer("expires_at", { mode: 'timestamp' }),
  
  // Display control
  displayPages: text("display_pages").default("deals-hub"),
  displayOrder: integer("display_order").default(0),
  
  // Additional fields for compatibility
  gender: text("gender"),
  contentType: text("content_type").default("product"),
  source: text("source").default("telegram")
});

export const amazonProducts = sqliteTable("amazon_products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  price: text("price").default("0"),
  originalPrice: text("original_price"),
  currency: text("currency").default("INR"),
  imageUrl: text("image_url").default("https://via.placeholder.com/300x300"),
  affiliateUrl: text("affiliate_url").notNull(),
  category: text("category").default("General"),
  rating: text("rating").default("4.0"),
  reviewCount: integer("review_count").default(0),
  discount: integer("discount").default(0),
  isFeatured: integer("is_featured").default(0),
  source: text("source").default("telegram-prime-picks"),
  telegramMessageId: integer("telegram_message_id"),
  expiresAt: integer("expires_at"),
  affiliateLink: text("affiliate_link"),
  displayPages: text("display_pages").default('["prime-picks"]'),
  createdAt: integer("created_at").default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at").default(sql`(strftime('%s', 'now'))`),
  hasLimitedOffer: integer("has_limited_offer").default(0),
  limitedOfferText: text("limited_offer_text"),
  messageGroupId: text("message_group_id"),
  productSequence: integer("product_sequence").default(1),
  totalInGroup: integer("total_in_group").default(1),
  contentType: text("content_type").default("product"),
  affiliateNetwork: text("affiliate_network"),
  affiliateTagApplied: integer("affiliate_tag_applied").default(0),
  originalUrl: text("original_url"),
  affiliateConfig: text("affiliate_config")
});

export const globalPicksProducts = sqliteTable("global_picks_products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  price: text("price"),
  originalPrice: text("original_price"),
  currency: text("currency").default("INR"),
  imageUrl: text("image_url"),
  affiliateUrl: text("affiliate_url").notNull(),
  originalUrl: text("original_url"),
  category: text("category"),
  subcategory: text("subcategory"),
  rating: text("rating"),
  reviewCount: text("review_count"),
  discount: text("discount"),
  isFeatured: integer("is_featured", { mode: 'boolean' }).default(false),
  isNew: integer("is_new", { mode: 'boolean' }).default(true),
  hasTimer: integer("has_timer", { mode: 'boolean' }).default(false),
  timerDuration: integer("timer_duration"),
  timerStartTime: integer("timer_start_time"),
  hasLimitedOffer: integer("has_limited_offer", { mode: 'boolean' }).default(false),
  limitedOfferText: text("limited_offer_text"),
  
  // Affiliate system fields
  affiliateNetwork: text("affiliate_network").default("global-picks"),
  affiliateNetworkId: integer("affiliate_network_id"),
  affiliateTagApplied: integer("affiliate_tag_applied", { mode: 'boolean' }).default(true),
  commissionRate: real("commission_rate"),
  
  // Telegram integration fields
  telegramMessageId: integer("telegram_message_id"),
  telegramChannelId: text("telegram_channel_id"),
  processingStatus: text("processing_status").default("active"),
  
  // Bundle support fields
  messageGroupId: text("message_group_id"),
  productSequence: integer("product_sequence").default(1),
  totalInGroup: integer("total_in_group").default(1),
  
  // Universal scraping fields
  sourceDomain: text("source_domain"),
  sourceMetadata: text("source_metadata"),
  scrapingMethod: text("scraping_method").default("universal"),
  
  // Performance tracking
  clickCount: integer("click_count").default(0),
  conversionCount: integer("conversion_count").default(0),
  
  // Timestamps
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  expiresAt: integer("expires_at", { mode: 'timestamp' }),
  
  // Display control
  displayPages: text("display_pages").default("global-picks"),
  displayOrder: integer("display_order").default(0),
  
  // Additional fields for compatibility
  gender: text("gender"),
  contentType: text("content_type").default("product"),
  source: text("source").default("telegram")
});

export const featuredProducts = sqliteTable("featured_products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  price: text("price"),
  originalPrice: text("original_price"),
  currency: text("currency").default("INR"),
  imageUrl: text("image_url"),
  affiliateUrl: text("affiliate_url").notNull(),
  originalUrl: text("original_url"),
  category: text("category"),
  subcategory: text("subcategory"),
  rating: text("rating"),
  reviewCount: text("review_count"),
  discount: text("discount"),
  isFeatured: integer("is_featured", { mode: 'boolean' }).default(true),
  isNew: integer("is_new", { mode: 'boolean' }).default(false),
  isActive: integer("is_active", { mode: 'boolean' }).default(true),
  displayOrder: integer("display_order").default(0),
  
  // Timer functionality
  hasTimer: integer("has_timer", { mode: 'boolean' }).default(false),
  timerDuration: integer("timer_duration"),
  timerStartTime: integer("timer_start_time"),
  
  // Limited offers
  hasLimitedOffer: integer("has_limited_offer", { mode: 'boolean' }).default(false),
  limitedOfferText: text("limited_offer_text"),
  
  // Affiliate tracking
  affiliateNetwork: text("affiliate_network"),
  affiliateNetworkId: integer("affiliate_network_id"),
  commissionRate: real("commission_rate"),
  
  // Analytics
  clickCount: integer("click_count").default(0),
  conversionCount: integer("conversion_count").default(0),
  viewCount: integer("view_count").default(0),
  
  // Timestamps
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  expiresAt: integer("expires_at", { mode: 'timestamp' }),
  
  // Metadata
  source: text("source").default("manual"),
  contentType: text("content_type").default("product"),
  gender: text("gender"),
});

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({
  id: true,
  createdAt: true,
});

export const insertCanvaSettingsSchema = createInsertSchema(canvaSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCanvaPostSchema = createInsertSchema(canvaPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCanvaTemplateSchema = createInsertSchema(canvaTemplates).omit({
  id: true,
  createdAt: true,
});

export const insertCurrencySettingsSchema = createInsertSchema(currencySettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertExchangeRateSchema = createInsertSchema(exchangeRates).omit({
  id: true,
  lastUpdated: true,
});

export const insertTopPicksProductSchema = createInsertSchema(topPicksProducts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAppsProductSchema = createInsertSchema(appsProducts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLootBoxProductSchema = createInsertSchema(lootBoxProducts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDealsHubProductSchema = createInsertSchema(dealsHubProducts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAmazonProductSchema = createInsertSchema(amazonProducts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGlobalPicksProductSchema = createInsertSchema(globalPicksProducts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFeaturedProductSchema = createInsertSchema(featuredProducts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Product = typeof products.$inferSelect;
export type BlogPost = typeof blogPosts.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type AffiliateNetwork = typeof affiliateNetworks.$inferSelect;
export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type AdminUser = typeof adminUsers.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type VideoContent = typeof videoContent.$inferSelect;
export type CanvaSettings = typeof canvaSettings.$inferSelect;
export type CanvaPost = typeof canvaPosts.$inferSelect;
export type CanvaTemplate = typeof canvaTemplates.$inferSelect;
export type CurrencySettings = typeof currencySettings.$inferSelect;
export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type TopPicksProduct = typeof topPicksProducts.$inferSelect;
export type AppsProduct = typeof appsProducts.$inferSelect;
export type LootBoxProduct = typeof lootBoxProducts.$inferSelect;
export type DealsHubProduct = typeof dealsHubProducts.$inferSelect;
export type AmazonProduct = typeof amazonProducts.$inferSelect;
export type GlobalPicksProduct = typeof globalPicksProducts.$inferSelect;
export type FeaturedProduct = typeof featuredProducts.$inferSelect;

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertAffiliateNetwork = z.infer<typeof insertAffiliateNetworkSchema>;
export type InsertNewsletterSubscriber = z.infer<typeof insertNewsletterSubscriberSchema>;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type InsertVideoContent = z.infer<typeof insertVideoContentSchema>;
export type InsertCanvaSettings = z.infer<typeof insertCanvaSettingsSchema>;
export type InsertCanvaPost = z.infer<typeof insertCanvaPostSchema>;
export type InsertCanvaTemplate = z.infer<typeof insertCanvaTemplateSchema>;
export type InsertCurrencySettings = z.infer<typeof insertCurrencySettingsSchema>;
export type InsertExchangeRate = z.infer<typeof insertExchangeRateSchema>;
export type InsertTopPicksProduct = z.infer<typeof insertTopPicksProductSchema>;
export type InsertAppsProduct = z.infer<typeof insertAppsProductSchema>;
export type InsertLootBoxProduct = z.infer<typeof insertLootBoxProductSchema>;
export type InsertDealsHubProduct = z.infer<typeof insertDealsHubProductSchema>;
export type InsertAmazonProduct = z.infer<typeof insertAmazonProductSchema>;
export type InsertGlobalPicksProduct = z.infer<typeof insertGlobalPicksProductSchema>;
// Widgets table for dynamic widget management
export const widgets = sqliteTable("widgets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(), // Widget display name
  description: text("description"), // Optional description shown in admin or generated widgets
  code: text("code").notNull(), // HTML/CSS/JS code for the widget
  targetPage: text("target_page").notNull(), // Page where widget should appear
  position: text("position").notNull(), // header, sidebar, footer, content-top, content-bottom
  isActive: integer("is_active", { mode: 'boolean' }).default(true),
  displayOrder: integer("display_order").default(0), // Order within position
  maxWidth: text("max_width"), // Optional max width (e.g., "300px", "100%")
  customCss: text("custom_css"), // Additional CSS for styling
  showOnMobile: integer("show_on_mobile", { mode: 'boolean' }).default(true),
  showOnDesktop: integer("show_on_desktop", { mode: 'boolean' }).default(true),
  externalLink: text("external_link"), // Optional external link to open when widget is clicked
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const insertWidgetSchema = createInsertSchema(widgets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Widget = typeof widgets.$inferSelect;
export type InsertWidget = z.infer<typeof insertWidgetSchema>;

export type InsertFeaturedProduct = z.infer<typeof insertFeaturedProductSchema>;

// Channel Posts - Track messages from Telegram channels
export const channelPosts = sqliteTable("channel_posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  channelId: text("channel_id").notNull(), // Telegram channel ID
  channelName: text("channel_name").notNull(), // Channel display name
  websitePage: text("website_page").notNull(), // Target website page
  messageId: integer("message_id").notNull(), // Telegram message ID
  
  // Content
  originalText: text("original_text").notNull(), // Original message text
  processedText: text("processed_text").notNull(), // Text with affiliate links
  extractedUrls: text("extracted_urls"), // JSON array of original URLs found
  
  // Processing Status
  isProcessed: integer("is_processed", { mode: 'boolean' }).default(false),
  isPosted: integer("is_posted", { mode: 'boolean' }).default(false),
  processingError: text("processing_error"),
  
  // Timestamps
  telegramTimestamp: integer("telegram_timestamp", { mode: 'timestamp' }), // When posted on Telegram
  processedAt: integer("processed_at", { mode: 'timestamp' }), // When processed by bot
  postedAt: integer("posted_at", { mode: 'timestamp' }), // When posted to website
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

// Affiliate Conversions - Track URL conversions and performance
export const affiliateConversions = sqliteTable("affiliate_conversions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  channelPostId: integer("channel_post_id").references(() => channelPosts.id),
  
  // URL Information
  originalUrl: text("original_url").notNull(),
  affiliateUrl: text("affiliate_url").notNull(),
  platform: text("platform").notNull(), // amazon, cuelinks, earnkaro, etc.
  
  // Conversion Details
  conversionSuccess: integer("conversion_success", { mode: 'boolean' }).notNull(),
  conversionError: text("conversion_error"),
  
  // Performance Tracking
  clickCount: integer("click_count").default(0),
  conversionCount: integer("conversion_count").default(0),
  revenue: text("revenue").default('0'), // stored as text in SQLite
  
  // Metadata
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const insertChannelPostSchema = createInsertSchema(channelPosts).omit({
  id: true,
  createdAt: true,
});

export const insertAffiliateConversionSchema = createInsertSchema(affiliateConversions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ChannelPost = typeof channelPosts.$inferSelect;
export type AffiliateConversion = typeof affiliateConversions.$inferSelect;
export type InsertChannelPost = z.infer<typeof insertChannelPostSchema>;
export type InsertAffiliateConversion = z.infer<typeof insertAffiliateConversionSchema>;

// Unified Content table for cross-platform content management
export const unifiedContent = sqliteTable("unified_content", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  price: text("price"),
  originalPrice: text("original_price"),
  imageUrl: text("image_url").notNull(),
  affiliateUrl: text("affiliate_url").notNull(),
  
  // Content Classification
  contentType: text("content_type").notNull(), // 'product', 'service', 'app', 'travel'
  pageType: text("page_type").notNull(), // 'today_picks', 'travel', 'deals', 'apps'
  category: text("category").notNull(),
  subcategory: text("subcategory"),
  
  // Source & Platform Information
  sourceType: text("source_type").notNull(), // 'manual', 'telegram', 'rss', 'api'
  sourceId: text("source_id"), // channel_id, rss_url, api_key, etc.
  affiliatePlatform: text("affiliate_platform"), // 'amazon', 'flipkart', 'booking', 'cuelinks'
  
  // Additional Metadata
  rating: text("rating"), // stored as text in SQLite
  reviewCount: integer("review_count"),
  discount: integer("discount"), // percentage
  currency: text("currency").default('INR'),
  gender: text("gender"), // "Men", "Women", "Kids", or null
  
  // Display & Status
  isActive: integer("is_active", { mode: 'boolean' }).default(true),
  isFeatured: integer("is_featured", { mode: 'boolean' }).default(false),
  displayOrder: integer("display_order").default(0),
  
  // Page Display Configuration
  displayPages: text("display_pages").default('["home"]'), // JSON array of pages where content should appear
  
  // Timer functionality
  hasTimer: integer("has_timer", { mode: 'boolean' }).default(false),
  timerDuration: integer("timer_duration"), // Duration in hours
  timerStartTime: integer("timer_start_time", { mode: 'timestamp' }),
  
  // Timestamps
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const insertUnifiedContentSchema = createInsertSchema(unifiedContent).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type UnifiedContent = typeof unifiedContent.$inferSelect;
export type InsertUnifiedContent = z.infer<typeof insertUnifiedContentSchema>;

// Meta tags table for website ownership verification
export const metaTags = sqliteTable("meta_tags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(), // Meta tag name (e.g., "google-site-verification", "facebook-domain-verification")
  content: text("content").notNull(), // Meta tag content/value
  provider: text("provider").notNull(), // Provider name (e.g., "Google", "Facebook", "Bing", "Pinterest")
  purpose: text("purpose").notNull(), // Purpose description (e.g., "Site Verification", "Domain Verification")
  isActive: integer("is_active", { mode: 'boolean' }).default(true),
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const insertMetaTagSchema = createInsertSchema(metaTags).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type MetaTag = typeof metaTags.$inferSelect;
export type InsertMetaTag = z.infer<typeof insertMetaTagSchema>;

// Travel Deals Schema for SQLite
// DEPRECATED: travelDeals table - DO NOT USE
// All travel data should use the unified travel_products table
// This schema is commented out to prevent future confusion
/*
export const travelDeals = sqliteTable("travel_deals", {
  // ... schema definition removed to prevent usage
  // Use travel_products table instead for all travel data
});

export const insertTravelDealSchema = createInsertSchema(travelDeals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type TravelDeal = typeof travelDeals.$inferSelect;
export type InsertTravelDeal = z.infer<typeof insertTravelDealSchema>;
*/

// NOTE: For travel data, use the existing travel_products table structure
// which is managed by bot-specific tables and unified data architecture

// ChannelConfig type for webhook and affiliate conversion
export interface ChannelConfig {
  id: number;
  isActive: boolean;
  affiliateUrl: string;
  affiliatePlatform?: string;
  affiliateTag?: string;
  supportedPlatforms?: string[];
}
