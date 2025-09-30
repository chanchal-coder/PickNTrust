# Fix Nginx configuration on EC2 properly
$EC2_USER = "ubuntu"
$EC2_IP = "51.21.112.211"
$SSH_KEY = "C:\Users\sharm\OneDrive\Desktop\Apps\pntkey.pem"

Write-Host "Fixing Nginx configuration on EC2..." -ForegroundColor Green

# First, let's check the current Nginx config
Write-Host "Checking current Nginx configuration..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'cat /etc/nginx/sites-available/default | grep proxy_pass'

# Create a corrected Nginx config and upload it
Write-Host "Creating corrected Nginx configuration..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'cat > /tmp/nginx-config << EOF
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3000;
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

# Replace the Nginx config
Write-Host "Replacing Nginx configuration..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'sudo cp /tmp/nginx-config /etc/nginx/sites-available/default'

# Test and reload Nginx
Write-Host "Testing and reloading Nginx..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'sudo nginx -t && sudo systemctl reload nginx'

# Test the website
Write-Host "Testing website access..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
try {
    $response = Invoke-WebRequest -Uri "http://$EC2_IP" -TimeoutSec 15 -UseBasicParsing
    Write-Host "✅ Website is now accessible!" -ForegroundColor Green
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Content length: $($response.Content.Length) bytes" -ForegroundColor Green
} catch {
    Write-Host "❌ Website still not accessible: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Nginx configuration fix completed!" -ForegroundColor Green