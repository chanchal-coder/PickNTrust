const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('server/database.sqlite');

console.log('=== DETAILED LOCAL DATABASE ANALYSIS ===');

// Get all tables
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
        console.error('Error getting tables:', err);
        return;
    }
    
    console.log('\nTABLES:', tables.map(t => t.name));
    
    // Check unified_content table structure
    db.all("PRAGMA table_info(unified_content)", (err, columns) => {
        if (err) {
            console.error('Error getting unified_content info:', err);
        } else {
            console.log('\nUNIFIED_CONTENT COLUMNS:');
            columns.forEach(col => {
                console.log(`  ${col.name}: ${col.type} (${col.notnull ? 'NOT NULL' : 'NULL'})`);
            });
        }
        
        // Get unified_content data
        db.all("SELECT * FROM unified_content LIMIT 10", (err, rows) => {
            if (err) {
                console.error('Error getting unified_content data:', err);
            } else {
                console.log('\nUNIFIED_CONTENT SAMPLE DATA:');
                rows.forEach((row, i) => {
                    console.log(`Row ${i + 1}:`, {
                        id: row.id,
                        title: row.title,
                        type: row.type,
                        status: row.status,
                        price: row.price,
                        category: row.category
                    });
                });
            }
            
            // Get categories
            db.all("SELECT * FROM categories", (err, cats) => {
                if (err) {
                    console.error('Error getting categories:', err);
                } else {
                    console.log('\nCATEGORIES:');
                    cats.forEach(cat => {
                        console.log(`  ${cat.id}: ${cat.name}`);
                    });
                }
                
                // Get total counts
                db.get("SELECT COUNT(*) as count FROM unified_content", (err, result) => {
                    if (err) {
                        console.error('Error getting unified_content count:', err);
                    } else {
                        console.log(`\nTOTAL UNIFIED_CONTENT RECORDS: ${result.count}`);
                    }
                    
                    db.get("SELECT COUNT(*) as count FROM categories", (err, result) => {
                        if (err) {
                            console.error('Error getting categories count:', err);
                        } else {
                            console.log(`TOTAL CATEGORIES: ${result.count}`);
                        }
                        db.close();
                    });
                });
            });
        });
    });
});