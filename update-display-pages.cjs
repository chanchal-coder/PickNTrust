/**
 * Update Display Pages for Products
 * Map products to their appropriate pages based on source/network
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'sqlite.db');
const db = new Database(dbPath);

console.log('🔧 Updating Display Pages for Products...');
console.log('=' .repeat(50));

try {
    // First, let's see what we have
    const currentProducts = db.prepare(`
        SELECT id, name, display_pages, source, telegram_message_id
        FROM products 
        ORDER BY id DESC
        LIMIT 10
    `).all();
    
    console.log(`\n📋 Current products (latest 10):`);
    currentProducts.forEach(product => {
        console.log(`   ID ${product.id}: "${product.name}"`);
        console.log(`      Display Pages: "${product.display_pages}"`);
        console.log(`      Source: ${product.source}`);
        console.log(`      Telegram ID: ${product.telegram_message_id}`);
        console.log('');
    });
    
    // Check channel_posts to understand the mapping
    const channelPosts = db.prepare(`
        SELECT channel_name, website_page, COUNT(*) as count
        FROM channel_posts 
        GROUP BY channel_name, website_page
        ORDER BY count DESC
    `).all();
    
    console.log(`\n📊 Channel to Page Mapping:`);
    channelPosts.forEach(post => {
        console.log(`   ${post.channel_name} → ${post.website_page} (${post.count} posts)`);
    });
    
    // Update products based on telegram source
    console.log(`\n🔄 Updating display_pages for telegram products...`);
    
    // Get products from telegram that need page assignment
    const telegramProducts = db.prepare(`
        SELECT p.id, p.name, p.telegram_message_id, cp.website_page
        FROM products p
        LEFT JOIN channel_posts cp ON p.telegram_message_id = cp.message_id
        WHERE p.source = 'telegram' AND p.telegram_message_id IS NOT NULL
    `).all();
    
    console.log(`Found ${telegramProducts.length} telegram products to update`);
    
    let updatedCount = 0;
    const updateStmt = db.prepare(`
        UPDATE products 
        SET display_pages = ? 
        WHERE id = ?
    `);
    
    telegramProducts.forEach(product => {
        if (product.website_page) {
            const displayPages = `["${product.website_page}"]`;
            updateStmt.run(displayPages, product.id);
            updatedCount++;
            console.log(`   ✅ Updated product ${product.id} to show on "${product.website_page}"`);
        }
    });
    
    console.log(`\n✅ Updated ${updatedCount} products with correct display_pages`);
    
    // Verify the updates
    console.log(`\n🔍 Verification - Display Pages after update:`);
    const updatedDisplayPages = db.prepare(`
        SELECT display_pages, COUNT(*) as count
        FROM products 
        WHERE display_pages IS NOT NULL AND display_pages != ''
        GROUP BY display_pages
        ORDER BY count DESC
    `).all();
    
    updatedDisplayPages.forEach(row => {
        console.log(`   "${row.display_pages}": ${row.count} products`);
    });
    
} catch (error) {
    console.error('❌ Error:', error.message);
} finally {
    db.close();
}