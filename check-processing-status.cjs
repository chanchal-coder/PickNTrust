const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

console.log('🔍 CHECKING PROCESSING STATUS VALUES');
console.log('====================================');

try {
    const rows = db.prepare(`
        SELECT id, title, status, processing_status, display_pages 
        FROM unified_content 
        ORDER BY id DESC 
        LIMIT 10
    `).all();
    
    console.log('Processing Status Values:');
    rows.forEach(r => {
        console.log(`ID ${r.id}: status='${r.status}', processing_status='${r.processing_status}', display_pages='${r.display_pages}'`);
    });
    
    // Check unique values
    console.log('\n📊 Unique Status Values:');
    const statusValues = db.prepare('SELECT DISTINCT status FROM unified_content WHERE status IS NOT NULL').all();
    console.log('Status values:', statusValues.map(s => s.status));
    
    const processingStatusValues = db.prepare('SELECT DISTINCT processing_status FROM unified_content WHERE processing_status IS NOT NULL').all();
    console.log('Processing Status values:', processingStatusValues.map(s => s.processing_status));
    
    // Check display_pages values
    console.log('\n📄 Display Pages Values:');
    const displayPagesValues = db.prepare('SELECT DISTINCT display_pages FROM unified_content WHERE display_pages IS NOT NULL').all();
    console.log('Display Pages values:', displayPagesValues.map(d => d.display_pages));
    
} catch (error) {
    console.error('Error:', error.message);
} finally {
    db.close();
}