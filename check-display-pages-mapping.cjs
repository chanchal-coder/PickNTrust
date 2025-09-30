/**
 * Check Display Pages Mapping in Products Table
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'sqlite.db');
const db = new Database(dbPath);

console.log('🔍 Checking Display Pages Mapping...');
console.log('=' .repeat(50));

try {
    // Check all display_pages values
    const displayPagesValues = db.prepare(`
        SELECT display_pages, COUNT(*) as count
        FROM products 
        WHERE display_pages IS NOT NULL AND display_pages != ''
        GROUP BY display_pages
        ORDER BY count DESC
    `).all();
    
    console.log(`\n📄 Display Pages Values:`);
    displayPagesValues.forEach(row => {
        console.log(`   "${row.display_pages}": ${row.count} products`);
    });
    
    // Check specific pages
    const pagesToCheck = ['prime-picks', 'value-picks', 'cue-picks', 'click-picks', 'global-picks', 'travel-picks', 'deals-hub', 'loot-box'];
    
    console.log(`\n🔍 Checking specific pages:`);
    for (const page of pagesToCheck) {
        const count = db.prepare(`
            SELECT COUNT(*) as count FROM products 
            WHERE display_pages LIKE '%' || ? || '%'
            AND processing_status = 'active'
        `).get(page);
        
        console.log(`   ${page}: ${count.count} products`);
        
        if (count.count > 0) {
            const samples = db.prepare(`
                SELECT id, name, display_pages FROM products 
                WHERE display_pages LIKE '%' || ? || '%'
                AND processing_status = 'active'
                LIMIT 2
            `).all(page);
            
            samples.forEach(sample => {
                console.log(`      • ID ${sample.id}: "${sample.name}" (pages: "${sample.display_pages}")`);
            });
        }
    }
    
    // Check products without display_pages
    const withoutDisplayPages = db.prepare(`
        SELECT COUNT(*) as count FROM products 
        WHERE (display_pages IS NULL OR display_pages = '')
        AND processing_status = 'active'
    `).get();
    
    console.log(`\n⚠️  Products without display_pages: ${withoutDisplayPages.count}`);
    
    if (withoutDisplayPages.count > 0) {
        const samples = db.prepare(`
            SELECT id, name, affiliate_network FROM products 
            WHERE (display_pages IS NULL OR display_pages = '')
            AND processing_status = 'active'
            LIMIT 5
        `).all();
        
        console.log(`   Sample products without display_pages:`);
        samples.forEach(sample => {
            console.log(`      • ID ${sample.id}: "${sample.name}" (network: ${sample.affiliate_network})`);
        });
    }
    
} catch (error) {
    console.error('❌ Error:', error.message);
} finally {
    db.close();
}