#!/bin/bash
set -e
DB="/home/ec2-user/PickNTrust/database.sqlite"
echo "DB: $DB"

if [ ! -f "$DB" ]; then
  echo "Database not found at $DB" >&2
  exit 1
fi

sqlite3 "$DB" "PRAGMA foreign_keys=ON;"

# Reset flags for all top-level categories
sqlite3 "$DB" "UPDATE categories SET is_for_products=0 WHERE parent_id IS NULL;"
sqlite3 "$DB" "UPDATE categories SET is_for_services=0 WHERE parent_id IS NULL;"
sqlite3 "$DB" "UPDATE categories SET is_for_ai_apps=0 WHERE parent_id IS NULL;"

ensure() {
  local name="$1"; local p=$2; local s=$3; local a=$4; local ord=$5
  # Insert if missing
  sqlite3 "$DB" "INSERT OR IGNORE INTO categories (name, icon, color, description, parent_id, display_order, is_for_products, is_for_services, is_for_ai_apps, is_active) VALUES ('${name}','mdi-tag','#888888','',NULL,${ord},${p},${s},${a},1);"
  # Update flags/order
  sqlite3 "$DB" "UPDATE categories SET display_order=${ord}, is_for_products=${p}, is_for_services=${s}, is_for_ai_apps=${a}, is_active=1 WHERE LOWER(name)=LOWER('${name}') AND parent_id IS NULL;"
}

# Products (13)
ensure 'Fashion' 1 0 0 1
ensure 'Accessories' 1 0 0 2
ensure 'Home & Living' 1 0 0 3
ensure 'Electronics & Gadgets' 1 0 0 4
ensure 'Health' 1 0 0 5
ensure 'Beauty' 1 0 0 6
ensure 'Sports & Fitness' 1 0 0 7
ensure 'Baby & Kids' 1 0 0 8
ensure 'Automotive' 1 0 0 9
ensure 'Books & Education' 1 0 0 10
ensure 'Pet Supplies' 1 0 0 11
ensure 'Office & Productivity' 1 0 0 12
ensure 'Travel' 1 0 0 13

# Services (19)
ensure 'Services' 0 1 0 1
ensure 'Digital Services' 0 1 0 2
ensure 'Financial Services' 0 1 0 3
ensure 'Marketing Services' 0 1 0 4
ensure 'Education Services' 0 1 0 5
ensure 'Home Services' 0 1 0 6
ensure 'Health & Wellness Services' 0 1 0 7
ensure 'Travel Services' 0 1 0 8
ensure 'Automotive Services' 0 1 0 9
ensure 'Technology Services' 0 1 0 10
ensure 'Business Services' 0 1 0 11
ensure 'Legal Services' 0 1 0 12
ensure 'Real Estate Services' 0 1 0 13
ensure 'Creative & Design Services' 0 1 0 14
ensure 'Repair & Maintenance Services' 0 1 0 15
ensure 'Logistics & Delivery Services' 0 1 0 16
ensure 'Consulting Services' 0 1 0 17
ensure 'Entertainment Services' 0 1 0 18
ensure 'Event Services' 0 1 0 19

# Apps & AI Apps (16)
ensure 'Apps & AI Apps' 0 0 1 1
ensure 'AI Tools' 0 0 1 2
ensure 'AI Writing Tools' 0 0 1 3
ensure 'AI Image Tools' 0 0 1 4
ensure 'AI Assistants' 0 0 1 5
ensure 'Productivity Apps' 0 0 1 6
ensure 'Design Apps' 0 0 1 7
ensure 'Developer Tools' 0 0 1 8
ensure 'Business Analytics Apps' 0 0 1 9
ensure 'Education Apps' 0 0 1 10
ensure 'Finance Apps' 0 0 1 11
ensure 'Health & Fitness Apps' 0 0 1 12
ensure 'Marketing Automation' 0 0 1 13
ensure 'Social Media Tools' 0 0 1 14
ensure 'Entertainment Apps' 0 0 1 15
ensure 'Utilities' 0 0 1 16

echo "Counts (DB)"
sqlite3 "$DB" "SELECT 'products', COUNT(*) FROM categories WHERE is_for_products=1 AND parent_id IS NULL;"
sqlite3 "$DB" "SELECT 'services', COUNT(*) FROM categories WHERE is_for_services=1 AND parent_id IS NULL;"
sqlite3 "$DB" "SELECT 'aiapps', COUNT(*) FROM categories WHERE is_for_ai_apps=1 AND parent_id IS NULL;"
