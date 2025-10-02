# Deploy PickNTrust static client to EC2 safely (no Nginx changes)
Write-Host "Deploying PickNTrust client to pickntrust.com..." -ForegroundColor Green

# SSH key and server
$SSH_KEY = "C:\Users\sharm\.ssh\pnt08.pem"
$SERVER = "ec2-user@51.20.55.153"

# 1) Build React client
Write-Host "Building React client..." -ForegroundColor Yellow
Push-Location "client"
npm run build
Pop-Location

# 2) Create tarball of built assets
Write-Host "Creating client artifact..." -ForegroundColor Yellow
$tarPath = "pickntrust-client.tar.gz"
if (Test-Path $tarPath) { Remove-Item $tarPath -Force }
tar -czf $tarPath -C client/dist .

# 3) Ensure remote directories and permissions
Write-Host "Preparing remote directories..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $SERVER "sudo mkdir -p /home/ec2-user/pickntrust/client/dist/public && sudo chown -R ec2-user:ec2-user /home/ec2-user/pickntrust"

# 4) Upload and extract client build into public directory
Write-Host "Uploading client artifact..." -ForegroundColor Yellow
scp -i $SSH_KEY -o StrictHostKeyChecking=no $tarPath "$SERVER:/home/ec2-user/pickntrust/"
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $SERVER "set -e; cd /home/ec2-user/pickntrust && tar -xzf pickntrust-client.tar.gz -C client/dist/public && rm -f pickntrust-client.tar.gz; sudo nginx -t && sudo systemctl reload nginx"

# 5) Verify HTTPS endpoints from local machine
Write-Host "Verifying HTTPS endpoints..." -ForegroundColor Yellow
try { (Invoke-WebRequest -Uri "https://www.pickntrust.com/health" -UseBasicParsing -TimeoutSec 20).StatusCode | Out-Host } catch { Write-Host "health check error: $($_.Exception.Message)" -ForegroundColor Red }
try { (Invoke-WebRequest -Uri "https://www.pickntrust.com/api/status" -UseBasicParsing -TimeoutSec 20).StatusCode | Out-Host } catch { Write-Host "api status error: $($_.Exception.Message)" -ForegroundColor Red }

Write-Host "✅ Client deployment completed without altering Nginx or backend." -ForegroundColor Green
