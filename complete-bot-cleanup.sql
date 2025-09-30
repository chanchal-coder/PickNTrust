-- COMPLETE BOT CLEANUP - Delete ALL bot tables and configurations
-- This will remove all 8 old bots and keep only the master bot system

-- Drop all bot-specific product tables
DROP TABLE IF EXISTS amazon_products;
DROP TABLE IF EXISTS cuelinks_products;
DROP TABLE IF EXISTS click_picks_products;
DROP TABLE IF EXISTS global_picks_products;
DROP TABLE IF EXISTS value_picks_products;
DROP TABLE IF EXISTS loot_box_products;
DROP TABLE IF EXISTS deals_hub_products;
DROP TABLE IF EXISTS travel_products;
DROP TABLE IF EXISTS top_picks_products;
DROP TABLE IF EXISTS prime_picks_products;
DROP TABLE IF EXISTS cue_picks_products;
DROP TABLE IF EXISTS lootbox_products;
DROP TABLE IF EXISTS dealshub_products;

-- Drop all bot configuration and tracking tables
DROP TABLE IF EXISTS telegram_channels;
DROP TABLE IF EXISTS bot_transformations;
DROP TABLE IF EXISTS bot_logs;
DROP TABLE IF EXISTS bot_stats;
DROP TABLE IF EXISTS channel_posts;
DROP TABLE IF EXISTS affiliate_conversions;
DROP TABLE IF EXISTS bot_configs;
DROP TABLE IF EXISTS channel_configs;

-- Clean up any remaining bot-related data from main tables
DELETE FROM products WHERE source = 'telegram' OR source LIKE '%bot%';
DELETE FROM categories WHERE name LIKE '%bot%' OR description LIKE '%telegram%';
DELETE FROM affiliate_networks WHERE name LIKE '%bot%' OR slug LIKE '%bot%';
DELETE FROM banners WHERE page LIKE '%bot%';
DELETE FROM widgets WHERE name LIKE '%bot%' OR name LIKE '%telegram%';
DELETE FROM blog_posts WHERE title LIKE '%bot%' OR content LIKE '%telegram%';
DELETE FROM announcements WHERE message LIKE '%bot%' OR message LIKE '%telegram%';
DELETE FROM video_content WHERE title LIKE '%bot%' OR description LIKE '%telegram%';
DELETE FROM canva_posts WHERE title LIKE '%bot%' OR description LIKE '%telegram%';
DELETE FROM featured_products WHERE source = 'telegram' OR source LIKE '%bot%';

-- Clean up any affiliate analytics related to bots
DELETE FROM affiliate_analytics WHERE source LIKE '%bot%' OR source LIKE '%telegram%';

-- Remove any commission tracking for bot networks
DELETE FROM commission_tracking WHERE network LIKE '%bot%' OR network LIKE '%telegram%';

-- Clean up any URL validations for bot URLs
DELETE FROM url_validations WHERE url LIKE '%telegram%' OR source LIKE '%bot%';

-- Vacuum to reclaim space
VACUUM;

-- Verify cleanup
SELECT 'Cleanup completed. Remaining tables:' as status;
SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;