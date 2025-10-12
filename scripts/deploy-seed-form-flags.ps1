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

# Ensure sqlite3 is available remotely and resolve DB path robustly
Write-Host "Checking sqlite3 on remote and resolving DB path..." -ForegroundColor Yellow
$installCmd = @'
set -e
if ! command -v sqlite3 >/dev/null 2>&1; then
  if command -v apt-get >/dev/null 2>&1; then
    sudo apt-get update -y && sudo apt-get install -y sqlite3 || true
  elif command -v dnf >/dev/null 2>&1; then
    sudo dnf install -y sqlite || true
  elif command -v yum >/dev/null 2>&1; then
    sudo yum install -y sqlite || true
  fi
fi
'@
ssh -i $KeyPath -o StrictHostKeyChecking=no $Server $installCmd

function Resolve-RemoteDbPath([string]$preferred) {
  $candidates = @(
    $preferred,
    "/home/ec2-user/pickntrust/database.sqlite",
    "/home/ec2-user/PickNTrust/database.sqlite",
    "/home/ubuntu/pickntrust/database.sqlite",
    "/home/ubuntu/PickNTrust/database.sqlite"
  ) | Where-Object { $_ -and $_.Trim() -ne "" }

  foreach ($p in $candidates) {
    $testCmd = "bash -lc 'test -f " + $p + "'"
    ssh -i $KeyPath -o StrictHostKeyChecking=no $Server $testCmd
    if ($LASTEXITCODE -eq 0) { return $p }
  }
  return $preferred
}

$ResolvedDbPath = Resolve-RemoteDbPath -preferred $DbPath
Write-Host "Using remote DB path: $ResolvedDbPath" -ForegroundColor Cyan

# Copy SQL to remote tmp path
Write-Host "Copying SQL to remote /tmp/seed-form-flags.sql..." -ForegroundColor Yellow
scp -i $KeyPath -o StrictHostKeyChecking=no $LocalSql "${Server}:/tmp/seed-form-flags.sql"

# Apply SQL to remote SQLite database (avoid complex quoting by piping)
Write-Host "Applying SQL to remote DB: $ResolvedDbPath" -ForegroundColor Yellow
ssh -i $KeyPath -o StrictHostKeyChecking=no $Server "cat /tmp/seed-form-flags.sql | sqlite3 $ResolvedDbPath"
if ($LASTEXITCODE -ne 0) { Write-Error "Failed to apply SQL to remote DB"; exit 1 }

# Show counts (products, services, ai apps)
Write-Host "Counts (products, services, ai apps):" -ForegroundColor Cyan
ssh -i $KeyPath -o StrictHostKeyChecking=no $Server "sqlite3 $ResolvedDbPath 'SELECT COUNT(*) FROM categories WHERE is_for_products=1 AND parent_id IS NULL;'"
ssh -i $KeyPath -o StrictHostKeyChecking=no $Server "sqlite3 $ResolvedDbPath 'SELECT COUNT(*) FROM categories WHERE is_for_services=1 AND parent_id IS NULL;'"
ssh -i $KeyPath -o StrictHostKeyChecking=no $Server "sqlite3 $ResolvedDbPath 'SELECT COUNT(*) FROM categories WHERE is_for_ai_apps=1 AND parent_id IS NULL;'"

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
    Write-Host ("Fetch error {0}: {1}" -f $url, $_.Exception.Message) -ForegroundColor Red
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