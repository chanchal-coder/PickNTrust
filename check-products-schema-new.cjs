/**
 * Check Products Table Schema
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'sqlite.db');
const db = new Database(dbPath);

console.log('🔍 Checking Products Table Schema...');
console.log('=' .repeat(50));

try {
    // Get schema
    const schema = db.prepare(`PRAGMA table_info(products)`).all();
    console.log(`\n📋 Products table columns:`);
    schema.forEach(col => {
        console.log(`   ${col.name}: ${col.type} ${col.pk ? '(PRIMARY KEY)' : ''} ${col.notnull ? '(NOT NULL)' : ''}`);
    });
    
    // Check total records
    const totalCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
    console.log(`\n📊 Total products: ${totalCount.count}`);
    
    // Check display_pages values
    const displayPagesValues = db.prepare(`
        SELECT display_pages, COUNT(*) as count
        FROM products 
        WHERE display_pages IS NOT NULL AND display_pages != ''
        GROUP BY display_pages
        ORDER BY count DESC
    `).all();
    
    console.log(`\n📄 Display Pages Values:`);
    displayPagesValues.forEach(row => {
        console.log(`   "${row.display_pages}": ${row.count} products`);
    });
    
    // Show sample records
    const samples = db.prepare(`
        SELECT id, name, display_pages, affiliate_network 
        FROM products 
        LIMIT 5
    `).all();
    
    console.log(`\n📝 Sample records:`);
    samples.forEach(sample => {
        console.log(`   ID ${sample.id}: "${sample.name}"`);
        console.log(`      Display Pages: "${sample.display_pages}"`);
        console.log(`      Network: ${sample.affiliate_network}`);
        console.log('');
    });
    
} catch (error) {
    console.error('❌ Error:', error.message);
} finally {
    db.close();
}