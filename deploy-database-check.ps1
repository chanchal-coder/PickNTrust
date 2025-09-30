# EC2 database check deployment script
$EC2_IP = "51.21.112.211"
$KEY_PATH = "C:\Users\sharm\OneDrive\Desktop\Apps\pntkey.pem"
$EC2_USER = "ubuntu"

Write-Host "Checking production database on EC2..." -ForegroundColor Green

# Test SSH connection
Write-Host "Testing SSH connection..." -ForegroundColor Yellow
ssh -i $KEY_PATH -o ConnectTimeout=10 -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP "echo 'SSH connection successful'"

if ($LASTEXITCODE -ne 0) {
    Write-Host "SSH connection failed!" -ForegroundColor Red
    exit 1
}

# Copy the database check script to EC2
Write-Host "Copying database check script to EC2..." -ForegroundColor Yellow
scp -i $KEY_PATH -o StrictHostKeyChecking=no "check-production-database.cjs" "${EC2_USER}@${EC2_IP}:/home/ubuntu/PickNTrust/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to copy script!" -ForegroundColor Red
    exit 1
}

# Execute the database check on EC2
Write-Host "Running database check on EC2..." -ForegroundColor Yellow
ssh -i $KEY_PATH -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_IP} 'cd /home/ubuntu/PickNTrust && echo "Installing dependencies..." && npm install better-sqlite3 --save && echo "Running database check..." && node check-production-database.cjs'

Write-Host "Database check completed!" -ForegroundColor Green