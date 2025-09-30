const Database = require('better-sqlite3');

console.log('🤖 TELEGRAM BOT ACTIVITY ANALYSIS');
console.log('=================================');

const db = new Database('database.sqlite');

try {
    // Check recent bot logs
    console.log('\n📋 RECENT BOT LOGS:');
    console.log('===================');
    const logs = db.prepare('SELECT * FROM botLogs ORDER BY timestamp DESC LIMIT 15').all();
    if (logs.length > 0) {
        logs.forEach(log => {
            const date = new Date(log.timestamp).toLocaleString();
            console.log(`${date} | ${log.bot_name} | ${log.action} | ${log.status}`);
            if (log.message) {
                console.log(`   Message: ${log.message}`);
            }
            if (log.error_details) {
                console.log(`   Error: ${log.error_details}`);
            }
            console.log('');
        });
    } else {
        console.log('❌ No bot logs found');
    }

    // Check channel posts
    console.log('\n📨 CHANNEL POSTS STATUS:');
    console.log('========================');
    const posts = db.prepare('SELECT * FROM channel_posts ORDER BY created_at DESC LIMIT 10').all();
    if (posts.length > 0) {
        posts.forEach(post => {
            const date = new Date(post.created_at * 1000).toLocaleString();
            console.log(`${date} | ${post.channel_name} -> ${post.target_page}`);
            console.log(`   Processed: ${post.is_processed ? '✅' : '❌'} | Posted: ${post.is_posted ? '✅' : '❌'}`);
            if (post.message_text) {
                console.log(`   Message: ${post.message_text.substring(0, 100)}...`);
            }
            if (post.extracted_urls) {
                console.log(`   URLs: ${post.extracted_urls}`);
            }
            console.log('');
        });
    } else {
        console.log('❌ No channel posts found');
    }

    // Check recent unified_content entries
    console.log('\n📦 RECENT UNIFIED_CONTENT ENTRIES:');
    console.log('==================================');
    const recentContent = db.prepare(`
        SELECT id, title, source_type, source_id, created_at, processing_status 
        FROM unified_content 
        WHERE source_type = 'telegram' OR source_type = 'telegram_channel'
        ORDER BY created_at DESC 
        LIMIT 10
    `).all();
    
    if (recentContent.length > 0) {
        recentContent.forEach(content => {
            const date = new Date(content.created_at).toLocaleString();
            console.log(`${date} | ${content.title} | ${content.source_type} | Status: ${content.processing_status}`);
        });
    } else {
        console.log('❌ No recent Telegram-sourced content found');
    }

    // Check bot stats
    console.log('\n📊 BOT STATISTICS:');
    console.log('==================');
    const stats = db.prepare('SELECT * FROM botStats ORDER BY timestamp DESC LIMIT 5').all();
    if (stats.length > 0) {
        stats.forEach(stat => {
            const date = new Date(stat.timestamp).toLocaleString();
            console.log(`${date} | ${stat.bot_name}`);
            console.log(`   Messages: ${stat.messages_processed} | Products: ${stat.products_created} | Errors: ${stat.errors_count}`);
        });
    } else {
        console.log('❌ No bot statistics found');
    }

} catch (error) {
    console.error('❌ Error:', error.message);
} finally {
    db.close();
}