const Database = require('better-sqlite3');

console.log('🔍 CHECKING DATABASE CONTENT');
console.log('============================');

try {
    const db = new Database('./database.sqlite');
    
    // Check unified_content table
    console.log('📊 UNIFIED_CONTENT TABLE:');
    const products = db.prepare(`
        SELECT id, title, price, original_price, discount, 
               display_pages, created_at, source_type, source_id
        FROM unified_content 
        ORDER BY created_at DESC 
        LIMIT 10
    `).all();
    
    if (products.length === 0) {
        console.log('❌ No products found in unified_content table');
    } else {
        console.log(`✅ Found ${products.length} products:`);
        products.forEach((product, index) => {
            console.log(`\n${index + 1}. ${product.title}`);
            console.log(`   Price: ₹${product.price}`);
            console.log(`   Page: ${product.display_pages}`);
            console.log(`   Created: ${product.created_at}`);
            console.log(`   Source: ${product.source_type || 'N/A'}`);
            console.log(`   Source ID: ${product.source_id || 'N/A'}`);
        });
    }
    
    // Check if there are any products for prime-picks specifically
    console.log('\n🎯 PRIME PICKS PRODUCTS:');
    const primePicksProducts = db.prepare(`
        SELECT * FROM unified_content 
        WHERE display_pages LIKE '%prime-picks%' 
        ORDER BY created_at DESC
    `).all();
    
    console.log(`Found ${primePicksProducts.length} prime-picks products`);
    
    // Check total count
    const totalCount = db.prepare('SELECT COUNT(*) as count FROM unified_content').get();
    console.log(`\n📈 Total products in database: ${totalCount.count}`);
    
    db.close();
    
} catch (error) {
    console.error('❌ Error:', error.message);
}