const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

console.log('🔍 CHECKING DATABASE IDS');
console.log('========================');

try {
    const maxId = db.prepare('SELECT MAX(id) as max_id FROM unified_content').get();
    console.log('Max ID in database:', maxId.max_id);
    
    const recent = db.prepare('SELECT id, title, created_at FROM unified_content ORDER BY id DESC LIMIT 5').all();
    console.log('\nRecent products:');
    recent.forEach(r => {
        console.log(`ID ${r.id}: ${r.title} (${r.created_at})`);
    });
    
    // Check if there's a product with "Manual Test Product" or "Wireless Headphones"
    console.log('\n🔍 Looking for manual test products:');
    const manualProducts = db.prepare(`
        SELECT id, title, created_at 
        FROM unified_content 
        WHERE title LIKE '%Manual%' OR title LIKE '%Wireless Headphones%'
    `).all();
    
    if (manualProducts.length > 0) {
        console.log('Found manual products:');
        manualProducts.forEach(p => {
            console.log(`ID ${p.id}: ${p.title} (${p.created_at})`);
        });
    } else {
        console.log('No manual products found');
    }
    
} catch (error) {
    console.error('Error:', error.message);
} finally {
    db.close();
}