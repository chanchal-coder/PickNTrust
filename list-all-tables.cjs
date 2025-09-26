const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');

console.log('🔍 LISTING ALL DATABASE TABLES');
console.log('==============================\n');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        return;
    }
    console.log('✅ Connected to database\n');
});

// Get all tables
db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", (err, tables) => {
    if (err) {
        console.error('❌ Error fetching tables:', err.message);
        return;
    }
    
    console.log('📊 ALL EXISTING TABLES:');
    console.log('=======================');
    tables.forEach((table, index) => {
        console.log(`${index + 1}. ${table.name}`);
    });
    
    console.log(`\n📈 Total tables: ${tables.length}\n`);
    
    // Look for product-related tables
    const productTables = tables.filter(t => t.name.toLowerCase().includes('product'));
    if (productTables.length > 0) {
        console.log('🛍️  PRODUCT-RELATED TABLES:');
        console.log('===========================');
        productTables.forEach(table => {
            console.log(`- ${table.name}`);
        });
        
        // Check each product table for data
        console.log('\n📊 CHECKING DATA IN PRODUCT TABLES:');
        console.log('===================================');
        
        let completed = 0;
        productTables.forEach(table => {
            db.get(`SELECT COUNT(*) as count FROM ${table.name}`, (err, row) => {
                if (err) {
                    console.log(`❌ ${table.name}: Error - ${err.message}`);
                } else {
                    console.log(`✅ ${table.name}: ${row.count} records`);
                }
                
                completed++;
                if (completed === productTables.length) {
                    db.close((err) => {
                        if (err) {
                            console.error('❌ Error closing database:', err.message);
                        } else {
                            console.log('\n✅ Database connection closed');
                        }
                    });
                }
            });
        });
    } else {
        console.log('❌ No product-related tables found!');
        db.close();
    }
});