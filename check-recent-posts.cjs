const Database = require('better-sqlite3');

console.log('🔍 Checking recent posts and affiliate URL conversion...');

const db = new Database('./database.sqlite');

try {
    // Check recent channel posts
    console.log('\n📋 Recent Channel Posts:');
    const recentPosts = db.prepare(`
        SELECT id, original_text, channel_name, website_page, is_processed, is_posted, 
               extracted_urls, extracted_title, extracted_price, extracted_original_price, 
               extracted_discount, created_at
        FROM channel_posts 
        ORDER BY created_at DESC 
        LIMIT 10
    `).all();
    
    recentPosts.forEach((post, index) => {
        console.log(`\n${index + 1}. Post ID: ${post.id}`);
        console.log(`   Channel: ${post.channel_name}`);
        console.log(`   Page: ${post.website_page}`);
        console.log(`   Processed: ${post.is_processed ? 'YES' : 'NO'}`);
        console.log(`   Posted: ${post.is_posted ? 'YES' : 'NO'}`);
        console.log(`   Title: ${post.extracted_title || 'NULL'}`);
        console.log(`   Price: ${post.extracted_price || 'NULL'}`);
        console.log(`   Original Price: ${post.extracted_original_price || 'NULL'}`);
        console.log(`   Discount: ${post.extracted_discount || 'NULL'}`);
        console.log(`   URLs: ${post.extracted_urls || 'NULL'}`);
        console.log(`   Message: ${post.original_text?.substring(0, 100)}...`);
        console.log(`   Created: ${new Date(post.created_at * 1000).toLocaleString()}`);
    });
    
    // Check recent products and their affiliate URLs
    console.log('\n\n🔗 Recent Products with Affiliate URLs:');
    const recentProducts = db.prepare(`
        SELECT id, title, affiliate_url, price, original_price, discount, 
               display_pages, source_type, created_at
        FROM unified_content 
        ORDER BY created_at DESC 
        LIMIT 10
    `).all();
    
    recentProducts.forEach((product, index) => {
        console.log(`\n${index + 1}. Product ID: ${product.id}`);
        console.log(`   Title: ${product.title}`);
        console.log(`   Pages: ${product.display_pages}`);
        console.log(`   Source: ${product.source_type}`);
        console.log(`   Price: ${product.price || 'NULL'}`);
        console.log(`   Original Price: ${product.original_price || 'NULL'}`);
        console.log(`   Discount: ${product.discount || 'NULL'}`);
        
        if (product.affiliate_url) {
            // Check if it contains the user's affiliate tag
            const hasUserTag = product.affiliate_url.includes('tag=pickntrust03-21');
            const hasCuelinks = product.affiliate_url.includes('linksredirect.com') || product.affiliate_url.includes('cuelinks');
            
            console.log(`   Affiliate URL: ${product.affiliate_url.substring(0, 80)}...`);
            console.log(`   ✅ Has User Tag (pickntrust03-21): ${hasUserTag}`);
            console.log(`   🔗 Is Cuelinks: ${hasCuelinks}`);
        } else {
            console.log(`   ❌ No Affiliate URL`);
        }
        console.log(`   Created: ${product.created_at}`);
    });
    
    // Check for Prime Picks specifically
    console.log('\n\n👑 Prime Picks Products:');
    const primePicks = db.prepare(`
        SELECT id, title, affiliate_url, price, original_price, display_pages
        FROM unified_content 
        WHERE display_pages LIKE '%prime-picks%'
        ORDER BY created_at DESC 
        LIMIT 5
    `).all();
    
    if (primePicks.length === 0) {
        console.log('No Prime Picks products found');
    } else {
        primePicks.forEach((product, index) => {
            console.log(`\n${index + 1}. ${product.title}`);
            console.log(`   Pages: ${product.display_pages}`);
            console.log(`   Price: ${product.price || 'NULL'}`);
            console.log(`   Original: ${product.original_price || 'NULL'}`);
            
            if (product.affiliate_url) {
                const hasUserTag = product.affiliate_url.includes('tag=pickntrust03-21');
                console.log(`   Affiliate: ${product.affiliate_url.substring(0, 60)}...`);
                console.log(`   User Tag: ${hasUserTag ? '✅ YES' : '❌ NO'}`);
            } else {
                console.log(`   ❌ No Affiliate URL`);
            }
        });
    }
    
    // Check for Cuelinks products
    console.log('\n\n🔗 Cuelinks Products:');
    const cuelinksProducts = db.prepare(`
        SELECT id, title, affiliate_url, price, original_price, display_pages, source_type
        FROM unified_content 
        WHERE affiliate_url LIKE '%cuelinks%' OR affiliate_url LIKE '%linksredirect%'
        ORDER BY created_at DESC 
        LIMIT 5
    `).all();
    
    if (cuelinksProducts.length === 0) {
        console.log('No Cuelinks products found');
    } else {
        cuelinksProducts.forEach((product, index) => {
            console.log(`\n${index + 1}. ${product.title}`);
            console.log(`   Pages: ${product.display_pages}`);
            console.log(`   Source: ${product.source_type}`);
            console.log(`   Price: ${product.price || 'NULL'}`);
            console.log(`   Original: ${product.original_price || 'NULL'}`);
            console.log(`   Affiliate: ${product.affiliate_url.substring(0, 80)}...`);
        });
    }
    
} catch (error) {
    console.error('❌ Error checking posts:', error);
} finally {
    db.close();
}