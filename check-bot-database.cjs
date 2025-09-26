const Database = require('better-sqlite3');

console.log('🔍 CHECKING BOT DATABASE');
console.log('========================');

try {
    const db = new Database('./database.sqlite');
    
    // Check what tables exist
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('\n📊 Available Tables:');
    console.log('===================');
    tables.forEach(table => {
        console.log(`- ${table.name}`);
    });
    
    // Check if unified_content table exists
    const unifiedContentExists = tables.some(t => t.name === 'unified_content');
    
    if (unifiedContentExists) {
        // Check recent products in unified_content
        const rows = db.prepare(`
            SELECT id, title, page_type, display_pages, source_type, 
                   datetime(created_at, 'localtime') as created_at 
            FROM unified_content 
            ORDER BY id DESC 
            LIMIT 10
        `).all();
        
        console.log('\n📦 Recent Products in unified_content:');
        console.log('=====================================');
        
        if (rows.length === 0) {
            console.log('❌ No products found in unified_content table');
        } else {
            rows.forEach(row => {
                console.log(`ID: ${row.id}`);
                console.log(`Title: ${row.title}`);
                console.log(`Page Type: ${row.page_type}`);
                console.log(`Display Pages: ${row.display_pages}`);
                console.log(`Source: ${row.source_type}`);
                console.log(`Created: ${row.created_at}`);
                console.log('---');
            });
        }
        
        // Check for cue-picks specifically
        const cuePicksProducts = db.prepare(`
            SELECT COUNT(*) as count 
            FROM unified_content 
            WHERE display_pages LIKE '%cue-picks%'
        `).get();
        
        console.log(`\n🎯 Products with 'cue-picks' in display_pages: ${cuePicksProducts.count}`);
        
        // Check unique display_pages values
        const displayPagesValues = db.prepare(`
            SELECT DISTINCT display_pages, COUNT(*) as count 
            FROM unified_content 
            GROUP BY display_pages
        `).all();
        
        console.log('\n📊 Unique Display Pages Values:');
        console.log('==============================');
        displayPagesValues.forEach(value => {
            console.log(`${value.display_pages}: ${value.count} products`);
        });
        
    } else {
        console.log('\n❌ unified_content table does not exist!');
        
        // Check if there are any other product tables
        const productTables = tables.filter(t => t.name.includes('product') || t.name.includes('content'));
        if (productTables.length > 0) {
            console.log('\n📋 Found other product-related tables:');
            productTables.forEach(table => {
                console.log(`- ${table.name}`);
            });
        }
    }
    
    db.close();
    console.log('\n✅ Check completed');
    
} catch (error) {
    console.error('❌ Error:', error.message);
}