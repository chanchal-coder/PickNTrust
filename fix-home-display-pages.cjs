const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

console.log('🔧 FIXING PRODUCTS WITH DEFAULT HOME DISPLAY_PAGES');
console.log('='.repeat(60));

try {
    // First, check current state
    const homeProducts = db.prepare(`
        SELECT id, title, display_pages, source_platform 
        FROM unified_content 
        WHERE display_pages = '["home"]'
    `).all();
    
    console.log(`Found ${homeProducts.length} products with default home display_pages:`);
    homeProducts.forEach(p => {
        console.log(`  ID ${p.id}: ${p.title} - Source: ${p.source_platform}`);
    });
    
    if (homeProducts.length > 0) {
        console.log('\n🔧 Updating these products to have prime-picks display_pages...');
        
        // Update products with home display_pages to prime-picks
        const updateResult = db.prepare(`
            UPDATE unified_content 
            SET display_pages = '["prime-picks"]'
            WHERE display_pages = '["home"]'
        `).run();
        
        console.log(`✅ Updated ${updateResult.changes} products`);
        
        // Verify the update
        console.log('\n✅ Verification - Products after update:');
        const primePicksProducts = db.prepare(`
            SELECT id, title, display_pages 
            FROM unified_content 
            WHERE display_pages LIKE '%prime-picks%'
            ORDER BY id
        `).all();
        
        console.log(`Prime-picks products: ${primePicksProducts.length}`);
        primePicksProducts.forEach(p => {
            console.log(`  ID ${p.id}: ${p.title} - ${p.display_pages}`);
        });
        
        // Test the API query
        console.log('\n🔍 Testing API query for prime-picks:');
        const apiQuery = `
            SELECT * FROM unified_content 
            WHERE display_pages LIKE '%' || ? || '%'
            AND processing_status = 'active'
            ORDER BY created_at DESC
        `;
        
        const apiResults = db.prepare(apiQuery).all('prime-picks');
        console.log(`API query results: ${apiResults.length} products`);
        
        if (apiResults.length > 0) {
            console.log('API will return:');
            apiResults.forEach(r => {
                console.log(`   ID ${r.id}: ${r.title}`);
            });
        }
    } else {
        console.log('✅ No products need fixing - all have correct display_pages values');
    }
    
} catch (error) {
    console.error('Error:', error.message);
} finally {
    db.close();
}