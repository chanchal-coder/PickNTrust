# Fix Nginx proxy configuration on EC2
$EC2_USER = "ubuntu"
$EC2_IP = "51.21.112.211"
$SSH_KEY = "C:\Users\sharm\OneDrive\Desktop\Apps\pntkey.pem"

Write-Host "Fixing Nginx proxy configuration on EC2..." -ForegroundColor Green

# Check what port the app is actually running on
Write-Host "Checking what port the Node.js app is running on..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'pm2 show pickntrust | grep -E "port|listening"'

# Check if app is running on port 3000
Write-Host "Checking if app is running on port 3000..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'curl -s http://localhost:3000/api/products | head -5'

# Update Nginx configuration to proxy to port 3000
Write-Host "Updating Nginx configuration to proxy to port 3000..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'sudo sed -i "s/proxy_pass http:\/\/127.0.0.1:5000;/proxy_pass http:\/\/127.0.0.1:3000;/g" /etc/nginx/sites-available/default'

# Test Nginx configuration
Write-Host "Testing Nginx configuration..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'sudo nginx -t'

# Reload Nginx
Write-Host "Reloading Nginx..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'sudo systemctl reload nginx'

# Test the website
Write-Host "Testing website access..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
try {
    $response = Invoke-WebRequest -Uri "http://$EC2_IP" -TimeoutSec 10 -UseBasicParsing
    Write-Host "✅ Website is now accessible!" -ForegroundColor Green
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Website still not accessible: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Nginx proxy fix completed!" -ForegroundColor Green