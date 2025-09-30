const Database = require('better-sqlite3');

try {
    const db = new Database('./server/database.sqlite');
    
    console.log('🔍 Checking database products...\n');
    
    // Check all products
    const allProducts = db.prepare('SELECT id, title, page_type, display_pages FROM unified_content ORDER BY id DESC LIMIT 10').all();
    console.log('📊 Recent products in database:');
    if (allProducts.length === 0) {
        console.log('❌ No products found in database');
    } else {
        allProducts.forEach(p => {
            console.log(`ID: ${p.id}, Title: ${p.title}, Page Type: ${p.page_type}, Display Pages: ${p.display_pages}`);
        });
    }
    
    console.log('\n🔍 Checking specific page types:');
    
    // Check Prime Picks
    const primePicksProducts = db.prepare('SELECT COUNT(*) as count FROM unified_content WHERE page_type = ?').get('prime-picks');
    console.log(`Prime Picks products: ${primePicksProducts.count}`);
    
    // Check Cue Picks
    const cuePicksProducts = db.prepare('SELECT COUNT(*) as count FROM unified_content WHERE page_type = ?').get('cue-picks');
    console.log(`Cue Picks products: ${cuePicksProducts.count}`);
    
    // Check all page types
    const pageTypes = db.prepare('SELECT page_type, COUNT(*) as count FROM unified_content GROUP BY page_type').all();
    console.log('\n📈 Products by page type:');
    pageTypes.forEach(pt => {
        console.log(`${pt.page_type}: ${pt.count} products`);
    });
    
    db.close();
    console.log('\n✅ Database check completed');
    
} catch (error) {
    console.error('❌ Error checking database:', error.message);
}