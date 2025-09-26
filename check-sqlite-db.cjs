const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'database.sqlite');
console.log('Checking database at:', dbPath);

try {
  const db = new Database(dbPath);
  
  // Check if database file exists and is accessible
  console.log('\n=== DATABASE FILE INFO ===');
  const fs = require('fs');
  const stats = fs.statSync(dbPath);
  console.log('File size:', stats.size, 'bytes');
  console.log('Last modified:', stats.mtime);
  
  // Get all tables
  console.log('\n=== TABLES IN DATABASE ===');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Total tables:', tables.length);
  tables.forEach(table => console.log('- ' + table.name));
  
  // Check if unified_content table exists
  const unifiedContentExists = tables.some(t => t.name === 'unified_content');
  console.log('\nUnified content table exists:', unifiedContentExists);
  
  if (unifiedContentExists) {
    // Get unified_content schema
    console.log('\n=== UNIFIED_CONTENT TABLE SCHEMA ===');
    const schema = db.prepare("PRAGMA table_info(unified_content)").all();
    console.log('Columns in unified_content:', schema.length);
    schema.forEach(col => {
      console.log(`- ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
    });
    
    // Check for key columns
    const keyColumns = ['is_service', 'is_ai_app', 'processing_status', 'visibility'];
    console.log('\n=== KEY COLUMNS CHECK ===');
    keyColumns.forEach(col => {
      const exists = schema.some(s => s.name === col);
      console.log(`${col}: ${exists ? '✓' : '✗'}`);
    });
    
    // Count records
    console.log('\n=== DATA COUNT ===');
    const totalCount = db.prepare("SELECT COUNT(*) as count FROM unified_content").get();
    console.log('Total products:', totalCount.count);
    
    if (totalCount.count > 0) {
      // Sample data
      console.log('\n=== SAMPLE DATA ===');
      const sampleData = db.prepare(`
        SELECT id, title, category, is_service, is_ai_app, processing_status, visibility, status
        FROM unified_content 
        LIMIT 5
      `).all();
      
      sampleData.forEach(row => {
        console.log(`ID: ${row.id}, Title: ${row.title?.substring(0, 30)}...`);
        console.log(`  Category: ${row.category}, Service: ${row.is_service}, AI App: ${row.is_ai_app}`);
        console.log(`  Processing: ${row.processing_status}, Visibility: ${row.visibility}, Status: ${row.status}`);
        console.log('');
      });
    }
  }
  
  // Check other important tables
  const importantTables = ['products', 'categories', 'affiliateNetworks'];
  console.log('\n=== OTHER IMPORTANT TABLES ===');
  importantTables.forEach(tableName => {
    const exists = tables.some(t => t.name === tableName);
    if (exists) {
      const count = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
      console.log(`${tableName}: ${count.count} records`);
    } else {
      console.log(`${tableName}: ✗ (not found)`);
    }
  });
  
  db.close();
  console.log('\n=== DATABASE CHECK COMPLETE ===');
  
} catch (error) {
  console.error('Error checking database:', error.message);
  console.error('Stack:', error.stack);
}