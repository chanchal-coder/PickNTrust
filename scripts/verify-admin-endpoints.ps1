param(
  [string]$BaseUrl = "https://www.pickntrust.com",
  [string]$AdminPassword = "pickntrust2025"
)

Write-Host "Checking admin endpoints at $BaseUrl" -ForegroundColor Cyan

function Show-Result($resp) {
  if ($resp) {
    Write-Host ("Status: {0}" -f $resp.StatusCode) -ForegroundColor Green
    try {
      $content = $resp.Content
      if ($content) { Write-Host "Body:"; Write-Output $content }
    } catch {}
  }
}

try {
  $headers = @{ 'Content-Type'='application/json'; 'x-admin-password'=$AdminPassword }

  Write-Host "GET /api/admin/nav-tabs" -ForegroundColor Yellow
  $resp1 = Invoke-WebRequest -Uri "$BaseUrl/api/admin/nav-tabs" -Method Get -Headers $headers -UseBasicParsing -TimeoutSec 20
  Show-Result $resp1

  Write-Host "POST /api/admin/auth" -ForegroundColor Yellow
  $bodyAuth = @{ password = $AdminPassword } | ConvertTo-Json -Compress
  $resp2 = Invoke-WebRequest -Uri "$BaseUrl/api/admin/auth" -Method Post -Headers $headers -Body $bodyAuth -UseBasicParsing -TimeoutSec 20
  Show-Result $resp2

  Write-Host "POST /api/admin/nav-tabs (no name to test auth)" -ForegroundColor Yellow
  $bodyCreate = @{ password = $AdminPassword } | ConvertTo-Json -Compress
  $resp3 = Invoke-WebRequest -Uri "$BaseUrl/api/admin/nav-tabs" -Method Post -Headers $headers -Body $bodyCreate -UseBasicParsing -TimeoutSec 20
  Show-Result $resp3
} catch {
  Write-Host "Error:" $_.Exception.Message -ForegroundColor Red
}