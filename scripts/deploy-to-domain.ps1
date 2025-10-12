Param(
  [Parameter(Mandatory = $true)] [string]$Domain,
  [Parameter(Mandatory = $true)] [string]$Server,
  [Parameter(Mandatory = $true)] [string]$KeyPath,
  [string]$AppDir = "/home/ec2-user/pickntrust"
)

Write-Host "Deploying PickNTrust to $Domain on $Server" -ForegroundColor Cyan

if (!(Test-Path $KeyPath)) {
  Write-Error "SSH key not found: $KeyPath"
  exit 1
}

$prefix = "DOMAIN='$Domain'`nAPP_DIR='$AppDir'`n"

$remoteScript = @'
#!/usr/bin/env bash
set -e

echo "Deploying PickNTrust to $DOMAIN"

export DEBIAN_FRONTEND=noninteractive
if command -v apt >/dev/null 2>&1; then
  sudo apt update -y
  sudo apt install -y curl git nginx software-properties-common
  if ! command -v node >/dev/null 2>&1; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
  fi
  sudo apt install -y certbot || true
else
  sudo dnf update -y || sudo yum update -y
  sudo dnf install -y curl git nginx || sudo yum install -y curl git nginx
  if ! command -v node >/dev/null 2>&1; then
    curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
    sudo dnf install -y nodejs || sudo yum install -y nodejs
  fi
  sudo dnf install -y certbot || sudo yum install -y certbot || true
fi

if ! command -v pm2 >/dev/null 2>&1; then
  sudo npm install -g pm2
fi

sudo mkdir -p "$APP_DIR"
sudo chown -R $(id -un):$(id -gn) "$APP_DIR"

cd "$APP_DIR"
if [ -d .git ]; then
  git fetch --all
  git reset --hard origin/main || git reset --hard origin/master || true
  git clean -fd
else
  git clone https://github.com/chanchal-coder/PickNTrust.git "$APP_DIR"
  cd "$APP_DIR"
fi

# === Safe backup of current static site ===
mkdir -p "$APP_DIR/backups"
TS=$(date +"%Y%m%d-%H%M%S")
if [ -d "$APP_DIR/dist/public" ]; then
  echo "Creating backup of dist/public → backups/public-$TS.tar.gz"
  tar -C "$APP_DIR/dist" -czf "$APP_DIR/backups/public-$TS.tar.gz" public || echo "Backup of public failed (continuing)"
fi

npm install
node build-production.js

# Ensure .env exists with required runtime flags
touch .env
grep -q '^ENABLE_TELEGRAM_BOT=' .env || echo 'ENABLE_TELEGRAM_BOT=true' >> .env
grep -q '^PUBLIC_BASE_URL=' .env || echo 'PUBLIC_BASE_URL=https://pickntrust.com' >> .env
grep -q '^ALLOW_ANY_BOT_TOKEN=' .env || echo 'ALLOW_ANY_BOT_TOKEN=true' >> .env
grep -q '^DATABASE_URL=' .env || echo 'DATABASE_URL=file:./database.sqlite' >> .env
grep -q '^LOG_DB_PATH=' .env || echo 'LOG_DB_PATH=true' >> .env

# Install production dependencies (omit dev), tolerating engine strictness
npm config set engine-strict false
export npm_config_engine_strict=false
npm ci --omit=dev || npm i --omit=dev || true

# Start/refresh backend via ecosystem, persist and enable on boot
pm2 start ecosystem.config.cjs || pm2 restart pickntrust-backend --update-env || pm2 start dist/server/index.js --name pickntrust-backend --update-env || pm2 start dist/server/server/index.js --name pickntrust-backend --update-env
pm2 save || true
sudo env PATH="$PATH" pm2 startup systemd -u ec2-user --hp /home/ec2-user || true

# Ensure bot process is started separately for isolation
pm2 restart pickntrust-bot --update-env || pm2 start dist/server/server/telegram-bot.js --name pickntrust-bot --update-env || true

