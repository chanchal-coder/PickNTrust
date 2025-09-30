/**
 * Debug Display Pages - Check why products aren't showing on website pages
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'sqlite.db');
const db = new Database(dbPath);

console.log('🔍 Debugging Display Pages Issue...');
console.log('=' .repeat(50));

try {
    // Check total unified_content records
    const totalCount = db.prepare('SELECT COUNT(*) as count FROM unified_content').get();
    console.log(`\n📊 Total unified_content records: ${totalCount.count}`);
    
    // Check records with display_pages field
    const withDisplayPages = db.prepare(`
        SELECT COUNT(*) as count FROM unified_content 
        WHERE display_pages IS NOT NULL AND display_pages != ''
    `).get();
    console.log(`📋 Records with display_pages: ${withDisplayPages.count}`);
    
    // Check processing_status distribution
    const statusDistribution = db.prepare(`
        SELECT status, COUNT(*) as count 
        FROM unified_content 
        GROUP BY status
    `).all();
    console.log(`\n📈 Status Distribution:`);
    statusDistribution.forEach(row => {
        console.log(`   ${row.status || 'NULL'}: ${row.count}`);
    });
    
    // Check what display_pages values exist
    const displayPagesValues = db.prepare(`
        SELECT DISTINCT display_pages, COUNT(*) as count
        FROM unified_content 
        WHERE display_pages IS NOT NULL AND display_pages != ''
        GROUP BY display_pages
        ORDER BY count DESC
    `).all();
    
    console.log(`\n📄 Display Pages Values:`);
    displayPagesValues.forEach(row => {
        console.log(`   "${row.display_pages}": ${row.count} products`);
    });
    
    // Check recent records to see their structure
    const recentRecords = db.prepare(`
        SELECT id, title, display_pages, status, created_at
        FROM unified_content 
        ORDER BY created_at DESC 
        LIMIT 10
    `).all();
    
    console.log(`\n🕒 Recent Records:`);
    recentRecords.forEach(record => {
        console.log(`   ID ${record.id}: "${record.title}"`);
        console.log(`      Display Pages: "${record.display_pages}"`);
        console.log(`      Status: "${record.status}"`);
        console.log(`      Created: ${record.created_at}`);
        console.log('');
    });
    
    // Test the exact API query
    console.log(`\n🔍 Testing API Query for 'prime-picks':`);
    const apiQuery = `
        SELECT * FROM unified_content 
        WHERE display_pages LIKE '%' || ? || '%'
        AND status = 'active'
        ORDER BY created_at DESC
    `;
    
    const apiResults = db.prepare(apiQuery).all('prime-picks');
    console.log(`   Results: ${apiResults.length} products`);
    
    if (apiResults.length > 0) {
        console.log('   Sample results:');
        apiResults.slice(0, 3).forEach(r => {
            console.log(`      ID ${r.id}: ${r.title}`);
            console.log(`         Display Pages: "${r.display_pages}"`);
        });
    }
    
    // Check if we need to update display_pages for existing records
    const needsUpdate = db.prepare(`
        SELECT COUNT(*) as count FROM unified_content 
        WHERE (display_pages IS NULL OR display_pages = '')
        AND status != 'failed'
    `).get();
    
    console.log(`\n⚠️  Records needing display_pages update: ${needsUpdate.count}`);
    
} catch (error) {
    console.error('❌ Error:', error.message);
} finally {
    db.close();
}