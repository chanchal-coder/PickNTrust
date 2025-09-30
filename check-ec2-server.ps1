# Check EC2 server status and configuration
$EC2_USER = "ubuntu"
$EC2_IP = "51.21.112.211"
$SSH_KEY = "C:\Users\sharm\OneDrive\Desktop\Apps\pntkey.pem"

Write-Host "Checking EC2 server status..." -ForegroundColor Green

# Check PM2 status
Write-Host "Checking PM2 status..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'pm2 status'

# Check if server is running on port 3000
Write-Host "`nChecking if server is running on port 3000..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'netstat -tlnp | grep :3000'

# Check server logs
Write-Host "`nChecking server logs..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'pm2 logs --lines 10'

# Check database file location
Write-Host "`nChecking database files..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'find /var/www/pickntrust -name "*.sqlite" -o -name "*.db" 2>/dev/null'

# Check unified_content table directly
Write-Host "`nChecking unified_content table..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'cd ~ && node -e "const Database = require(\"better-sqlite3\"); const db = new Database(\"database.sqlite\"); console.log(\"Records:\", db.prepare(\"SELECT COUNT(*) as count FROM unified_content\").get()); db.close();"'

Write-Host "`nServer check completed!" -ForegroundColor Green