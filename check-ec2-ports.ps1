# Check EC2 server ports and configuration
$EC2_USER = "ubuntu"
$EC2_IP = "51.21.112.211"
$SSH_KEY = "C:\Users\sharm\OneDrive\Desktop\Apps\pntkey.pem"

Write-Host "Checking EC2 server ports and configuration..." -ForegroundColor Green

# Check all listening ports
Write-Host "Checking all listening ports..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'netstat -tlnp | grep LISTEN'

# Check Nginx configuration
Write-Host "`nChecking Nginx configuration..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'sudo nginx -t && sudo systemctl status nginx'

# Check what's running on port 80 and 443
Write-Host "`nChecking web server ports (80, 443)..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'sudo lsof -i :80 && echo "---" && sudo lsof -i :443'

# Check PM2 processes
Write-Host "`nChecking PM2 processes..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'pm2 list'

# Test the actual website
Write-Host "`nTesting website access..." -ForegroundColor Yellow
Write-Host "Testing http://$EC2_IP (port 80)..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://$EC2_IP" -TimeoutSec 10 -UseBasicParsing
    Write-Host "✅ Website accessible on port 80!" -ForegroundColor Green
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Website not accessible on port 80: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nPort check completed!" -ForegroundColor Green