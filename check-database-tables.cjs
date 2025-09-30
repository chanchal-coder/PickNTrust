const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

console.log('🔍 Checking all database files for unified_content table...\n');

// Check multiple database locations
const dbPaths = [
    { name: 'Root database.sqlite', path: path.join(__dirname, 'database.sqlite') },
    { name: 'Server database.sqlite', path: path.join(__dirname, 'server', 'database.sqlite') },
    { name: 'Root sqlite.db', path: path.join(__dirname, 'sqlite.db') }
];

dbPaths.forEach(({ name, path: dbPath }) => {
    console.log(`\n=== ${name} ===`);
    console.log(`Path: ${dbPath}`);
    
    if (!fs.existsSync(dbPath)) {
        console.log('❌ File does not exist');
        return;
    }
    
    try {
        const db = new Database(dbPath);
        
        // Get all tables
        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
        console.log(`✅ Connected - ${tables.length} tables found:`);
        
        tables.forEach(table => {
            console.log(`  - ${table.name}`);
        });
        
        // Check for unified_content specifically
        const hasUnifiedContent = tables.some(t => t.name === 'unified_content');
        console.log(`\nUnified content table: ${hasUnifiedContent ? '✅ EXISTS' : '❌ NOT FOUND'}`);
        
        if (hasUnifiedContent) {
            // Get schema
            const schema = db.prepare("PRAGMA table_info(unified_content)").all();
            console.log('\nColumns:');
            schema.forEach(col => {
                console.log(`  - ${col.name}: ${col.type}`);
            });
            
            // Get count
            const count = db.prepare("SELECT COUNT(*) as count FROM unified_content").get();
            console.log(`\nTotal records: ${count.count}`);
            
            // Check for products with original_price
            const withOriginalPrice = db.prepare("SELECT COUNT(*) as count FROM unified_content WHERE original_price IS NOT NULL AND original_price != ''").get();
            console.log(`Records with original_price: ${withOriginalPrice.count}`);
        }
        
        db.close();
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
});