const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('server/database.sqlite');

console.log('=== LOCAL DATABASE ANALYSIS ===');

// Get table structure
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
        console.error('Error getting tables:', err);
        return;
    }
    
    console.log('\nTABLES:', tables.map(t => t.name));
    
    // Check unified_content table structure
    db.all("PRAGMA table_info(unified_content)", (err, columns) => {
        if (err) {
            console.error('Error getting table info:', err);
        } else {
            console.log('\nUNIFIED_CONTENT COLUMNS:');
            columns.forEach(col => {
                console.log(`  ${col.name}: ${col.type} (${col.notnull ? 'NOT NULL' : 'NULL'})`);
            });
        }
        
        // Get sample data
        db.all("SELECT * FROM unified_content LIMIT 5", (err, rows) => {
            if (err) {
                console.error('Error getting sample data:', err);
            } else {
                console.log('\nSAMPLE DATA:');
                rows.forEach((row, i) => {
                    console.log(`Row ${i + 1}:`, row);
                });
            }
            
            // Get total count
            db.get("SELECT COUNT(*) as count FROM unified_content", (err, result) => {
                if (err) {
                    console.error('Error getting count:', err);
                } else {
                    console.log(`\nTOTAL RECORDS: ${result.count}`);
                }
                db.close();
            });
        });
    });
});