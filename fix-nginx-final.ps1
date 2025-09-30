# Fix nginx configuration - Final attempt
$EC2_USER = "ubuntu"
$EC2_IP = "51.21.112.211"
$SSH_KEY = "C:\Users\sharm\OneDrive\Desktop\Apps\pntkey.pem"

Write-Host "Fixing nginx configuration - Final attempt..." -ForegroundColor Green

# Check current nginx configuration
Write-Host "Checking current nginx configuration..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'cat /etc/nginx/sites-available/default | grep proxy_pass'

# Test if the server is actually running on port 5000
Write-Host "`nTesting server on port 5000..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'curl -s http://localhost:5000 | head -5'

# Check PM2 status
Write-Host "`nChecking PM2 status..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'pm2 status'

# Create a proper nginx configuration
Write-Host "`nCreating proper nginx configuration..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'sudo tee /etc/nginx/sites-available/default > /dev/null << EOF
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Browser compatibility headers
        add_header "Access-Control-Allow-Origin" "*" always;
        add_header "Access-Control-Allow-Methods" "GET, POST, OPTIONS" always;
        add_header "Access-Control-Allow-Headers" "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range" always;
        
        # Handle preflight requests
        if (\$request_method = "OPTIONS") {
            add_header "Access-Control-Allow-Origin" "*";
            add_header "Access-Control-Allow-Methods" "GET, POST, OPTIONS";
            add_header "Access-Control-Allow-Headers" "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range";
            add_header "Access-Control-Max-Age" 1728000;
            add_header "Content-Type" "text/plain; charset=utf-8";
            add_header "Content-Length" 0;
            return 204;
        }
    }
}
EOF'

# Test nginx configuration
Write-Host "Testing nginx configuration..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'sudo nginx -t'

# Reload nginx
Write-Host "Reloading nginx..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'sudo systemctl reload nginx'

# Check nginx status
Write-Host "`nChecking nginx status..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'sudo systemctl status nginx --no-pager -l'

# Wait a moment for everything to settle
Write-Host "Waiting for services to settle..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Test the website multiple times
Write-Host "`nTesting website access (attempt 1)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://$EC2_IP" -TimeoutSec 20 -UseBasicParsing
    Write-Host "✅ Website is accessible!" -ForegroundColor Green
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Content length: $($response.Content.Length) bytes" -ForegroundColor Green
    
    # Test API endpoints
    Write-Host "`nTesting API endpoints..." -ForegroundColor Yellow
    try {
        $apiResponse = Invoke-WebRequest -Uri "http://$EC2_IP/api/products" -TimeoutSec 15 -UseBasicParsing
        Write-Host "✅ API endpoint working!" -ForegroundColor Green
        Write-Host "API Status: $($apiResponse.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ API endpoint issue: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Website not accessible (attempt 1): $($_.Exception.Message)" -ForegroundColor Red
    
    # Try a second time
    Write-Host "`nTesting website access (attempt 2)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    try {
        $response2 = Invoke-WebRequest -Uri "http://$EC2_IP" -TimeoutSec 20 -UseBasicParsing
        Write-Host "✅ Website is accessible on second attempt!" -ForegroundColor Green
        Write-Host "Status: $($response2.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "❌ Website still not accessible (attempt 2): $($_.Exception.Message)" -ForegroundColor Red
        
        # Show debugging info
        Write-Host "`nDebugging information..." -ForegroundColor Yellow
        ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'curl -v http://localhost:5000 2>&1 | head -10'
    }
}

Write-Host "`nNginx fix completed!" -ForegroundColor Green