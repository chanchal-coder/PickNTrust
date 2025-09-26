const Database = require('better-sqlite3');

console.log('🔍 Checking for New Product from Bot Test');
console.log('==========================================');

try {
    const db = new Database('./database.sqlite');
    
    // Get products from the last 5 minutes
    const recentProducts = db.prepare(`
        SELECT * FROM unified_content 
        WHERE created_at > strftime('%s', 'now', '-5 minutes')
        ORDER BY created_at DESC
    `).all();
    
    console.log(`\n📦 Found ${recentProducts.length} products from last 5 minutes:`);
    
    recentProducts.forEach((product, index) => {
        console.log(`\n${index + 1}. Product ID: ${product.id}`);
        console.log(`   Title: ${product.title}`);
        console.log(`   Description: ${product.description}`);
        console.log(`   Featured Image: ${product.featured_image}`);
        console.log(`   Media URLs: ${product.media_urls}`);
        console.log(`   Affiliate URLs: ${product.affiliate_urls}`);
        console.log(`   Content: ${product.content ? 'Has content data' : 'No content'}`);
        console.log(`   Created: ${new Date(product.created_at * 1000).toLocaleString()}`);
        
        // Parse content if available
        if (product.content) {
            try {
                const contentData = JSON.parse(product.content);
                console.log(`   📊 Content Data:`);
                console.log(`      Price: ${contentData.price}`);
                console.log(`      Description: ${contentData.description}`);
                console.log(`      Image URL: ${contentData.imageUrl}`);
            } catch (e) {
                console.log(`   ❌ Failed to parse content: ${e.message}`);
            }
        }
    });
    
    if (recentProducts.length === 0) {
        console.log('\n⚠️ No new products found. Bot may not have processed the test message yet.');
    } else {
        console.log('\n✅ Bot is processing messages with the new structure!');
    }
    
} catch (error) {
    console.error('❌ Error:', error.message);
}