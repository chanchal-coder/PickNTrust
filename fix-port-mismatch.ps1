# Fix port mismatch between nginx and server
$EC2_USER = "ubuntu"
$EC2_IP = "51.21.112.211"
$SSH_KEY = "C:\Users\sharm\OneDrive\Desktop\Apps\pntkey.pem"

Write-Host "Fixing port mismatch between nginx and server..." -ForegroundColor Green

# Check current nginx configuration
Write-Host "Current nginx configuration shows port 3000, but server is on port 5000" -ForegroundColor Yellow

# Update nginx to point to port 5000 (where our server is actually running)
Write-Host "`nUpdating nginx to point to port 5000..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'sudo sed -i "s/proxy_pass http:\/\/127\.0\.0\.1:3000/proxy_pass http:\/\/127.0.0.1:5000/" /etc/nginx/sites-available/default'

# Verify the change
Write-Host "`nVerifying nginx configuration change..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'grep proxy_pass /etc/nginx/sites-available/default'

# Test nginx configuration
Write-Host "`nTesting nginx configuration..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'sudo nginx -t'

# Reload nginx
Write-Host "Reloading nginx..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'sudo systemctl reload nginx'

# Check if server is actually running on port 5000
Write-Host "`nChecking if server is running on port 5000..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'curl -s -o /dev/null -w "%{http_code}" http://localhost:5000'

# Check PM2 status
Write-Host "`nChecking PM2 status..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'pm2 status'

# Wait for nginx to settle
Write-Host "Waiting for nginx to settle..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Test the website
Write-Host "`nTesting website access..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://$EC2_IP" -TimeoutSec 20 -UseBasicParsing
    Write-Host "✅ Website is now accessible!" -ForegroundColor Green
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Content length: $($response.Content.Length) bytes" -ForegroundColor Green
    
    # Test API endpoint
    Write-Host "`nTesting API endpoint..." -ForegroundColor Yellow
    try {
        $apiResponse = Invoke-WebRequest -Uri "http://$EC2_IP/api/products" -TimeoutSec 15 -UseBasicParsing
        Write-Host "✅ API endpoint working!" -ForegroundColor Green
        Write-Host "API Response: $($apiResponse.Content.Substring(0, [Math]::Min(100, $apiResponse.Content.Length)))" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ API endpoint issue: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Website still not accessible: $($_.Exception.Message)" -ForegroundColor Red
    
    # Additional debugging
    Write-Host "`nAdditional debugging..." -ForegroundColor Yellow
    ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'netstat -tlnp | grep :5000'
    ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'pm2 logs pickntrust-fallback --lines 3'
}

Write-Host "`nPort mismatch fix completed!" -ForegroundColor Green