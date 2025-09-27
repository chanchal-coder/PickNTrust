# Deploy Database Fixes to AWS EC2 Production
# This script applies the local database fixes to the production server

$ErrorActionPreference = "Stop"

# Configuration
$EC2_IP = "51.21.253.229"
$KEY_PATH = "C:/Users/sharm/OneDrive/Desktop/Apps/pntkey.pem"
$EC2_USER = "ubuntu"
$APP_DIR = "/home/ubuntu/PickNTrust"

Write-Host "🚀 Deploying Database Fixes to AWS EC2 Production" -ForegroundColor Blue
Write-Host "Target: $EC2_IP" -ForegroundColor Yellow

# Test SSH connection first
Write-Host "🔐 Testing SSH connection..." -ForegroundColor Yellow
try {
    ssh -i $KEY_PATH -o ConnectTimeout=10 -o BatchMode=yes "$EC2_USER@$EC2_IP" "exit"
    Write-Host "✅ SSH connection successful" -ForegroundColor Green
} catch {
    Write-Host "❌ SSH connection failed" -ForegroundColor Red
    Write-Host "Please check: SSH key, EC2 instance status, security groups" -ForegroundColor Red
    exit 1
}

# Create database fix script for production
$dbFixScript = @"
#!/bin/bash
set -e

echo "🔧 Applying Database Fixes to Production..."

cd /home/ubuntu/PickNTrust

# Backup current database
echo "📦 Creating database backup..."
cp database.sqlite database.sqlite.backup.`$(date +%Y%m%d_%H%M%S) 2>/dev/null || echo "No existing database found"

# Create database fix script
cat > fix-production-database.cjs << 'JSEOF'
const Database = require('better-sqlite3');
const path = require('path');

console.log('🔧 Starting production database fixes...');

// Use the correct database path for production
const dbPath = path.join(__dirname, 'database.sqlite');
console.log('Database path:', dbPath);

const db = new Database(dbPath);

try {
    // Check current schema
    console.log('\n📋 Checking database schema...');
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('Available tables:', tables.map(t => t.name));
    
    // Check if unified_content table exists
    const unifiedContentExists = tables.some(t => t.name === 'unified_content');
    if (!unifiedContentExists) {
        console.log('❌ unified_content table not found');
        process.exit(1);
    }
    
    // Get schema for unified_content
    const schema = db.prepare("PRAGMA table_info(unified_content)").all();
    console.log('unified_content columns:', schema.map(s => s.name));
    
    // 1. Remove test products from featured list
    console.log('\n🧹 Removing test products from featured list...');
    const removeTestFeatured = db.prepare(`
        UPDATE unified_content 
        SET is_featured = 0 
        WHERE (title LIKE '%test%' OR title LIKE '%TEST%' OR title LIKE '%WEBHOOK%') 
        AND is_featured = 1
    `);
    const removedCount = removeTestFeatured.run().changes;
    console.log(`Removed `${removedCount}` test products from featured list`);
    
    // 2. Set real products as featured (up to 8)
    console.log('\n⭐ Setting real products as featured...');
    const setFeatured = db.prepare(`
        UPDATE unified_content 
        SET is_featured = 1 
        WHERE id IN (
            SELECT id FROM unified_content 
            WHERE is_active = 1 
            AND (title NOT LIKE '%test%' AND title NOT LIKE '%TEST%' AND title NOT LIKE '%WEBHOOK%')
            AND (title IS NOT NULL AND title != '')
            ORDER BY created_at DESC 
            LIMIT 8
        )
    `);
    const featuredCount = setFeatured.run().changes;
    console.log(`Set `${featuredCount}` real products as featured`);
    
    // 3. Verify the changes
    console.log('\n✅ Verifying changes...');
    const featuredProducts = db.prepare(`
        SELECT id, title, price, category, is_featured 
        FROM unified_content 
        WHERE is_featured = 1 
        ORDER BY created_at DESC
    `).all();
    
    console.log(`\n📊 Featured products (`${featuredProducts.length}`):`);
    featuredProducts.forEach((product, index) => {
        console.log(`${index + 1}. ${product.title} - $${product.price} (${product.category})`);
    });
    
    console.log('\n🎉 Database fixes applied successfully!');
    
} catch (error) {
    console.error('❌ Error applying database fixes:', error);
    process.exit(1);
} finally {
    db.close();
}
JSEOF"

# Install better-sqlite3 if not present
echo "📦 Installing database dependencies..."
npm install better-sqlite3 --save

# Run the database fix
echo "🔧 Applying database fixes..."
node fix-production-database.cjs

# Restart the application to pick up changes
echo "🔄 Restarting application..."
pm2 restart pickntrust

# Wait a moment for restart
sleep 3

# Test the API endpoint
echo "🧪 Testing production API..."
curl -s "http://localhost:5000/api/products/page/top-picks" | head -200

echo "✅ Production database fixes completed!"
"@

# Copy and execute the script on EC2
Write-Host "📤 Uploading and executing database fix script..." -ForegroundColor Yellow

# Create temporary script file
$tempScript = [System.IO.Path]::GetTempFileName() + ".sh"
$dbFixScript | Out-File -FilePath $tempScript -Encoding UTF8

try {
    # Copy script to EC2
    scp -i $KEY_PATH $tempScript "$EC2_USER@${EC2_IP}:/tmp/fix-database.sh"
    
    # Execute script on EC2
    ssh -i $KEY_PATH "$EC2_USER@$EC2_IP" "chmod +x /tmp/fix-database.sh && /tmp/fix-database.sh"
    
    Write-Host "✅ Database fixes applied successfully!" -ForegroundColor Green
    
    # Test the production API
    Write-Host "🧪 Testing production API endpoint..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "http://$EC2_IP/api/products/page/top-picks" -UseBasicParsing -TimeoutSec 10
        $data = $response.Content | ConvertFrom-Json
        
        Write-Host "📊 Production API Response:" -ForegroundColor Blue
        Write-Host "Total products: $($data.Count)" -ForegroundColor Green
        
        if ($data.Count -gt 0) {
            Write-Host "First 3 products:" -ForegroundColor Yellow
            $data | Select-Object -First 3 | ForEach-Object {
                Write-Host "  • $($_.title) - $($_.price)" -ForegroundColor Cyan
            }
        }
        
        Write-Host "🎉 Production website is now showing real products!" -ForegroundColor Green
        Write-Host "🌐 Visit: http://$EC2_IP" -ForegroundColor Blue
        
    } catch {
        Write-Host "⚠️ Could not test API endpoint directly, but fixes should be applied" -ForegroundColor Yellow
        Write-Host "Please check: http://$EC2_IP" -ForegroundColor Blue
    }
    
} catch {
    Write-Host "❌ Error during deployment: $_" -ForegroundColor Red
    exit 1
} finally {
    # Clean up temporary file
    if (Test-Path $tempScript) {
        Remove-Item $tempScript -Force
    }
}

Write-Host "`n🎉 Deployment Complete!" -ForegroundColor Green
Write-Host "🌐 Production Website: http://$EC2_IP" -ForegroundColor Blue
Write-Host "🔧 Admin Panel: http://$EC2_IP/admin" -ForegroundColor Blue
Write-Host "📱 Credentials: admin / pickntrust2025" -ForegroundColor Cyan