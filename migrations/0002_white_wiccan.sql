PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_admin_users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`reset_token` text,
	`reset_token_expiry` integer,
	`last_login` integer,
	`created_at` integer DEFAULT '"2025-09-05T13:35:33.598Z"',
	`is_active` integer DEFAULT true
);
--> statement-breakpoint
INSERT INTO `__new_admin_users`("id", "username", "email", "password_hash", "reset_token", "reset_token_expiry", "last_login", "created_at", "is_active") SELECT "id", "username", "email", "password_hash", "reset_token", "reset_token_expiry", "last_login", "created_at", "is_active" FROM `admin_users`;--> statement-breakpoint
DROP TABLE `admin_users`;--> statement-breakpoint
ALTER TABLE `__new_admin_users` RENAME TO `admin_users`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `admin_users_username_unique` ON `admin_users` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `admin_users_email_unique` ON `admin_users` (`email`);--> statement-breakpoint
CREATE TABLE `__new_announcements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`message` text NOT NULL,
	`is_active` integer DEFAULT true,
	`text_color` text DEFAULT '#ffffff',
	`background_color` text DEFAULT '#3b82f6',
	`font_size` text DEFAULT '16px',
	`font_weight` text DEFAULT 'normal',
	`text_decoration` text DEFAULT 'none',
	`font_style` text DEFAULT 'normal',
	`animation_speed` text DEFAULT '30',
	`text_border_width` text DEFAULT '0px',
	`text_border_style` text DEFAULT 'solid',
	`text_border_color` text DEFAULT '#000000',
	`banner_border_width` text DEFAULT '0px',
	`banner_border_style` text DEFAULT 'solid',
	`banner_border_color` text DEFAULT '#000000',
	`created_at` integer DEFAULT '"2025-09-05T13:35:33.598Z"'
);
--> statement-breakpoint
INSERT INTO `__new_announcements`("id", "message", "is_active", "text_color", "background_color", "font_size", "font_weight", "text_decoration", "font_style", "animation_speed", "text_border_width", "text_border_style", "text_border_color", "banner_border_width", "banner_border_style", "banner_border_color", "created_at") SELECT "id", "message", "is_active", "text_color", "background_color", "font_size", "font_weight", "text_decoration", "font_style", "animation_speed", "text_border_width", "text_border_style", "text_border_color", "banner_border_width", "banner_border_style", "banner_border_color", "created_at" FROM `announcements`;--> statement-breakpoint
DROP TABLE `announcements`;--> statement-breakpoint
ALTER TABLE `__new_announcements` RENAME TO `announcements`;--> statement-breakpoint
CREATE TABLE `__new_apps_products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`price` text,
	`original_price` text,
	`currency` text DEFAULT 'INR',
	`image_url` text,
	`affiliate_url` text NOT NULL,
	`original_url` text,
	`category` text,
	`subcategory` text,
	`rating` text,
	`review_count` text,
	`discount` text,
	`is_featured` integer DEFAULT false,
	`is_new` integer DEFAULT true,
	`has_timer` integer DEFAULT false,
	`timer_duration` integer,
	`timer_start_time` integer,
	`has_limited_offer` integer DEFAULT false,
	`limited_offer_text` text,
	`affiliate_network` text DEFAULT 'apps',
	`affiliate_network_id` integer,
	`affiliate_tag_applied` integer DEFAULT true,
	`commission_rate` real,
	`telegram_message_id` integer,
	`telegram_channel_id` text,
	`processing_status` text DEFAULT 'active',
	`message_group_id` text,
	`product_sequence` integer DEFAULT 1,
	`total_in_group` integer DEFAULT 1,
	`is_ai_app` integer DEFAULT false,
	`is_service` integer DEFAULT false,
	`app_type` text DEFAULT 'mobile',
	`platform` text,
	`app_size` text,
	`app_version` text,
	`developer_name` text,
	`pricing_type` text DEFAULT 'one-time',
	`monthly_price` text,
	`yearly_price` text,
	`is_free` integer DEFAULT false,
	`price_description` text,
	`ai_category` text,
	`ai_features` text,
	`model_type` text,
	`api_access` integer DEFAULT false,
	`app_store_url` text,
	`play_store_url` text,
	`web_app_url` text,
	`download_url` text,
	`source_domain` text,
	`source_metadata` text,
	`scraping_method` text DEFAULT 'telegram',
	`click_count` integer DEFAULT 0,
	`conversion_count` integer DEFAULT 0,
	`view_count` integer DEFAULT 0,
	`download_count` integer DEFAULT 0,
	`created_at` integer DEFAULT '"2025-09-05T13:35:33.604Z"',
	`updated_at` integer DEFAULT '"2025-09-05T13:35:33.604Z"',
	`expires_at` integer,
	`display_pages` text DEFAULT 'apps',
	`display_order` integer DEFAULT 0,
	`gender` text,
	`content_type` text DEFAULT 'app',
	`source` text DEFAULT 'telegram'
);
--> statement-breakpoint
INSERT INTO `__new_apps_products`("id", "name", "description", "price", "original_price", "currency", "image_url", "affiliate_url", "original_url", "category", "subcategory", "rating", "review_count", "discount", "is_featured", "is_new", "has_timer", "timer_duration", "timer_start_time", "has_limited_offer", "limited_offer_text", "affiliate_network", "affiliate_network_id", "affiliate_tag_applied", "commission_rate", "telegram_message_id", "telegram_channel_id", "processing_status", "message_group_id", "product_sequence", "total_in_group", "is_ai_app", "is_service", "app_type", "platform", "app_size", "app_version", "developer_name", "pricing_type", "monthly_price", "yearly_price", "is_free", "price_description", "ai_category", "ai_features", "model_type", "api_access", "app_store_url", "play_store_url", "web_app_url", "download_url", "source_domain", "source_metadata", "scraping_method", "click_count", "conversion_count", "view_count", "download_count", "created_at", "updated_at", "expires_at", "display_pages", "display_order", "gender", "content_type", "source") SELECT "id", "name", "description", "price", "original_price", "currency", "image_url", "affiliate_url", "original_url", "category", "subcategory", "rating", "review_count", "discount", "is_featured", "is_new", "has_timer", "timer_duration", "timer_start_time", "has_limited_offer", "limited_offer_text", "affiliate_network", "affiliate_network_id", "affiliate_tag_applied", "commission_rate", "telegram_message_id", "telegram_channel_id", "processing_status", "message_group_id", "product_sequence", "total_in_group", "is_ai_app", "is_service", "app_type", "platform", "app_size", "app_version", "developer_name", "pricing_type", "monthly_price", "yearly_price", "is_free", "price_description", "ai_category", "ai_features", "model_type", "api_access", "app_store_url", "play_store_url", "web_app_url", "download_url", "source_domain", "source_metadata", "scraping_method", "click_count", "conversion_count", "view_count", "download_count", "created_at", "updated_at", "expires_at", "display_pages", "display_order", "gender", "content_type", "source" FROM `apps_products`;--> statement-breakpoint
DROP TABLE `apps_products`;--> statement-breakpoint
ALTER TABLE `__new_apps_products` RENAME TO `apps_products`;--> statement-breakpoint
CREATE TABLE `__new_blog_posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`excerpt` text NOT NULL,
	`content` text NOT NULL,
	`category` text NOT NULL,
	`tags` text,
	`image_url` text NOT NULL,
	`video_url` text,
	`published_at` integer NOT NULL,
	`created_at` integer DEFAULT '"2025-09-05T13:35:33.598Z"',
	`read_time` text NOT NULL,
	`slug` text NOT NULL,
	`has_timer` integer DEFAULT false,
	`timer_duration` integer,
	`timer_start_time` integer
);
--> statement-breakpoint
INSERT INTO `__new_blog_posts`("id", "title", "excerpt", "content", "category", "tags", "image_url", "video_url", "published_at", "created_at", "read_time", "slug", "has_timer", "timer_duration", "timer_start_time") SELECT "id", "title", "excerpt", "content", "category", "tags", "image_url", "video_url", "published_at", "created_at", "read_time", "slug", "has_timer", "timer_duration", "timer_start_time" FROM `blog_posts`;--> statement-breakpoint
DROP TABLE `blog_posts`;--> statement-breakpoint
ALTER TABLE `__new_blog_posts` RENAME TO `blog_posts`;--> statement-breakpoint
CREATE TABLE `__new_canva_posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`content_type` text NOT NULL,
	`content_id` integer NOT NULL,
	`design_id` text,
	`template_id` text,
	`caption` text,
	`hashtags` text,
	`platforms` text,
	`post_urls` text,
	`status` text DEFAULT 'pending',
	`scheduled_at` integer,
	`posted_at` integer,
	`expires_at` integer,
	`created_at` integer DEFAULT '"2025-09-05T13:35:33.603Z"',
	`updated_at` integer DEFAULT '"2025-09-05T13:35:33.603Z"'
);
--> statement-breakpoint
INSERT INTO `__new_canva_posts`("id", "content_type", "content_id", "design_id", "template_id", "caption", "hashtags", "platforms", "post_urls", "status", "scheduled_at", "posted_at", "expires_at", "created_at", "updated_at") SELECT "id", "content_type", "content_id", "design_id", "template_id", "caption", "hashtags", "platforms", "post_urls", "status", "scheduled_at", "posted_at", "expires_at", "created_at", "updated_at" FROM `canva_posts`;--> statement-breakpoint
DROP TABLE `canva_posts`;--> statement-breakpoint
ALTER TABLE `__new_canva_posts` RENAME TO `canva_posts`;--> statement-breakpoint
CREATE TABLE `__new_canva_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`is_enabled` integer DEFAULT false,
	`api_key` text,
	`api_secret` text,
	`default_template_id` text,
	`auto_generate_captions` integer DEFAULT true,
	`auto_generate_hashtags` integer DEFAULT true,
	`default_title` text,
	`default_caption` text,
	`default_hashtags` text,
	`platforms` text DEFAULT '[]',
	`schedule_type` text DEFAULT 'immediate',
	`schedule_delay_minutes` integer DEFAULT 0,
	`created_at` integer DEFAULT '"2025-09-05T13:35:33.602Z"',
	`updated_at` integer DEFAULT '"2025-09-05T13:35:33.602Z"'
);
--> statement-breakpoint
INSERT INTO `__new_canva_settings`("id", "is_enabled", "api_key", "api_secret", "default_template_id", "auto_generate_captions", "auto_generate_hashtags", "default_title", "default_caption", "default_hashtags", "platforms", "schedule_type", "schedule_delay_minutes", "created_at", "updated_at") SELECT "id", "is_enabled", "api_key", "api_secret", "default_template_id", "auto_generate_captions", "auto_generate_hashtags", "default_title", "default_caption", "default_hashtags", "platforms", "schedule_type", "schedule_delay_minutes", "created_at", "updated_at" FROM `canva_settings`;--> statement-breakpoint
DROP TABLE `canva_settings`;--> statement-breakpoint
ALTER TABLE `__new_canva_settings` RENAME TO `canva_settings`;--> statement-breakpoint
CREATE TABLE `__new_canva_templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`template_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`category` text,
	`thumbnail_url` text,
	`is_active` integer DEFAULT true,
	`created_at` integer DEFAULT '"2025-09-05T13:35:33.603Z"'
);
--> statement-breakpoint
INSERT INTO `__new_canva_templates`("id", "template_id", "name", "type", "category", "thumbnail_url", "is_active", "created_at") SELECT "id", "template_id", "name", "type", "category", "thumbnail_url", "is_active", "created_at" FROM `canva_templates`;--> statement-breakpoint
DROP TABLE `canva_templates`;--> statement-breakpoint
ALTER TABLE `__new_canva_templates` RENAME TO `canva_templates`;--> statement-breakpoint
CREATE UNIQUE INDEX `canva_templates_template_id_unique` ON `canva_templates` (`template_id`);--> statement-breakpoint
CREATE TABLE `__new_currency_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`default_currency` text DEFAULT 'INR',
	`enabled_currencies` text DEFAULT '["INR","USD","EUR","GBP","JPY","CAD","AUD","SGD","CNY","KRW"]',
	`auto_update_rates` integer DEFAULT true,
	`last_rate_update` integer,
	`created_at` integer DEFAULT '"2025-09-05T13:35:33.603Z"',
	`updated_at` integer DEFAULT '"2025-09-05T13:35:33.603Z"'
);
--> statement-breakpoint
INSERT INTO `__new_currency_settings`("id", "default_currency", "enabled_currencies", "auto_update_rates", "last_rate_update", "created_at", "updated_at") SELECT "id", "default_currency", "enabled_currencies", "auto_update_rates", "last_rate_update", "created_at", "updated_at" FROM `currency_settings`;--> statement-breakpoint
DROP TABLE `currency_settings`;--> statement-breakpoint
ALTER TABLE `__new_currency_settings` RENAME TO `currency_settings`;--> statement-breakpoint
CREATE TABLE `__new_deals_hub_products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`price` text,
	`original_price` text,
	`currency` text DEFAULT 'INR',
	`image_url` text,
	`affiliate_url` text NOT NULL,
	`original_url` text,
	`category` text,
	`subcategory` text,
	`rating` text,
	`review_count` text,
	`discount` text,
	`is_featured` integer DEFAULT false,
	`is_new` integer DEFAULT true,
	`has_timer` integer DEFAULT false,
	`timer_duration` integer,
	`timer_start_time` integer,
	`has_limited_offer` integer DEFAULT false,
	`limited_offer_text` text,
	`affiliate_network` text DEFAULT 'deals-hub',
	`affiliate_network_id` integer,
	`affiliate_tag_applied` integer DEFAULT true,
	`commission_rate` real,
	`telegram_message_id` integer,
	`telegram_channel_id` text,
	`processing_status` text DEFAULT 'active',
	`message_group_id` text,
	`product_sequence` integer DEFAULT 1,
	`total_in_group` integer DEFAULT 1,
	`deal_type` text DEFAULT 'general',
	`deal_priority` integer DEFAULT 0,
	`deal_start_time` integer,
	`deal_end_time` integer,
	`stock_quantity` integer,
	`max_quantity_per_user` integer DEFAULT 1,
	`source_domain` text,
	`source_metadata` text,
	`scraping_method` text DEFAULT 'telegram',
	`click_count` integer DEFAULT 0,
	`conversion_count` integer DEFAULT 0,
	`view_count` integer DEFAULT 0,
	`created_at` integer DEFAULT '"2025-09-05T13:35:33.604Z"',
	`updated_at` integer DEFAULT '"2025-09-05T13:35:33.604Z"',
	`expires_at` integer,
	`display_pages` text DEFAULT 'deals-hub',
	`display_order` integer DEFAULT 0,
	`gender` text,
	`content_type` text DEFAULT 'product',
	`source` text DEFAULT 'telegram'
);
--> statement-breakpoint
INSERT INTO `__new_deals_hub_products`("id", "name", "description", "price", "original_price", "currency", "image_url", "affiliate_url", "original_url", "category", "subcategory", "rating", "review_count", "discount", "is_featured", "is_new", "has_timer", "timer_duration", "timer_start_time", "has_limited_offer", "limited_offer_text", "affiliate_network", "affiliate_network_id", "affiliate_tag_applied", "commission_rate", "telegram_message_id", "telegram_channel_id", "processing_status", "message_group_id", "product_sequence", "total_in_group", "deal_type", "deal_priority", "deal_start_time", "deal_end_time", "stock_quantity", "max_quantity_per_user", "source_domain", "source_metadata", "scraping_method", "click_count", "conversion_count", "view_count", "created_at", "updated_at", "expires_at", "display_pages", "display_order", "gender", "content_type", "source") SELECT "id", "name", "description", "price", "original_price", "currency", "image_url", "affiliate_url", "original_url", "category", "subcategory", "rating", "review_count", "discount", "is_featured", "is_new", "has_timer", "timer_duration", "timer_start_time", "has_limited_offer", "limited_offer_text", "affiliate_network", "affiliate_network_id", "affiliate_tag_applied", "commission_rate", "telegram_message_id", "telegram_channel_id", "processing_status", "message_group_id", "product_sequence", "total_in_group", "deal_type", "deal_priority", "deal_start_time", "deal_end_time", "stock_quantity", "max_quantity_per_user", "source_domain", "source_metadata", "scraping_method", "click_count", "conversion_count", "view_count", "created_at", "updated_at", "expires_at", "display_pages", "display_order", "gender", "content_type", "source" FROM `deals_hub_products`;--> statement-breakpoint
DROP TABLE `deals_hub_products`;--> statement-breakpoint
ALTER TABLE `__new_deals_hub_products` RENAME TO `deals_hub_products`;--> statement-breakpoint
CREATE TABLE `__new_exchange_rates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`from_currency` text NOT NULL,
	`to_currency` text NOT NULL,
	`rate` numeric NOT NULL,
	`last_updated` integer DEFAULT '"2025-09-05T13:35:33.603Z"'
);
--> statement-breakpoint
INSERT INTO `__new_exchange_rates`("id", "from_currency", "to_currency", "rate", "last_updated") SELECT "id", "from_currency", "to_currency", "rate", "last_updated" FROM `exchange_rates`;--> statement-breakpoint
DROP TABLE `exchange_rates`;--> statement-breakpoint
ALTER TABLE `__new_exchange_rates` RENAME TO `exchange_rates`;--> statement-breakpoint
CREATE TABLE `__new_global_picks_products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`price` text,
	`original_price` text,
	`currency` text DEFAULT 'INR',
	`image_url` text,
	`affiliate_url` text NOT NULL,
	`original_url` text,
	`category` text,
	`subcategory` text,
	`rating` text,
	`review_count` text,
	`discount` text,
	`is_featured` integer DEFAULT false,
	`is_new` integer DEFAULT true,
	`has_timer` integer DEFAULT false,
	`timer_duration` integer,
	`timer_start_time` integer,
	`has_limited_offer` integer DEFAULT false,
	`limited_offer_text` text,
	`affiliate_network` text DEFAULT 'global-picks',
	`affiliate_network_id` integer,
	`affiliate_tag_applied` integer DEFAULT true,
	`commission_rate` real,
	`telegram_message_id` integer,
	`telegram_channel_id` text,
	`processing_status` text DEFAULT 'active',
	`message_group_id` text,
	`product_sequence` integer DEFAULT 1,
	`total_in_group` integer DEFAULT 1,
	`source_domain` text,
	`source_metadata` text,
	`scraping_method` text DEFAULT 'universal',
	`click_count` integer DEFAULT 0,
	`conversion_count` integer DEFAULT 0,
	`created_at` integer DEFAULT '"2025-09-05T13:35:33.604Z"',
	`updated_at` integer DEFAULT '"2025-09-05T13:35:33.604Z"',
	`expires_at` integer,
	`display_pages` text DEFAULT 'global-picks',
	`display_order` integer DEFAULT 0,
	`gender` text,
	`content_type` text DEFAULT 'product',
	`source` text DEFAULT 'telegram'
);
--> statement-breakpoint
INSERT INTO `__new_global_picks_products`("id", "name", "description", "price", "original_price", "currency", "image_url", "affiliate_url", "original_url", "category", "subcategory", "rating", "review_count", "discount", "is_featured", "is_new", "has_timer", "timer_duration", "timer_start_time", "has_limited_offer", "limited_offer_text", "affiliate_network", "affiliate_network_id", "affiliate_tag_applied", "commission_rate", "telegram_message_id", "telegram_channel_id", "processing_status", "message_group_id", "product_sequence", "total_in_group", "source_domain", "source_metadata", "scraping_method", "click_count", "conversion_count", "created_at", "updated_at", "expires_at", "display_pages", "display_order", "gender", "content_type", "source") SELECT "id", "name", "description", "price", "original_price", "currency", "image_url", "affiliate_url", "original_url", "category", "subcategory", "rating", "review_count", "discount", "is_featured", "is_new", "has_timer", "timer_duration", "timer_start_time", "has_limited_offer", "limited_offer_text", "affiliate_network", "affiliate_network_id", "affiliate_tag_applied", "commission_rate", "telegram_message_id", "telegram_channel_id", "processing_status", "message_group_id", "product_sequence", "total_in_group", "source_domain", "source_metadata", "scraping_method", "click_count", "conversion_count", "created_at", "updated_at", "expires_at", "display_pages", "display_order", "gender", "content_type", "source" FROM `global_picks_products`;--> statement-breakpoint
DROP TABLE `global_picks_products`;--> statement-breakpoint
ALTER TABLE `__new_global_picks_products` RENAME TO `global_picks_products`;--> statement-breakpoint
CREATE TABLE `__new_loot_box_products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`price` text,
	`original_price` text,
	`currency` text DEFAULT 'INR',
	`image_url` text,
	`affiliate_url` text NOT NULL,
	`original_url` text,
	`category` text,
	`subcategory` text,
	`rating` text,
	`review_count` text,
	`discount` text,
	`is_featured` integer DEFAULT false,
	`is_new` integer DEFAULT true,
	`has_timer` integer DEFAULT false,
	`timer_duration` integer,
	`timer_start_time` integer,
	`has_limited_offer` integer DEFAULT false,
	`limited_offer_text` text,
	`affiliate_network` text DEFAULT 'deodap',
	`affiliate_network_id` integer,
	`affiliate_tag_applied` integer DEFAULT true,
	`commission_rate` real,
	`telegram_message_id` integer,
	`telegram_channel_id` text,
	`processing_status` text DEFAULT 'active',
	`message_group_id` text,
	`product_sequence` integer DEFAULT 1,
	`total_in_group` integer DEFAULT 1,
	`product_type` text DEFAULT 'product',
	`deodap_category` text,
	`is_service` integer DEFAULT false,
	`is_digital` integer DEFAULT false,
	`is_course` integer DEFAULT false,
	`service_duration` text,
	`access_type` text,
	`deodap_product_id` text,
	`deodap_seller` text,
	`deodap_tags` text,
	`source_domain` text DEFAULT 'deodap.in',
	`source_metadata` text,
	`scraping_method` text DEFAULT 'telegram',
	`click_count` integer DEFAULT 0,
	`conversion_count` integer DEFAULT 0,
	`view_count` integer DEFAULT 0,
	`created_at` integer DEFAULT '"2025-09-05T13:35:33.604Z"',
	`updated_at` integer DEFAULT '"2025-09-05T13:35:33.604Z"',
	`expires_at` integer,
	`display_pages` text DEFAULT 'loot-box',
	`display_order` integer DEFAULT 0,
	`gender` text,
	`content_type` text DEFAULT 'product',
	`source` text DEFAULT 'telegram'
);
--> statement-breakpoint
INSERT INTO `__new_loot_box_products`("id", "name", "description", "price", "original_price", "currency", "image_url", "affiliate_url", "original_url", "category", "subcategory", "rating", "review_count", "discount", "is_featured", "is_new", "has_timer", "timer_duration", "timer_start_time", "has_limited_offer", "limited_offer_text", "affiliate_network", "affiliate_network_id", "affiliate_tag_applied", "commission_rate", "telegram_message_id", "telegram_channel_id", "processing_status", "message_group_id", "product_sequence", "total_in_group", "product_type", "deodap_category", "is_service", "is_digital", "is_course", "service_duration", "access_type", "deodap_product_id", "deodap_seller", "deodap_tags", "source_domain", "source_metadata", "scraping_method", "click_count", "conversion_count", "view_count", "created_at", "updated_at", "expires_at", "display_pages", "display_order", "gender", "content_type", "source") SELECT "id", "name", "description", "price", "original_price", "currency", "image_url", "affiliate_url", "original_url", "category", "subcategory", "rating", "review_count", "discount", "is_featured", "is_new", "has_timer", "timer_duration", "timer_start_time", "has_limited_offer", "limited_offer_text", "affiliate_network", "affiliate_network_id", "affiliate_tag_applied", "commission_rate", "telegram_message_id", "telegram_channel_id", "processing_status", "message_group_id", "product_sequence", "total_in_group", "product_type", "deodap_category", "is_service", "is_digital", "is_course", "service_duration", "access_type", "deodap_product_id", "deodap_seller", "deodap_tags", "source_domain", "source_metadata", "scraping_method", "click_count", "conversion_count", "view_count", "created_at", "updated_at", "expires_at", "display_pages", "display_order", "gender", "content_type", "source" FROM `loot_box_products`;--> statement-breakpoint
DROP TABLE `loot_box_products`;--> statement-breakpoint
ALTER TABLE `__new_loot_box_products` RENAME TO `loot_box_products`;--> statement-breakpoint
CREATE TABLE `__new_newsletter_subscribers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`subscribed_at` integer DEFAULT '"2025-09-05T13:35:33.598Z"'
);
--> statement-breakpoint
INSERT INTO `__new_newsletter_subscribers`("id", "email", "subscribed_at") SELECT "id", "email", "subscribed_at" FROM `newsletter_subscribers`;--> statement-breakpoint
DROP TABLE `newsletter_subscribers`;--> statement-breakpoint
ALTER TABLE `__new_newsletter_subscribers` RENAME TO `newsletter_subscribers`;--> statement-breakpoint
CREATE UNIQUE INDEX `newsletter_subscribers_email_unique` ON `newsletter_subscribers` (`email`);--> statement-breakpoint
CREATE TABLE `__new_products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`price` numeric NOT NULL,
	`original_price` numeric,
	`currency` text DEFAULT 'INR',
	`image_url` text NOT NULL,
	`affiliate_url` text NOT NULL,
	`affiliate_network_id` integer,
	`category` text NOT NULL,
	`subcategory` text,
	`gender` text,
	`rating` numeric NOT NULL,
	`review_count` integer NOT NULL,
	`discount` integer,
	`is_new` integer DEFAULT false,
	`is_featured` integer DEFAULT false,
	`is_service` integer DEFAULT false,
	`is_ai_app` integer DEFAULT false,
	`custom_fields` text,
	`pricing_type` text,
	`monthly_price` text,
	`yearly_price` text,
	`is_free` integer DEFAULT false,
	`price_description` text,
	`has_timer` integer DEFAULT false,
	`timer_duration` integer,
	`timer_start_time` integer,
	`source` text,
	`telegram_message_id` integer,
	`expires_at` integer,
	`affiliate_link` text,
	`created_at` integer DEFAULT '"2025-09-05T13:35:33.597Z"',
	`updated_at` integer DEFAULT '"2025-09-05T13:35:33.597Z"',
	`display_pages` text DEFAULT '["home"]',
	FOREIGN KEY (`affiliate_network_id`) REFERENCES `affiliate_networks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_products`("id", "name", "description", "price", "original_price", "currency", "image_url", "affiliate_url", "affiliate_network_id", "category", "subcategory", "gender", "rating", "review_count", "discount", "is_new", "is_featured", "is_service", "is_ai_app", "custom_fields", "pricing_type", "monthly_price", "yearly_price", "is_free", "price_description", "has_timer", "timer_duration", "timer_start_time", "source", "telegram_message_id", "expires_at", "affiliate_link", "created_at", "updated_at", "display_pages") SELECT "id", "name", "description", "price", "original_price", "currency", "image_url", "affiliate_url", "affiliate_network_id", "category", "subcategory", "gender", "rating", "review_count", "discount", "is_new", "is_featured", "is_service", "is_ai_app", "custom_fields", "pricing_type", "monthly_price", "yearly_price", "is_free", "price_description", "has_timer", "timer_duration", "timer_start_time", "source", "telegram_message_id", "expires_at", "affiliate_link", "created_at", "updated_at", "display_pages" FROM `products`;--> statement-breakpoint
