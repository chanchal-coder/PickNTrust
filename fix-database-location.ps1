# Fix database location on EC2
$EC2_USER = "ubuntu"
$EC2_IP = "51.21.112.211"
$SSH_KEY = "C:\Users\sharm\OneDrive\Desktop\Apps\pntkey.pem"

Write-Host "Fixing database location on EC2..." -ForegroundColor Green

# Move database to correct location and restart server
Write-Host "Moving database and restarting server..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'sudo cp /home/ubuntu/database.sqlite /var/www/pickntrust/database.sqlite && sudo chown ubuntu:ubuntu /var/www/pickntrust/database.sqlite && pm2 restart pickntrust'

# Wait a moment for server to restart
Write-Host "Waiting for server to restart..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Test the API endpoints
Write-Host "Testing API endpoints..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'curl -s http://localhost:3000/api/products'

Write-Host "`nDatabase location fixed!" -ForegroundColor Green