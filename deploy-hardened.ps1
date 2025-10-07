param()

Write-Host "Deploying hardened client to pickntrust.com..." -ForegroundColor Green

$ErrorActionPreference = 'Stop'
$SSH_KEY = "C:\Users\sharm\.ssh\pnt08.pem"
$SERVER = "ec2-user@51.20.55.153"

# 1) Build production artifacts
Write-Host "Building production artifacts..." -ForegroundColor Yellow
npm run build

# 2) Create tarball of built assets
Write-Host "Creating client artifact..." -ForegroundColor Yellow
$tarPath = "pickntrust-client.tar.gz"
if (Test-Path $tarPath) { Remove-Item $tarPath -Force }
tar -czf $tarPath -C dist/public .

# 3) Prepare remote directory and ownership
Write-Host "Preparing remote directories..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $SERVER "sudo mkdir -p /home/ec2-user/pickntrust/dist/public && sudo chown -R ec2-user:ec2-user /home/ec2-user/pickntrust"

# 4) Upload and remote extract with sane permissions
Write-Host "Uploading client artifact..." -ForegroundColor Yellow
scp -i $SSH_KEY -o StrictHostKeyChecking=no $tarPath "$($SERVER):/home/ec2-user/pickntrust/"
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $SERVER 'bash -lc "set -e; umask 022; cd /home/ec2-user/pickntrust; rm -rf dist/public; mkdir -p dist/public; tar -xzf pickntrust-client.tar.gz -C dist/public; rm -f pickntrust-client.tar.gz; sudo chown -R ec2-user:ec2-user dist/public; find dist/public -type d -print0 | xargs -0 chmod 755; find dist/public -type f -print0 | xargs -0 chmod 644"'

# 5) Push Nginx config and reload
Write-Host "Updating Nginx config and reloading..." -ForegroundColor Yellow
scp -i $SSH_KEY -o StrictHostKeyChecking=no "pickntrust.conf" "$($SERVER):/home/ec2-user/pickntrust/pickntrust.conf"
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $SERVER 'bash -lc "sudo cp /home/ec2-user/pickntrust/pickntrust.conf /etc/nginx/conf.d/pickntrust.conf; sudo nginx -t; sudo systemctl reload nginx"'

# 6) Verify homepage and asset bundle over HTTPS
Write-Host "Verifying homepage and asset bundle..." -ForegroundColor Yellow
$headers = @{ 'User-Agent' = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36' }
$home = Invoke-WebRequest -Uri "https://pickntrust.com/" -Headers $headers -UseBasicParsing -TimeoutSec 20
Write-Host "Homepage status: $($home.StatusCode)" -ForegroundColor Cyan
if ($home.StatusCode -ne 200) { throw "Homepage returned status $($home.StatusCode)" }

$match = Select-String -InputObject $home.Content -Pattern 'assets/index-[^"]+\.js'
if (-not $match) { throw "No index bundle reference found in root HTML" }
$assetUrl = "https://pickntrust.com/$($match.Matches[0].Value)"
Write-Host "Asset URL: $assetUrl" -ForegroundColor Cyan
$assetResp = Invoke-WebRequest -Uri $assetUrl -UseBasicParsing -TimeoutSec 20
Write-Host "Asset status: $($assetResp.StatusCode)" -ForegroundColor Cyan
if ($assetResp.StatusCode -ne 200) { throw "Asset returned status $($assetResp.StatusCode)" }

Write-Host "✅ Hardened client deployment completed and verified (200s)." -ForegroundColor Green