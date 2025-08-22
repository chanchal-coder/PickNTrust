-- Complete schema fix for PM2 logs issue
-- This script adds both missing columns and the new custom name field

-- Check current table structure
PRAGMA table_info(products);

-- Add missing affiliate_network_id column if not exists
ALTER TABLE products ADD COLUMN affiliate_network_id INTEGER REFERENCES affiliate_networks(id);

-- Add new affiliate_network_name column for custom names when not using dropdown
ALTER TABLE products ADD COLUMN affiliate_network_name TEXT;

-- Verify the changes
PRAGMA table_info(products);

-- Optional: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_products_affiliate_network_id ON products(affiliate_network_id);
