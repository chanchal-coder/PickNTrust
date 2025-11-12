#!/usr/bin/env bash
set -euo pipefail

DB_DEFAULT="/home/ec2-user/pickntrust/database.sqlite"
DB=""

for p in \
  "/home/ec2-user/pickntrust/database.sqlite" \
  "/home/ec2-user/pickntrust/dist/database.sqlite"; do
  if [ -f "$p" ]; then DB="$p"; break; fi
done

if [ -z "${DB:-}" ]; then
  DB="$DB_DEFAULT"
fi

echo "Using DB: $DB"

if ! command -v sqlite3 >/dev/null 2>&1; then
  echo "sqlite3 is not installed on remote." >&2
  exit 1
fi

COLS=$(sqlite3 "$DB" "PRAGMA table_info(categories);" | awk -F'|' '{print $2}')

if ! printf "%s\n" "$COLS" | grep -Fx "is_active" >/dev/null 2>&1; then
  sqlite3 "$DB" "ALTER TABLE categories ADD COLUMN is_active INTEGER DEFAULT 1;"
fi
sqlite3 "$DB" "UPDATE categories SET is_active = COALESCE(is_active, 1);"

if ! printf "%s\n" "$COLS" | grep -Fx "is_for_ai_apps" >/dev/null 2>&1; then
  sqlite3 "$DB" "ALTER TABLE categories ADD COLUMN is_for_ai_apps INTEGER DEFAULT 0;"
fi
sqlite3 "$DB" "UPDATE categories SET is_for_ai_apps = COALESCE(is_for_ai_apps, 0);"

COUNT=$(sqlite3 "$DB" "SELECT COUNT(*) FROM categories;")
if [ "$COUNT" -eq 0 ]; then
  sqlite3 "$DB" <<'EOF'
INSERT INTO categories (name, parent_id, slug, description, is_for_products, is_for_services, is_for_ai_apps, display_order, icon, color, created_at, updated_at)
VALUES 
('Apps & AI Apps', NULL, 'apps', '', 0, 0, 1, 1, 'mdi-tag', '#888888', strftime('%s','now'), strftime('%s','now')),
('Services', NULL, 'services', '', 0, 1, 0, 1, 'mdi-tag', '#888888', strftime('%s','now'), strftime('%s','now')),
('Fashion', NULL, 'fashion', 'Trendy clothing and footwear for every style and occasion.', 1, 0, 0, 1, 'fas fa-tshirt', '#10B981', strftime('%s','now'), strftime('%s','now')),
('AI Tools', NULL, 'ai-tools', '', 0, 0, 1, 1, 'fas fa-microchip', '#0ea5e9', strftime('%s','now'), strftime('%s','now'));
EOF
fi

echo "Categories count: $(sqlite3 \"$DB\" \"SELECT COUNT(*) FROM categories;\")"
echo "Products count: $(sqlite3 \"$DB\" \"SELECT COUNT(*) FROM unified_content WHERE content_type='product' AND is_active=1;\")"
echo "Services count: $(sqlite3 \"$DB\" \"SELECT COUNT(*) FROM unified_content WHERE content_type='service' AND is_active=1;\")"
echo "Apps & AI count: $(sqlite3 \"$DB\" \"SELECT COUNT(*) FROM unified_content WHERE content_type IN ('app','aiapp') AND is_active=1;\")"