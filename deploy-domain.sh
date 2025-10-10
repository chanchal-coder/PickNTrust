#!/usr/bin/env bash
# Deploy PickNTrust to a given domain on a remote Linux server
# Usage: DOMAIN=example.com SERVER=ec2-user@1.2.3.4 KEY=~/.ssh/key.pem APP_DIR=/home/ec2-user/pickntrust ./deploy-domain.sh

set -euo pipefail

DOMAIN=${DOMAIN:-}
SERVER=${SERVER:-}
KEY=${KEY:-}
APP_DIR=${APP_DIR:-/home/ec2-user/pickntrust}

if [[ -z "$DOMAIN" || -z "$SERVER" || -z "$KEY" ]]; then
  echo "Usage: DOMAIN=<domain> SERVER=<user@ip> KEY=<ssh-key-path> [APP_DIR=/home/ec2-user/pickntrust] ./deploy-domain.sh"
  exit 1
fi

echo "Deploying PickNTrust to $DOMAIN on $SERVER"

ssh -i "$KEY" -o StrictHostKeyChecking=no "$SERVER" bash -s <<REMOTE
set -e

export DEBIAN_FRONTEND=noninteractive
if command -v apt >/dev/null 2>&1; then
  sudo apt update -y
  sudo apt install -y curl git nginx software-properties-common
  if ! command -v node >/dev/null 2>&1; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
  fi
  sudo apt install -y certbot
else
  sudo dnf update -y || sudo yum update -y
  sudo dnf install -y curl git nginx || sudo yum install -y curl git nginx
  if ! command -v node >/dev/null 2>&1; then
    curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
    sudo dnf install -y nodejs || sudo yum install -y nodejs
  fi
  sudo dnf install -y certbot || sudo yum install -y certbot
fi

if ! command -v pm2 >/dev/null 2>&1; then
  sudo npm install -g pm2
fi

sudo mkdir -p "$APP_DIR"
sudo chown -R \\$(id -un):\\$(id -gn) "$APP_DIR"

cd "$APP_DIR"
if [ -d .git ]; then
  git fetch --all
  git reset --hard origin/main || git reset --hard origin/master || true
  git clean -fd
else
  git clone https://github.com/chanchal-coder/PickNTrust.git "$APP_DIR"
  cd "$APP_DIR"
fi

npm install
node build-production.js

pm2 delete pickntrust-backend 2>/dev/null || true
pm2 start dist/server/server/index.js --name pickntrust-backend --env production
pm2 save

sudo mkdir -p /var/lib/letsencrypt

# HTTP server with ACME challenge and SPA/static serving
sudo tee /etc/nginx/conf.d/
cat > /tmp/${DOMAIN}.http.conf <<NGINXHTTP
server {
  listen 80;
  server_name ${DOMAIN} www.${DOMAIN};

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
  }
}

server {
  listen 443 ssl;
  server_name ${DOMAIN};
  ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;

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
  }
}
NGINXSSL

sudo mv /tmp/${DOMAIN}.ssl.conf /etc/nginx/conf.d/${DOMAIN}-ssl.conf
sudo nginx -t && sudo nginx -s reload

echo "Deployment finished"
REMOTE
REMOTE

echo "Done: https://$DOMAIN"