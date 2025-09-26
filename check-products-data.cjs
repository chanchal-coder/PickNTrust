const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');

console.log('🔍 CHECKING PRODUCTS DATA');
console.log('=========================\n');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        return;
    }
    console.log('✅ Connected to database\n');
});

// Check total products count
db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
    if (err) {
        console.error('❌ Error counting products:', err.message);
        return;
    }
    console.log(`📊 Total products: ${row.count}\n`);
});

// Check display_pages values
db.all("SELECT id, name, display_pages, category, content_type FROM products LIMIT 10", (err, rows) => {
    if (err) {
        console.error('❌ Error fetching products:', err.message);
        return;
    }
    
    console.log('📄 Sample products data:');
    console.log('========================');
    rows.forEach(row => {
        console.log(`ID: ${row.id}`);
        console.log(`Name: ${row.name}`);
        console.log(`Display Pages: ${row.display_pages}`);
        console.log(`Category: ${row.category}`);
        console.log(`Content Type: ${row.content_type}`);
        console.log('---');
    });
    
    // Check unique display_pages values
    db.all("SELECT DISTINCT display_pages FROM products", (err, rows) => {
        if (err) {
            console.error('❌ Error fetching display_pages:', err.message);
            return;
        }
        
        console.log('\n🏷️  Unique display_pages values:');
        console.log('================================');
        rows.forEach(row => {
            console.log(`- ${row.display_pages}`);
        });
        
        // Check if any products match our target pages
        const targetPages = ['prime-picks', 'cue-picks', 'value-picks', 'click-picks', 'global-picks', 'deals-hub', 'loot-box', 'top-picks', 'travel-picks'];
        
        console.log('\n🎯 Checking for target pages:');
        console.log('=============================');
        
        targetPages.forEach(page => {
            db.get(`SELECT COUNT(*) as count FROM products WHERE display_pages LIKE '%"${page}"%'`, (err, row) => {
                if (err) {
                    console.error(`❌ Error checking ${page}:`, err.message);
                    return;
                }
                console.log(`${page}: ${row.count} products`);
            });
        });
        
        db.close((err) => {
            if (err) {
                console.error('❌ Error closing database:', err.message);
            } else {
                console.log('\n✅ Database connection closed');
            }
        });
    });
});