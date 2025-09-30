const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const databases = [
    'database.sqlite',
    'database.db', 
    'sqlite.db'
];

async function checkDatabase(dbPath) {
    return new Promise((resolve, reject) => {
        console.log(`\n=== Checking ${dbPath} ===`);
        
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
            if (err) {
                console.log(`❌ Cannot open ${dbPath}: ${err.message}`);
                resolve({ dbPath, error: err.message, tables: [], counts: {} });
                return;
            }
            
            console.log(`✅ Successfully opened ${dbPath}`);
            
            // Get all tables
            db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
                if (err) {
                    console.log(`❌ Error getting tables from ${dbPath}: ${err.message}`);
                    db.close();
                    resolve({ dbPath, error: err.message, tables: [], counts: {} });
                    return;
                }
                
                const tableNames = tables.map(t => t.name);
                console.log(`📋 Tables in ${dbPath}:`, tableNames);
                
                // Check key tables
                const keyTables = ['unified_content', 'channel_posts', 'products'];
                const counts = {};
                let completed = 0;
                
                keyTables.forEach(tableName => {
                    if (tableNames.includes(tableName)) {
                        db.get(`SELECT COUNT(*) as count FROM ${tableName}`, [], (err, row) => {
                            if (!err) {
                                counts[tableName] = row.count;
                                console.log(`📊 ${tableName}: ${row.count} entries`);
                            } else {
                                counts[tableName] = 'error';
                                console.log(`❌ Error counting ${tableName}: ${err.message}`);
                            }
                            
                            completed++;
                            if (completed === keyTables.length) {
                                db.close();
                                resolve({ dbPath, tables: tableNames, counts });
                            }
                        });
                    } else {
                        counts[tableName] = 'not found';
                        completed++;
                        if (completed === keyTables.length) {
                            db.close();
                            resolve({ dbPath, tables: tableNames, counts });
                        }
                    }
                });
                
                if (keyTables.length === 0) {
                    db.close();
                    resolve({ dbPath, tables: tableNames, counts });
                }
            });
        });
    });
}

async function main() {
    console.log('🔍 Checking database contents to determine the correct database file...\n');
    
    const results = [];
    
    for (const dbPath of databases) {
        try {
            const result = await checkDatabase(dbPath);
            results.push(result);
        } catch (error) {
            console.log(`❌ Error checking ${dbPath}: ${error.message}`);
            results.push({ dbPath, error: error.message, tables: [], counts: {} });
        }
    }
    
    console.log('\n=== SUMMARY ===');
    results.forEach(result => {
        console.log(`\n📁 ${result.dbPath}:`);
        if (result.error) {
            console.log(`   ❌ Error: ${result.error}`);
        } else {
            console.log(`   📋 Tables: ${result.tables.length}`);
            console.log(`   📊 unified_content: ${result.counts.unified_content || 'N/A'}`);
            console.log(`   📊 channel_posts: ${result.counts.channel_posts || 'N/A'}`);
            console.log(`   📊 products: ${result.counts.products || 'N/A'}`);
        }
    });
    
    // Determine the best database
    const validDbs = results.filter(r => !r.error && r.tables.length > 0);
    if (validDbs.length > 0) {
        const bestDb = validDbs.reduce((best, current) => {
            const bestScore = (best.counts.unified_content || 0) + (best.counts.channel_posts || 0) + (best.counts.products || 0);
            const currentScore = (current.counts.unified_content || 0) + (current.counts.channel_posts || 0) + (current.counts.products || 0);
            return currentScore > bestScore ? current : best;
        });
        
        console.log(`\n🎯 RECOMMENDED DATABASE: ${bestDb.dbPath}`);
        console.log(`   Reason: Has the most data across key tables`);
    } else {
        console.log('\n❌ No valid databases found!');
    }
}

main().catch(console.error);