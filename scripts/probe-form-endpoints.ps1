Param(
  [string]$Base = "http://localhost:5000"
)

Write-Host "Probing form category endpoints at $Base..."

try {
  $p = Invoke-RestMethod -Uri ("$Base/api/categories/forms/products") -TimeoutSec 15
  Write-Host ("products forms -> " + (@($p).Length))
} catch {
  Write-Host ("products forms -> ERROR " + $_.Exception.Message)
}

try {
  $s = Invoke-RestMethod -Uri ("$Base/api/categories/forms/services") -TimeoutSec 15
  Write-Host ("services forms -> " + (@($s).Length))
} catch {
  Write-Host ("services forms -> ERROR " + $_.Exception.Message)
}

try {
  $a = Invoke-RestMethod -Uri ("$Base/api/categories/forms/aiapps") -TimeoutSec 15
  Write-Host ("aiapps forms -> " + (@($a).Length))
} catch {
  Write-Host ("aiapps forms -> ERROR " + $_.Exception.Message)
}