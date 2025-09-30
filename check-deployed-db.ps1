# Check deployed database structure and data
$SERVER = "ubuntu@51.21.112.211"
$KEY_PATH = "C:\Users\sharm\OneDrive\Desktop\Apps\pntkey.pem"

Write-Host "=== CHECKING DEPLOYED DATABASE ===" -ForegroundColor Green

# Create a temporary script to check the database on the server
$dbCheckScript = @"
#!/bin/bash
cd /home/ubuntu/PickNTrust
echo "=== DEPLOYED DATABASE ANALYSIS ==="

# Check if database exists
if [ -f "server/database.sqlite" ]; then
    echo "Database file exists: server/database.sqlite"
    
    # Get tables
    echo -e "\nTABLES:"
    sqlite3 server/database.sqlite ".tables"
    
    # Check unified_content structure
    echo -e "\nUNIFIED_CONTENT STRUCTURE:"
    sqlite3 server/database.sqlite "PRAGMA table_info(unified_content);"
    
    # Get sample data
    echo -e "\nUNIFIED_CONTENT SAMPLE DATA:"
    sqlite3 server/database.sqlite "SELECT id, title, type, status, price, category FROM unified_content LIMIT 10;"
    
    # Get categories
    echo -e "\nCATEGORIES:"
    sqlite3 server/database.sqlite "SELECT * FROM categories;"
    
    # Get counts
    echo -e "\nCOUNTS:"
    echo "unified_content: `$(sqlite3 server/database.sqlite "SELECT COUNT(*) FROM unified_content;")`"
    echo "categories: `$(sqlite3 server/database.sqlite "SELECT COUNT(*) FROM categories;")`"
    
else
    echo "Database file NOT FOUND at server/database.sqlite"
    echo "Looking for database files..."
    find /home/ubuntu/PickNTrust -name "*.sqlite" -o -name "*.db"
fi
"@

# Write the script to a temporary file
$dbCheckScript | Out-File -FilePath "temp-db-check.sh" -Encoding UTF8

# Copy and execute the script on the server
Write-Host "Copying database check script to server..." -ForegroundColor Yellow
scp -i "$KEY_PATH" -o StrictHostKeyChecking=no temp-db-check.sh "${SERVER}:/tmp/"

Write-Host "Executing database check on server..." -ForegroundColor Yellow
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no $SERVER "chmod +x /tmp/temp-db-check.sh && /tmp/temp-db-check.sh"

# Clean up
Remove-Item "temp-db-check.sh" -Force

Write-Host "Database check complete!" -ForegroundColor Green