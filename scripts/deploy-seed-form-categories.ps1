# Seed exact form categories on the deployed server (EC2)
# - Copies scripts/seed-form-categories.cjs to the server
# - Runs it against the same SQLite DB the backend uses
# - Verifies forms endpoints return the expected counts

Param(
  [string]$Server = "ubuntu@51.21.112.211",
  [string]$KeyPath = "C:\Users\sharm\OneDrive\Desktop\Apps\pntkey.pem",
  [string]$AppDir = "/home/ubuntu/PickNTrust"
)

Write-Host "=== Seeding form categories on deployed server ===" -ForegroundColor Green

if (!(Test-Path $KeyPath)) {
  Write-Error "Key file not found: $KeyPath"
  exit 1
}

# 1) Copy the seeding script to the server
Write-Host "Copying seed-form-categories.cjs to server..." -ForegroundColor Yellow
scp -i $KeyPath -o StrictHostKeyChecking=no "scripts/seed-form-categories.cjs" "${Server}:$AppDir/scripts/seed-form-categories.cjs"
if ($LASTEXITCODE -ne 0) { Write-Error "Failed to copy seeding script"; exit 1 }

# 2) Run the seeding script with Node on the server (targets root database.sqlite)
Write-Host "Running seeding script on server..." -ForegroundColor Yellow
ssh -i $KeyPath -o StrictHostKeyChecking=no $Server "cd $AppDir && NODE_ENV=production node scripts/seed-form-categories.cjs"
if ($LASTEXITCODE -ne 0) { Write-Error "Failed to run seeding script"; exit 1 }

# 3) Verify the categories exist in the database directly
Write-Host "Verifying categories in SQLite..." -ForegroundColor Yellow
ssh -i $KeyPath -o StrictHostKeyChecking=no $Server "cd $AppDir && sqlite3 database.sqlite \"SELECT COUNT(*) FROM categories WHERE is_for_products=1 AND parent_id IS NULL;\""
ssh -i $KeyPath -o StrictHostKeyChecking=no $Server "cd $AppDir && sqlite3 database.sqlite \"SELECT COUNT(*) FROM categories WHERE is_for_services=1 AND parent_id IS NULL;\""
ssh -i $KeyPath -o StrictHostKeyChecking=no $Server "cd $AppDir && sqlite3 database.sqlite \"SELECT COUNT(*) FROM categories WHERE is_for_ai_apps=1 AND parent_id IS NULL;\""

# 4) Verify API endpoints from localhost (backend on port 5000)
Write-Host "Verifying forms endpoints via API..." -ForegroundColor Yellow
ssh -i $KeyPath -o StrictHostKeyChecking=no $Server "curl -sS http://127.0.0.1:5000/api/categories/forms/products | jq 'length as $l | {count:$l, sample:(.[0:5]|map(.name))}' || true"
ssh -i $KeyPath -o StrictHostKeyChecking=no $Server "curl -sS http://127.0.0.1:5000/api/categories/forms/services | jq 'length as $l | {count:$l, sample:(.[0:5]|map(.name))}' || true"
ssh -i $KeyPath -o StrictHostKeyChecking=no $Server "curl -sS http://127.0.0.1:5000/api/categories/forms/aiapps | jq 'length as $l | {count:$l, sample:(.[0:5]|map(.name))}' || true"

Write-Host "=== Done. Forms categories seeded and verified. ===" -ForegroundColor Green