param()

# Trigger Import Static on production with replaceExisting and allowDuplicates flags
$payload = @{ 
  replaceExisting = $true
  allowDuplicates = $false
}

$json = $payload | ConvertTo-Json -Depth 3

try {
  $resp = Invoke-RestMethod -Uri 'https://pickntrust.com/api/admin/banners/import-static' -Method Post -ContentType 'application/json' -Body $json
  Write-Host "Import Static response:" -ForegroundColor Green
  $resp | ConvertTo-Json -Depth 6
} catch {
  Write-Host "Import Static failed:" -ForegroundColor Red
  Write-Host $_.Exception.Message
  if ($_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message }
}