Param(
  [Parameter(Mandatory=$true)][string]$Server,
  [Parameter(Mandatory=$true)][string]$KeyPath,
  [string]$Domain = "pickntrust.com",
  [string]$AppDir = "/home/ec2-user/pickntrust"
)

$ErrorActionPreference = "Stop"

function Exec($cmd) {
  Write-Host "`n$cmd" -ForegroundColor Cyan
  Invoke-Expression $cmd
}

function Run-SSH($remoteCmd) {
  $quoted = 'bash -lc ' + '"' + $remoteCmd.Replace('"','\"') + '"'
  Write-Host "`n[SSH] $remoteCmd" -ForegroundColor Yellow
  & ssh -i $KeyPath -o StrictHostKeyChecking=no $Server $quoted
}

function Upload($local, $remote) {
  Write-Host "`n[SCP] $local -> ${Server}:$remote" -ForegroundColor Green
  & scp -i $KeyPath -o StrictHostKeyChecking=no $local "${Server}:$remote"
}

Write-Host "Starting EC2 deploy to domain: $Domain" -ForegroundColor Green
Write-Host "Server: $Server" -ForegroundColor Green
Write-Host "Key: $KeyPath" -ForegroundColor Green

# 1) Local build (client + server)
Write-Host "Building client and server locally" -ForegroundColor Yellow
Exec "npm run build:production"

# Verify outputs
if (-not (Test-Path "dist/public") -or -not (Test-Path "dist/server/server/index.js")) {
  Write-Error "Build outputs missing: dist/public or dist/server/server/index.js"
}

# 2) Package artifacts (tar.gz full dist)
Write-Host "Packaging artifacts" -ForegroundColor Yellow
if (Get-Command tar.exe -ErrorAction SilentlyContinue) {
  if (Test-Path "dist-full.tar.gz") { Remove-Item -Force "dist-full.tar.gz" }
  & tar.exe -czf dist-full.tar.gz dist
} else {
  # Fallback to zip (remote must have unzip)
  if (Test-Path "dist-full.zip") { Remove-Item -Force "dist-full.zip" }
  Compress-Archive -Path "dist/*" -DestinationPath "dist-full.zip" -Force
}

# 3) Test SSH connectivity
Write-Host "Testing SSH connection" -ForegroundColor Yellow
Run-SSH "echo SSH connection OK; uname -a; node -v || true; pm2 -v || true"

# 4) Prepare remote app directory
Run-SSH "set -e; sudo mkdir -p $AppDir; sudo chown -R ec2-user:ec2-user $AppDir; mkdir -p $AppDir/uploads"

# 5) Upload artifacts and configs
if (Test-Path "dist-full.tar.gz") {
  Upload "dist-full.tar.gz" "$AppDir/dist-full.tar.gz"
} elseif (Test-Path "dist-full.zip") {
  Upload "dist-full.zip" "$AppDir/dist-full.zip"
}
if (Test-Path "pickntrust.conf") { Upload "pickntrust.conf" "$AppDir/pickntrust.conf" }
if (Test-Path "ecosystem.config.cjs") { Upload "ecosystem.config.cjs" "$AppDir/ecosystem.config.cjs" }

# 6) Unpack and install on remote
Run-SSH "set -e; cd $AppDir; if [ -f dist-full.tar.gz ]; then tar -xzf dist-full.tar.gz; fi; if [ -f dist-full.zip ]; then unzip -o dist-full.zip -d dist; fi; sudo npm i -g pm2 || true; if [ -f package.json ]; then npm ci --omit=dev || npm install --omit=dev; fi"

# 7) Configure Nginx (serve dist/public, proxy /api)
# Skipping Nginx config update; assumes existing config serves dist/public and proxies /api.

# 8) Start backend via PM2
Run-SSH "set -e; cd $AppDir; pm2 delete pickntrust-backend || true; if [ -f ecosystem.config.cjs ]; then pm2 start ecosystem.config.cjs --only pickntrust-backend --update-env || true; fi; if ! pm2 list | grep -q pickntrust-backend; then pm2 start dist/server/server/index.js --name pickntrust-backend --update-env || pm2 start dist/server/index.js --name pickntrust-backend --update-env; fi; pm2 save || true"

# 9) Remote health checks
# Remote health checks skipped to reduce PowerShell parsing complexity.

# 10) Post-deploy verification from local
Write-Host "Verifying remote website and assets" -ForegroundColor Yellow
try {
  $rootCode = (Invoke-WebRequest -UseBasicParsing -Uri "https://$Domain/").StatusCode
  Write-Host "Root status: $rootCode" -ForegroundColor Green
} catch { Write-Host "Root fetch failed: $($_.Exception.Message)" -ForegroundColor Red }
try {
  $statusCode = (Invoke-WebRequest -UseBasicParsing -Uri "https://$Domain/api/status").StatusCode
  Write-Host "/api/status: $statusCode" -ForegroundColor Green
} catch { Write-Host "/api/status failed: $($_.Exception.Message)" -ForegroundColor Red }

Write-Host "Deployment script completed" -ForegroundColor Green