# PM2 log rotation
pm2 install pm2-logrotate || true
pm2 set pm2-logrotate:max_size 10M || true
pm2 set pm2-logrotate:retain 10 || true
pm2 set pm2-logrotate:compress true || true

# Optional swap to reduce OOM risk on tiny instances
if ! sudo swapon --show | grep -q /swapfile; then
  sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo "/swapfile none swap sw 0 0" | sudo tee -a /etc/fstab
fi

# Verify health, port binding, and logs
curl -s -o /dev/null -w "Local /health: %{http_code}\n" http://127.0.0.1:5000/health || true
(ss -tulpn 2>/dev/null || netstat -tulpn 2>/dev/null) | grep -E ":5000" || echo no-5000
pm2 status || true
pm2 logs pickntrust-backend --lines 50 || pm2 logs pickntrust --lines 50 || true

# Post-deploy: ensure PrimePicks fallback widget exists and verify API
if [ -f scripts/fix-fallback-widget.cjs ]; then
  node scripts/fix-fallback-widget.cjs || true
fi
curl -s -o /dev/null -w "PrimePicks header widgets: %{http_code}\n" https://pickntrust.com/api/widgets/prime-picks/header || true

# === Seed canonical form flags and verify counts ===
echo "Ensuring sqlite3 and seeding canonical form flags..."
if command -v apt >/dev/null 2>&1; then
  sudo apt install -y sqlite3 || true
else
  sudo dnf install -y sqlite || sudo yum install -y sqlite || true
fi

# Resolve database file path
DB_FILE=""
for p in "$APP_DIR/database.sqlite" "$APP_DIR/server/database.sqlite"; do
  if [ -f "$p" ]; then DB_FILE="$p"; break; fi
done
if [ -z "$DB_FILE" ]; then
  DB_FILE=$(find "$APP_DIR" -maxdepth 2 -name 'database.sqlite' | head -n 1 || true)
fi
echo "Database file: ${DB_FILE:-not found}"

SEED_SQL="$APP_DIR/scripts/seed-form-flags.sql"
if [ -n "$DB_FILE" ] && [ -f "$SEED_SQL" ]; then
  echo "Applying seed-form-flags.sql to $DB_FILE..."
  sqlite3 "$DB_FILE" < "$SEED_SQL" || echo "Seeding failed (continuing)"
fi

# Show DB counts
if [ -n "$DB_FILE" ]; then
  P_CNT=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM categories WHERE is_for_products=1 AND parent_id IS NULL;" || echo 0)
  S_CNT=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM categories WHERE is_for_services=1 AND parent_id IS NULL;" || echo 0)
  A_CNT=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM categories WHERE is_for_ai_apps=1 AND parent_id IS NULL;" || echo 0)
  echo "DB counts => Products: $P_CNT, Services: $S_CNT, Apps & AI: $A_CNT"
fi

# Verify public API counts using Node
node -e '
const https = require("https"), http = require("http");
const domain = process.env.DOMAIN || "'"$DOMAIN"'";
const proto = "https";
function get(path){return new Promise((resolve)=>{
  const url = `${proto}://${domain}${path}`;
  (proto==="https"?https:http).get(url, (res)=>{
    let data=""; res.on("data",d=>data+=d); res.on("end",()=>{try{
      const j = JSON.parse(data); const arr = Array.isArray(j)?j:(j.data||[]);
      resolve(Array.isArray(arr)?arr.length:0);
    }catch(e){resolve(0);}});
  }).on("error",()=>resolve(0));});}
(async()=>{
  const p = await get("/api/categories/forms/products");
  const s = await get("/api/categories/forms/services");
  const a = await get("/api/categories/forms/aiapps");
  console.log(`API counts => Products: ${p}, Services: ${s}, Apps & AI: ${a}`);
  if (p!==13 || s!==19 || a!==16) { process.exitCode = 1; }
})();
'

