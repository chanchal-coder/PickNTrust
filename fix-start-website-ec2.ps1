<#
  One-click EC2 fix to start the PickNTrust website.
  - Builds backend and frontend
  - Starts backend with PM2
  - Configures Nginx reverse proxy on port 80
  - Verifies health endpoints

  Usage:
    powershell -ExecutionPolicy Bypass -File .\fix-start-website-ec2.ps1
#>

$ErrorActionPreference = "Stop"

$EC2_USER = "ec2-user"
$EC2_IP   = "51.20.55.153"
$SSH_KEY  = "C:\Users\sharm\.ssh\pnt08.pem"

Write-Host "🚀 Starting EC2 website fix for $EC2_USER@$EC2_IP" -ForegroundColor Green

function Run-SSH($cmd) {
  Write-Host "→ $cmd" -ForegroundColor Cyan
  & ssh -i $SSH_KEY -o StrictHostKeyChecking=no "$EC2_USER@$EC2_IP" $cmd
}

Write-Host "🔐 Testing SSH connectivity..." -ForegroundColor Yellow
try {
  Run-SSH 'echo OK && hostname && whoami'
} catch {
  Write-Host "❌ SSH failed. Verify key, Security Group, and instance is reachable." -ForegroundColor Red
  throw
}

Write-Host "📦 Ensuring system dependencies (git, nginx, node, pm2)..." -ForegroundColor Yellow
Run-SSH "bash -lc 'set -e
PKG=""
if command -v dnf >/dev/null 2>&1; then PKG=dnf; elif command -v yum >/dev/null 2>&1; then PKG=yum; elif command -v apt-get >/dev/null 2>&1; then PKG=apt-get; fi
if [ -n "$PKG" ]; then
  if [ "$PKG" = "apt-get" ]; then sudo apt-get update -y; fi
  sudo $PKG install -y git nginx || true
fi
if ! command -v node >/dev/null 2>&1; then
  if command -v dnf >/dev/null 2>&1; then
    curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash - && sudo dnf install -y nodejs
  elif command -v yum >/dev/null 2>&1; then
    curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash - && sudo yum install -y nodejs
  elif command -v apt-get >/dev/null 2>&1; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs
  fi
fi
if ! command -v pm2 >/dev/null 2>&1; then sudo npm install -g pm2; fi
'"

Write-Host "📂 Preparing application directory..." -ForegroundColor Yellow
Run-SSH "bash -lc 'set -e
mkdir -p /home/ec2-user
if [ -d /home/ec2-user/pickntrust/.git ]; then
  cd /home/ec2-user/pickntrust && git pull || true
else
  cd /home/ec2-user
  if command -v git >/dev/null 2>&1; then
    git clone https://github.com/chanchal-coder/PickNTrust.git pickntrust || true
  fi
fi
'"

Write-Host "📦 Installing dependencies and building app..." -ForegroundColor Yellow
Run-SSH "bash -lc 'set -e
cd /home/ec2-user/pickntrust
npm ci
npm run build
if [ ! -d dist/public ]; then echo "Client build missing: dist/public" >&2; exit 1; fi
if [ ! -f dist/server/server/index.js ]; then echo "Server build missing: dist/server/server/index.js" >&2; exit 1; fi
'"

Write-Host "🚀 Starting backend with PM2..." -ForegroundColor Yellow
Run-SSH "bash -lc 'set -e
cd /home/ec2-user/pickntrust
pm2 start ecosystem.config.cjs --only pickntrust-backend --update-env || pm2 start dist/server/server/index.js --name pickntrust-backend --update-env
pm2 save
pm2 status || true
'"

Write-Host "🌐 Configuring Nginx reverse proxy..." -ForegroundColor Yellow
Run-SSH "sudo bash -lc 'set -e
cat > /etc/nginx/conf.d/pickntrust.conf <<CONF
server {
  listen 80;
  server_name _;
  location / {
    proxy_pass http://127.0.0.1:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection \"upgrade\";
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_read_timeout 120s;
    proxy_connect_timeout 30s;
  }
}
CONF
nginx -t
systemctl reload nginx || systemctl restart nginx
'"

Write-Host "🩺 Verifying health endpoints..." -ForegroundColor Yellow
Run-SSH "bash -lc 'set -e
echo \"Backend health (expect 200):\"
curl -s -o /dev/null -w \"%{http_code}\n\" http://127.0.0.1:5000/health || echo ERR
echo \"HTTP on :80 (expect 200):\"
curl -s -o /dev/null -w \"%{http_code}\n\" http://127.0.0.1/ || echo ERR
echo \"Listening ports:\" && sudo ss -tulpn | grep -E ":80|:5000" || true
'"

Write-Host "✅ Completed. If DNS points to this EC2, pickntrust.com should load. Test:" -ForegroundColor Green
Write-Host "  Invoke-WebRequest -Uri http://$EC2_IP/ -TimeoutSec 10 -UseBasicParsing" -ForegroundColor Green
Write-Host "  Invoke-WebRequest -Uri https://pickntrust.com/api/status -TimeoutSec 10 -UseBasicParsing" -ForegroundColor Green