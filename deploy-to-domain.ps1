# Deploy PickNTrust to pickntrust.com domain
Write-Host "Deploying PickNTrust to pickntrust.com..." -ForegroundColor Green

# SSH key path
$SSH_KEY = "C:\Users\sharm\OneDrive\Desktop\Apps\pntkey.pem"
$SERVER = "ubuntu@51.21.112.211"

# 1. Create deployment package with React build
Write-Host "Creating React build..." -ForegroundColor Yellow
cd client
npm run build
cd ..

# 2. Create tar with React build
Write-Host "Creating deployment package..." -ForegroundColor Yellow
tar -czf pickntrust-full.tar.gz -C client/dist .

# 3. Copy database
Copy-Item "server/database.sqlite" "database.sqlite" -Force

# 4. Deploy React app to correct nginx location
Write-Host "Deploying React app to /home/ubuntu/PickNTrust/public..." -ForegroundColor Yellow
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no $SERVER "sudo mkdir -p /home/ubuntu/PickNTrust/public && sudo chown ubuntu:ubuntu /home/ubuntu/PickNTrust/public"
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no pickntrust-full.tar.gz "${SERVER}:/home/ubuntu/PickNTrust/"
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no $SERVER "cd /home/ubuntu/PickNTrust && tar -xzf pickntrust-full.tar.gz -C public && rm pickntrust-full.tar.gz"

# 5. Deploy backend server
Write-Host "Deploying backend server..." -ForegroundColor Yellow
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no production-server.js "${SERVER}:/home/ubuntu/PickNTrust/"
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no database.sqlite "${SERVER}:/home/ubuntu/PickNTrust/"

# 6. Install dependencies and restart server
Write-Host "Installing dependencies and restarting server..." -ForegroundColor Yellow
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no $SERVER "cd /home/ubuntu/PickNTrust && npm install express sqlite3 cors && pm2 stop pickntrust-production 2>/dev/null || true && pm2 start production-server.js --name pickntrust-production && pm2 save"

Write-Host "Deployment complete! Your PickNTrust app should now be live at https://pickntrust.com" -ForegroundColor Green
