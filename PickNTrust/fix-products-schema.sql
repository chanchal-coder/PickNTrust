-- Check current table structure
PRAGMA table_info(products);

-- Add the missing affiliate_network_id column
ALTER TABLE products ADD COLUMN affiliate_network_id INTEGER REFERENCES affiliate_networks(id);

-- Verify the change
PRAGMA table_info(products);
