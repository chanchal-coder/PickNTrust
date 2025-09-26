const Database = require('better-sqlite3');

try {
    const db = new Database('./server/database.sqlite');
    
    console.log('=== CHECKING PRIME PICKS AND CUE PICKS PRODUCTS ===');
    
    // Check all products in unified_content
    const allProducts = db.prepare('SELECT * FROM unified_content').all();
    console.log(`Total products in unified_content: ${allProducts.length}`);
    
    // Check Prime Picks products
    const primePicksProducts = db.prepare('SELECT * FROM unified_content WHERE page_type = ?').all('prime-picks');
    console.log(`Prime Picks products: ${primePicksProducts.length}`);
    
    // Check Cue Picks products
    const cuePicksProducts = db.prepare('SELECT * FROM unified_content WHERE page_type = ?').all('cue-picks');
    console.log(`Cue Picks products: ${cuePicksProducts.length}`);
    
    // Show all products with their page types
    console.log('\n=== ALL PRODUCTS BY PAGE TYPE ===');
    allProducts.forEach(product => {
        console.log(`- ${product.title} (${product.page_type}) - Created: ${new Date(product.created_at * 1000).toLocaleString()}`);
    });
    
    // Check if there are any products from Telegram source
    const telegramProducts = db.prepare('SELECT * FROM unified_content WHERE source_type = ?').all('telegram');
    console.log(`\nTelegram source products: ${telegramProducts.length}`);
    
    db.close();
} catch (error) {
    console.error('Error checking products:', error.message);
}