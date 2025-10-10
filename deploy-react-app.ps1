# Deploy React App to Server (updated for ec2-user and new host)
$keyPath = "C:\Users\sharm\.ssh\pnt08.pem"
$serverIP = "51.20.55.153"
$username = "ec2-user"

Write-Host "Deploying React app to server..."

# Ensure remote dist/public directory exists (matches PM2 FRONTEND_STATIC_DIR)
$createDirCommand = "mkdir -p /home/ec2-user/pickntrust/dist/public"
ssh -o StrictHostKeyChecking=no -i $keyPath $username@$serverIP $createDirCommand

# Copy the built React app files from local dist/public
Write-Host "Copying React app files..."
scp -o StrictHostKeyChecking=no -r -i $keyPath "dist/public/*" $username@$serverIP":/home/ec2-user/pickntrust/dist/public/"

# Optional: Copy updated production server file if needed
if (Test-Path "production-server.js") {
  Write-Host "Copying updated server file..."
  scp -o StrictHostKeyChecking=no -i $keyPath "production-server.js" $username@$serverIP":/home/ec2-user/pickntrust/"
}

# Restart backend via PM2 (app name from ecosystem.config.cjs)
Write-Host "Restarting backend via PM2..."
$restartCommand = "pm2 restart pickntrust-backend || pm2 list"
ssh -o StrictHostKeyChecking=no -i $keyPath $username@$serverIP $restartCommand

Write-Host "Deployment complete!"