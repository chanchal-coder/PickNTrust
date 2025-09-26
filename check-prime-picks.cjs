const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

console.log('🔍 CHECKING PRIME-PICKS PRODUCTS');
console.log('=================================');

try {
    // Check for prime-picks products
    const primePicksRows = db.prepare(`
        SELECT id, title, display_pages 
        FROM unified_content 
        WHERE display_pages LIKE '%prime-picks%'
    `).all();
    
    console.log(`Products with prime-picks: ${primePicksRows.length}`);
    primePicksRows.forEach(r => {
        console.log(`ID ${r.id}: ${r.title} - ${r.display_pages}`);
    });
    
    // Check the manually added product (ID 59)
    console.log('\n🔍 Checking manually added product (ID 59):');
    const manualProduct = db.prepare('SELECT * FROM unified_content WHERE id = 59').get();
    if (manualProduct) {
        console.log('✅ Found product ID 59:');
        console.log(`   Title: ${manualProduct.title}`);
        console.log(`   Display Pages: ${manualProduct.display_pages}`);
        console.log(`   Processing Status: ${manualProduct.processing_status}`);
        console.log(`   Status: ${manualProduct.status}`);
    } else {
        console.log('❌ Product ID 59 not found');
    }
    
    // Test the exact API query for prime-picks
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
        console.log('First few results:');
        apiResults.slice(0, 3).forEach(r => {
            console.log(`   ID ${r.id}: ${r.title}`);
        });
    }
    
} catch (error) {
    console.error('Error:', error.message);
} finally {
    db.close();
}