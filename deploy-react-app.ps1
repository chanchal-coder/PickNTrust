# Deploy React App to Server
$keyPath = "C:\AWSKeys\picktrust-key.pem"
$serverIP = "51.21.112.211"
$username = "ubuntu"

Write-Host "Deploying React app to server..."

# Create the client/dist directory structure on server
$createDirCommand = "mkdir -p /home/ubuntu/PickNTrust/client/dist"
ssh -o StrictHostKeyChecking=no -i $keyPath $username@$serverIP $createDirCommand

# Copy the built React app files
Write-Host "Copying React app files..."
scp -o StrictHostKeyChecking=no -r -i $keyPath "client/dist/*" $username@$serverIP":/home/ubuntu/PickNTrust/client/dist/"

# Copy the updated production server
Write-Host "Copying updated server file..."
scp -o StrictHostKeyChecking=no -i $keyPath "production-server.cjs" $username@$serverIP":/home/ubuntu/PickNTrust/"

# Restart the server
Write-Host "Restarting server..."
$restartCommand = "cd /home/ubuntu/PickNTrust && pm2 restart pickntrust-production"
ssh -o StrictHostKeyChecking=no -i $keyPath $username@$serverIP $restartCommand

Write-Host "Deployment complete!"