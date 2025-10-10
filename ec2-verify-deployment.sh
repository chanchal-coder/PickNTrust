#!/usr/bin/env bash

# Comprehensive deployment verification for PickNTrust on EC2
# Checks: Nginx config, TLS, static assets, PM2 backend, API health, DB presence

set -u

section() {
  echo "\n==== $1 ===="
}

safe_cmd() {
  # Run a command; never fail the whole script
  bash -lc "$1" || echo "(command failed) $1"
}

section "System info"
safe_cmd "uname -a"
safe_cmd "node -v || true"

section "Nginx config test"
safe_cmd "sudo nginx -t"

section "Nginx important directives"
safe_cmd "sudo nginx -T 2>/dev/null | grep -E \"server_name|root|listen 443|listen 80\" | sed -E 's/^\s+//' | uniq | head -n 120"

section "HTTPS index headers"
safe_cmd "curl -skI https://pickntrust.com/ | head -n 20"

WEB_ROOT="/home/ec2-user/pickntrust/public"
INDEX_HTML="$WEB_ROOT/index.html"

section "Index asset reference"
if [ -f "$INDEX_HTML" ]; then
  ASSET=$(grep -Eo 'assets/index-[^"]+\.js' "$INDEX_HTML" | head -1 || true)
  echo "Index path: $INDEX_HTML"
  echo "Parsed asset: ${ASSET:-<none>}"
  if [ -n "$ASSET" ]; then
    safe_cmd "curl -skI https://pickntrust.com/$ASSET | head -n 20"
  else
    echo "No index asset reference found."
  fi
else
  echo "Index not found at $INDEX_HTML"
fi

section "Index asset hash on server"
if [ -n "${ASSET:-}" ]; then
  LOCAL_ASSET_PATH="$WEB_ROOT/${ASSET}"
  if [ -f "$LOCAL_ASSET_PATH" ]; then
    if command -v sha256sum >/dev/null 2>&1; then
      safe_cmd "echo -n 'RemoteAsset='; basename '$LOCAL_ASSET_PATH'"
      safe_cmd "sha256sum '$LOCAL_ASSET_PATH' | awk '{print \"RemoteSHA256=\" $1}'"
      safe_cmd "ls -lh '$LOCAL_ASSET_PATH'"
    else
      echo "sha256sum not available"
    fi
  else
    echo "Asset file missing on disk: $LOCAL_ASSET_PATH"
  fi
else
  echo "No asset parsed from index.html"
fi

section "Public directory listing (top 40)"
safe_cmd "ls -la $WEB_ROOT | head -n 40"

section "PM2 status"
if command -v pm2 >/dev/null 2>&1; then
  safe_cmd "pm2 status"
else
  echo "pm2 not installed or not in PATH"
fi

section "Backend port binding"
safe_cmd "(ss -tulpn 2>/dev/null || netstat -tulpn 2>/dev/null) | grep -E ':5000' || echo 'no process bound to :5000'"

section "Local API /health"
safe_cmd "curl -s -o /dev/null -w 'Local /health code: %{http_code}\n' http://127.0.0.1:5000/health"

section "Public /health via HTTPS"
safe_cmd "curl -s -o /dev/null -w 'HTTPS /health code: %{http_code}\n' https://pickntrust.com/health"

DB_PATH="/home/ec2-user/pickntrust/database.sqlite"
section "Database presence"
if [ -f "$DB_PATH" ]; then
  ls -lh "$DB_PATH"
  if command -v sqlite3 >/dev/null 2>&1; then
    section "DB tables sample"
    safe_cmd "sqlite3 '$DB_PATH' '.tables' | sed -E 's/\s+/ /g' | head -n 1"
    section "unified_content count"
    safe_cmd "sqlite3 '$DB_PATH' 'SELECT COUNT(*) FROM unified_content;'"
  else
    echo "sqlite3 not available"
  fi
else
  echo "Database file not found: $DB_PATH"
fi

section "Recent files in web root"
safe_cmd "find '$WEB_ROOT' -maxdepth 1 -type f -printf '%TY-%Tm-%Td %TH:%TM %p\n' 2>/dev/null | sort -r | head -n 20"

section "Done"
echo "Verification completed."