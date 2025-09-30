const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('🗑️ REMOVING SEPARATE PRODUCT TABLES...\n');

// List of separate product tables that should be removed
const separateTables = [
    'amazon_products',
    'cuelinks_products', 
    'value_picks_products',
    'click_picks_products',
    'global_picks_products',
    'deals_hub_products',
    'lootbox_products',
    'travel_products'
];

try {
    // Check which tables exist before removal
    const existingTables = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name IN (${separateTables.map(() => '?').join(',')})
    `).all(...separateTables);

    console.log('📋 TABLES TO REMOVE:');
    existingTables.forEach(table => {
        console.log(`   - ${table.name}`);
    });

    if (existingTables.length === 0) {
        console.log('   ✅ No separate product tables found to remove');
    } else {
        // Remove each table
        for (const table of existingTables) {
            try {
                db.prepare(`DROP TABLE IF EXISTS ${table.name}`).run();
                console.log(`   ✅ Removed table: ${table.name}`);
            } catch (error) {
                console.log(`   ❌ Error removing ${table.name}: ${error.message}`);
            }
        }
    }

    console.log('\n📊 VERIFYING UNIFIED_CONTENT TABLE:');
    
    // Check unified_content table
    const unifiedContentInfo = db.prepare(`
        SELECT COUNT(*) as count FROM unified_content
    `).get();
    
    console.log(`   ✅ unified_content table has ${unifiedContentInfo.count} records`);

    // Check display_pages distribution
    const displayPagesStats = db.prepare(`
        SELECT display_pages, COUNT(*) as count 
        FROM unified_content 
        WHERE display_pages IS NOT NULL 
        GROUP BY display_pages
        ORDER BY count DESC
    `).all();

    console.log('\n📈 DISPLAY_PAGES DISTRIBUTION:');
    displayPagesStats.forEach(stat => {
        console.log(`   - ${stat.display_pages}: ${stat.count} records`);
    });

    console.log('\n✅ DATABASE CLEANUP COMPLETED!');
    console.log('   - Separate product tables removed');
    console.log('   - unified_content table preserved');
    console.log('   - All pages should now use unified_content with display_pages filtering');

} catch (error) {
    console.error('❌ Error during cleanup:', error.message);
} finally {
    db.close();
}