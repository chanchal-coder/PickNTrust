const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');

console.log('🔍 CHECKING UNIFIED_CONTENT TABLE');
console.log('=================================\n');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        return;
    }
    console.log('✅ Connected to database\n');
});

// Check unified_content table schema
db.all("PRAGMA table_info(unified_content)", (err, columns) => {
    if (err) {
        console.error('❌ Error getting unified_content schema:', err.message);
        return;
    }
    
    console.log('📋 UNIFIED_CONTENT TABLE SCHEMA:');
    console.log('================================');
    columns.forEach(col => {
        console.log(`- ${col.name}: ${col.type} ${col.notnull ? '(NOT NULL)' : ''} ${col.pk ? '(PRIMARY KEY)' : ''}`);
    });
    
    // Check if display_pages column exists
    const displayPagesCol = columns.find(c => c.name === 'display_pages');
    console.log(`\n🏷️  display_pages column: ${displayPagesCol ? '✅ EXISTS' : '❌ MISSING'}`);
    
    // Check for other relevant columns
    const relevantCols = ['category', 'content_type', 'processing_status', 'page', 'pages'];
    console.log('\n🔍 RELEVANT COLUMNS:');
    relevantCols.forEach(colName => {
        const col = columns.find(c => c.name === colName);
        console.log(`- ${colName}: ${col ? '✅ EXISTS' : '❌ MISSING'}`);
    });
    
    // Get total count
    db.get("SELECT COUNT(*) as count FROM unified_content", (err, row) => {
        if (err) {
            console.error('❌ Error counting records:', err.message);
            return;
        }
        console.log(`\n📊 Total records: ${row.count}\n`);
        
        if (row.count > 0) {
            // Get sample data
            db.all("SELECT * FROM unified_content LIMIT 5", (err, rows) => {
                if (err) {
                    console.error('❌ Error fetching sample data:', err.message);
                    return;
                }
                
                console.log('📄 SAMPLE UNIFIED_CONTENT DATA:');
                console.log('===============================');
                rows.forEach((row, index) => {
                    console.log(`${index + 1}. Record:`);
                    Object.keys(row).forEach(key => {
                        console.log(`   ${key}: ${row[key]}`);
                    });
                    console.log('   ---');
                });
                
                // Check unique values for key columns
                const keyColumns = ['content_type', 'category', 'processing_status'];
                keyColumns.forEach(colName => {
                    if (columns.find(c => c.name === colName)) {
                        db.all(`SELECT DISTINCT ${colName} FROM unified_content WHERE ${colName} IS NOT NULL`, (err, rows) => {
                            if (err) {
                                console.error(`❌ Error fetching ${colName} values:`, err.message);
                            } else {
                                console.log(`\n🏷️  UNIQUE ${colName.toUpperCase()} VALUES:`);
                                rows.forEach(row => {
                                    console.log(`- ${row[colName]}`);
                                });
                            }
                        });
                    }
                });
                
                setTimeout(() => {
                    db.close((err) => {
                        if (err) {
                            console.error('❌ Error closing database:', err.message);
                        } else {
                            console.log('\n✅ Database connection closed');
                        }
                    });
                }, 1000);
            });
        } else {
            console.log('⚠️  No records found in the table');
            db.close();
        }
    });
});