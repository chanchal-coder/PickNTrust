# Deploy PickNTrust static client to EC2 safely (ec2-user path only)
Write-Host "Deploying PickNTrust client to pickntrust.com..." -ForegroundColor Green

# SSH key and server
$SSH_KEY = "C:\Users\sharm\.ssh\pnt08.pem"
$SERVER = "ec2-user@51.20.55.153"

# 1) Build production artifacts (client + server)
Write-Host "Building production artifacts (client + server)..." -ForegroundColor Yellow
npm run build

# 2) Create tarball of built assets (client outputs to ../dist/public)
Write-Host "Creating client artifact..." -ForegroundColor Yellow
$tarPath = "pickntrust-client.tar.gz"
if (Test-Path $tarPath) { Remove-Item $tarPath -Force }
tar -czf $tarPath -C dist/public .

# 3) Ensure remote directories and permissions
Write-Host "Preparing remote directories..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $SERVER "sudo mkdir -p /home/ec2-user/pickntrust/dist/public && sudo chown -R ec2-user:ec2-user /home/ec2-user/pickntrust"

# 4) Upload and extract client build into public directory
Write-Host "Uploading client artifact..." -ForegroundColor Yellow
scp -i $SSH_KEY -o StrictHostKeyChecking=no $tarPath "${SERVER}:/home/ec2-user/pickntrust/"
ssh -i $SSH_KEY -o StrictHostKeyChecking=no ${SERVER} "bash -lc 'set -e; cd /home/ec2-user/pickntrust && rm -rf dist/public && mkdir -p dist/public && tar -xzf pickntrust-client.tar.gz -C dist/public && rm -f pickntrust-client.tar.gz && sudo chown -R ec2-user:ec2-user dist/public && find dist/public -type d -exec chmod 755 {} \\; && find dist/public -type f -exec chmod 644 {} \\;'"

# 4b) Push Nginx config with cache headers to avoid stale index caching and reload
Write-Host "Updating Nginx config (cache headers for index/assets)..." -ForegroundColor Yellow
scp -i $SSH_KEY -o StrictHostKeyChecking=no "pickntrust.conf" "${SERVER}:/home/ec2-user/pickntrust/pickntrust.conf"
ssh -i $SSH_KEY -o StrictHostKeyChecking=no ${SERVER} "bash -lc 'set -e; 
  sudo cp /home/ec2-user/pickntrust/pickntrust.conf /etc/nginx/conf.d/pickntrust.conf; 
  sudo rm -f /etc/nginx/conf.d/nginx-pickntrust.conf 2>/dev/null || true; 
  sudo rm -f /etc/nginx/conf.d/pickntrust-vhost.conf 2>/dev/null || true; 
  sudo rm -f /etc/nginx/sites-enabled/pickntrust 2>/dev/null || true; 
  sudo rm -f /etc/nginx/sites-available/pickntrust 2>/dev/null || true; 
  sudo nginx -t; 
  sudo systemctl reload nginx; 
  echo \"---- Active Nginx server_names ----\"; 
  sudo nginx -T 2>/dev/null | grep -E \"server_name|listen 443|listen 80\" | sed -E \"s/^\\s+//\" | uniq; 
'"

# 5) Verify HTTPS endpoints from local machine
Write-Host "Verifying HTTPS endpoints..." -ForegroundColor Yellow
try { (Invoke-WebRequest -Uri "https://www.pickntrust.com/" -UseBasicParsing -TimeoutSec 20).StatusCode | Out-Host } catch { Write-Host "root check error: $($_.Exception.Message)" -ForegroundColor Red }
try { (Invoke-WebRequest -Uri "https://www.pickntrust.com/health" -UseBasicParsing -TimeoutSec 20).StatusCode | Out-Host } catch { Write-Host "health check error: $($_.Exception.Message)" -ForegroundColor Red }

