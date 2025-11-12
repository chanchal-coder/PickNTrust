param(
  [string]$BaseUrl = "https://pickntrust.com",
  [string]$AdminPassword = "pickntrust2025"
)

Write-Host "Seeding navigation tabs on $BaseUrl" -ForegroundColor Cyan

function Invoke-CreateTab($tab) {
  $headers = @{ 'Content-Type'='application/json'; 'x-admin-password'=$AdminPassword }
  $body = $tab | ConvertTo-Json -Compress
  try {
    $resp = Invoke-WebRequest -Uri "$BaseUrl/api/admin/nav-tabs" -Method Post -Headers $headers -Body $body -UseBasicParsing -TimeoutSec 30
    Write-Host ("+ Added {0} ({1}) Status={2}" -f $tab.slug, $tab.name, $resp.StatusCode) -ForegroundColor Green
    return $true
  } catch {
    $msg = $_.Exception.Message
    if ($msg -match '409' -or $msg -match 'Slug already exists') {
      Write-Host ("= Exists {0} ({1})" -f $tab.slug, $tab.name) -ForegroundColor Yellow
      return $true
    } else {
      Write-Host ("! Failed {0} ({1}) -> {2}" -f $tab.slug, $tab.name, $msg) -ForegroundColor Red
      return $false
    }
  }
}

$tabs = @(
  @{ name='Fresh Picks'; slug='fresh-picks'; icon='fas fa-leaf'; color_from='#10B981'; color_to='#06B6D4'; colorStyle='gradient'; is_active=$true; description='Latest and freshest curated selections' },
  @{ name="Artist's Corner"; slug='artists-corner'; icon='fas fa-palette'; color_from='#8B5CF6'; color_to='#EC4899'; colorStyle='gradient'; is_active=$true; description='Creative picks, art and design highlights' },
  @{ name='OTT Hub'; slug='ott-hub'; icon='fas fa-tv'; color_from='#EF4444'; color_to='#F59E0B'; colorStyle='gradient'; is_active=$true; description='Streaming, OTT platforms and entertainment' }
)

$allOk = $true
foreach ($t in $tabs) { if (-not (Invoke-CreateTab $t)) { $allOk = $false } }

Write-Host "\nVerifying tabs via GET /api/nav-tabs" -ForegroundColor Cyan
try {
  $resp = Invoke-WebRequest -Uri "$BaseUrl/api/nav-tabs" -Method Get -UseBasicParsing -TimeoutSec 30
  $json = $resp.Content | ConvertFrom-Json
  $needed = @('fresh-picks','artists-corner','ott-hub')
  $present = @()
  foreach ($item in $json) { if ($needed -contains ($item.slug)) { $present += $item.slug } }
  Write-Host ("Present: {0}" -f ([string]::Join(', ', $present))) -ForegroundColor Green
  $missing = $needed | Where-Object { $_ -notin $present }
  if ($missing.Count -gt 0) {
    Write-Host ("Missing: {0}" -f ([string]::Join(', ', $missing))) -ForegroundColor Yellow
    exit 2
  } else {
    Write-Host "All target tabs present." -ForegroundColor Green
  }
} catch {
  Write-Host "GET /api/nav-tabs failed: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}

if ($allOk) { exit 0 } else { exit 3 }