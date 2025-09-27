# Debug and fix app port configuration on EC2
$EC2_USER = "ubuntu"
$EC2_IP = "51.21.112.211"
$SSH_KEY = "C:\Users\sharm\OneDrive\Desktop\Apps\pntkey.pem"

Write-Host "Debugging app port configuration on EC2..." -ForegroundColor Green

# Check PM2 configuration
Write-Host "Checking PM2 configuration..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'pm2 show pickntrust'

# Check what ports are actually listening
Write-Host "`nChecking listening ports..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'netstat -tlnp | grep node'

# Check the app's package.json or server configuration
Write-Host "`nChecking app configuration..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'cd /var/www/pickntrust && cat package.json | grep -A5 -B5 "start\|port"'

# Check environment variables
Write-Host "`nChecking environment variables..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'cd /var/www/pickntrust && cat .env 2>/dev/null || echo "No .env file found"'

# Check the actual server file for port configuration
Write-Host "`nChecking server file for port configuration..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'cd /var/www/pickntrust && find . -name "*.js" -o -name "*.ts" | head -5 | xargs grep -l "listen\|port" 2>/dev/null | head -3'

# Try to restart the app with explicit port 5000
Write-Host "`nRestarting app with PORT=5000..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'cd /var/www/pickntrust && PORT=5000 pm2 restart pickntrust --update-env'

# Wait and test
Write-Host "Waiting for app to restart..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Test the website
Write-Host "Testing website access..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://$EC2_IP" -TimeoutSec 15 -UseBasicParsing
    Write-Host "✅ Website is now accessible!" -ForegroundColor Green
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Website still not accessible: $($_.Exception.Message)" -ForegroundColor Red
    
    # Try testing port 3000 directly
    Write-Host "Testing port 3000 directly..." -ForegroundColor Yellow
    ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'curl -s http://localhost:3000 | head -10'
}

Write-Host "Debug completed!" -ForegroundColor Green