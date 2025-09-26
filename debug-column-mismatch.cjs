const Database = require('better-sqlite3');

async function debugColumnMismatch() {
  console.log('🔍 Debugging column mismatch...');
  
  const db = new Database('./server/database.sqlite');
  
  try {
    // Get all columns from the table
    const tableInfo = db.prepare('PRAGMA table_info(unified_content)').all();
    const tableColumns = tableInfo.map(col => col.name);
    
    console.log(`📊 Table has ${tableColumns.length} columns:`);
    tableColumns.forEach((col, i) => {
      console.log(`${i+1}. ${col}`);
    });
    
    // Columns from the INSERT statement (from the code)
    const insertColumns = [
      'title', 'description', 'price', 'original_price', 'image_url', 'affiliate_url',
      'content_type', 'page_type', 'category', 'source_type', 'source_platform', 'source_id',
      'affiliate_platform', 'rating', 'review_count', 'discount', 'currency',
      'is_active', 'is_featured', 'is_service', 'is_ai_app', 'display_order', 'display_pages',
      'has_timer', 'timer_duration', 'timer_start_time', 'processing_status',
      'status', 'visibility', 'created_at', 'updated_at'
    ];
    
    console.log(`\n📝 INSERT statement has ${insertColumns.length} columns:`);
    insertColumns.forEach((col, i) => {
      console.log(`${i+1}. ${col}`);
    });
    
    // Find missing columns
    const missingFromInsert = tableColumns.filter(col => !insertColumns.includes(col));
    const extraInInsert = insertColumns.filter(col => !tableColumns.includes(col));
    
    console.log(`\n❌ Missing from INSERT statement (${missingFromInsert.length}):`);
    missingFromInsert.forEach(col => console.log(`   - ${col}`));
    
    console.log(`\n⚠️ Extra in INSERT statement (${extraInInsert.length}):`);
    extraInInsert.forEach(col => console.log(`   - ${col}`));
    
    console.log(`\n📈 Summary:`);
    console.log(`   Table columns: ${tableColumns.length}`);
    console.log(`   INSERT columns: ${insertColumns.length}`);
    console.log(`   Difference: ${tableColumns.length - insertColumns.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    db.close();
  }
}

debugColumnMismatch();