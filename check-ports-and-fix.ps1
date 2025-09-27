# Check ports and fix configuration on EC2
$EC2_USER = "ubuntu"
$EC2_IP = "51.21.112.211"
$SSH_KEY = "C:\Users\sharm\OneDrive\Desktop\Apps\pntkey.pem"

Write-Host "Checking ports and fixing configuration on EC2..." -ForegroundColor Green

# Check what ports are actually listening
Write-Host "Checking all listening ports..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'netstat -tlnp | grep LISTEN'

Write-Host "`nChecking Node.js processes specifically..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'ps aux | grep node'

# Test both ports 3000 and 5000 directly
Write-Host "`nTesting port 3000 directly..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "Port 3000 not responding"'

Write-Host "`nTesting port 5000 directly..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'curl -s -o /dev/null -w "%{http_code}" http://localhost:5000 || echo "Port 5000 not responding"'

Write-Host "`nTesting port 5173 directly..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 || echo "Port 5173 not responding"'

# Check PM2 logs for any errors
Write-Host "`nChecking PM2 logs..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'pm2 logs pickntrust --lines 10'

# Check if the app is actually starting properly
Write-Host "`nChecking PM2 status..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'pm2 status'

# Try to restart with explicit port and check immediately
Write-Host "`nRestarting with PORT=5000 and checking immediately..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'cd /var/www/pickntrust && PORT=5000 pm2 restart pickntrust --update-env && sleep 5 && curl -s -o /dev/null -w "%{http_code}" http://localhost:5000'

# Update Nginx to point to the correct port
Write-Host "`nUpdating Nginx to point to port 5000..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'sudo sed -i "s/proxy_pass http:\/\/127.0.0.1:[0-9]*/proxy_pass http:\/\/127.0.0.1:5000/" /etc/nginx/sites-available/default'

# Test and reload Nginx
Write-Host "Testing and reloading Nginx..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'sudo nginx -t && sudo systemctl reload nginx'

# Final test
Write-Host "`nFinal website test..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
try {
    $response = Invoke-WebRequest -Uri "http://$EC2_IP" -TimeoutSec 15 -UseBasicParsing
    Write-Host "✅ Website is now accessible!" -ForegroundColor Green
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Content preview: $($response.Content.Substring(0, [Math]::Min(200, $response.Content.Length)))" -ForegroundColor Green
} catch {
    Write-Host "❌ Website still not accessible: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Port check and fix completed!" -ForegroundColor Green