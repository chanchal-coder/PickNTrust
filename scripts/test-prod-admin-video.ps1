param(
  [string]$BaseUrl = "http://localhost:5000",
  [switch]$DoPostTest
)

Write-Host "Production Admin Video Sanity Test" -ForegroundColor Green

# Non-invasive GET check (does not modify data)
try {
  $getResponse = Invoke-RestMethod -Uri "$BaseUrl/api/video-content" -Method GET -TimeoutSec 20
  $count = if ($getResponse -is [System.Collections.IEnumerable]) { ($getResponse | Measure-Object).Count } else { 1 }
  Write-Host "GET /api/video-content OK. Count: $count" -ForegroundColor Green
} catch {
  Write-Host "GET /api/video-content failed" -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
  if ($_.Exception.Response) {
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $responseBody = $reader.ReadToEnd()
    Write-Host "Response Body: $responseBody" -ForegroundColor Red
  }
}

if ($DoPostTest) {
  Write-Host "Optional POST test enabled; adding a small test video." -ForegroundColor Yellow
  $payload = @{
    title = "Deploy Test Video"
    description = "Non-invasive deploy verification"
    videoUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    thumbnailUrl = "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"
    platform = "youtube"
    category = "test"
    tags = @("deploy", "test")
    duration = 30
    hasTimer = $false
    showOnHomepage = $false
    adminPassword = "pickntrust2025"
  } | ConvertTo-Json -Depth 10

  try {
    $postResp = Invoke-RestMethod -Uri "$BaseUrl/api/admin/video-content" -Method POST -Body $payload -ContentType "application/json" -TimeoutSec 20
    Write-Host "POST /api/admin/video-content OK. ID: $($postResp.data.id)" -ForegroundColor Green
  } catch {
    Write-Host "POST /api/admin/video-content failed" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.Exception.Response) {
      $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
      $responseBody = $reader.ReadToEnd()
      Write-Host "Response Body: $responseBody" -ForegroundColor Red
    }
  }
}

Write-Host "Production Admin Video Test complete." -ForegroundColor Green