const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');

console.log('🔍 CHECKING MAIN PRODUCTS TABLE');
console.log('===============================\n');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        return;
    }
    console.log('✅ Connected to database\n');
});

// Check products table schema
db.all("PRAGMA table_info(products)", (err, columns) => {
    if (err) {
        console.error('❌ Error getting products schema:', err.message);
        return;
    }
    
    console.log('📋 PRODUCTS TABLE SCHEMA:');
    console.log('=========================');
    columns.forEach(col => {
        console.log(`- ${col.name}: ${col.type} ${col.notnull ? '(NOT NULL)' : ''} ${col.pk ? '(PRIMARY KEY)' : ''}`);
    });
    
    // Check if display_pages column exists
    const displayPagesCol = columns.find(c => c.name === 'display_pages');
    console.log(`\n🏷️  display_pages column: ${displayPagesCol ? '✅ EXISTS' : '❌ MISSING'}\n`);
    
    // Get total count
    db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
        if (err) {
            console.error('❌ Error counting products:', err.message);
            return;
        }
        console.log(`📊 Total products: ${row.count}\n`);
        
        if (row.count > 0) {
            // Get sample data
            db.all("SELECT id, name, display_pages, category, content_type, processing_status FROM products LIMIT 10", (err, rows) => {
                if (err) {
                    console.error('❌ Error fetching sample data:', err.message);
                    return;
                }
                
                console.log('📄 SAMPLE PRODUCTS DATA:');
                console.log('========================');
                rows.forEach((row, index) => {
                    console.log(`${index + 1}. ID: ${row.id}`);
                    console.log(`   Name: ${row.name}`);
                    console.log(`   Display Pages: ${row.display_pages}`);
                    console.log(`   Category: ${row.category}`);
                    console.log(`   Content Type: ${row.content_type}`);
                    console.log(`   Status: ${row.processing_status}`);
                    console.log('   ---');
                });
                
                // Check unique display_pages values
                db.all("SELECT DISTINCT display_pages FROM products WHERE display_pages IS NOT NULL", (err, rows) => {
                    if (err) {
                        console.error('❌ Error fetching display_pages:', err.message);
                        return;
                    }
                    
                    console.log('\n🏷️  UNIQUE DISPLAY_PAGES VALUES:');
                    console.log('================================');
                    rows.forEach(row => {
                        console.log(`- ${row.display_pages}`);
                    });
                    
                    // Test queries for each target page
                    const targetPages = ['prime-picks', 'cue-picks', 'value-picks', 'click-picks', 'global-picks', 'deals-hub', 'loot-box', 'top-picks', 'travel-picks'];
                    
                    console.log('\n🎯 PRODUCTS COUNT BY TARGET PAGES:');
                    console.log('==================================');
                    
                    let completed = 0;
                    targetPages.forEach(page => {
                        db.get(`SELECT COUNT(*) as count FROM products WHERE display_pages LIKE '%"${page}"%' AND processing_status = 'active'`, (err, row) => {
                            if (err) {
                                console.error(`❌ Error checking ${page}:`, err.message);
                            } else {
                                console.log(`${page}: ${row.count} products`);
                            }
                            
                            completed++;
                            if (completed === targetPages.length) {
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
                });
            });
        } else {
            console.log('⚠️  No products found in the table');
            db.close();
        }
    });
});