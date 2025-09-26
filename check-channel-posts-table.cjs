const Database = require('better-sqlite3');

console.log('🔍 Checking channel_posts table...');

try {
    const db = new Database('./server/database.db');
    
    // Get all tables
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('All tables:', tables.map(t => t.name));
    
    // Check if channel_posts exists
    const hasChannelPosts = tables.some(t => t.name === 'channel_posts');
    console.log('\nHas channel_posts table:', hasChannelPosts);
    
    if (hasChannelPosts) {
        // Get schema
        const schema = db.prepare('PRAGMA table_info(channel_posts)').all();
        console.log('\nchannel_posts columns:');
        schema.forEach(col => {
            console.log(`  - ${col.name} (${col.type})`);
        });
        
        // Get count
        const count = db.prepare('SELECT COUNT(*) as count FROM channel_posts').get();
        console.log(`\nRecords in channel_posts: ${count.count}`);
    } else {
        console.log('\n❌ channel_posts table NOT FOUND');
    }
    
    db.close();
} catch (error) {
    console.error('Error:', error.message);
}