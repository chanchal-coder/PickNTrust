#!/bin/bash
# Safe client deploy script for EC2 (no Nginx or backend changes)
# Usage:
#   deploy-client            # extract /home/ec2-user/pickntrust/pickntrust-client.tar.gz into client/dist/public and reload Nginx
#   RESTART_PM2=1 deploy-client   # additionally restart PM2 app 'pickntrust' with updated env

set -euo pipefail

ARTIFACT_PATH="/home/ec2-user/pickntrust/pickntrust-client.tar.gz"
TARGET_DIR="/home/ec2-user/pickntrust/client/dist/public"
APP_NAME="pickntrust"

# Ensure target directory exists and permissions are correct
sudo mkdir -p "$TARGET_DIR"
sudo chown -R ec2-user:ec2-user /home/ec2-user/pickntrust

# Extract client artifact if present
if [[ -f "$ARTIFACT_PATH" ]]; then
  echo "Extracting client artifact to $TARGET_DIR..."
  tar -xzf "$ARTIFACT_PATH" -C "$TARGET_DIR"
  rm -f "$ARTIFACT_PATH"
else
  echo "WARNING: Artifact not found at $ARTIFACT_PATH. Upload the tar first."
fi

# Test and reload Nginx
echo "Testing Nginx config..."
sudo nginx -t

echo "Reloading Nginx..."
sudo systemctl reload nginx

# Optional PM2 restart
if [[ "${RESTART_PM2:-0}" == "1" ]]; then
  echo "Restarting PM2 app: $APP_NAME"
  pm2 restart "$APP_NAME" --update-env || echo "PM2 restart failed or app not found."
fi

# Quick local validation
echo "Local HTTPS checks:"
curl -sk -I https://localhost/health | head -n 5 || true
curl -sk -I https://localhost/api/status | head -n 5 || true

echo "✅ Client deploy script completed."