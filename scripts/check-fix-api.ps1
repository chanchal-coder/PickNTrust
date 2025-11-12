param(
  [string]$SSH_KEY = "$env:USERPROFILE\.ssh\pnt08.pem",
  [string]$SERVER = "ec2-user@16.171.161.251",
  [string]$DOMAIN = "www.pickntrust.com"
)

Write-Host "== Checking and fixing categories on EC2 ==" -ForegroundColor Cyan

if (!(Test-Path $SSH_KEY)) {
  Write-Error "SSH key not found: $SSH_KEY"
  exit 1
}

$RemoteScriptPath = "/tmp/remote-fix-categories.sh"
$LocalScriptPath = Join-Path $PSScriptRoot "remote-fix-categories.sh"

if (!(Test-Path $LocalScriptPath)) {
  Write-Error "Helper script not found: $LocalScriptPath"
  exit 1
}

Write-Host "Uploading helper to ${SERVER}:${RemoteScriptPath}"
scp -i $SSH_KEY -o StrictHostKeyChecking=no $LocalScriptPath "${SERVER}:${RemoteScriptPath}" | Out-Null

Write-Host "Running remote fix script..."
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $SERVER "sed -i 's/\r$//' $RemoteScriptPath"
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $SERVER "chmod +x $RemoteScriptPath"
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $SERVER "$RemoteScriptPath"

Write-Host "== Verifying public API ==" -ForegroundColor Cyan
$url = "https://$DOMAIN/api/categories/browse"
try {
  $resp = Invoke-WebRequest -Uri $url -Headers @{ 'User-Agent' = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } -UseBasicParsing -TimeoutSec 20
  $json = $resp.Content | ConvertFrom-Json
  $count = $json.Count
  Write-Host "Browse categories count: $count" -ForegroundColor Green
  if ($count -eq 0) {
    Write-Warning "Browse API returned zero categories. Investigate server logs and DB."
  }
} catch {
  Write-Error "Failed to fetch ${url}: $_"
}

Write-Host "== PM2 status (backend/bot) ==" -ForegroundColor Cyan
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $SERVER "bash -lc 'pm2 status | sed -n \"1,60p\"'"

Write-Host "Done." -ForegroundColor Cyan