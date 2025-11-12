param()

Write-Host "=== PickNTrust Bulk Video Upload Test ===" -ForegroundColor Yellow
Write-Host "Using GET endpoint workaround for admin video uploads" -ForegroundColor Cyan
Write-Host ""

# Test videos to upload
$testVideos = @("Sample Video 1", "Sample Video 2", "Sample Video 3", "Demo Content A", "Demo Content B")

$baseUrl = "https://www.pickntrust.com/api/admin/video-content/create"
$adminPassword = "pickntrust2025"
$defaultPages = "videos,apps,services" # comma-separated page slugs where videos should appear
$showOnHomepage = "false"            # set to "true" if you also want homepage
$successCount = 0
$failCount = 0

Write-Host "Starting bulk upload of $($testVideos.Count) videos..." -ForegroundColor Green
Write-Host ""

foreach ($title in $testVideos) {
    try {
        Write-Host "Uploading: $title..." -NoNewline
        
        $url = "$baseUrl" + "?adminPassword=$adminPassword" + "&title=$title" + "&videoUrl=https://www.youtube.com/watch?v=dQw4w9WgXcQ" + "&platform=youtube" + "&category=General" + "&description=Bulk upload test video" + "&pages=$defaultPages" + "&showOnHomepage=$showOnHomepage"
        
        $response = Invoke-WebRequest -Uri $url -Method Get -TimeoutSec 30
        
        if ($response.StatusCode -eq 200) {
            $result = $response.Content | ConvertFrom-Json
            if ($result.success) {
                Write-Host " Success (ID: $($result.data.id))" -ForegroundColor Green
                $successCount++
            } else {
                Write-Host " Failed: $($result.error)" -ForegroundColor Red
                $failCount++
            }
        } else {
            Write-Host " HTTP $($response.StatusCode)" -ForegroundColor Red
            $failCount++
        }
        
        Start-Sleep -Milliseconds 500
        
    } catch {
        Write-Host " Exception: $($_.Exception.Message)" -ForegroundColor Red
        $failCount++
    }
}

Write-Host ""
Write-Host "=== Upload Summary ===" -ForegroundColor Yellow
Write-Host "Successful uploads: $successCount" -ForegroundColor Green
Write-Host "Failed uploads: $failCount" -ForegroundColor Red

try {
    $listResponse = Invoke-WebRequest -Uri 'https://www.pickntrust.com/api/video-content' -Method Get -TimeoutSec 20
    $allVideos = $listResponse.Content | ConvertFrom-Json
    Write-Host "Total videos in database: $($allVideos.Count)" -ForegroundColor Cyan
} catch {
    Write-Host "Could not verify total count: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Bulk upload test completed!" -ForegroundColor Green