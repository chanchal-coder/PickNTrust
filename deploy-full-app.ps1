# Deploy Full PickNTrust App to EC2 (unified server)
$keyPath = "C:\Users\sharm\.ssh\pnt08.pem"
$server = "ec2-user@51.20.55.153"

Write-Host "Deploying PickNTrust application to EC2..."

# Package frontend if present
Write-Host "Packaging React app..."
if (Test-Path "react-app.tar.gz") { Remove-Item "react-app.tar.gz" }
if (Test-Path "client\dist") {
    tar -czf react-app.tar.gz -C client\dist .
    Write-Host "Packaged client/dist into react-app.tar.gz"
} else {
    Write-Host "client/dist not found; skipping frontend package"
}

Write-Host "Preparing remote host..."
ssh -o StrictHostKeyChecking=no -i $keyPath $server @"
set -e
pm2 stop all || true
pm2 delete all || true
sudo mkdir -p /var/www/pickntrust/client/dist
sudo chown -R ec2-user:ec2-user /var/www/pickntrust
"@

Write-Host "Uploading server and assets..."
scp -o StrictHostKeyChecking=no -i $keyPath production-server.js "${server}:/var/www/pickntrust/"
if (Test-Path "react-app.tar.gz") {
    scp -o StrictHostKeyChecking=no -i $keyPath react-app.tar.gz "${server}:/tmp/"
}

Write-Host "Deploying on remote..."
ssh -o StrictHostKeyChecking=no -i $keyPath $server @"
set -e
if [ -f /tmp/react-app.tar.gz ]; then
  cd /tmp
  sudo tar -xzf react-app.tar.gz -C /var/www/pickntrust/client/dist/
  rm react-app.tar.gz
fi
sudo chown -R ec2-user:ec2-user /var/www/pickntrust
sudo chmod -R 755 /var/www/pickntrust
cd /var/www/pickntrust
npm install express cors sqlite3 better-sqlite3 --save 2>/dev/null || true
pm2 start production-server.js --name "pickntrust-production"
pm2 save
echo 'PickNTrust application deployed successfully!'
pm2 status
"@

Write-Host "Deployment complete! Your PickNTrust website should now be live at http://51.20.55.153"