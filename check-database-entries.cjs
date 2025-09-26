const Database = require('better-sqlite3');

console.log('🔍 CHECKING DATABASE ENTRIES');
console.log('============================');

try {
    // Use the same database file as the bot
    const db = new Database('./database.sqlite');
    
    // Check unified_content entries
    const count = db.prepare('SELECT COUNT(*) as count FROM unified_content').get();
    console.log(`📊 UNIFIED_CONTENT ENTRIES: ${count.count}`);
    
    if (count.count > 0) {
        console.log('\n📋 LATEST ENTRIES:');
        const latest = db.prepare('SELECT * FROM unified_content ORDER BY created_at DESC LIMIT 5').all();
        latest.forEach((row, i) => {
            console.log(`${i+1}. Title: ${row.title}`);
            console.log(`   Price: ${row.price}`);
            console.log(`   Status: ${row.status}`);
            console.log(`   Page Type: ${row.page_type}`);
            console.log(`   Created: ${new Date(row.created_at * 1000).toLocaleString()}`);
            console.log('   ---');
        });
    } else {
        console.log('❌ No entries found in unified_content table');
    }
    
    db.close();
    
} catch (error) {
    console.error('❌ Error:', error.message);
}