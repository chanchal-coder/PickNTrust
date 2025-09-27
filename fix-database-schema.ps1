# Fix database schema mismatch by deploying the correct local database
$SERVER = "ubuntu@51.21.112.211"
$KEY_PATH = "C:\Users\sharm\OneDrive\Desktop\Apps\pntkey.pem"

Write-Host "=== FIXING DATABASE SCHEMA MISMATCH ===" -ForegroundColor Green

# First, backup the current deployed database
Write-Host "Backing up current deployed database..." -ForegroundColor Yellow
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no $SERVER "cd /home/ubuntu/PickNTrust && cp database.sqlite database.sqlite.backup && cp server/database.sqlite server/database.sqlite.backup 2>/dev/null || echo 'server/database.sqlite backup skipped'"

# Copy the local database to the server
Write-Host "Copying local database to server..." -ForegroundColor Yellow
scp -i "$KEY_PATH" -o StrictHostKeyChecking=no "server/database.sqlite" "${SERVER}:/home/ubuntu/PickNTrust/database.sqlite"
scp -i "$KEY_PATH" -o StrictHostKeyChecking=no "server/database.sqlite" "${SERVER}:/home/ubuntu/PickNTrust/server/database.sqlite"

# Verify the database was copied correctly
Write-Host "Verifying database structure..." -ForegroundColor Yellow
$verifyStructure = ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no $SERVER "cd /home/ubuntu/PickNTrust && sqlite3 database.sqlite 'PRAGMA table_info(unified_content);' | grep 'type'"
Write-Host "Type column check: $verifyStructure"

# Test a sample query
$testQuery = ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no $SERVER "cd /home/ubuntu/PickNTrust && sqlite3 database.sqlite 'SELECT id, title, type, status, price, category FROM unified_content LIMIT 3;'"
Write-Host "`nSample data with correct schema:" -ForegroundColor Cyan
Write-Host $testQuery

# Restart the PM2 process to pick up the new database
Write-Host "`nRestarting PM2 process..." -ForegroundColor Yellow
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no $SERVER "pm2 restart pickntrust-production"

Write-Host "`nDatabase schema fix complete!" -ForegroundColor Green
Write-Host "The local database with correct schema has been deployed to the server." -ForegroundColor Green