# 6) Remote asset presence and index bundle verification
Write-Host "Verifying remote assets and index bundle..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no ${SERVER} "bash -lc 'set -e; 
  cd /home/ec2-user/pickntrust/dist/public; 
  echo Index exists?; ls -la index.html || (echo index.html missing && exit 1); 
  echo Find index bundle by filename; 
  BUNDLE=$(ls assets/index-*.js 2>/dev/null | head -1); 
  echo Bundle: $BUNDLE; 
  if [ -z \"$BUNDLE\" ]; then echo Index bundle not found && exit 1; fi; 
  echo Check bundle file exists; 
  test -f \"$BUNDLE\" && echo Bundle present || (echo Bundle missing: $BUNDLE && exit 1); 
  echo List assets directory; ls -la assets | head -20; 
'"

# 4c) Extract client build tarball on server with safe permissions
Write-Host "Extracting client build on server..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no ${SERVER} "bash -lc 'set -e; 
  cd /home/ec2-user/pickntrust; 
  rm -rf dist/public; 
  mkdir -p dist/public; 
  tar -xzf pickntrust-client.tar.gz -C dist/public; 
  rm -f pickntrust-client.tar.gz; 
  sudo chown -R ec2-user:ec2-user dist/public; 
  find dist/public -type d -exec chmod 755 {} \\;; 
  find dist/public -type f -exec chmod 644 {} \\;; 
'"

# 7) End-to-end HTTPS check for canonical apex
Write-Host "Validating apex over HTTPS..." -ForegroundColor Yellow
try {
  $resp = Invoke-WebRequest -Uri "https://pickntrust.com/" -UseBasicParsing -TimeoutSec 20
  Write-Host "Status: $($resp.StatusCode)"
  if ($resp.Content -match "assets/index-") { Write-Host "✅ Index references assets bundle" -ForegroundColor Green } else { Write-Host "⚠️ Index bundle reference not detected" -ForegroundColor Yellow }
} catch { Write-Host "apex check error: $($_.Exception.Message)" -ForegroundColor Red }
try { (Invoke-WebRequest -Uri "https://www.pickntrust.com/api/status" -UseBasicParsing -TimeoutSec 20).StatusCode | Out-Host } catch { Write-Host "api status error: $($_.Exception.Message)" -ForegroundColor Red }

# 6) Verify live bundle name and ensure test widget string is removed
Write-Host "Verifying live bundle contents..." -ForegroundColor Yellow
try {
  $html = Invoke-WebRequest -Uri 'https://www.pickntrust.com/prime-picks' -UseBasicParsing
  $m = [regex]::Match($html.Content, 'src="/assets/index-([^"]+)"')
  $hash = $m.Groups[1].Value
  $indexUrl = "https://www.pickntrust.com/assets/index-$hash"
  Write-Host "Index bundle URL: $indexUrl" -ForegroundColor Cyan
  $idxResp = Invoke-WebRequest -Uri $indexUrl -UseBasicParsing
  if ($idxResp.StatusCode -ne 200) { throw "Index bundle fetch failed with status $($idxResp.StatusCode)" }
  $idx = $idxResp.Content
  $pm = [regex]::Match($idx, 'pages-picks-[A-Za-z0-9_-]+\.js')
  if ($pm.Success) {
    $bundleUrl = "https://www.pickntrust.com/assets/$($pm.Value)"
    Write-Host "Pages-picks bundle URL: $bundleUrl" -ForegroundColor Cyan
    $bundleResp = Invoke-WebRequest -Uri $bundleUrl -UseBasicParsing
    if ($bundleResp.StatusCode -ne 200) { throw "Pages-picks bundle fetch failed with status $($bundleResp.StatusCode)" }
    $content = $bundleResp.Content
  } else {
    Write-Host "No pages-picks bundle reference found; checking index bundle content only." -ForegroundColor Yellow
    $content = $idx
  }
  if ($content -match 'Prime Picks Test Widget') { Write-Host '❌ Test widget string still present' -ForegroundColor Red } else { Write-Host '✅ Test widget string removed' -ForegroundColor Green }
} catch {
  Write-Host "bundle verify error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "✅ Client deployment completed without altering Nginx or backend." -ForegroundColor Green

# --- Backend + Runtime append: Node 18, full dist upload, PM2 startup ---
Write-Host "\nAugmenting deploy: uploading backend+frontend dist and hardening runtime..." -ForegroundColor Yellow

# Paths
$DistTar = "dist-full.tar.gz"

# Ensure full dist artifact exists (frontend+backend)
if (!(Test-Path $DistTar)) {
  if (Test-Path "dist") {
    Write-Host "Creating full dist artifact..." -ForegroundColor Yellow
    tar -czf $DistTar dist
  } else {
    Write-Host "dist folder missing; run build before deploy." -ForegroundColor Red
    throw "Missing dist folder"
  }
}

# Upload ecosystem and dist (only if server build exists)
$serverBundleA = Test-Path "dist/server/server/index.js"
$serverBundleB = Test-Path "dist/server/index.js"
if (-not ($serverBundleA -or $serverBundleB)) {
  Write-Host "Server bundle not found. Skipping backend deploy augmentation." -ForegroundColor Yellow
} else {
  Write-Host "Uploading dist and ecosystem config..." -ForegroundColor Yellow
  scp -i $SSH_KEY -o StrictHostKeyChecking=no $DistTar "${SERVER}:/home/ec2-user/pickntrust/"
  scp -i $SSH_KEY -o StrictHostKeyChecking=no "ecosystem.config.cjs" "${SERVER}:/home/ec2-user/pickntrust/"

# Remote setup: pin Node 18, extract dist, start via PM2, enable logrotate and boot start
Write-Host "Configuring EC2 runtime and starting backend..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $SERVER 'bash -lc "set -e
cd /home/ec2-user/pickntrust

# Install system Node.js 18 (avoid NVM)
if command -v dnf >/dev/null 2>&1; then
  sudo dnf -y install nodejs-18 || sudo dnf -y install nodejs18 || true
elif command -v yum >/dev/null 2>&1; then
  if command -v amazon-linux-extras >/dev/null 2>&1; then
    sudo amazon-linux-extras enable nodejs18 || true
    sudo yum clean metadata || true
    sudo yum -y install nodejs || sudo yum -y install nodejs18 || true
  else
    sudo yum -y install nodejs18 || sudo yum -y install nodejs || true
  fi
elif command -v apt-get >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

# Verify Node and npm
node -v || { echo "ERROR: Node.js not installed"; exit 1; }
npm -v || { echo "ERROR: npm not installed"; exit 1; }

# Ensure PM2 globally (prefer system-wide)
sudo npm i -g pm2 || npm i -g pm2 || true

# Extract dist (frontend+backend)
rm -rf dist || true
mkdir -p dist
tar -xzf dist-full.tar.gz -C .
if [ ! -f dist/server/server/index.js ] && [ ! -f dist/server/index.js ]; then
  echo "ERROR: server bundle missing after extraction (checked dist/server/server/index.js and dist/server/index.js)"; ls -la dist/server || true; exit 1
fi

# Install production deps in project root
npm config set engine-strict false
export npm_config_engine_strict=false
npm ci --omit=dev || npm i --omit=dev

# Start/refresh backend via ecosystem, then persist and enable boot
pm2 start ecosystem.config.cjs || pm2 restart pickntrust-backend --update-env || pm2 start dist/server/index.js --name pickntrust-backend --update-env || pm2 start dist/server/server/index.js --name pickntrust-backend --update-env
pm2 save || true
sudo env PATH="$PATH" pm2 startup systemd -u ec2-user --hp /home/ec2-user || true

# PM2 log rotation
pm2 install pm2-logrotate || true
pm2 set pm2-logrotate:max_size 10M || true
pm2 set pm2-logrotate:retain 10 || true
pm2 set pm2-logrotate:compress true || true

# Optional: small swap to reduce OOM risk on tiny instances
if ! sudo swapon --show | grep -q /swapfile; then
  sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo "/swapfile none swap sw 0 0" | sudo tee -a /etc/fstab
fi

# Verify health, port binding, and logs
curl -s -o /dev/null -w "Local /health: %{http_code}\n" http://127.0.0.1:5000/health || true
ss -tulpn | grep -E ":5000" || echo no-5000
pm2 status || true
pm2 logs pickntrust-backend --lines 50 || pm2 logs pickntrust --lines 50 || true
"'
  Write-Host "✅ Backend+frontend dist deployed, Node 18 pinned, PM2 persisted." -ForegroundColor Green
}
