# Deploy unified_content table creation to EC2 with sudo
$EC2_USER = "ubuntu"
$EC2_IP = "51.21.112.211"
$SSH_KEY = "C:\Users\sharm\OneDrive\Desktop\Apps\pntkey.pem"

Write-Host "Creating unified_content table on EC2 with sudo..." -ForegroundColor Green

# Test SSH connection
Write-Host "Testing SSH connection..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o ConnectTimeout=10 -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP "echo 'SSH connection successful'"

if ($LASTEXITCODE -ne 0) {
    Write-Host "SSH connection failed!" -ForegroundColor Red
    exit 1
}

# Copy the table creation script
Write-Host "Copying table creation script..." -ForegroundColor Yellow
scp -i $SSH_KEY -o StrictHostKeyChecking=no "create-unified-table.cjs" "${EC2_USER}@${EC2_IP}:~/"

# Execute the script on EC2 with proper permissions
Write-Host "Installing better-sqlite3 and creating unified_content table..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'sudo chown -R ubuntu:ubuntu /var/www/pickntrust && cd /var/www/pickntrust && npm install better-sqlite3 && node ~/create-unified-table.cjs'

Write-Host "Table creation completed!" -ForegroundColor Green