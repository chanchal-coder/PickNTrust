param(
  [string]$Base = 'https://pickntrust.com',
  [string]$Password = 'pickntrust2025'
)

$ErrorActionPreference = 'Stop'

function Invoke-JsonPost {
  param(
    [string]$Url,
    [hashtable]$Body,
    [hashtable]$Headers
  )
  $json = $Body | ConvertTo-Json -Compress
  try {
    return Invoke-RestMethod -Method Post -Uri $Url -ContentType 'application/json' -Body $json -Headers $Headers -TimeoutSec 30
  } catch {
    Write-Host ("POST failed: " + $_.Exception.Message) -ForegroundColor Red
    if ($_.Exception.Response -and $_.Exception.Response.Content) {
      try {
        $errBody = [System.IO.StreamReader]::new($_.Exception.Response.Content).ReadToEnd()
        Write-Host ("Response body: " + $errBody) -ForegroundColor DarkGray
      } catch {}
    }
    throw
  }
}

function Get-Json {
  param([string]$Url)
  try {
    return Invoke-RestMethod -Method Get -Uri $Url -TimeoutSec 30
  } catch {
    Write-Host ("GET failed: " + $_.Exception.Message) -ForegroundColor Red
    throw
  }
}

$name = "ServiceOnly-$([DateTime]::UtcNow.ToString('yyyyMMdd-HHmmss'))"
$payload = @{
  password      = $Password
  name          = $name
  description   = 'Deploy verify'
  displayOrder  = 905
  isActive      = $true
  isForProducts = $false
  isForServices = $true
  isForAIApps   = $false
}

Write-Host "Creating: $name"
$headers = @{ 'x-admin-password' = $Password }
$create = Invoke-JsonPost -Url ("$Base/api/admin/categories") -Body $payload -Headers $headers

Start-Sleep -Seconds 2

$services = Get-Json -Url ("$Base/api/categories/forms/services")
$products = Get-Json -Url ("$Base/api/categories/forms/products")
$aiapps   = Get-Json -Url ("$Base/api/categories/forms/aiapps")

$foundS = $services | Where-Object { $_.name -eq $name }
$foundP = $products | Where-Object { $_.name -eq $name }
$foundA = $aiapps   | Where-Object { $_.name -eq $name }

Write-Host ("Created id: " + $create.id)
Write-Host ("Services includes: " + ([bool]$foundS))
Write-Host ("Products includes: " + ([bool]$foundP))
Write-Host ("AI Apps includes: " + ([bool]$foundA))

if (-not $foundS) {
  Write-Host "Category not found in services list; inspecting raw categories..." -ForegroundColor Yellow
  try {
    $all = Get-Json -Url ("$Base/api/categories")
    $row = $all | Where-Object { $_.name -eq $name }
    if ($row) {
      Write-Host ("Row flags => products: " + $row.isForProducts + ", services: " + $row.isForServices + ", aiapps: " + $row.isForAIApps)
    } else {
      Write-Host "Row not returned by /api/categories" -ForegroundColor Yellow
    }
  } catch {
    Write-Host "Failed to fetch /api/categories: $($_.Exception.Message)" -ForegroundColor Red
  }
}