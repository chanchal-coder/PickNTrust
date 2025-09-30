const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

console.log('🔍 Checking production database structure...');

// Check multiple possible database locations
const possiblePaths = [
    path.join(__dirname, 'database.sqlite'),
    path.join(__dirname, 'sqlite.db'),
    path.join(__dirname, 'server', 'database.sqlite'),
    path.join(__dirname, 'server', 'sqlite.db'),
    '/home/ubuntu/PickNTrust/database.sqlite',
    '/home/ubuntu/PickNTrust/sqlite.db',
    '/home/ubuntu/PickNTrust/server/database.sqlite',
    '/home/ubuntu/PickNTrust/server/sqlite.db'
];

console.log('📁 Checking possible database locations:');
possiblePaths.forEach(dbPath => {
    const exists = fs.existsSync(dbPath);
    console.log(`  ${exists ? '✅' : '❌'} ${dbPath}`);
});

// Find the actual database file
let dbPath = null;
for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath)) {
        dbPath = testPath;
        console.log(`\n🎯 Found database at: ${dbPath}`);
        break;
    }
}

if (!dbPath) {
    console.error('❌ No database file found!');
    console.log('\n📋 Available files in current directory:');
    try {
        const files = fs.readdirSync(__dirname);
        files.forEach(file => {
            if (file.includes('sqlite') || file.includes('db')) {
                console.log(`  - ${file}`);
            }
        });
    } catch (error) {
        console.error('Error reading directory:', error.message);
    }
    process.exit(1);
}

try {
    const db = new Database(dbPath);
    
    // Get all tables
    console.log('\n📊 Database tables:');
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    
    if (tables.length === 0) {
        console.log('  ❌ No tables found in database!');
    } else {
        tables.forEach(table => {
            console.log(`  - ${table.name}`);
        });
    }
    
    // Check for unified_content specifically
    const unifiedTable = tables.find(t => t.name === 'unified_content');
    if (unifiedTable) {
        console.log('\n✅ unified_content table exists!');
        
        // Get schema
        const schema = db.prepare("PRAGMA table_info(unified_content)").all();
        console.log('\n📋 unified_content schema:');
        schema.forEach(col => {
            console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''}`);
        });
        
        // Get row count
        const count = db.prepare("SELECT COUNT(*) as count FROM unified_content").get();
        console.log(`\n📈 Total rows: ${count.count}`);
        
        // Check for featured products
        const featuredCount = db.prepare("SELECT COUNT(*) as count FROM unified_content WHERE is_featured = 1").get();
        console.log(`🌟 Featured products: ${featuredCount.count}`);
        
    } else {
        console.log('\n❌ unified_content table NOT found!');
        
        // Check for other product-related tables
        const productTables = tables.filter(t => 
            t.name.includes('product') || 
            t.name.includes('content') || 
            t.name.includes('item')
        );
        
        if (productTables.length > 0) {
            console.log('\n🔍 Found other product-related tables:');
            productTables.forEach(table => {
                console.log(`  - ${table.name}`);
                try {
                    const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
                    console.log(`    Rows: ${count.count}`);
                } catch (error) {
                    console.log(`    Error counting rows: ${error.message}`);
                }
            });
        }
    }
    
    db.close();
    console.log('\n✅ Database check completed!');
    
} catch (error) {
    console.error('❌ Error checking database:', error.message);
    process.exit(1);
}