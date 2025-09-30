# Fix Website Simple - Complete EC2 Server Fix
# This script will fix the PM2 process and get the website working

$EC2_IP = "51.21.112.211"
$EC2_USER = "ubuntu"
$KEY_PATH = "C:\Users\sharm\.ssh\pickntrust-key.pem"

Write-Host "=== FIXING WEBSITE - SIMPLE APPROACH ===" -ForegroundColor Green

# Step 1: Stop all existing PM2 processes
Write-Host "`n1. Cleaning up existing PM2 processes..." -ForegroundColor Yellow
ssh -i $KEY_PATH $EC2_USER@$EC2_IP "pm2 stop all && pm2 delete all"

# Step 2: Check the correct application directory
Write-Host "`n2. Checking application directory..." -ForegroundColor Yellow
ssh -i $KEY_PATH $EC2_USER@$EC2_IP "ls -la /var/www/pickntrust/"

# Step 3: Start the application using the simple server
Write-Host "`n3. Starting application with simple server..." -ForegroundColor Yellow
ssh -i $KEY_PATH $EC2_USER@$EC2_IP "cd /var/www/pickntrust && PORT=5000 pm2 start simple-server.cjs --name pickntrust-app"

# Step 4: Check PM2 status
Write-Host "`n4. Checking PM2 status..." -ForegroundColor Yellow
ssh -i $KEY_PATH $EC2_USER@$EC2_IP "pm2 status"

# Step 5: Test if the server is responding on port 5000
Write-Host "`n5. Testing server on port 5000..." -ForegroundColor Yellow
ssh -i $KEY_PATH $EC2_USER@$EC2_IP "curl -s http://localhost:5000 || echo 'Port 5000 not responding'"

# Step 6: Update Nginx configuration
Write-Host "`n6. Updating Nginx configuration..." -ForegroundColor Yellow
$nginxConfig = @"
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
        proxy_cache_bypass `$http_upgrade;
        
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range' always;
        
        if (`$request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }
    }
}
"@

# Upload the nginx config
$nginxConfig | ssh -i $KEY_PATH $EC2_USER@$EC2_IP "sudo tee /etc/nginx/sites-available/default > /dev/null"

# Step 7: Test and reload Nginx
Write-Host "`n7. Testing and reloading Nginx..." -ForegroundColor Yellow
ssh -i $KEY_PATH $EC2_USER@$EC2_IP "sudo nginx -t && sudo systemctl reload nginx"

# Step 8: Wait for services to settle
Write-Host "`n8. Waiting for services to settle..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Step 9: Test website accessibility
Write-Host "`n9. Testing website accessibility..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://$EC2_IP" -TimeoutSec 10 -ErrorAction Stop
    Write-Host "✓ Website is accessible! Status: $($response.StatusCode)" -ForegroundColor Green
}
catch {
    Write-Host "✗ Website test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 10: Test API endpoint
Write-Host "`n10. Testing API endpoint..." -ForegroundColor Yellow
try {
    $apiResponse = Invoke-WebRequest -Uri "http://$EC2_IP/api/health" -TimeoutSec 10 -ErrorAction Stop
    Write-Host "✓ API is accessible! Status: $($apiResponse.StatusCode)" -ForegroundColor Green
}
catch {
    Write-Host "✗ API test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 11: Final status check
Write-Host "`n11. Final status check..." -ForegroundColor Yellow
ssh -i $KEY_PATH $EC2_USER@$EC2_IP "pm2 status"

Write-Host "`n=== WEBSITE FIX COMPLETE ===" -ForegroundColor Green
Write-Host "Your website should now be accessible at: http://$EC2_IP" -ForegroundColor Cyan