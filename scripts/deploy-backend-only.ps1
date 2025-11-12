param(
  [Parameter(Mandatory = $true)][string]$Host,
  [Parameter(Mandatory = $true)][string]$User,
  [Parameter(Mandatory = $true)][string]$AppDir,
  [string]$Branch = "main",
  [string]$Pm2App = "pickntrust-backend",
  [string]$KeyFile = ""
)

function Invoke-SSH {
  param([string]$Cmd)
  if ($KeyFile -and (Test-Path $KeyFile)) {
    ssh -i $KeyFile "$User@$Host" $Cmd
  } else {
    ssh "$User@$Host" $Cmd
  }
}

Write-Host "Backend-only deploy starting..." -ForegroundColor Green

$remoteCmd = @"
set -e
cd '$AppDir'
echo 'Pulling latest code...'
git fetch --all --quiet
git checkout '$Branch'
git reset --hard "origin/$Branch"
echo 'Installing deps...'
npm ci
echo 'Building server...'
npm run build:server
echo 'Reloading PM2 app...'
pm2 reload '$Pm2App'
echo 'Sanity check: /api/video-content'
curl -s http://localhost:5000/api/video-content | head -c 800 || true
"@

Invoke-SSH $remoteCmd

Write-Host "Backend-only deploy completed." -ForegroundColor Green