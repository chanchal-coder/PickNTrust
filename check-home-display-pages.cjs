const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

console.log('🔍 CHECKING PRODUCTS WITH DEFAULT HOME DISPLAY_PAGES');
console.log('='.repeat(60));

try {
    // Check products with default home display_pages
    const homeProducts = db.prepare(`
        SELECT id, title, display_pages, source_platform, created_at 
        FROM unified_content 
        WHERE display_pages = '["home"]'
        ORDER BY created_at DESC
        LIMIT 10
    `).all();
    
    console.log(`Products with default home display_pages: ${homeProducts.length}`);
    
    if (homeProducts.length > 0) {
        console.log('\nRecent products with home display_pages:');
        homeProducts.forEach(p => {
            const date = new Date(p.created_at * 1000).toLocaleString();
            console.log(`  ID ${p.id}: ${p.title} - Source: ${p.source_platform} - ${date}`);
        });
    }
    
    // Check products with correct prime-picks display_pages
    const primePicksProducts = db.prepare(`
        SELECT id, title, display_pages 
        FROM unified_content 
        WHERE display_pages LIKE '%prime-picks%'
        ORDER BY created_at DESC
        LIMIT 5
    `).all();
    
    console.log(`\nProducts with prime-picks display_pages: ${primePicksProducts.length}`);
    primePicksProducts.forEach(p => {
        console.log(`  ID ${p.id}: ${p.title} - ${p.display_pages}`);
    });
    
    // Check all unique display_pages values
    const uniqueDisplayPages = db.prepare(`
        SELECT DISTINCT display_pages, COUNT(*) as count
        FROM unified_content 
        GROUP BY display_pages
        ORDER BY count DESC
    `).all();
    
    console.log('\nAll unique display_pages values:');
    uniqueDisplayPages.forEach(dp => {
        console.log(`  ${dp.display_pages} - ${dp.count} products`);
    });
    
} catch (error) {
    console.error('Error:', error.message);
} finally {
    db.close();
}