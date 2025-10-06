#!/usr/bin/env bash
set -euo pipefail

# Admin password used to authenticate widget admin endpoints
WPWD="${ADMIN_PASSWORD:-pickntrust2025}"
BASE="http://127.0.0.1:5000"

echo "Purging widgets via admin API..."

# Collect widget IDs from admin list
IDS=$(curl -s -H "x-admin-password: ${WPWD}" "${BASE}/api/admin/widgets" \
  | tr -d '\n' \
  | sed 's/},{/}\n{/g' \
  | grep -o '"id":[0-9]*' \
  | awk -F: '{print $2}')

COUNT=0
for id in $IDS; do
  echo "Deleting widget ${id}"
  curl -s -X DELETE -H "x-admin-password: ${WPWD}" "${BASE}/api/admin/widgets/${id}" >/dev/null || true
  COUNT=$((COUNT+1))
done

echo "Deleted ${COUNT} widgets"
echo "Verifying prime-picks widgets:"
curl -s "${BASE}/api/widgets/prime-picks" | head -c 200; echo

echo "Done."