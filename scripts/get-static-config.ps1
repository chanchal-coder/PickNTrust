param()

try {
  $resp = Invoke-RestMethod -Uri 'https://pickntrust.com/api/admin/banners/static-config' -Method Get
  Write-Host "Static config (resolved path & contents):" -ForegroundColor Cyan
  $resp | ConvertTo-Json -Depth 6
} catch {
  Write-Host "Fetch static-config failed:" -ForegroundColor Red
  Write-Host $_.Exception.Message
  if ($_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message }
}