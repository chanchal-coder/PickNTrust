const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

console.log('🔍 CHECKING MANUAL PRODUCTS');
console.log('===========================');

try {
    const products = db.prepare(`
        SELECT id, title, display_pages, processing_status, status 
        FROM unified_content 
        WHERE id IN (35, 36, 37)
    `).all();
    
    console.log('Manual products details:');
    products.forEach(p => {
        console.log(`ID ${p.id}: ${p.title}`);
        console.log(`   display_pages: '${p.display_pages}'`);
        console.log(`   processing_status: '${p.processing_status}'`);
        console.log(`   status: '${p.status}'`);
        console.log('');
    });
    
    // Now let's fix one of them to have prime-picks
    console.log('🔧 FIXING PRODUCT ID 37 FOR PRIME-PICKS');
    
    const updateResult = db.prepare(`
        UPDATE unified_content 
        SET display_pages = '["prime-picks"]'
        WHERE id = 37
    `).run();
    
    console.log(`Updated ${updateResult.changes} rows`);
    
    // Verify the update
    const updatedProduct = db.prepare('SELECT id, title, display_pages FROM unified_content WHERE id = 37').get();
    console.log('Updated product:');
    console.log(`ID ${updatedProduct.id}: ${updatedProduct.title}`);
    console.log(`display_pages: '${updatedProduct.display_pages}'`);
    
    // Test the API query again
    console.log('\n🔍 Testing API query for prime-picks after fix:');
    const apiQuery = `
        SELECT * FROM unified_content 
        WHERE display_pages LIKE '%' || ? || '%'
        AND processing_status = 'active'
        ORDER BY created_at DESC
    `;
    
    const apiResults = db.prepare(apiQuery).all('prime-picks');
    console.log(`API query results: ${apiResults.length} products`);
    
    if (apiResults.length > 0) {
        console.log('Results:');
        apiResults.forEach(r => {
            console.log(`   ID ${r.id}: ${r.title}`);
        });
    }
    
} catch (error) {
    console.error('Error:', error.message);
} finally {
    db.close();
}