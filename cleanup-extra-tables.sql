-- Cleanup script to remove unnecessary product tables
-- The system is designed to use a single 'products' table with displayPages field

-- Drop the extra product tables that were created by mistake
DROP TABLE IF EXISTS prime_picks_products;
DROP TABLE IF EXISTS cue_picks_products;
DROP TABLE IF EXISTS amazon_products;
DROP TABLE IF EXISTS value_picks_products;
DROP TABLE IF EXISTS click_picks_products;
DROP TABLE IF EXISTS global_picks_products;
DROP TABLE IF EXISTS deals_hub_products;
DROP TABLE IF EXISTS loot_box_products;

-- Keep the main products table and other legitimate tables
-- products table should remain
-- CUELINKS_PRODUCTS and DEALSHUB_PRODUCTS can remain as they might be used by external integrations

SELECT 'Cleanup completed. Only main products table should remain for bot posting.' as status;