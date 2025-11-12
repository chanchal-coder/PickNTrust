param()

try {
  $resp = Invoke-RestMethod -Uri 'https://pickntrust.com/api/banners/home' -Method Get
  Write-Host "Home banners (dynamic DB):" -ForegroundColor Cyan
  $resp | ConvertTo-Json -Depth 6
} catch {
  Write-Host "Fetch home banners failed:" -ForegroundColor Red
  Write-Host $_.Exception.Message
  if ($_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message }
}