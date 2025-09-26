const Database = require('better-sqlite3');
const path = require('path');

// Connect to the database
const dbPath = path.join(__dirname, 'database.db');
const db = new Database(dbPath);

console.log('🔍 Checking for latest products in database...\n');

try {
    // Get the most recent products from unified_content table
    const recentProducts = db.prepare(`
        SELECT 
            id,
            title,
            content,
            category,
            display_pages,
            processing_status,
            created_at,
            updated_at
        FROM unified_content 
        ORDER BY created_at DESC 
        LIMIT 10
    `).all();

    console.log(`Found ${recentProducts.length} recent products:\n`);

    recentProducts.forEach((product, index) => {
        console.log(`${index + 1}. Product ID: ${product.id}`);
        console.log(`   Title: ${product.title}`);
        console.log(`   Category: ${product.category}`);
        console.log(`   Display Pages: ${product.display_pages}`);
        console.log(`   Processing Status: ${product.processing_status}`);
        console.log(`   Created: ${product.created_at}`);
        console.log(`   Updated: ${product.updated_at}`);
        
        // Parse content to show key details
        try {
            const contentData = JSON.parse(product.content);
            if (contentData.price) {
                console.log(`   Price: ${contentData.price}`);
            }
            if (contentData.imageUrl) {
                console.log(`   Has Image: Yes`);
            }
        } catch (e) {
            console.log(`   Content: ${product.content.substring(0, 100)}...`);
        }
        console.log('');
    });

    // Check specifically for Prime Picks products
    console.log('\n📋 Prime Picks products (active):');
    const primePicksProducts = db.prepare(`
        SELECT 
            id,
            title,
            processing_status,
            created_at
        FROM unified_content 
        WHERE display_pages LIKE '%prime-picks%' 
        AND processing_status = 'active'
        ORDER BY created_at DESC
    `).all();

    console.log(`Found ${primePicksProducts.length} active Prime Picks products:`);
    primePicksProducts.forEach((product, index) => {
        console.log(`${index + 1}. ${product.title} (ID: ${product.id}) - ${product.created_at}`);
    });

    // Check for any Prime Picks products with pending status
    console.log('\n⏳ Prime Picks products (pending):');
    const pendingPrimePicksProducts = db.prepare(`
        SELECT 
            id,
            title,
            processing_status,
            created_at
        FROM unified_content 
        WHERE display_pages LIKE '%prime-picks%' 
        AND processing_status = 'pending'
        ORDER BY created_at DESC
    `).all();

    console.log(`Found ${pendingPrimePicksProducts.length} pending Prime Picks products:`);
    pendingPrimePicksProducts.forEach((product, index) => {
        console.log(`${index + 1}. ${product.title} (ID: ${product.id}) - ${product.created_at}`);
    });

} catch (error) {
    console.error('❌ Error checking database:', error.message);
} finally {
    db.close();
}