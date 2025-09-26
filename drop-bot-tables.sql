-- Drop all bot-related tables from the database
-- This script removes all Telegram bot tables and related data

-- Drop bot-specific product tables
DROP TABLE IF EXISTS prime_picks_products;
DROP TABLE IF EXISTS cue_picks_products;
DROP TABLE IF EXISTS value_picks_products;
DROP TABLE IF EXISTS click_picks_products;
DROP TABLE IF EXISTS loot_box_products;
DROP TABLE IF EXISTS top_picks_products;
DROP TABLE IF EXISTS apps_products;
DROP TABLE IF EXISTS deals_hub_products;
DROP TABLE IF EXISTS amazon_products;
DROP TABLE IF EXISTS global_picks_products;

-- Drop channel and telegram-related tables
DROP TABLE IF EXISTS channel_posts;
DROP TABLE IF EXISTS affiliate_conversions;

-- Drop any remaining bot configuration tables
DROP TABLE IF EXISTS channel_configs;
DROP TABLE IF EXISTS bot_configs;
DROP TABLE IF EXISTS telegram_channels;

-- Clean up any products with telegram source from main products table
DELETE FROM products WHERE source = 'telegram' OR source LIKE '%telegram%';

-- Clean up any unified content with telegram source
DELETE FROM unified_content WHERE source_type = 'telegram';

-- Remove any widgets related to bots
DELETE FROM widgets WHERE name LIKE '%bot%' OR name LIKE '%telegram%' OR name LIKE '%channel%';

-- Clean up any blog posts about bots
DELETE FROM blog_posts WHERE title LIKE '%bot%' OR title LIKE '%telegram%' OR content LIKE '%telegram%';

-- Remove any categories specific to bot products
DELETE FROM categories WHERE name LIKE '%bot%' OR name LIKE '%telegram%';

-- Clean up any affiliate networks that were bot-specific
DELETE FROM affiliate_networks WHERE name LIKE '%bot%' OR name LIKE '%telegram%' OR slug LIKE '%bot%';

-- Remove any announcements related to bots
DELETE FROM announcements WHERE message LIKE '%bot%' OR message LIKE '%telegram%';

-- Clean up any video content related to bots
DELETE FROM video_content WHERE title LIKE '%bot%' OR description LIKE '%telegram%';

-- Remove any Canva posts related to bots
DELETE FROM canva_posts WHERE title LIKE '%bot%' OR description LIKE '%telegram%';

-- Clean up any featured products that came from telegram
DELETE FROM featured_products WHERE source = 'telegram' OR source LIKE '%telegram%';

VACUUM;