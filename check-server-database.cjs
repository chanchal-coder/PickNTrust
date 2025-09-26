const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

console.log('🔍 Checking multiple database files...\n');

// Check all database files
const dbFiles = [
    { name: 'Main Database', path: path.join(__dirname, 'database.sqlite') },
    { name: 'Server Database', path: path.join(__dirname, 'server', 'database.sqlite') },
    { name: 'Dist Server Database', path: path.join(__dirname, 'dist', 'server', 'database.sqlite') }
];

async function checkDatabase(dbInfo) {
    return new Promise((resolve) => {
        console.log(`\n📁 Checking ${dbInfo.name}: ${dbInfo.path}`);
        
        if (!fs.existsSync(dbInfo.path)) {
            console.log(`❌ File does not exist`);
            resolve();
            return;
        }
        
        const db = new sqlite3.Database(dbInfo.path, (err) => {
            if (err) {
                console.error(`❌ Error opening database: ${err.message}`);
                resolve();
                return;
            }
            console.log(`✅ Connected successfully`);
        });

        // Check if unified_content table exists
        db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", (err, tables) => {
            if (err) {
                console.error(`❌ Error getting tables: ${err.message}`);
                db.close();
                resolve();
                return;
            }
            
            console.log(`📋 Tables (${tables.length}):`, tables.map(t => t.name).join(', '));
            
            const hasUnifiedContent = tables.some(table => table.name === 'unified_content');
            console.log(`🔍 unified_content table: ${hasUnifiedContent ? '✅ EXISTS' : '❌ MISSING'}`);
            
            if (hasUnifiedContent) {
                // Count rows and check for prime-picks data
                db.get("SELECT COUNT(*) as count FROM unified_content", (err, result) => {
                    if (err) {
                        console.error(`❌ Error counting rows: ${err.message}`);
                        db.close();
                        resolve();
                        return;
                    }
                    
                    console.log(`📈 unified_content rows: ${result.count}`);
                    
                    // Check for prime-picks data
                    db.get("SELECT COUNT(*) as count FROM unified_content WHERE display_pages LIKE '%prime-picks%'", (err, primeResult) => {
                        if (err) {
                            console.error(`❌ Error querying prime-picks: ${err.message}`);
                        } else {
                            console.log(`🎯 prime-picks products: ${primeResult.count}`);
                        }
                        
                        db.close();
                        resolve();
                    });
                });
            } else {
                db.close();
                resolve();
            }
        });
    });
}

async function checkAllDatabases() {
    for (const dbInfo of dbFiles) {
        await checkDatabase(dbInfo);
    }
    
    console.log('\n🎯 CONCLUSION:');
    console.log('The server is configured to use path.join(__dirname, "../database.sqlite")');
    console.log('From server directory, this should point to the main database.sqlite');
    console.log('If the server/database.sqlite exists and is missing unified_content,');
    console.log('it might be interfering with the path resolution.');
}

checkAllDatabases();