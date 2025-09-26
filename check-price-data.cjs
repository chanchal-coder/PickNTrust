const Database = require('better-sqlite3');

console.log('🔍 CHECKING PRICE DATA IN UNIFIED_CONTENT');
console.log('========================================');

try {
    const db = new Database('./database.sqlite');
    
    // Check price data
    console.log('📊 PRICE DATA ANALYSIS:');
    const products = db.prepare(`
        SELECT id, title, price, original_price, discount 
        FROM unified_content 
        WHERE price IS NOT NULL 
        ORDER BY created_at DESC 
        LIMIT 15
    `).all();
    
    if (products.length === 0) {
        console.log('❌ No products with price data found');
    } else {
        console.log(`✅ Found ${products.length} products with price data:`);
        products.forEach((product, index) => {
            console.log(`\n${index + 1}. ${product.title.substring(0, 40)}...`);
            console.log(`   Price: ${product.price || 'NULL'}`);
            console.log(`   Original Price: ${product.original_price || 'NULL'}`);
            console.log(`   Discount: ${product.discount || 'NULL'}%`);
        });
    }
    
    // Check for products without price data
    console.log('\n🔍 PRODUCTS WITHOUT PRICE DATA:');
    const noPriceProducts = db.prepare(`
        SELECT COUNT(*) as count 
        FROM unified_content 
        WHERE price IS NULL OR price = ''
    `).get();
    
    console.log(`Products without price: ${noPriceProducts.count}`);
    
    // Check for products with placeholder or invalid prices
    console.log('\n⚠️ PRODUCTS WITH INVALID PRICES:');
    const invalidPrices = db.prepare(`
        SELECT id, title, price, original_price 
        FROM unified_content 
        WHERE price LIKE '%placeholder%' 
           OR price LIKE '%N/A%' 
           OR price LIKE '%null%'
           OR price = ''
        LIMIT 10
    `).all();
    
    if (invalidPrices.length > 0) {
        console.log(`Found ${invalidPrices.length} products with invalid prices:`);
        invalidPrices.forEach((product, index) => {
            console.log(`${index + 1}. ${product.title.substring(0, 30)}... | Price: "${product.price}"`);
        });
    } else {
        console.log('✅ No products with invalid prices found');
    }
    
    db.close();
    
} catch (error) {
    console.error('❌ Error checking price data:', error.message);
}