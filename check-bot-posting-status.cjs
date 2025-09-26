const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'server', 'database.sqlite');

console.log('🔍 Checking Bot Posting Status...\n');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    }
    console.log('✅ Connected to SQLite database\n');
});

// Check recent channel_posts activity
function checkRecentChannelPosts() {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT 
                id,
                channel_name,
                message_text,
                created_at,
                processed_at,
                status
            FROM channel_posts 
            WHERE created_at > datetime('now', '-2 hours')
            ORDER BY created_at DESC
            LIMIT 10
        `;
        
        db.all(query, [], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            
            console.log('📨 Recent Channel Posts (Last 2 hours):');
            if (rows.length === 0) {
                console.log('   ⚠️  No new channel posts in the last 2 hours');
            } else {
                rows.forEach(row => {
                    console.log(`   📝 ID: ${row.id} | Channel: ${row.channel_name}`);
                    console.log(`      Status: ${row.status} | Created: ${row.created_at}`);
                    console.log(`      Text: ${row.message_text?.substring(0, 100)}...`);
                    console.log('');
                });
            }
            resolve(rows);
        });
    });
}

// Check recent unified_content activity
function checkRecentUnifiedContent() {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT 
                id,
                title,
                status,
                created_at,
                updated_at,
                source_channel
            FROM unified_content 
            WHERE created_at > datetime('now', '-2 hours')
            ORDER BY created_at DESC
            LIMIT 10
        `;
        
        db.all(query, [], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            
            console.log('📋 Recent Unified Content (Last 2 hours):');
            if (rows.length === 0) {
                console.log('   ⚠️  No new unified content in the last 2 hours');
            } else {
                rows.forEach(row => {
                    console.log(`   📄 ID: ${row.id} | Title: ${row.title}`);
                    console.log(`      Status: ${row.status} | Source: ${row.source_channel}`);
                    console.log(`      Created: ${row.created_at}`);
                    console.log('');
                });
            }
            resolve(rows);
        });
    });
}

// Check for any processing errors
function checkProcessingErrors() {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT 
                id,
                channel_name,
                error_message,
                created_at,
                status
            FROM channel_posts 
            WHERE status = 'error' OR error_message IS NOT NULL
            ORDER BY created_at DESC
            LIMIT 5
        `;
        
        db.all(query, [], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            
            console.log('❌ Recent Processing Errors:');
            if (rows.length === 0) {
                console.log('   ✅ No processing errors found');
            } else {
                rows.forEach(row => {
                    console.log(`   🚨 ID: ${row.id} | Channel: ${row.channel_name}`);
                    console.log(`      Error: ${row.error_message}`);
                    console.log(`      Date: ${row.created_at}`);
                    console.log('');
                });
            }
            resolve(rows);
        });
    });
}

// Check total counts
function checkTotalCounts() {
    return new Promise((resolve, reject) => {
        const queries = [
            { name: 'Total Channel Posts', query: 'SELECT COUNT(*) as count FROM channel_posts' },
            { name: 'Total Unified Content', query: 'SELECT COUNT(*) as count FROM unified_content' },
            { name: 'Published Content', query: "SELECT COUNT(*) as count FROM unified_content WHERE status = 'published'" },
            { name: 'Active Content', query: "SELECT COUNT(*) as count FROM unified_content WHERE status = 'active'" }
        ];
        
        let results = {};
        let completed = 0;
        
        queries.forEach(({ name, query }) => {
            db.get(query, [], (err, row) => {
                if (err) {
                    results[name] = 'Error: ' + err.message;
                } else {
                    results[name] = row.count;
                }
                completed++;
                
                if (completed === queries.length) {
                    console.log('📊 Database Summary:');
                    Object.entries(results).forEach(([name, count]) => {
                        console.log(`   ${name}: ${count}`);
                    });
                    resolve(results);
                }
            });
        });
    });
}

// Main execution
async function main() {
    try {
        await checkRecentChannelPosts();
        console.log('\n' + '='.repeat(50) + '\n');
        
        await checkRecentUnifiedContent();
        console.log('\n' + '='.repeat(50) + '\n');
        
        await checkProcessingErrors();
        console.log('\n' + '='.repeat(50) + '\n');
        
        await checkTotalCounts();
        
        console.log('\n🔍 Analysis Complete!');
        console.log('\n💡 Recommendations:');
        console.log('   1. If no recent posts: Check if bot is receiving messages');
        console.log('   2. If posts but no unified content: Check processing logic');
        console.log('   3. If errors present: Review error messages for fixes');
        console.log('   4. Test by sending a message to a monitored channel');
        
    } catch (error) {
        console.error('❌ Error during analysis:', error);
    } finally {
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            }
            process.exit(0);
        });
    }
}

main();