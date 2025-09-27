# Test EC2 API endpoints
$EC2_USER = "ubuntu"
$EC2_IP = "51.21.112.211"
$SSH_KEY = "C:\Users\sharm\OneDrive\Desktop\Apps\pntkey.pem"

Write-Host "Testing EC2 API endpoints..." -ForegroundColor Green

# Test the API endpoints via SSH
Write-Host "Testing /api/products endpoint..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'curl -s http://localhost:3000/api/products | head -20'

Write-Host "`nTesting /api/featured endpoint..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'curl -s http://localhost:3000/api/featured | head -20'

Write-Host "`nTesting direct database query..." -ForegroundColor Yellow
ssh -i $SSH_KEY -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP 'cd ~ && echo "const Database = require(\"better-sqlite3\"); const db = new Database(\"database.sqlite\"); console.log(JSON.stringify(db.prepare(\"SELECT * FROM unified_content LIMIT 3\").all(), null, 2)); db.close();" | node'

Write-Host "`nAPI testing completed!" -ForegroundColor Green