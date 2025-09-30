Param()

# Fix deployed categories schema and test API endpoints
$SERVER = "ubuntu@51.21.112.211"
$KEY_PATH = "C:\Users\sharm\OneDrive\Desktop\Apps\pntkey.pem"

Write-Host "=== FIXING DEPLOYED CATEGORIES SCHEMA ===" -ForegroundColor Green

$remoteScript = @'
#!/bin/bash
set -e

DB="/home/ubuntu/database.sqlite"
echo "DB file: $DB"

if [ ! -f "$DB" ]; then
  echo "Database file NOT FOUND at $DB"
  exit 1
fi

echo "Columns BEFORE:"
sqlite3 "$DB" "PRAGMA table_info(categories);"

add_col() {
  local name="$1"
  local def="$2"
  local exists
  exists=$(sqlite3 "$DB" "SELECT name FROM pragma_table_info('categories') WHERE name='$name';")
  if [ -z "$exists" ]; then
    echo "Adding column $name"
    sqlite3 "$DB" "ALTER TABLE categories ADD COLUMN $def;"
  else
    echo "Column $name already exists"
  fi
}

add_col parent_id "parent_id INTEGER"
add_col display_order "display_order INTEGER DEFAULT 0"
add_col icon "icon TEXT DEFAULT 'fas fa-tag'"
add_col color "color TEXT DEFAULT '#3b82f6'"
add_col description "description TEXT DEFAULT ''"
add_col is_for_products "is_for_products INTEGER DEFAULT 1"
add_col is_for_services "is_for_services INTEGER DEFAULT 0"
add_col is_for_ai_apps "is_for_ai_apps INTEGER DEFAULT 0"
add_col is_service "is_service INTEGER DEFAULT 0"
add_col is_ai_app "is_ai_app INTEGER DEFAULT 0"

echo "Columns AFTER:"
sqlite3 "$DB" "PRAGMA table_info(categories);"

echo "Unified content columns:"
sqlite3 "$DB" "PRAGMA table_info(unified_content);"

# Ensure required unified_content columns exist
add_uc_col() {
  local name="$1"
  local def="$2"
  local exists
  exists=$(sqlite3 "$DB" "SELECT name FROM pragma_table_info('unified_content') WHERE name='$name';")
  if [ -z "$exists" ]; then
    echo "Adding unified_content column $name"
    sqlite3 "$DB" "ALTER TABLE unified_content ADD COLUMN $def;"
  else
    echo "Unified_content column $name already exists"
  fi
}

add_uc_col processing_status "processing_status TEXT"
add_uc_col visibility "visibility TEXT"
add_uc_col is_ai_app "is_ai_app INTEGER DEFAULT 0"

echo "Updating unified_content defaults for status/visibility..."
sqlite3 "$DB" "UPDATE unified_content SET processing_status='completed' WHERE processing_status IS NULL AND status IN ('active','published');"
sqlite3 "$DB" "UPDATE unified_content SET visibility='public' WHERE visibility IS NULL AND status IN ('active','published');"

echo "Seeding categories from unified_content (if missing)..."
sqlite3 "$DB" "INSERT INTO categories(name, icon, color, description, display_order, is_for_products, is_for_services, is_for_ai_apps)
SELECT 
  uc.category,
  'fas fa-tag',
  '#3b82f6',
  '',
  0,
  CASE WHEN SUM(CASE WHEN uc.is_service = 1 THEN 1 ELSE 0 END) = 0 AND SUM(CASE WHEN uc.is_ai_app = 1 THEN 1 ELSE 0 END) = 0 THEN 1 ELSE 0 END,
  CASE WHEN SUM(CASE WHEN uc.is_service = 1 THEN 1 ELSE 0 END) > 0 THEN 1 ELSE 0 END,
  CASE WHEN SUM(CASE WHEN uc.is_ai_app = 1 THEN 1 ELSE 0 END) > 0 THEN 1 ELSE 0 END
FROM unified_content uc
WHERE uc.category IS NOT NULL AND uc.category != ''
AND NOT EXISTS (SELECT 1 FROM categories c WHERE c.name = uc.category)
GROUP BY uc.category;"

COUNT=$(sqlite3 "$DB" "SELECT COUNT(*) FROM categories;")
echo "Categories row count: $COUNT"
if [ "$COUNT" = "0" ]; then
  echo "Seeding baseline categories..."
  sqlite3 "$DB" "INSERT INTO categories (name, icon, color, description, display_order, is_for_products, is_for_services, is_for_ai_apps, is_service, is_ai_app) VALUES ('Electronics & Gadgets','fas fa-laptop','#6366F1','Latest technology and smart devices',10,1,0,0,0,0);"
  sqlite3 "$DB" "INSERT INTO categories (name, icon, color, description, display_order, is_for_products, is_for_services, is_for_ai_apps, is_service, is_ai_app) VALUES ('Fashion & Clothing','fas fa-tshirt','#EC4899','Trendy clothing and accessories',20,1,0,0,0,0);"
  sqlite3 "$DB" "INSERT INTO categories (name, icon, color, description, display_order, is_for_products, is_for_services, is_for_ai_apps, is_service, is_ai_app) VALUES ('Home & Living','fas fa-home','#10B981','Home decor and living essentials',30,1,0,0,0,0);"
  sqlite3 "$DB" "INSERT INTO categories (name, icon, color, description, display_order, is_for_products, is_for_services, is_for_ai_apps, is_service, is_ai_app) VALUES ('Services','fas fa-briefcase','#059669','Professional services and solutions',100,0,1,0,1,0);"
  sqlite3 "$DB" "INSERT INTO categories (name, icon, color, description, display_order, is_for_products, is_for_services, is_for_ai_apps, is_service, is_ai_app) VALUES ('AI & Apps','fas fa-rocket','#7C3AED','AI applications and software tools',101,0,0,1,0,1);"
fi

echo "Testing /api/categories/browse?type=all"
curl -sS "http://localhost:5000/api/categories/browse?type=all" || true
echo

echo "Testing /api/categories/products"
curl -sS "http://localhost:5000/api/categories/products" || true
echo

echo "Testing /api/categories/services"
curl -sS "http://localhost:5000/api/categories/services" || true
echo

echo "Testing /api/categories/aiapps"
curl -sS "http://localhost:5000/api/categories/aiapps" || true
echo

echo "PM2 log files:"
ls -la ~/.pm2/logs || true
echo "=== pm2 errors (last 200 lines) ==="
tail -n 200 ~/.pm2/logs/pickntrust-backend-error.log || true
echo "=== pm2 output (last 200 lines) ==="
tail -n 200 ~/.pm2/logs/pickntrust-backend-out.log || true
echo "=== pm2 logs (fallback, last 200) ==="
pm2 logs pickntrust-backend --lines 200 --nostream || true
'@

# Write the remote script locally
$remotePath = "/tmp/fix-deployed-categories.sh"
$localTemp = "temp-fix-deployed-categories.sh"
$remoteScript | Out-File -FilePath $localTemp -Encoding UTF8

try {
  Write-Host "Copying fix script to server..." -ForegroundColor Yellow
  scp -i "$KEY_PATH" -o StrictHostKeyChecking=no $localTemp "${SERVER}:$remotePath"

  Write-Host "Executing fix script on server..." -ForegroundColor Yellow
  ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no $SERVER "sed -i 's/\r$//' $remotePath && bash $remotePath"
}
finally {
  Remove-Item $localTemp -Force -ErrorAction SilentlyContinue
}

Write-Host "=== Fix script completed ===" -ForegroundColor Green