sudo mkdir -p /var/lib/letsencrypt

# HTTP server with ACME challenge and SPA/static serving
cat > /tmp/${DOMAIN}.http.conf <<NGINXHTTP
server {
  listen 80;
  server_name ${DOMAIN} www.${DOMAIN};
  client_max_body_size 50M;

  location ^~ /.well-known/acme-challenge/ {
    root /var/lib/letsencrypt;
    default_type "text/plain";
    try_files $uri =404;
  }

  root ${APP_DIR}/dist/public;
  index index.html index.htm;

  location /assets/ {
    try_files $uri $uri/ =404;
    add_header Cache-Control "public, max-age=31536000, immutable" always;
  }

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /api {
    proxy_pass http://127.0.0.1:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 300s;
    proxy_connect_timeout 75s;
    proxy_request_buffering off;
  }
}
NGINXHTTP

sudo mv /tmp/${DOMAIN}.http.conf /etc/nginx/conf.d/${DOMAIN}.conf
sudo nginx -t && sudo nginx -s reload

# Obtain certificate
sudo certbot certonly --webroot -w /var/lib/letsencrypt -d ${DOMAIN} -d www.${DOMAIN} --agree-tos -m admin@${DOMAIN} --non-interactive || true

# HTTPS servers
cat > /tmp/${DOMAIN}.ssl.conf <<NGINXSSL
server {
  listen 443 ssl;
  server_name www.${DOMAIN};
  ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
  client_max_body_size 50M;

  gzip on;
  gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

  root ${APP_DIR}/dist/public;
  index index.html index.htm;

  location = /index.html { add_header Cache-Control "no-cache, no-store, must-revalidate" always; }
  location /assets/ { try_files $uri $uri/ =404; add_header Cache-Control "public, max-age=31536000, immutable" always; }
  location / { try_files $uri $uri/ /index.html; }

  location /api {
    proxy_pass http://127.0.0.1:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 300s;
    proxy_connect_timeout 75s;
    proxy_request_buffering off;
  }
}

server {
  listen 443 ssl;
  server_name ${DOMAIN};
  ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
  client_max_body_size 50M;

  gzip on;
  gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

  root ${APP_DIR}/dist/public;
  index index.html index.htm;

  location = /index.html { add_header Cache-Control "no-cache, no-store, must-revalidate" always; }
  location /assets/ { try_files $uri $uri/ =404; add_header Cache-Control "public, max-age=31536000, immutable" always; }
  location / { try_files $uri $uri/ /index.html; }

  location /api {
    proxy_pass http://127.0.0.1:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 300s;
    proxy_connect_timeout 75s;
    proxy_request_buffering off;
  }
}
NGINXSSL

sudo mv /tmp/${DOMAIN}.ssl.conf /etc/nginx/conf.d/${DOMAIN}-ssl.conf
sudo nginx -t && sudo nginx -s reload

echo "Deployment finished"
'@

$fullScript = $prefix + $remoteScript

Write-Host "Running remote deploy script via SSH…" -ForegroundColor Yellow
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = "ssh"
$psi.Arguments = "-i `"$KeyPath`" -o StrictHostKeyChecking=no $Server bash -s"
$psi.RedirectStandardInput = $true
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$psi.UseShellExecute = $false
$proc = New-Object System.Diagnostics.Process
$proc.StartInfo = $psi
$proc.Start() | Out-Null
$proc.StandardInput.WriteLine($fullScript)
$proc.StandardInput.Close()

while (-not $proc.HasExited) { Start-Sleep -Milliseconds 200 }

Write-Host $proc.StandardOutput.ReadToEnd()
if ($proc.ExitCode -ne 0) {
  Write-Warning "Remote deploy script exited with code $($proc.ExitCode). See error output:"
  Write-Host $proc.StandardError.ReadToEnd()
  exit $proc.ExitCode
}

Write-Host "Done: https://$Domain" -ForegroundColor Green