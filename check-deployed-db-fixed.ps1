# Check deployed database structure and data
$SERVER = "ubuntu@51.21.112.211"
$KEY_PATH = "C:\Users\sharm\OneDrive\Desktop\Apps\pntkey.pem"

Write-Host "=== CHECKING DEPLOYED DATABASE ===" -ForegroundColor Green

# Execute commands directly via SSH instead of creating a script file
Write-Host "Checking database on server..." -ForegroundColor Yellow

# Check if database exists and get basic info
$dbExists = ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no $SERVER "cd /home/ubuntu/PickNTrust && ls -la server/database.sqlite 2>/dev/null || echo 'Database not found'"
Write-Host "Database file check:" -ForegroundColor Cyan
Write-Host $dbExists

# Get tables
$tables = ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no $SERVER "cd /home/ubuntu/PickNTrust && sqlite3 server/database.sqlite '.tables' 2>/dev/null || echo 'Cannot access database'"
Write-Host "`nTables:" -ForegroundColor Cyan
Write-Host $tables

# Check unified_content structure
$structure = ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no $SERVER "cd /home/ubuntu/PickNTrust && sqlite3 server/database.sqlite 'PRAGMA table_info(unified_content);' 2>/dev/null || echo 'Cannot get table info'"
Write-Host "`nUnified Content Structure:" -ForegroundColor Cyan
Write-Host $structure

# Get sample data
$sampleData = ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no $SERVER "cd /home/ubuntu/PickNTrust && sqlite3 server/database.sqlite 'SELECT id, title, type, status, price, category FROM unified_content LIMIT 5;' 2>/dev/null || echo 'Cannot get sample data'"
Write-Host "`nSample Data:" -ForegroundColor Cyan
Write-Host $sampleData

# Get categories
$categories = ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no $SERVER "cd /home/ubuntu/PickNTrust && sqlite3 server/database.sqlite 'SELECT * FROM categories;' 2>/dev/null || echo 'Cannot get categories'"
Write-Host "`nCategories:" -ForegroundColor Cyan
Write-Host $categories

# Get counts
$counts = ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no $SERVER "cd /home/ubuntu/PickNTrust && sqlite3 server/database.sqlite 'SELECT COUNT(*) FROM unified_content; SELECT COUNT(*) FROM categories;' 2>/dev/null || echo 'Cannot get counts'"
Write-Host "`nRecord Counts:" -ForegroundColor Cyan
Write-Host $counts

Write-Host "`nDatabase check complete!" -ForegroundColor Green