const Database = require('better-sqlite3');
const path = require('path');

console.log('🔧 Manual Product Insertion Test');
console.log('================================');

// Database setup
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

function insertTestProduct() {
    try {
        console.log('📦 Creating test product...');
        
        // Create content data matching the expected format
        const contentData = {
            price: '₹2,999',
            originalPrice: '₹5,999',
            rating: 4.5,
            reviewCount: 2847,
            discount: '50%',
            currency: 'INR'
        };
        
        const mediaUrls = ['https://via.placeholder.com/300x300/3B82F6/white?text=Wireless+Headphones'];
        const affiliateUrls = ['https://www.amazon.in/dp/B08XYZ789/ref=sr_1_1?keywords=wireless+headphones&tag=pickntrust03-21'];
        const originalUrls = ['https://www.amazon.in/dp/B08XYZ789/ref=sr_1_1?keywords=wireless+headphones&tag=pickntrust03-21'];
        
        const stmt = db.prepare(`
            INSERT INTO unified_content (
                title, description, content, 
                display_pages, content_type, category,
                source_platform, source_id, source_type,
                media_urls, affiliate_urls,
                status, visibility, 
                processing_status, created_at, updated_at,
                price, original_price, currency, discount,
                image_url, affiliate_url, page_type
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), ?, ?, ?, ?, ?, ?, ?)
        `);
        
        const result = stmt.run(
            'Premium Wireless Headphones - Bot Test',
            '🎯 AMAZING DEAL ALERT! Premium Wireless Headphones with 50% OFF. High-quality sound, comfortable fit, long battery life. Perfect for music lovers and professionals.',
            JSON.stringify(contentData),
            JSON.stringify(['prime-picks']),
            'product',
            'Electronics',
            'telegram',
            'manual_test',
            'manual',
            JSON.stringify(mediaUrls),
            JSON.stringify(affiliateUrls),
            'active',
            'public',
            'active',
            '₹2,999',
            '₹5,999',
            'INR',
            50,
            'https://via.placeholder.com/300x300/3B82F6/white?text=Wireless+Headphones',
            'https://www.amazon.in/dp/B08XYZ789/ref=sr_1_1?keywords=wireless+headphones&tag=pickntrust03-21',
            'prime-picks'
        );
        
        console.log('✅ Product inserted successfully!');
        console.log('   Database ID:', result.lastInsertRowid);
        console.log('   Title: Premium Wireless Headphones - Bot Test');
        console.log('   Price: ₹2,999 (was ₹5,999)');
        console.log('   Discount: 50%');
        console.log('   Page: prime-picks');
        
        // Verify the insertion
        const inserted = db.prepare('SELECT * FROM unified_content WHERE id = ?').get(result.lastInsertRowid);
        console.log('\n🔍 Verification:');
        console.log('   Content JSON:', JSON.parse(inserted.content));
        console.log('   Media URLs:', JSON.parse(inserted.media_urls));
        console.log('   Affiliate URLs:', JSON.parse(inserted.affiliate_urls));
        
        console.log('\n🎉 Manual product insertion completed!');
        console.log('💡 This simulates what the bot should do when it receives a product message');
        console.log('🌐 Check the Prime Picks page to see if the product displays correctly');
        
    } catch (error) {
        console.error('❌ Error inserting product:', error.message);
    }
}

// Run the insertion
insertTestProduct();