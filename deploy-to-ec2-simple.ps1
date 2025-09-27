# Simple EC2 deployment script for database fixes
$EC2_IP = "51.21.253.229"
$KEY_PATH = "C:\Users\sharm\OneDrive\Desktop\Apps\PickNTrust0\pickntrust-key.pem"
$EC2_USER = "ubuntu"

Write-Host "🚀 Deploying database fixes to EC2..." -ForegroundColor Green

# Test SSH connection
Write-Host "📡 Testing SSH connection..." -ForegroundColor Yellow
ssh -i $KEY_PATH -o ConnectTimeout=10 -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP "echo 'SSH connection successful'"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ SSH connection failed!" -ForegroundColor Red
    exit 1
}

# Copy the database fix script to EC2
Write-Host "📁 Copying database fix script to EC2..." -ForegroundColor Yellow
scp -i $KEY_PATH -o StrictHostKeyChecking=no "fix-production-database.cjs" "${EC2_USER}@${EC2_IP}:/home/ubuntu/PickNTrust/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to copy script!" -ForegroundColor Red
    exit 1
}

# Execute the database fixes on EC2
Write-Host "🔧 Executing database fixes on EC2..." -ForegroundColor Yellow
ssh -i $KEY_PATH -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_IP} 'cd /home/ubuntu/PickNTrust && echo "Installing database dependencies..." && npm install better-sqlite3 --save && echo "Running database fixes..." && node fix-production-database.cjs && echo "Restarting application..." && pm2 restart pickntrust && sleep 3 && echo "Testing API endpoint..." && curl -s http://localhost:5000/api/products/page/top-picks | head -200 && echo "Deployment completed!"'

Write-Host "EC2 deployment completed!" -ForegroundColor Green