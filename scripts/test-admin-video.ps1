param(
    [string]$BaseUrl = "http://127.0.0.1:5000"
)

Write-Host "Testing Admin Video Endpoints..." -ForegroundColor Green

# Test payload for adding a video
$testVideo = @{
    title = "Test Video"
    description = "A test video for admin functionality"
    videoUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    thumbnailUrl = "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"
    platform = "youtube"
    category = "entertainment"
    tags = @("test", "demo")
    duration = 212
    hasTimer = $false
    showOnHomepage = $true
    adminPassword = "pickntrust2025"
}

$jsonPayload = $testVideo | ConvertTo-Json -Depth 10

Write-Host "Testing POST /api/admin/video-content..." -ForegroundColor Yellow
Write-Host "Payload: $jsonPayload" -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/admin/video-content" -Method POST -Body $jsonPayload -ContentType "application/json"
    Write-Host "✅ POST Success!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Depth 10)" -ForegroundColor Green
    
    # Store the video ID for further tests
    $videoId = $response.id
    
    if ($videoId) {
        Write-Host "`nTesting GET /api/video-content to verify video was added..." -ForegroundColor Yellow
        $getResponse = Invoke-RestMethod -Uri "$BaseUrl/api/video-content" -Method GET
        Write-Host "✅ GET Success! Found $($getResponse.Count) videos" -ForegroundColor Green
        
        # Test UPDATE endpoint
        Write-Host "`nTesting PUT /api/admin/video-content/$videoId..." -ForegroundColor Yellow
        $updatePayload = @{
            title = "Updated Test Video"
            description = "Updated description"
            adminPassword = "pickntrust2025"
        } | ConvertTo-Json
        
        $updateResponse = Invoke-RestMethod -Uri "$BaseUrl/api/admin/video-content/$videoId" -Method PUT -Body $updatePayload -ContentType "application/json"
        Write-Host "✅ PUT Success!" -ForegroundColor Green
        Write-Host "Update Response: $($updateResponse | ConvertTo-Json)" -ForegroundColor Green
        
        # Test DELETE endpoint
        Write-Host "`nTesting DELETE /api/admin/video-content/$videoId..." -ForegroundColor Yellow
        $deletePayload = @{
            adminPassword = "pickntrust2025"
        } | ConvertTo-Json
        
        $deleteResponse = Invoke-RestMethod -Uri "$BaseUrl/api/admin/video-content/$videoId" -Method DELETE -Body $deletePayload -ContentType "application/json"
        Write-Host "✅ DELETE Success!" -ForegroundColor Green
        Write-Host "Delete Response: $($deleteResponse | ConvertTo-Json)" -ForegroundColor Green
    }
    
} catch {
    Write-Host "❌ Error occurred:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody" -ForegroundColor Red
    }
}

Write-Host "`nAdmin Video Endpoint Test Complete!" -ForegroundColor Green