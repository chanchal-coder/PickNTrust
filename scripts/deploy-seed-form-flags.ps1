Param(
  [Parameter(Mandatory=$true)][string]$Server,
  [Parameter(Mandatory=$true)][string]$KeyPath,
  [string]$DbPath = "/home/ec2-user/pickntrust/database.sqlite",
  [string]$ApiBase = "https://www.pickntrust.com"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Write-Host "Seeding canonical form category flags on $Server" -ForegroundColor Green

$LocalSql = Join-Path $PSScriptRoot 'seed-form-flags.sql'
if (-not (Test-Path $LocalSql)) { throw "Missing SQL file: $LocalSql" }

# Copy SQL to remote tmp path
Write-Host "Copying SQL to remote /tmp/seed-form-flags.sql..." -ForegroundColor Yellow
scp -i $KeyPath -o StrictHostKeyChecking=no $LocalSql "$Server:/tmp/seed-form-flags.sql"

# Apply SQL to remote SQLite database
Write-Host "Applying SQL to remote DB: $DbPath" -ForegroundColor Yellow
$remoteApply = @'
set -e
DB_PATH="$1"
if [ ! -f "$DB_PATH" ]; then
  echo "ERROR: DB not found at $DB_PATH" >&2
  exit 1
fi
if ! command -v sqlite3 >/dev/null 2>&1; then
  echo "ERROR: sqlite3 not installed" >&2
  exit 1
fi
sqlite3 "$DB_PATH" < /tmp/seed-form-flags.sql
echo "Applied seed-form-flags.sql"
echo "Counts (products, services, ai apps):"
sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM categories WHERE is_for_products=1 AND parent_id IS NULL;"
sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM categories WHERE is_for_services=1 AND parent_id IS NULL;"
sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM categories WHERE is_for_ai_apps=1 AND parent_id IS NULL;"
'@

ssh -i $KeyPath -o StrictHostKeyChecking=no $Server "bash -lc '$remoteApply' -- $DbPath"

# Verify public API counts
Write-Host "Verifying public API counts at $ApiBase..." -ForegroundColor Yellow
function Get-Count($url) {
  try {
    $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 20
    $data = $resp.Content | ConvertFrom-Json
    if ($data -is [System.Collections.IEnumerable]) { return ($data | Measure-Object).Count }
    if ($data.data) { return ($data.data | Measure-Object).Count }
    return 0
  } catch {
    Write-Host "Fetch error $url: $($_.Exception.Message)" -ForegroundColor Red
    return -1
  }
}

$pCount = Get-Count "$ApiBase/api/categories/forms/products"
$sCount = Get-Count "$ApiBase/api/categories/forms/services"
$aCount = Get-Count "$ApiBase/api/categories/forms/aiapps"

Write-Host "API counts => Products: $pCount, Services: $sCount, Apps & AI: $aCount" -ForegroundColor Cyan
if ($pCount -ne 13 -or $sCount -ne 19 -or $aCount -ne 16) {
  Write-Host "❌ API counts mismatch (expected 13/19/16)" -ForegroundColor Red
  exit 1
}

Write-Host "✅ Canonical form categories seeded and verified." -ForegroundColor Green