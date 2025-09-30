-- PERMANENT DELETION OF PAGE-SPECIFIC TABLES
-- This will remove all confusion and force everything to use unified_content table

-- Drop all page-specific product tables
DROP TABLE IF EXISTS amazon_products;
DROP TABLE IF EXISTS prime_picks_products;
DROP TABLE IF EXISTS cue_picks_products;
DROP TABLE IF EXISTS click_picks_products;
DROP TABLE IF EXISTS value_picks_products;
DROP TABLE IF EXISTS global_picks_products;
DROP TABLE IF EXISTS deals_hub_products;
DROP TABLE IF EXISTS loot_box_products;
DROP TABLE IF EXISTS travel_products;
DROP TABLE IF EXISTS cuelinks_products;

-- Verify tables are deleted
SELECT 'All page-specific tables have been permanently deleted' as status;
SELECT 'Only unified_content table should remain for all products' as note;

-- Show remaining tables
SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%product%';