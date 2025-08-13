#!/bin/bash

echo "PICKNTRUST DIAGNOSTIC - FINDING THE EXACT ISSUE"
echo "==============================================="

echo "1. CURRENT DIRECTORY AND FILES:"
pwd
ls -la

echo ""
echo "2. NODE AND NPM VERSIONS:"
node --version
npm --version

echo ""
echo "3. PM2 STATUS:"
pm2 status
pm2 list

echo ""
echo "4. BUILD FILES CHECK:"
echo "Checking dist/server/index.js:"
ls -la dist/server/index.js 2>/dev/null || echo "MISSING: dist/server/index.js"

echo "Checking dist/public/index.html:"
ls -la dist/public/index.html 2>/dev/null || echo "MISSING: dist/public/index.html"

echo ""
echo "5. ECOSYSTEM CONFIG:"
echo "Checking ecosystem.config.cjs:"
ls -la ecosystem.config.cjs 2>/dev/null || echo "MISSING: ecosystem.config.cjs"

if [ -f "ecosystem.config.cjs" ]; then
    echo "Content of ecosystem.config.cjs:"
    cat ecosystem.config.cjs
fi

echo ""
echo "6. PACKAGE.JSON SCRIPTS:"
if [ -f "package.json" ]; then
    echo "Build script from package.json:"
    grep -A 5 '"scripts"' package.json
fi

echo ""
echo "7. PROCESS CHECK:"
echo "Processes using port 5000:"
sudo netstat -tlnp | grep :5000 || echo "Nothing on port 5000"

echo "Processes using port 80:"
sudo netstat -tlnp | grep :80 || echo "Nothing on port 80"

echo ""
echo "8. NGINX STATUS:"
sudo systemctl status nginx --no-pager || echo "Nginx not running"

echo ""
echo "9. RECENT PM2 LOGS:"
pm2 logs --lines 10 2>/dev/null || echo "No PM2 logs available"

echo ""
echo "10. TRYING TO START PM2 MANUALLY:"
echo "Attempting: pm2 start ecosystem.config.cjs"
pm2 start ecosystem.config.cjs 2>&1

echo ""
echo "PM2 status after manual start:"
pm2 status

echo ""
echo "11. TESTING BACKEND DIRECTLY:"
echo "Testing if backend responds on port 5000:"
curl -v http://localhost:5000 2>&1 | head -10

echo ""
echo "DIAGNOSTIC COMPLETE - PLEASE SHARE THIS OUTPUT"
