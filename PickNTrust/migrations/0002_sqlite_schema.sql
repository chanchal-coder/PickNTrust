-- SQLite Schema Migration
CREATE TABLE IF NOT EXISTS "affiliate_networks" (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT,
	"name" TEXT NOT NULL,
	"slug" TEXT NOT NULL UNIQUE,
	"description" TEXT NOT NULL,
	"commission_rate" TEXT NOT NULL,
	"tracking_params" TEXT,
	"logo_url" TEXT,
	"is_active" INTEGER DEFAULT 1,
	"join_url" TEXT
);

CREATE TABLE IF NOT EXISTS "products" (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT,
	"name" TEXT NOT NULL,
	"description" TEXT NOT NULL,
	"price" TEXT NOT NULL,
	"original_price" TEXT,
	"image_url" TEXT NOT NULL,
	"affiliate_url" TEXT NOT NULL,
	"affiliate_network_id" INTEGER,
	"category" TEXT NOT NULL,
	"gender" TEXT,
	"rating" TEXT NOT NULL,
	"review_count" INTEGER NOT NULL,
	"discount" INTEGER,
	"is_new" INTEGER DEFAULT 0,
	"is_featured" INTEGER DEFAULT 0,
	"has_timer" INTEGER DEFAULT 0,
	"timer_duration" INTEGER,
	"timer_start_time" INTEGER,
	"created_at" INTEGER,
	FOREIGN KEY ("affiliate_network_id") REFERENCES "affiliate_networks"("id")
);

CREATE TABLE IF NOT EXISTS "blog_posts" (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT,
	"title" TEXT NOT NULL,
	"excerpt" TEXT NOT NULL,
	"content" TEXT NOT NULL,
	"category" TEXT NOT NULL,
	"tags" TEXT,
	"image_url" TEXT NOT NULL,
	"video_url" TEXT,
	"published_at" INTEGER NOT NULL,
	"created_at" INTEGER,
	"read_time" TEXT NOT NULL,
	"slug" TEXT NOT NULL,
	"has_timer" INTEGER DEFAULT 0,
	"timer_duration" INTEGER,
	"timer_start_time" INTEGER
);

CREATE TABLE IF NOT EXISTS "categories" (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT,
	"name" TEXT NOT NULL,
	"icon" TEXT NOT NULL,
	"color" TEXT NOT NULL,
	"description" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "newsletter_subscribers" (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT,
	"email" TEXT NOT NULL UNIQUE,
	"subscribed_at" INTEGER
);

CREATE TABLE IF NOT EXISTS "admin_users" (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT,
	"username" TEXT NOT NULL UNIQUE,
	"email" TEXT NOT NULL UNIQUE,
	"password_hash" TEXT NOT NULL,
	"reset_token" TEXT,
	"reset_token_expiry" INTEGER,
	"last_login" INTEGER,
	"created_at" INTEGER,
	"is_active" INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS "announcements" (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT,
	"message" TEXT NOT NULL,
	"is_active" INTEGER DEFAULT 1,
	"text_color" TEXT DEFAULT '#ffffff',
	"background_color" TEXT DEFAULT '#3b82f6',
	"font_size" TEXT DEFAULT '16px',
	"font_weight" TEXT DEFAULT 'normal',
	"text_decoration" TEXT DEFAULT 'none',
	"font_style" TEXT DEFAULT 'normal',
	"animation_speed" TEXT DEFAULT '30',
	"text_border_width" TEXT DEFAULT '0px',
	"text_border_style" TEXT DEFAULT 'solid',
	"text_border_color" TEXT DEFAULT '#000000',
	"banner_border_width" TEXT DEFAULT '0px',
	"banner_border_style" TEXT DEFAULT 'solid',
	"banner_border_color" TEXT DEFAULT '#000000',
	"created_at" INTEGER
);

-- Insert some default data
INSERT OR IGNORE INTO "affiliate_networks" ("id", "name", "slug", "description", "commission_rate", "is_active") VALUES
(1, 'Amazon Associates', 'amazon', 'Amazon affiliate program', '5.0', 1),
(2, 'Flipkart Affiliate', 'flipkart', 'Flipkart affiliate program', '4.0', 1),
(3, 'Generic Affiliate', 'generic', 'Generic affiliate network', '3.0', 1);

INSERT OR IGNORE INTO "categories" ("id", "name", "icon", "color", "description") VALUES
(1, 'Electronics & Gadgets', '📱', '#3B82F6', 'Latest electronics and gadgets'),
(2, 'Fashion & Clothing', '👕', '#EF4444', 'Trendy fashion and clothing'),
(3, 'Home & Kitchen', '🏠', '#10B981', 'Home and kitchen essentials'),
(4, 'Health & Beauty', '💄', '#F59E0B', 'Health and beauty products'),
(5, 'Sports & Fitness', '⚽', '#8B5CF6', 'Sports and fitness equipment'),
(6, 'Books & Education', '📚', '#06B6D4', 'Books and educational materials');
