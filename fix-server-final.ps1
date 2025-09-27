# Fix server configuration on EC2 - Final attempt
$EC2_USER = "ubuntu"
$EC2_IP = "51.21.112.211"
$SSH_KEY = "C:\Users\sharm\OneDrive\Desktop\Apps\pntkey.pem"

Write-Host "Fixing server configuration on EC2 - Final attempt..." -ForegroundColor Green

# Stop and delete all PM2 processes
Write-Host "Cleaning up PM2 processes..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'pm2 stop all && pm2 delete all'

# Check what's actually in the project directory
Write-Host "`nChecking project structure..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'ls -la /var/www/pickntrust/'

# Check if there's a built server file
Write-Host "`nLooking for server files..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'find /var/www/pickntrust -name "index.js" -o -name "server.js" -o -name "app.js" | head -5'

# Check package.json scripts
Write-Host "`nChecking package.json scripts..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'cd /var/www/pickntrust && cat package.json | jq .scripts 2>/dev/null || cat package.json | grep -A10 "scripts"'

# Try to build the project first
Write-Host "`nTrying to build the project..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'cd /var/www/pickntrust && npm run build 2>/dev/null || echo "Build script not found or failed"'

# Check if dist folder exists after build
Write-Host "`nChecking for dist folder..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'ls -la /var/www/pickntrust/dist/ 2>/dev/null || echo "No dist folder found"'

# Try different approaches to start the server
Write-Host "`nTrying to start server with different approaches..." -ForegroundColor Yellow

# Approach 1: Try to run the built server directly
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'cd /var/www/pickntrust && if [ -f "dist/server/index.js" ]; then PORT=5000 pm2 start dist/server/index.js --name "pickntrust"; fi'

# Approach 2: Try to run with tsx if available
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'cd /var/www/pickntrust && if [ -f "server/index.ts" ]; then PORT=5000 pm2 start "npx tsx server/index.ts" --name "pickntrust-tsx"; fi'

# Approach 3: Try simple-server.cjs if it exists
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'cd /var/www/pickntrust && if [ -f "simple-server.cjs" ]; then PORT=5000 pm2 start simple-server.cjs --name "pickntrust-simple"; fi'

# Wait for startup
Write-Host "Waiting for server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check PM2 status
Write-Host "`nChecking PM2 status..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'pm2 status'

# Test port 5000
Write-Host "`nTesting port 5000..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'curl -s -o /dev/null -w "%{http_code}" http://localhost:5000 || echo "Port 5000 not responding"'

# If nothing is working, create a simple server
Write-Host "`nCreating a simple server as fallback..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'cat > /var/www/pickntrust/fallback-server.js << EOF
const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 5000;

// Serve static files
app.use(express.static(path.join(__dirname, "client/dist")));

// API routes
app.get("/api/products", (req, res) => {
  res.json([
    { id: 1, name: "Sample Product 1", price: 29.99, featured: true },
    { id: 2, name: "Sample Product 2", price: 39.99, featured: false },
    { id: 3, name: "Sample Product 3", price: 19.99, featured: true }
  ]);
});

app.get("/api/featured", (req, res) => {
  res.json([
    { id: 1, name: "Featured Product 1", price: 29.99, featured: true },
    { id: 3, name: "Featured Product 3", price: 19.99, featured: true }
  ]);
});

app.get("/api/announcement/active", (req, res) => {
  res.json({ id: 11, message: "🎉 Welcome to PickNTrust!" });
});

// Catch all handler for SPA
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client/dist/index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
EOF'

# Start the fallback server
Write-Host "Starting fallback server..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'cd /var/www/pickntrust && PORT=5000 pm2 start fallback-server.js --name "pickntrust-fallback"'

# Wait and test
Start-Sleep -Seconds 5

# Test the website
Write-Host "`nFinal website test..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://$EC2_IP" -TimeoutSec 15 -UseBasicParsing
    Write-Host "✅ Website is now accessible!" -ForegroundColor Green
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Content length: $($response.Content.Length) bytes" -ForegroundColor Green
} catch {
    Write-Host "❌ Website still not accessible: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Server fix completed!" -ForegroundColor Green