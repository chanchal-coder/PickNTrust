-- Final cleanup for remaining bot-related tables
-- Drop remaining bot-related tables
DROP TABLE IF EXISTS bot_affiliate_tags;
DROP TABLE IF EXISTS prime_picks_products;

-- Clean up any remaining bot-related data from channel_posts table if it exists
DELETE FROM channel_posts WHERE 1=1;

-- Clean up any remaining telegram-sourced data from products table
DELETE FROM products WHERE source = 'telegram';
DELETE FROM products WHERE scraping_method = 'telegram';

-- Clean up any remaining telegram data from unified_content table
DELETE FROM unified_content WHERE source_type = 'telegram';

-- Clean up any remaining telegram widgets
DELETE FROM widgets WHERE source = 'telegram';