Param(
  [string]$Server = "ec2-user@51.20.55.153",
  [string]$KeyPath = "C:\Users\sharm\.ssh\pnt08.pem"
)

$ErrorActionPreference = "Stop"

Write-Host "Starting deploy-to-domain (Mumma guide)" -ForegroundColor Green

# 1) Build locally
Write-Host "Building application locally..." -ForegroundColor Yellow
npm run build

# Verify build outputs
if (-not (Test-Path "dist/public")) { throw "dist/public missing after build" }
if (-not (Test-Path "dist/server/server/index.js")) { throw "dist/server/server/index.js missing after build" }
Write-Host "Local build outputs verified" -ForegroundColor Green

# 2) Package client assets (atomic publish via tarball)
Write-Host "Packaging client assets into tarball..." -ForegroundColor Yellow
$tarPath = Join-Path $env:TEMP "public.tar.gz"
if (Test-Path $tarPath) { Remove-Item $tarPath -Force }
tar -czf $tarPath -C "dist/public" .
Write-Host "Tarball created: $tarPath" -ForegroundColor Green

# 3) Upload assets and backend bundle to server
Write-Host "Uploading assets and backend to server..." -ForegroundColor Yellow
scp -i $KeyPath -o StrictHostKeyChecking=no $tarPath "${Server}:/home/ec2-user/pickntrust/public.tar.gz"
scp -i $KeyPath -o StrictHostKeyChecking=no -r "dist/server" "${Server}:/home/ec2-user/pickntrust/dist/server"
scp -i $KeyPath -o StrictHostKeyChecking=no "ecosystem.config.cjs" "${Server}:/home/ec2-user/pickntrust/ecosystem.config.cjs"
if (Test-Path "scripts/fix-fallback-widget.cjs") {
  scp -i $KeyPath -o StrictHostKeyChecking=no "scripts/fix-fallback-widget.cjs" "${Server}:/home/ec2-user/pickntrust/scripts/fix-fallback-widget.cjs"
}

# 4) Remote atomic swap for client, PM2 backend refresh, health checks
Write-Host "Applying atomic client swap and refreshing backend (PM2)..." -ForegroundColor Yellow
$remote = @'
# Be resilient: do not exit on first error
set +e
cd /home/ec2-user/pickntrust
mkdir -p dist/public_new dist logs scripts

# Ensure Nginx vhost proxies /api to backend and serves SPA
cat > /tmp/pickntrust.conf << 'NGINXCONF'
server {
  listen 80 default_server;
  server_name _;

  root /home/ec2-user/pickntrust/dist/public;
  index index.html index.htm;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /api {
    proxy_pass http://127.0.0.1:5000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 300s;
    proxy_connect_timeout 75s;
  }

  location /health {
    proxy_pass http://127.0.0.1:5000/health;
  }
}
NGINXCONF
sudo mv /tmp/pickntrust.conf /etc/nginx/conf.d/pickntrust.conf
sudo rm -f /etc/nginx/conf.d/default.conf /etc/nginx/sites-enabled/default /etc/nginx/sites-available/default || true
echo "==== NGINX pickntrust.conf written ====" && sed -n '1,120p' /etc/nginx/conf.d/pickntrust.conf || true
sudo nginx -t && sudo systemctl reload nginx || { echo "NGINX test failed"; sudo nginx -t; }

# Ensure no conflicting vhosts override API proxy
echo "Listing active Nginx conf.d files (no disable applied):" && ls -la /etc/nginx/conf.d || true
sudo nginx -t && sudo systemctl reload nginx || true

# Show active server blocks and confirm /api location exists
echo "==== NGINX ACTIVE CONF (summary) ===="
sudo nginx -T 2>/dev/null | grep -n "location /api" || true

# Atomic client publish (to dist/public)
tar -xzf public.tar.gz -C dist/public_new
rm -rf dist/public_old
if [ -d dist/public ]; then mv dist/public dist/public_old; fi
mv dist/public_new dist/public

# Nginx reload (validate first - after client publish below)

# Ensure PM2 exists
pm2 -v || npm i -g pm2

# Backend start/reload (isolated from bot)
pm2 start ecosystem.config.cjs --only pickntrust-backend --update-env || pm2 reload pickntrust-backend || pm2 start dist/server/server/index.js --name pickntrust-backend --update-env
pm2 restart pickntrust-bot || true
pm2 save || true

# Local health check
echo "Backend /health HTTP status:" && curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5000/health || true

# Validate API proxying through Nginx
echo "Nginx /api/products/apps:" && curl -s -o /dev/null -w "%{http_code} %{content_type}" http://127.0.0.1/api/products/apps || true
echo "Nginx /api/products/page/apps:" && curl -s -o /dev/null -w "%{http_code} %{content_type}" http://127.0.0.1/api/products/page/apps || true

# Also show small JSON snippet to ensure not HTML
echo "Snippet apps via Nginx:" && curl -s http://127.0.0.1/api/products/apps | head -c 200 || true
echo "\nSnippet page apps via Nginx:" && curl -s http://127.0.0.1/api/products/page/apps | head -c 200 || true

# PrimePicks fallback widget (ensure at least one header widget present)
if [ -f scripts/fix-fallback-widget.cjs ]; then node scripts/fix-fallback-widget.cjs || true; fi
'@

# Ship remote script via file to avoid PowerShell $-expansion issues
$tmpScript = [System.IO.Path]::Combine($env:TEMP, "deploy-remote.sh")
Set-Content -Path $tmpScript -Value $remote -Encoding UTF8
scp -i $KeyPath -o StrictHostKeyChecking=no $tmpScript "${Server}:/home/ec2-user/pickntrust/deploy-remote.sh"
ssh -i $KeyPath -o StrictHostKeyChecking=no ${Server} "bash -lc 'chmod +x /home/ec2-user/pickntrust/deploy-remote.sh && /home/ec2-user/pickntrust/deploy-remote.sh'"

# 5) External health checks
Write-Host "Verifying site and API externally..." -ForegroundColor Yellow
$serverHost = $Server.Split('@')[1]
try {
  $respRoot = Invoke-WebRequest -Uri "http://$serverHost/" -UseBasicParsing -TimeoutSec 15
  Write-Host ("Root status: {0}" -f $respRoot.StatusCode) -ForegroundColor Green
} catch {
  Write-Host ("Root check failed: {0}" -f $_.Exception.Message) -ForegroundColor Yellow
}

foreach ($path in @("/health", "/api/status")) {
  try {
    $resp = Invoke-WebRequest -Uri ("http://{0}{1}" -f $serverHost, $path) -UseBasicParsing -TimeoutSec 15
    Write-Host ("OK {0}: {1}" -f $path, $resp.StatusCode) -ForegroundColor Green
  } catch {
    Write-Host ("WARN {0} failed: {1}" -f $path, $_.Exception.Message) -ForegroundColor Yellow
  }
}

Write-Host "Deployment completed (deploy-to-domain)" -ForegroundColor Green