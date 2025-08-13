#!/bin/bash

echo "🔧 Fixing PM2 logs issue and adding custom affiliate network support..."
echo "Adding missing columns to products table..."

# Run the complete SQL fix
sqlite3 sqlite.db << EOF
-- Add missing affiliate_network_id column
ALTER TABLE products ADD COLUMN affiliate_network_id INTEGER REFERENCES affiliate_networks(id);

-- Add new affiliate_network_name column for custom names
ALTER TABLE products ADD COLUMN affiliate_network_name TEXT;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_products_affiliate_network_id ON products(affiliate_network_id);
EOF

echo "✅ Database schema updated successfully!"
echo "✅ Added support for custom affiliate network names!"
echo "🔄 Restarting PM2 process..."

# Restart the PM2 process
pm2 restart pickntru

echo "✅ PM2 process restarted!"
echo "📊 Checking PM2 logs..."
pm2 logs pickntru --lines 50
