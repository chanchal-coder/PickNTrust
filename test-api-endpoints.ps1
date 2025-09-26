# PickNTrust API Endpoint Testing Script
# Tests all display pages to verify they can post and retrieve products

Write-Host "🚀 Starting PickNTrust API Endpoint Tests" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

# Base URL for the API
$baseUrl = "http://localhost:3000"

# Function to test an API endpoint
function Test-APIEndpoint {
    param(
        [string]$PageName,
        [string]$Endpoint,
        [string]$Icon = "📄"
    )
    
    Write-Host "`n$Icon Testing $PageName..." -ForegroundColor Yellow
    Write-Host "Endpoint: $Endpoint" -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri $Endpoint -Method GET -Headers @{"Content-Type"="application/json"} -TimeoutSec 10
        
        if ($response.StatusCode -eq 200) {
            $content = $response.Content | ConvertFrom-Json
            $productCount = if ($content -is [array]) { $content.Count } else { 1 }
            
            Write-Host "✅ SUCCESS: $PageName API working" -ForegroundColor Green
            Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Green
            Write-Host "   Products returned: $productCount" -ForegroundColor Green
            
            # Show sample product if available
            if ($productCount -gt 0 -and $content -is [array]) {
                $sampleProduct = $content[0]
                Write-Host "   Sample product: $($sampleProduct.name)" -ForegroundColor Cyan
                Write-Host "   Price: $($sampleProduct.currency)$($sampleProduct.price)" -ForegroundColor Cyan
            }
            
            return @{
                Success = $true
                StatusCode = $response.StatusCode
                ProductCount = $productCount
                PageName = $PageName
            }
        } else {
            Write-Host "⚠️  WARNING: Unexpected status code $($response.StatusCode)" -ForegroundColor Yellow
            return @{
                Success = $false
                StatusCode = $response.StatusCode
                ProductCount = 0
                PageName = $PageName
                Error = "Unexpected status code"
            }
        }
    }
    catch {
        Write-Host "❌ FAILED: $PageName API not working" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        
        return @{
            Success = $false
            StatusCode = 0
            ProductCount = 0
            PageName = $PageName
            Error = $_.Exception.Message
        }
    }
}

# Test all display page endpoints
$testResults = @()

# Home Page (fas fa-home)
$testResults += Test-APIEndpoint -PageName "Home Page" -Endpoint "$baseUrl/api/products/page/home" -Icon "🏠"

# Prime Picks
$testResults += Test-APIEndpoint -PageName "Prime Picks" -Endpoint "$baseUrl/api/products/page/prime-picks" -Icon "⭐"

# Cue Picks
$testResults += Test-APIEndpoint -PageName "Cue Picks" -Endpoint "$baseUrl/api/products/page/cue-picks" -Icon "🎯"

# Value Picks
$testResults += Test-APIEndpoint -PageName "Value Picks" -Endpoint "$baseUrl/api/products/page/value-picks" -Icon "💎"

# Click Picks
$testResults += Test-APIEndpoint -PageName "Click Picks" -Endpoint "$baseUrl/api/products/page/click-picks" -Icon "🖱️"

# Global Picks
$testResults += Test-APIEndpoint -PageName "Global Picks" -Endpoint "$baseUrl/api/products/page/global-picks" -Icon "🌍"

# Travel Picks
$testResults += Test-APIEndpoint -PageName "Travel Picks" -Endpoint "$baseUrl/api/products/page/travel-picks" -Icon "✈️"

# Deals Hub
$testResults += Test-APIEndpoint -PageName "Deals Hub" -Endpoint "$baseUrl/api/products/page/deals-hub" -Icon "🛒"

# Loot Box
$testResults += Test-APIEndpoint -PageName "Loot Box" -Endpoint "$baseUrl/api/products/page/loot-box" -Icon "📦"

# Top Picks (Featured Products)
$testResults += Test-APIEndpoint -PageName "Top Picks" -Endpoint "$baseUrl/api/products/page/top-picks" -Icon "🔥"

# Apps Page
$testResults += Test-APIEndpoint -PageName "Apps Page" -Endpoint "$baseUrl/api/products/page/apps" -Icon "📱"

# Summary Report
Write-Host "`n`n📊 TEST SUMMARY REPORT" -ForegroundColor Magenta
Write-Host "======================" -ForegroundColor Magenta

$successCount = ($testResults | Where-Object { $_.Success }).Count
$totalTests = $testResults.Count
$totalProducts = ($testResults | Measure-Object -Property ProductCount -Sum).Sum

Write-Host "`n✅ Successful endpoints: $successCount/$totalTests" -ForegroundColor Green
Write-Host "📦 Total products across all pages: $totalProducts" -ForegroundColor Cyan

if ($successCount -eq $totalTests) {
    Write-Host "`n🎉 ALL API ENDPOINTS ARE WORKING! 🎉" -ForegroundColor Green
    Write-Host "All display pages can successfully post and retrieve products." -ForegroundColor Green
} else {
    Write-Host "`n⚠️  Some endpoints need attention:" -ForegroundColor Yellow
    $failedTests = $testResults | Where-Object { -not $_.Success }
    foreach ($failed in $failedTests) {
        Write-Host "   ❌ $($failed.PageName): $($failed.Error)" -ForegroundColor Red
    }
}

# Detailed Results Table
Write-Host "`n📋 DETAILED RESULTS:" -ForegroundColor Blue
Write-Host "Page Name          | Status | Products | Status Code" -ForegroundColor Blue
Write-Host "-------------------|--------|----------|------------" -ForegroundColor Blue

foreach ($result in $testResults) {
    $status = if ($result.Success) { "✅ PASS" } else { "❌ FAIL" }
    $statusColor = if ($result.Success) { "Green" } else { "Red" }
    
    $line = "{0,-18} | {1,-6} | {2,8} | {3,11}" -f $result.PageName, $status, $result.ProductCount, $result.StatusCode
    Write-Host $line -ForegroundColor $statusColor
}

Write-Host "`n🏁 API Testing Complete!" -ForegroundColor Green