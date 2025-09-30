const Database = require('better-sqlite3');

try {
    const db = new Database('./database.db');
    
    console.log('🔍 CHECKING RECENT PRODUCTS WITH DETAILED INFO');
    console.log('==============================================\n');
    
    const products = db.prepare(`
        SELECT * FROM unified_content 
        ORDER BY created_at DESC 
        LIMIT 5
    `).all();
    
    console.log(`Found ${products.length} recent products:\n`);
    
    products.forEach((p, i) => {
        console.log(`${i+1}. ID ${p.id}: "${p.title}"`);
        console.log(`   Description: "${p.description}"`);
        console.log(`   Content: ${p.content}`);
        console.log(`   Media URLs: ${p.media_urls}`);
        console.log(`   Featured Image: ${p.featured_image}`);
        console.log(`   Original URLs: ${p.original_urls}`);
        console.log(`   Affiliate URLs: ${p.affiliate_urls}`);
        console.log(`   Display Pages: ${p.display_pages}`);
        console.log(`   Created: ${new Date(p.created_at * 1000).toLocaleString()}`);
        console.log('   ----------------------------------------\n');
    });

    // Check for issues
    console.log('🔍 CHECKING FOR SPECIFIC ISSUES:');
    console.log('================================');
    
    const issueProducts = db.prepare(`
        SELECT id, title, description, content, media_urls, featured_image
        FROM unified_content 
        WHERE description LIKE '%₹%' OR description LIKE '%price%' OR description IS NULL
        ORDER BY created_at DESC
        LIMIT 10
    `).all();
    
    console.log(`\nFound ${issueProducts.length} products with potential issues:`);
    issueProducts.forEach(p => {
        console.log(`- ID ${p.id}: "${p.title}"`);
        console.log(`  Description: "${p.description}"`);
        if (p.content) {
            try {
                const content = JSON.parse(p.content);
                console.log(`  Price in content: ${content.price || 'N/A'}`);
                console.log(`  Description in content: ${content.description || 'N/A'}`);
            } catch (e) {
                console.log(`  Content parse error: ${e.message}`);
            }
        }
        console.log('');
    });
    
    db.close();
    console.log('✅ Database check completed');
    
} catch (error) {
    console.error('❌ Error:', error.message);
}