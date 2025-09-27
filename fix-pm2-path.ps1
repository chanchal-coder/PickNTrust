# Fix PM2 path configuration on EC2
$EC2_USER = "ubuntu"
$EC2_IP = "51.21.112.211"
$SSH_KEY = "C:\Users\sharm\OneDrive\Desktop\Apps\pntkey.pem"

Write-Host "Fixing PM2 path configuration on EC2..." -ForegroundColor Green

# Check current PM2 configuration
Write-Host "Checking current PM2 configuration..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'pm2 show pickntrust'

# Check what files exist in the correct directory
Write-Host "`nChecking files in /var/www/pickntrust..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'ls -la /var/www/pickntrust/'

# Check if there's a server file or package.json
Write-Host "`nChecking for server files..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'find /var/www/pickntrust -name "*.js" -o -name "package.json" | head -10'

# Check package.json for start script
Write-Host "`nChecking package.json start script..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'cd /var/www/pickntrust && cat package.json | grep -A5 -B5 "start"'

# Stop current PM2 process
Write-Host "`nStopping current PM2 process..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'pm2 stop pickntrust'

# Delete the problematic PM2 process
Write-Host "Deleting PM2 process..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'pm2 delete pickntrust'

# Start the app properly from the correct directory
Write-Host "`nStarting app from correct directory..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'cd /var/www/pickntrust && PORT=5000 pm2 start npm --name "pickntrust" -- start'

# Wait for startup
Write-Host "Waiting for app to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check PM2 status
Write-Host "`nChecking PM2 status..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'pm2 status'

# Test port 5000
Write-Host "`nTesting port 5000..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'curl -s -o /dev/null -w "%{http_code}" http://localhost:5000'

# Update nginx configuration to use the correct config
Write-Host "`nUpdating nginx configuration..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'sudo cp /var/www/pickntrust/nginx-pickntrust.conf /etc/nginx/sites-available/default 2>/dev/null || echo "Config file not found, using manual update"'

# Manual nginx update if config file doesn't exist
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'sudo sed -i "s/proxy_pass http:\/\/127.0.0.1:[0-9]*/proxy_pass http:\/\/127.0.0.1:5000/" /etc/nginx/sites-available/default'

# Test and reload nginx
Write-Host "Testing and reloading nginx..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'sudo nginx -t && sudo systemctl reload nginx'

# Final test
Write-Host "`nFinal website test..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
try {
    $response = Invoke-WebRequest -Uri "http://$EC2_IP" -TimeoutSec 15 -UseBasicParsing
    Write-Host "✅ Website is now accessible!" -ForegroundColor Green
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Content length: $($response.Content.Length) bytes" -ForegroundColor Green
} catch {
    Write-Host "❌ Website still not accessible: $($_.Exception.Message)" -ForegroundColor Red
    
    # Show PM2 logs for debugging
    Write-Host "`nShowing PM2 logs for debugging..." -ForegroundColor Yellow
    ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'pm2 logs pickntrust --lines 5'
}

Write-Host "PM2 path fix completed!" -ForegroundColor Green