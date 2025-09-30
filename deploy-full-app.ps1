# Deploy Full PickNTrust App to EC2
$keyPath = "C:\Users\sharm\OneDrive\Desktop\Apps\pntkey.pem"
$server = "ubuntu@51.21.112.211"

Write-Host "Deploying PickNTrust application to EC2..."

# Create deployment package
Write-Host "Creating deployment package..."
if (Test-Path "deployment-package.tar.gz") {
    Remove-Item "deployment-package.tar.gz"
}

# Create tar with React build and server
tar -czf deployment-package.tar.gz -C client\dist . --transform 's,^,client/dist/,' production-server.js package.json

Write-Host "Uploading to EC2..."

# Upload via SSH using password-less connection (assuming key is properly configured)
ssh -o StrictHostKeyChecking=no -i $keyPath $server @"
# Stop existing PM2 processes
pm2 stop all
pm2 delete all

# Backup current setup
sudo cp -r /var/www/pickntrust /var/www/pickntrust-backup-$(date +%Y%m%d-%H%M%S) 2>/dev/null || true

# Create fresh directory
sudo mkdir -p /var/www/pickntrust/client/dist
sudo chown -R ubuntu:ubuntu /var/www/pickntrust
"@

# Upload files directly via SSH
Write-Host "Copying files..."
scp -o StrictHostKeyChecking=no -i $keyPath production-server.js "${server}:/var/www/pickntrust/"
scp -o StrictHostKeyChecking=no -i $keyPath react-app.tar.gz "${server}:/tmp/"

# Deploy on server
ssh -o StrictHostKeyChecking=no -i $keyPath $server @"
# Extract React app
cd /tmp
sudo tar -xzf react-app.tar.gz -C /var/www/pickntrust/client/dist/
rm react-app.tar.gz

# Set permissions
sudo chown -R ubuntu:ubuntu /var/www/pickntrust
sudo chmod -R 755 /var/www/pickntrust

# Install dependencies if needed
cd /var/www/pickntrust
npm install express cors sqlite3 --save 2>/dev/null || true

# Start the production server
pm2 start production-server.js --name "pickntrust-production"
pm2 save

echo 'PickNTrust application deployed successfully!'
pm2 status
"@

Write-Host "Deployment complete! Your PickNTrust website should now be live at http://51.21.112.211"