DROP TABLE `products`;--> statement-breakpoint
ALTER TABLE `__new_products` RENAME TO `products`;--> statement-breakpoint
CREATE TABLE `__new_top_picks_products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`price` text,
	`original_price` text,
	`currency` text DEFAULT 'INR',
	`image_url` text,
	`affiliate_url` text NOT NULL,
	`original_url` text,
	`category` text,
	`subcategory` text,
	`rating` text,
	`review_count` text,
	`discount` text,
	`is_featured` integer DEFAULT false,
	`is_new` integer DEFAULT true,
	`has_timer` integer DEFAULT false,
	`timer_duration` integer,
	`timer_start_time` integer,
	`has_limited_offer` integer DEFAULT false,
	`limited_offer_text` text,
	`affiliate_network` text DEFAULT 'top-picks',
	`affiliate_network_id` integer,
	`affiliate_tag_applied` integer DEFAULT true,
	`commission_rate` real,
	`telegram_message_id` integer,
	`telegram_channel_id` text,
	`processing_status` text DEFAULT 'active',
	`message_group_id` text,
	`product_sequence` integer DEFAULT 1,
	`total_in_group` integer DEFAULT 1,
	`is_viral` integer DEFAULT false,
	`is_trending` integer DEFAULT false,
	`is_limited_deal` integer DEFAULT false,
	`is_new_offer` integer DEFAULT false,
	`trend_score` real DEFAULT 0,
	`viral_score` real DEFAULT 0,
	`popularity_rank` integer DEFAULT 0,
	`view_velocity` real DEFAULT 0,
	`click_velocity` real DEFAULT 0,
	`share_count` integer DEFAULT 0,
	`wishlist_count` integer DEFAULT 0,
	`conversion_velocity` real DEFAULT 0,
	`trending_start_time` integer,
	`trending_duration` integer,
	`peak_performance_time` integer,
	`deal_urgency_level` text DEFAULT 'normal',
	`stock_level` text,
	`deal_expires_at` integer,
	`flash_sale` integer DEFAULT false,
	`recent_purchases` integer DEFAULT 0,
	`social_mentions` integer DEFAULT 0,
	`influencer_endorsed` integer DEFAULT false,
	`quality_score` real DEFAULT 0,
	`user_satisfaction` real DEFAULT 0,
	`return_rate` real DEFAULT 0,
	`source_domain` text,
	`source_page` text,
	`source_metadata` text,
	`scraping_method` text DEFAULT 'telegram',
	`click_count` integer DEFAULT 0,
	`conversion_count` integer DEFAULT 0,
	`view_count` integer DEFAULT 0,
	`share_count_total` integer DEFAULT 0,
	`created_at` integer DEFAULT '"2025-09-05T13:35:33.603Z"',
	`updated_at` integer DEFAULT '"2025-09-05T13:35:33.603Z"',
	`expires_at` integer,
	`last_trending_check` integer,
	`display_pages` text DEFAULT 'top-picks',
	`display_order` integer DEFAULT 0,
	`priority_level` integer DEFAULT 1,
	`gender` text,
	`content_type` text DEFAULT 'product',
	`source` text DEFAULT 'telegram',
	`is_service` integer DEFAULT false,
	`is_ai_app` integer DEFAULT false,
	`app_type` text,
	`platform` text
);
--> statement-breakpoint
INSERT INTO `__new_top_picks_products`("id", "name", "description", "price", "original_price", "currency", "image_url", "affiliate_url", "original_url", "category", "subcategory", "rating", "review_count", "discount", "is_featured", "is_new", "has_timer", "timer_duration", "timer_start_time", "has_limited_offer", "limited_offer_text", "affiliate_network", "affiliate_network_id", "affiliate_tag_applied", "commission_rate", "telegram_message_id", "telegram_channel_id", "processing_status", "message_group_id", "product_sequence", "total_in_group", "is_viral", "is_trending", "is_limited_deal", "is_new_offer", "trend_score", "viral_score", "popularity_rank", "view_velocity", "click_velocity", "share_count", "wishlist_count", "conversion_velocity", "trending_start_time", "trending_duration", "peak_performance_time", "deal_urgency_level", "stock_level", "deal_expires_at", "flash_sale", "recent_purchases", "social_mentions", "influencer_endorsed", "quality_score", "user_satisfaction", "return_rate", "source_domain", "source_page", "source_metadata", "scraping_method", "click_count", "conversion_count", "view_count", "share_count_total", "created_at", "updated_at", "expires_at", "last_trending_check", "display_pages", "display_order", "priority_level", "gender", "content_type", "source", "is_service", "is_ai_app", "app_type", "platform") SELECT "id", "name", "description", "price", "original_price", "currency", "image_url", "affiliate_url", "original_url", "category", "subcategory", "rating", "review_count", "discount", "is_featured", "is_new", "has_timer", "timer_duration", "timer_start_time", "has_limited_offer", "limited_offer_text", "affiliate_network", "affiliate_network_id", "affiliate_tag_applied", "commission_rate", "telegram_message_id", "telegram_channel_id", "processing_status", "message_group_id", "product_sequence", "total_in_group", "is_viral", "is_trending", "is_limited_deal", "is_new_offer", "trend_score", "viral_score", "popularity_rank", "view_velocity", "click_velocity", "share_count", "wishlist_count", "conversion_velocity", "trending_start_time", "trending_duration", "peak_performance_time", "deal_urgency_level", "stock_level", "deal_expires_at", "flash_sale", "recent_purchases", "social_mentions", "influencer_endorsed", "quality_score", "user_satisfaction", "return_rate", "source_domain", "source_page", "source_metadata", "scraping_method", "click_count", "conversion_count", "view_count", "share_count_total", "created_at", "updated_at", "expires_at", "last_trending_check", "display_pages", "display_order", "priority_level", "gender", "content_type", "source", "is_service", "is_ai_app", "app_type", "platform" FROM `top_picks_products`;--> statement-breakpoint
DROP TABLE `top_picks_products`;--> statement-breakpoint
ALTER TABLE `__new_top_picks_products` RENAME TO `top_picks_products`;--> statement-breakpoint
CREATE TABLE `__new_video_content` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`video_url` text NOT NULL,
	`thumbnail_url` text,
	`platform` text NOT NULL,
	`category` text NOT NULL,
	`tags` text,
	`duration` text,
	`has_timer` integer DEFAULT false,
	`timer_duration` integer,
	`timer_start_time` integer,
	`pages` text DEFAULT '[]',
	`show_on_homepage` integer DEFAULT true,
	`cta_text` text,
	`cta_url` text,
	`created_at` integer DEFAULT '"2025-09-05T13:35:33.598Z"'
);
--> statement-breakpoint
INSERT INTO `__new_video_content`("id", "title", "description", "video_url", "thumbnail_url", "platform", "category", "tags", "duration", "has_timer", "timer_duration", "timer_start_time", "pages", "show_on_homepage", "cta_text", "cta_url", "created_at") SELECT "id", "title", "description", "video_url", "thumbnail_url", "platform", "category", "tags", "duration", "has_timer", "timer_duration", "timer_start_time", "pages", "show_on_homepage", "cta_text", "cta_url", "created_at" FROM `video_content`;--> statement-breakpoint
DROP TABLE `video_content`;--> statement-breakpoint
ALTER TABLE `__new_video_content` RENAME TO `video_content`;